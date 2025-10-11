"use server";

import { prisma } from "@/lib/prisma";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { BASE_BUCKET, getOriginalPath, getResizedPaths } from "@/lib/imagePaths";

/**
 * Recursively list all files under a folder prefix.
 * Only used for fallback/manual cleanup.
 */
async function listAllFiles(prefix: string): Promise<string[]> {
  const allFiles: string[] = [];
  let offset = 0;
  const limit = 1000;

  while (true) {
    const { data, error } = await supabaseAdmin.storage.from(BASE_BUCKET).list(prefix, { limit, offset });
    if (error) {
      console.warn(`Failed to list files under ${prefix}:`, error.message);
      break;
    }

    if (!data || data.length === 0) break;

    for (const item of data) {
      const path = `${prefix}/${item.name}`;
      allFiles.push(path);

      // Recursively list subfolders (items without a dot are folders)
      if (!item.name.includes(".")) {
        const subFiles = await listAllFiles(path);
        allFiles.push(...subFiles);
      }
    }

    if (data.length < limit) break;
    offset += limit;
  }

  return allFiles;
}

/**
 * Deletes a product and all related assets (images + DB rows)
 * Fail-safe with automatic fallback:
 * 1. Delete images based on DB records first.
 * 2. If that fails, recursively delete all files under the product folder.
 * 3. Only proceed to delete DB entries if images are successfully deleted.
 */
export async function deleteProduct(productId: string) {
  // 1. Verify product existence and get images
  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: { images: true },
  });

  if (!product) throw new Error("Product not found");

  // 2. Build all file paths using imagePaths.ts
  const filePaths = product.images.flatMap((img) => {
    const original = getOriginalPath(productId, img.basename, img.extension);
    const resized = getResizedPaths(productId, img.basename, img.extension);
    return [original, ...resized];
  });

  // 3. Attempt deletion of images
  let imagesDeleted = false;
  try {
    if (filePaths.length > 0) {
      const { error: removeError } = await supabaseAdmin.storage.from(BASE_BUCKET).remove(filePaths);
      if (removeError) throw removeError;
    }
    imagesDeleted = true;
  } catch (err) {
    console.warn("Initial Supabase image deletion failed:", (err as any).message);

    // Fallback: recursively delete all files under product folder
    const allFiles = await listAllFiles(productId);
    if (allFiles.length > 0) {
      const { error: fallbackError } = await supabaseAdmin.storage.from(BASE_BUCKET).remove(allFiles);
      if (fallbackError) {
        console.error("Fallback Supabase deletion failed:", fallbackError.message);
        throw new Error("Failed to delete product images. Manual cleanup may be required.");
      }
      imagesDeleted = true;
      console.log(`Fallback deletion succeeded: ${allFiles.length} files removed.`);
    } else {
      console.log("No files found for fallback deletion.");
    }
  }

  if (!imagesDeleted) {
    throw new Error("Failed to delete any product images.");
  }

  // 4. Delete product record (cascade removes variants + image rows)
  try {
    await prisma.product.delete({ where: { id: productId } });
    console.log(`Product "${product.name}" and all assets deleted successfully.`);
  } catch (error) {
    console.error("Database deletion failed:", error);
    throw new Error("Failed to delete product from database.");
  }
}
