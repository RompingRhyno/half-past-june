"use server";

import { prisma } from "@/lib/prisma";

export interface UpdateProductImagesInput {
  productId: string;
  images: Array<{
    id?: string; // existing image ID if updating
    basename: string;
    extension: string;
    order: number;
  }>;
}

/**
 * Update images for a product.
 * Can create new images, update order, or delete removed images.
 */
export async function updateProductImages({
  productId,
  images,
}: UpdateProductImagesInput) {
  try {
    await prisma.$transaction(async (tx) => {
      // Get existing images
      const existingImages = await tx.image.findMany({
        where: { productId },
      });

      const existingMap = new Map(existingImages.map((img) => [img.id, img]));
      const incomingIds = images.map((img) => img.id).filter(Boolean) as string[];

      // Delete images that are no longer present
      const idsToDelete = existingImages
        .map((img) => img.id)
        .filter((id) => !incomingIds.includes(id));

      if (idsToDelete.length) {
        await tx.image.deleteMany({ where: { id: { in: idsToDelete } } });
      }

      // Update order only if it has changed
      for (const img of images) {
        if (img.id) {
          const existing = existingMap.get(img.id);
          if (existing && existing.order !== img.order) {
            await tx.image.update({
              where: { id: img.id },
              data: { order: img.order },
            });
          }
        }
      }

      // Create new images (those without an id)
      const newImages = images.filter((img) => !img.id);
      if (newImages.length) {
        const createData = newImages.map((img) => ({
          productId,
          basename: img.basename,
          extension: img.extension,
          order: img.order,
        }));
        await tx.image.createMany({ data: createData });
      }
    });
  } catch (err) {
    console.error("Failed to update product images:", err);
    throw new Error("Failed to update product images");
  }
}
