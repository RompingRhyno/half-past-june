"use server";

import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

interface ProductSizeInput {
  id?: string;
  size: string;
  stock?: string;
}

interface ProductVariantInput {
  id?: string;
  colour: string;
  colourCode?: string;
  price: number;
  stock?: string;
  sizes?: ProductSizeInput[];
}

interface UpdateProductInput {
  name: string;
  slug: string;
  description?: string;
  makeToOrder?: boolean;
  variants: ProductVariantInput[];
}

export async function updateProduct(data: UpdateProductInput) {
  const product = await prisma.product.findUnique({
    where: { slug: data.slug },
    include: {
      variants: { include: { sizes: true } },
    },
  });

  if (!product) {
    throw new Error("Product not found");
  }

  const makeToOrder = data.makeToOrder ?? true;

  try {
    await prisma.$transaction(async (tx) => {
      // Update product core fields
      await tx.product.update({
        where: { id: product.id },
        data: {
          name: data.name,
          description: data.description,
          makeToOrder,
        },
      });

      // --- Handle variants ---
      const existingVariants = product.variants;
      const incomingVariants = data.variants;

      const existingVariantIds = existingVariants.map((v) => v.id);
      const incomingVariantIds = incomingVariants
        .map((v) => v.id)
        .filter(Boolean) as string[];

      const variantIdsToDelete = existingVariantIds.filter(
        (id) => !incomingVariantIds.includes(id)
      );

      if (variantIdsToDelete.length > 0) {
        await tx.variantSize.deleteMany({
          where: { variantId: { in: variantIdsToDelete } },
        });
        await tx.productVariant.deleteMany({
          where: { id: { in: variantIdsToDelete } },
        });
      }

      for (const variant of incomingVariants) {
        if (variant.id) {
          // Update existing variant
          await tx.productVariant.update({
            where: { id: variant.id },
            data: {
              colour: variant.colour,
              colourCode: variant.colourCode,
              price: Number(variant.price),
              stock: variant.sizes?.length ? null : Number(variant.stock || 0),
            },
          });

          // Handle variant sizes
          const existingSizes =
            existingVariants.find((v) => v.id === variant.id)?.sizes || [];
          const existingSizeIds = existingSizes.map((s) => s.id);
          const incomingSizes = variant.sizes || [];
          const incomingSizeIds = incomingSizes.map((s) => s.id).filter(Boolean) as string[];

          const sizeIdsToDelete = existingSizeIds.filter(
            (id) => !incomingSizeIds.includes(id)
          );

          if (sizeIdsToDelete.length > 0) {
            await tx.variantSize.deleteMany({
              where: { id: { in: sizeIdsToDelete } },
            });
          }

          for (const size of incomingSizes) {
            if (size.id) {
              await tx.variantSize.update({
                where: { id: size.id },
                data: {
                  size: size.size,
                  stock: makeToOrder ? null : Number(size.stock || 0),
                },
              });
            } else {
              await tx.variantSize.create({
                data: {
                  variantId: variant.id,
                  size: size.size,
                  stock: makeToOrder ? null : Number(size.stock || 0),
                },
              });
            }
          }
        } else {
          // Create new variant + nested sizes
          await tx.productVariant.create({
            data: {
              productId: product.id,
              colour: variant.colour,
              colourCode: variant.colourCode,
              price: Number(variant.price),
              stock: variant.sizes?.length ? null : Number(variant.stock || 0),
              sizes: {
                create:
                  variant.sizes?.map((s) => ({
                    size: s.size,
                    stock: makeToOrder ? null : Number(s.stock || 0),
                  })) || [],
              },
            },
          });
        }
      }
    });
  } catch (error) {
    console.error("Product update failed:", error);
    throw new Error(
      error instanceof Error ? error.message : "Failed to update product"
    );
  }
}

export async function updateProductAction(formData: FormData) {
  const slug = formData.get("slug") as string;

  await updateProduct({
    name: formData.get("name") as string,
    slug,
    description: formData.get("description") as string,
    makeToOrder: formData.get("makeToOrder") === "true",
    variants: JSON.parse(formData.get("variants") as string),
  });
  console.log("updateProductAction finished successfully");
}
