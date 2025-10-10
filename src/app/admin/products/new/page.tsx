import { createProductAction } from "@/actions/createProduct";
import ProductFormWithImages from "@/components/product-form/ProductFormWithImages";

export default function AddProductPage() {
  return (
    <ProductFormWithImages
      mode="create"
      formAction={createProductAction}
      initialValues={{ name: "", slug: "", description: "", makeToOrder: true, variants: [] }}
    />
  );
}
