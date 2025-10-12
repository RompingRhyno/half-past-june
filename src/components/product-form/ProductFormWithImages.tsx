"use client";

import { useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import ProductForm, { InitialValues, ProductFormHandle, SubmitResult } from "./ProductForm";
import ProductImages, { ProductImagesHandle } from "./ProductImages";
import { ProcessedImageInfo, ExistingImage } from "./productImages.types";
import { toast } from "sonner";
import { deleteProduct } from "@/actions/deleteProduct";

type Props = {
    mode: "create" | "edit";
    initialValues?: InitialValues;
    productId?: string;
    existingImages?: ExistingImage[];
    formAction: (formData: FormData) => Promise<SubmitResult>;
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
    const [realProductId, setRealProductId] = useState<string | null>(
        mode === "edit" ? productId ?? null : null
    );
    const [deleting, setDeleting] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [processing, setProcessing] = useState(false);

    const formRef = useRef<ProductFormHandle>(null);
    const imagesRef = useRef<ProductImagesHandle>(null);

    const handleSave = useCallback(async () => {
        if (processing) return;
        if (!formRef.current || !imagesRef.current) return;

        setProcessing(true);
        try {
            // 1. Submit the product form
            const result = await formRef.current.submitForm();
            if (!result?.success) {
                toast.error(result?.error ?? "Failed to save product.");
                return;
            }

            // 2. Ensure we have a product ID
            const currentProductId = result.productId || realProductId;
            if (!currentProductId) {
                toast.error("No product ID returned from server.");
                return;
            }

            // 3. Update state and notify ProductImages hook
            setRealProductId(currentProductId);
            imagesRef.current.updateProductId?.(currentProductId);

            // 4. Upload all pending images
            await imagesRef.current.uploadAll?.(currentProductId);
            
            // 5. Get successfully processed images
            const uploadedImages: ProcessedImageInfo[] =
                imagesRef.current.getProcessedImages?.() ?? [];

            // 6. Reorder images on server if any were uploaded
            if (uploadedImages.length > 0) {
                const res = await fetch("/api/images/reorder", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        productId: currentProductId,
                        orderedImages: uploadedImages.map(({ id, order }) => ({ id, order })),
                    }),
                });
                if (!res.ok) throw new Error("Failed to reorder images");
            }

            toast.success(mode === "create" ? "Product created successfully!" : "Changes saved!");
            router.push("/admin/products");
        } catch (err) {
            console.error("handleSave error:", err);
            toast.error("Failed to save product or images.");
        } finally {
            setProcessing(false);
        }
    }, [realProductId, mode, processing, router]);


    const handleDelete = useCallback(async () => {
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
    }, [productId, productName, router]);

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
                        disabled={processing}
                    >
                        {processing ? "Saving..." : "Save"}
                    </button>
                </div>
            </div>

            {/* Delete confirmation */}
            {showConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                    <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6 space-y-4">
                        <h3 className="text-lg font-bold">Delete Product</h3>
                        <p>
                            Are you sure you want to delete "{productName}"? This action cannot
                            be undone.
                        </p>
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

            {/* Product form + images */}
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
                    productId={realProductId}
                    existingImages={existingImages}
                />
            </div>
        </div>
    );
}
