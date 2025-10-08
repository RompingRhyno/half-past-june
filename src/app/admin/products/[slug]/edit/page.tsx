import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import ProductForm from "@/components/product-form/ProductForm";
import ProductImages from "@/components/product-form/ProductImages";
import { mapProductToInitialValues } from "@/lib/mapProductToInitialValues";
import { updateProductAction } from "@/actions/updateProduct";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function EditProductPage({ params }: PageProps) {
  const { slug } = await params;

  const product = await prisma.product.findUnique({
    where: { slug },
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

  // Normalize product into InitialValues for the form
  const initialValues = mapProductToInitialValues(product);

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">Edit Product</h1>

      <ProductForm
        mode="edit"
        initialValues={initialValues}
        action={updateProductAction}
      />

      <ProductImages slug={slug} existingImages={product.images} />
    </div>
  );
}
