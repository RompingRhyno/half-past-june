import Link from "next/link";

export default function ProductPage() {
  return (
    <div className="p-6 space-y-4">
      <h1 className="text-3xl font-bold">Products</h1>
      <p>Add or edit products below:</p>

      <Link href="/admin/products/new">
        <button className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
          Add New Product
        </button>
      </Link>
    </div>
  );
}
