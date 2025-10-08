import { UploadableImage } from "@/components/product-form/productImages.types";
import { toast } from "sonner";

/** Assign sparse order values (gap = 10) */
export const getSparseOrder = (idx: number) => (idx + 1) * 10;

/** Rebalance orders to avoid collisions */
export const rebalanceOrders = (imgs: UploadableImage[]): UploadableImage[] => {
  const next = [...imgs];
  let prevOrder = 0;
  for (let i = 0; i < next.length; i++) {
    const img = next[i];
    if (!img.order || img.order <= prevOrder) img.order = prevOrder + 10;
    prevOrder = img.order;
  }
  return next;
};

/** Create DB row for a new image with prepended timestamp for uniqueness */
export async function createImageDbRow(
  file: File,
  slug: string,
  order: number
): Promise<{ id: string; basename: string; extension: string }> {
  const timestamp = Date.now();
  const originalBasename = file.name.replace(/\.[^/.]+$/, "");
  const extension = file.name.split(".").pop()!;
  const basenameWithTimestamp = `${timestamp}_${originalBasename}`;

  try {
    const res = await fetch("/api/images/add", {
      method: "POST",
      body: JSON.stringify({
        slug,
        basename: basenameWithTimestamp, // includes timestamp in basename
        extension,
        order,
      }),
    });
    if (!res.ok) throw new Error("Failed to create image DB row");
    
    const data = await res.json();
    return {
      id: data.id,
      basename: basenameWithTimestamp,
      extension,
    };
  } catch {
    toast.error(`Failed to create image entry for ${file.name}`);
    throw new Error("DB row creation failed");
  }
}


/**
 * Deletes all storage files for an image (original + resized variants),
 * then deletes the DB row only if all storage deletions succeed.
 */
export async function deleteImageWithStorage(img: UploadableImage) {
  if (!img.imageId) return;

  const pathsToDelete: string[] = [];

  if (img.originalPath) pathsToDelete.push(img.originalPath);
  if (img.processedVariants?.length) pathsToDelete.push(...img.processedVariants);

  try {
    // Delete from Supabase Storage via API
    const storageRes = await fetch("/api/images/delete-storage", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paths: pathsToDelete }),
    });

    if (!storageRes.ok) {
      const text = await storageRes.text();
      throw new Error(`Storage delete failed: ${text}`);
    }

    // Delete DB row
    const dbRes = await fetch("/api/images/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: img.imageId }),
    });

    if (!dbRes.ok) {
      const text = await dbRes.text();
      throw new Error(`DB delete failed: ${text}`);
    }
  } catch (err: any) {
    toast.error(`Failed to delete image ${img.basename}: ${err.message}`);
    throw err;
  }
}
