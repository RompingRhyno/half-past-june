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

interface CreateProductInput {
  name: string;
  slug: string;
  description?: string;
  makeToOrder?: boolean;
  variants: ProductVariant[];
  images?: Array<{ basename: string; extension: string }>;
}

// Product creation logic
export async function createProduct(data: CreateProductInput) {
  try {
    const product = await prisma.product.create({
      data: {
        name: data.name,
        slug: data.slug,
        description: data.description,
        makeToOrder: data.makeToOrder ?? true,
        images: {
          create: data.images?.map(img => ({
            basename: img.basename,
            extension: img.extension,
          })) || [],
        },
        variants: {
          create: data.variants.map(variant => ({
            colour: variant.colour,
            colourCode: variant.colourCode,
            price: Number(variant.price),
            stock: variant.sizes?.length ? null : Number(variant.stock || 0),
            sizes: {
              create: variant.sizes?.map(size => ({
                size: size.size,
                stock: data.makeToOrder ? null : Number(size.stock || 0),
              })) || [],
            },
          })),
        },
      },
      select: { slug: true },
    });

    return product.slug;

  } catch (error) {
    console.error("Product creation failed:", error);
    throw new Error(
      error instanceof Error
        ? error.message
        : "Failed to create product"
    );
  }
}

// Server action for form submission
export async function createProductAction(formData: FormData) {
  const slug = formData.get("slug") as string;

  await createProduct({
    name: formData.get("name") as string,
    slug,
    description: formData.get("description") as string,
    makeToOrder: formData.get("makeToOrder") === "true",
    variants: JSON.parse(formData.get("variants") as string),
    images: JSON.parse(formData.get("images") as string),
  });

  redirect(`/admin/products/${slug}/edit`);
}
