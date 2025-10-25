import Link from "next/link";
import { prisma } from "@/lib/prisma";
import ProductCardClient from "@/components/product/ProductCardClient";

export const revalidate = 0; // Always fresh for admin view

export default async function ProductPage() {
  // Fetch all products with images
  const products = await prisma.product.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      images: {
        orderBy: { order: "asc" },
        select: { basename: true, extension: true, order: true },
      },
    },
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Products</h1>
        <Link href="/admin/products/new">
          <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
            Add New Product
          </button>
        </Link>
      </div>

      {products.length === 0 ? (
        <p className="text-gray-600">
          No products found. Add one to get started.
        </p>
      ) : (
        <div className="space-y-8">
          {products.map((product, index) => (
            <ProductCardClient
              key={product.id}
              product={{
                id: product.id,
                slug: product.slug,
                name: product.name,
                description: product.description ?? "",
                images: product.images.map((img) => ({
                  basename: img.basename,
                  extension: img.extension,
                  order: img.order,
                })),
              }}
              eager={index < 2} // Eager load first two cards
            />
          ))}
        </div>
      )}
    </div>
  );
}
