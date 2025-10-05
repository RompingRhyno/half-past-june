import { createProductAction } from "@/actions/createProduct";
import ProductForm from "@/components/product-form/ProductForm";

export default function AddProductPage() {
  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">Add New Product</h1>
      <ProductForm
        mode="create"
        action={createProductAction}
      />
    </div>
  );
}
