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
import { deleteProduct } from "@/actions/deleteProduct";

type Props = {
    mode: "create" | "edit";
    initialValues?: InitialValues;
    productId?: string;
    existingImages?: ExistingImage[];
    formAction: (formData: FormData) => Promise<void>;
};

export default function ProductFormWithImages({
    mode,
    initialValues,
    productId,
    existingImages,
    formAction,
}: Props) {
    const router = useRouter();
    const [productName, setProductName] = useState(initialValues?.name ?? "");
    const [orderedImages, setOrderedImages] = useState<ProcessedImageInfo[]>([]);
    const [deleting, setDeleting] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const formRef = useRef<ProductFormHandle>(null);
    const imagesRef = useRef<ProductImagesHandle>(null);

    const handleOrderChange = useCallback((ordered: ProcessedImageInfo[]) => {
        setOrderedImages(ordered);
    }, []);

    const handleSave = async () => {
        if (!formRef.current) return;

        const formError = await formRef.current.submitForm();
        if (formError) {
            toast.error(formError);
            return;
        }

        if (imagesRef.current) {
            try {
                await imagesRef.current.uploadAll();
            } catch (err) {
                console.error("Image upload failed:", err);
                toast.error("Failed to upload images.");
                return;
            }
        }

        if (productId && orderedImages.length > 0) {
            try {
                const res = await fetch("/api/images/reorder", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        productId,
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

        toast.success(mode === "create" ? "Product created successfully!" : "Changes saved!");
        router.push("/admin/products");
    };

    const handleDelete = async () => {
        if (!productId) return;
        setShowConfirm(false);
        setDeleting(true);

        try {
            await deleteProduct(productId);
            toast.success(`Product "${productName}" deleted successfully.`);
            router.push("/admin/products");
        } catch (err) {
            console.error("Failed to delete product:", err);
            toast.error("Failed to delete product. Please try again.");
        } finally {
            setDeleting(false);
        }
    };

    return (
        <div>
            {/* Floating header */}
            <div className="fixed top-0 left-0 right-0 bg-white shadow z-50 flex items-center justify-between p-4 max-w-4xl mx-auto">
                <h2 className="text-xl font-bold truncate">{productName || "New Product"}</h2>
                <div className="flex gap-2">
                    {mode === "edit" && (
                        <button
                            type="button"
                            className="px-4 py-2 rounded border hover:bg-red-100 text-red-600"
                            onClick={() => setShowConfirm(true)}
                            disabled={deleting}
                        >
                            {deleting ? "Deleting..." : "Delete"}
                        </button>
                    )}
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

            {/* Confirmation modal */}
            {showConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                    <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6 space-y-4">
                        <h3 className="text-lg font-bold">Delete Product</h3>
                        <p>Are you sure you want to delete "{productName}"? This action cannot be undone.</p>
                        <div className="flex justify-end gap-2 mt-4">
                            <button
                                className="px-4 py-2 rounded border hover:bg-gray-100"
                                onClick={() => setShowConfirm(false)}
                                disabled={deleting}
                            >
                                Cancel
                            </button>
                            <button
                                className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700"
                                onClick={handleDelete}
                                disabled={deleting}
                            >
                                {deleting ? "Deleting..." : "Delete"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

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
                    productId={productId}
                    existingImages={existingImages}
                    onOrderChange={handleOrderChange}
                />

            </div>
        </div>
    );
}
