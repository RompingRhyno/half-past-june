import { createProductAction } from "@/actions/createProduct";
import AddProductForm from "@/components/product-form/AddProductForm";

export default function AddProductPage() {
  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">Add New Product</h1>
      <AddProductForm action={createProductAction} />
    </div>
  );
}
