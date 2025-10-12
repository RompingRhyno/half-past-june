"use server";

import { prisma } from "@/lib/prisma";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { BASE_BUCKET, getOriginalPath, getResizedPaths } from "@/lib/imagePaths";

/** Recursively list all files under a folder prefix for fallback cleanup */
async function listAllFiles(prefix: string): Promise<string[]> {
  const allFiles: string[] = [];
  let offset = 0;
  const limit = 1000;

  while (true) {
    const { data, error } = await supabaseAdmin.storage.from(BASE_BUCKET).list(prefix, { limit, offset });
    if (error) break;
    if (!data || data.length === 0) break;

    for (const item of data) {
      const path = `${prefix}/${item.name}`;
      allFiles.push(path);

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

/** Delete product images and database row safely */
export async function deleteProduct(productId: string) {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: { images: true },
  });

  if (!product) throw new Error("Product not found");

  const filePaths = product.images.flatMap((img) => {
    const original = getOriginalPath(productId, img.basename, img.extension);
    const resized = getResizedPaths(productId, img.basename, img.extension);
    return [original, ...resized];
  });

  let imagesDeleted = false;

  try {
    if (filePaths.length > 0) {
      const { error: removeError } = await supabaseAdmin.storage.from(BASE_BUCKET).remove(filePaths);
      if (removeError) throw removeError;
    }
    imagesDeleted = true;
  } catch {
    // Fallback: delete all files under product folder
    const allFiles = await listAllFiles(productId);
    if (allFiles.length > 0) {
      const { error: fallbackError } = await supabaseAdmin.storage.from(BASE_BUCKET).remove(allFiles);
      if (fallbackError) throw new Error("Failed to delete product images. Manual cleanup required.");
      imagesDeleted = true;
    }
  }

  if (!imagesDeleted) throw new Error("Failed to delete any product images.");

  try {
    await prisma.product.delete({ where: { id: productId } });
  } catch {
    throw new Error("Failed to delete product from database.");
  }
}
