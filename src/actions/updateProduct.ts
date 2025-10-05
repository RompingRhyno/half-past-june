"use server";

import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

interface ProductVariant {
  colour: string;
  colourCode?: string;
  price: number;
  stock?: string;
  sizes?: Array<{
    size: string;
    stock?: string;
  }>;
}

interface UpdateProductInput {
  name: string;
  slug: string;
  description?: string;
  makeToOrder?: boolean;
  variants: ProductVariant[];
  images?: Array<{ basename: string; extension: string }>;
}

// Core update function
export async function updateProduct(data: UpdateProductInput) {
  try {
    await prisma.product.update({
      where: { slug: data.slug },
      data: {
        name: data.name,
        description: data.description,
        makeToOrder: data.makeToOrder ?? true,
        images: {
          deleteMany: {},
          create: data.images?.map((img) => ({
            basename: img.basename,
            extension: img.extension,
          })) || [],
        },
        variants: {
          deleteMany: {},
          create: data.variants.map((variant) => ({
            colour: variant.colour,
            colourCode: variant.colourCode,
            price: Number(variant.price),
            stock: variant.sizes?.length ? null : Number(variant.stock || 0),
            sizes: {
              create: variant.sizes?.map((size) => ({
                size: size.size,
                stock: data.makeToOrder ? null : Number(size.stock || 0),
              })) || [],
            },
          })),
        },
      },
    });
  } catch (error) {
    console.error("Product update failed:", error);
    throw new Error(
      error instanceof Error ? error.message : "Failed to update product"
    );
  }
}

// Server action for form submission
export async function updateProductAction(formData: FormData) {
  const slug = formData.get("slug") as string;

  await updateProduct({
    name: formData.get("name") as string,
    slug,
    description: formData.get("description") as string,
    makeToOrder: formData.get("makeToOrder") === "true",
    variants: JSON.parse(formData.get("variants") as string),
    images: JSON.parse(formData.get("images") as string),
  });

  redirect(`/admin/products/${slug}/edit`);
}
