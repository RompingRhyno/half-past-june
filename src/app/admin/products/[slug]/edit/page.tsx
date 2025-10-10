import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import ProductFormWithImages from "@/components/product-form/ProductFormWithImages";
import { mapProductToInitialValues } from "@/lib/mapProductToInitialValues";
import { updateProductAction } from "@/actions/updateProduct";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function EditProductPage(props: PageProps) {
  const { slug } = await props.params;

  const product = await prisma.product.findUnique({
    where: { slug },
    include: {
      variants: { include: { sizes: true } },
      images: true,
    },
  });

  if (!product) notFound();

  const initialValues = mapProductToInitialValues(product);

  return (
    <ProductFormWithImages
      mode="edit"
      formAction={updateProductAction}
      initialValues={initialValues}
      slug={slug}
      existingImages={product.images}
    />
  );
}
