import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import ProductImages from "@/components/product-form/ProductImages";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function EditProductPage({ params }: PageProps) {
  const awaitedParams = await params;
  const slug = awaitedParams.slug;

  const product = await prisma.product.findUnique({
    where: { slug: slug },
    include: {
      variants: {
        include: {
          sizes: true,
        },
      },
      images: true,
    },
  });

  if (!product) notFound();

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">Edit Product</h1>

      {/* <AddProductForm product={product} /> */}

      <ProductImages slug={slug} existingImages={product.images} />
    </div>
  );
}
