"use client";

import { useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import ProductForm, { InitialValues, ProductFormHandle } from "./ProductForm";
import ProductImages, {
  ProductImagesHandle,
  ExistingImage,
} from "./ProductImages";
import { ProcessedImageInfo } from "./productImages.types";
import { toast } from "sonner";

type Props = {
  mode: "create" | "edit";
  initialValues?: InitialValues;
  slug?: string;
  existingImages?: ExistingImage[];
  formAction: (formData: FormData) => Promise<void>;
};

export default function ProductFormWithImages({
  mode,
  initialValues,
  slug,
  existingImages,
  formAction,
}: Props) {
  const router = useRouter();
  const [productName, setProductName] = useState(initialValues?.name ?? "");
  const [orderedImages, setOrderedImages] = useState<ProcessedImageInfo[]>([]);
  const formRef = useRef<ProductFormHandle>(null);
  const imagesRef = useRef<ProductImagesHandle>(null);

  // callback from ProductImages when order changes
  const handleOrderChange = useCallback((ordered: ProcessedImageInfo[]) => {
    setOrderedImages(ordered);
  }, []);

  // Determine slug for images (new or edit)
  const imagesSlug =
    mode === "create"
      ? productName
        ? productName.toLowerCase().replace(/\s+/g, "-")
        : "new-product"
      : slug ?? "unknown-product";

  const handleSave = async () => {
    if (!formRef.current) return;

    // Submit form fields
    const formError = await formRef.current.submitForm();
    if (formError) {
      toast.error(formError);
      return;
    }

    // Upload images
    if (imagesRef.current) {
      try {
        await imagesRef.current.uploadAll();
      } catch (err) {
        console.error("Image upload failed:", err);
        toast.error("Failed to upload images.");
        return;
      }
    }

    // Persist image order
    if (orderedImages.length > 0) {
      try {
        const res = await fetch("/api/images/reorder", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            slug: slug ?? productName.toLowerCase().replace(/\s+/g, "-"),
            orderedImages: orderedImages.map((img) => ({
              id: img.id,
              order: img.order,
            })),
          }),
        });

        if (!res.ok) throw new Error("Failed to reorder images");
      } catch (err) {
        console.error("Image reorder failed:", err);
        toast.error("Failed to save image order.");
        return;
      }
    }

    // Success
    toast.success(mode === "create" ? "Product created successfully!" : "Changes saved!");
    router.push("/admin/products");
  };

  return (
    <div>
      {/* Floating header */}
      <div className="fixed top-0 left-0 right-0 bg-white shadow z-50 flex items-center justify-between p-4 max-w-4xl mx-auto">
        <h2 className="text-xl font-bold truncate">{productName || "New Product"}</h2>
        <div className="flex gap-2">
          <button
            type="button"
            className="px-4 py-2 rounded border hover:bg-gray-100"
            onClick={() => router.push("/admin/products")}
          >
            Cancel
          </button>
          <button
            type="button"
            className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
            onClick={handleSave}
          >
            Save
          </button>
        </div>
      </div>

      <div className="pt-20 space-y-6 max-w-4xl mx-auto p-6">
        <ProductForm
          ref={formRef}
          mode={mode}
          initialValues={initialValues}
          onNameChange={setProductName}
          action={formAction}
        />

        <ProductImages
          ref={imagesRef}
          slug={imagesSlug}
          existingImages={existingImages}
          onOrderChange={handleOrderChange} // listen for reorder events
        />
      </div>
    </div>
  );
}
