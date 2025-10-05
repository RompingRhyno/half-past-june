import Link from "next/link";

export default function AdminHomePage() {
  return (
    <div className="p-6 space-y-4">
      <h1 className="text-3xl font-bold">Welcome to the Admin Console</h1>
      <p>Select a section from the menu to manage products, orders, or users.</p>

      <Link href="/admin/products">
        <button className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
          Manage Products
        </button>
      </Link>
    </div>
  );
}
