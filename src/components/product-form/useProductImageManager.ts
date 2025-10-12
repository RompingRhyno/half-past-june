import { useEffect, useState, useCallback, useRef } from "react";
import { arrayMoveImmutable } from "array-move";
import { resizeImage } from "@/lib/imageResize";
import {
  getOriginalPath,
  getResizedPaths,
  getPreviewPath,
  BASE_BUCKET,
  TARGET_WIDTHS,
} from "@/lib/imagePaths";
import { getSignedUploadUrl, uploadViaSignedUrl } from "@/lib/imageUpload";
import {
  getSparseOrder,
  rebalanceOrders,
  deleteImageWithStorage,
  createImageDbRow,
} from "@/lib/imageManagerHelpers";
import {
  UploadableImage,
  ProcessedImageInfo,
  UploadStatus,
  ExistingImage,
} from "./productImages.types";

export function useProductImageManager(
  initialProductId: string | null,
  existingImages: ExistingImage[] = [],
  onProcessedChange?: (processed: ProcessedImageInfo[]) => void
) {
  const [images, setImages] = useState<UploadableImage[]>([]);
  const [productId, setProductId] = useState<string | null>(initialProductId);
  const uploadingRef = useRef(false);

  /** Setter for productId (late assignment) */
  const updateProductId = useCallback((id: string) => {
    setProductId(id);
  }, []);

  /** Notify parent about processed images */
  const notifyProcessedChange = useCallback(
    (updated: UploadableImage[]) => {
      if (!onProcessedChange) return;
      const processed = updated
        .filter((img) => img.status === "success" && img.imageId)
        .map((img) => ({
          id: img.imageId!,
          basename: img.basename!,
          extension: img.extension!,
          order: img.order!,
        }));
      onProcessedChange(processed);
    },
    [onProcessedChange]
  );

  /** Initialize existing images */
  useEffect(() => {
    if (!existingImages.length) return;

    const converted: UploadableImage[] = existingImages
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
      .map((img, idx) => ({
        file: undefined,
        status: "success" as UploadStatus,
        previewUrl: productId
          ? `https://${process.env.NEXT_PUBLIC_SUPABASE_URL!.replace(
              /^https?:\/\//,
              ""
            )}/storage/v1/object/public/${BASE_BUCKET}/${getPreviewPath(
              productId,
              img.basename,
              img.extension
            )}`
          : "",
        id: `existing-${img.id}`,
        isExisting: true,
        basename: img.basename,
        extension: img.extension,
        imageId: img.id,
        order: img.order ?? getSparseOrder(idx),
      }));

    setImages(rebalanceOrders(converted));
    notifyProcessedChange(converted);
  }, [existingImages, notifyProcessedChange, productId]);

  /** Add new local files (queued even if productId is null) */
  const handleAddFiles = useCallback(
    (files: File[]) => {
      const valid = files.filter((f) => f.type.startsWith("image/") && !f.name.endsWith(".gif"));
      const newImages: UploadableImage[] = valid.map((file, i) => ({
        file,
        status: "pending" as UploadStatus,
        previewUrl: URL.createObjectURL(file),
        id: `local-${Date.now()}-${i}`,
        order: getSparseOrder(images.length + i),
      }));
      setImages((prev) => rebalanceOrders([...prev, ...newImages]));
    },
    [images.length]
  );

  /** Remove image */
  const handleRemove = useCallback(
    async (index: number) => {
      const img = images[index];
      if (!img.isExisting && img.previewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(img.previewUrl);
      }

      try {
        if (img.isExisting) await deleteImageWithStorage(img);
      } catch (err) {
        console.warn("Storage deletion failed:", err);
      }

      setImages((prev) => {
        const balanced = rebalanceOrders(prev.filter((_, i) => i !== index));
        notifyProcessedChange(balanced);
        return balanced;
      });
    },
    [images, notifyProcessedChange]
  );

  /** Reorder images */
  const handleReorder = useCallback(
    (from: number, to: number) => {
      const next = arrayMoveImmutable(images, from, to);
      const balanced = rebalanceOrders(next);
      setImages(balanced);
      notifyProcessedChange(balanced);
      return balanced;
    },
    [images, notifyProcessedChange]
  );

  /** Upload single image (DB-first, then storage) */
  const uploadSingle = useCallback(
    async (index: number, file: File, idOverride?: string) => {
      const effectiveId = idOverride || productId;
      if (!effectiveId) return;

      const imgToProcess = images[index];
      const fileExt = file.name.split(".").pop()!;
      const order = imgToProcess.order ?? getSparseOrder(index);

      setImages((prev) =>
        prev.map((img, i) =>
          i === index ? { ...img, status: "uploading", errorMessage: undefined } : img
        )
      );

      try {
        // Step 1: Create DB row first
        const dbRow = await createImageDbRow(file, effectiveId, order);
        if (!dbRow?.id) {
          throw new Error("Failed to create image record in database");
        }

        const { id: dbId, basename, extension } = dbRow;

        // Step 2: Upload original image to storage
        const { url: signedUrl } = await getSignedUploadUrl(
          getOriginalPath(effectiveId, basename, extension)
        );
        await uploadViaSignedUrl(signedUrl, file, file.type);

        // Step 3: Generate resized variants
        const resizedBlobs = await resizeImage(file, TARGET_WIDTHS);
        const resizedPaths = getResizedPaths(effectiveId, basename, extension);
        for (let i = 0; i < resizedPaths.length; i++) {
          const { url } = await getSignedUploadUrl(resizedPaths[i]);
          await uploadViaSignedUrl(url, resizedBlobs[i], file.type);
        }

        // Step 4: Build public preview URL
        const newPreviewUrl = `https://${process.env.NEXT_PUBLIC_SUPABASE_URL!.replace(
          /^https?:\/\//,
          ""
        )}/storage/v1/object/public/${BASE_BUCKET}/${getPreviewPath(
          effectiveId,
          basename,
          extension
        )}`;

        // Step 5: Update local state
        setImages((prev) => {
          const updated = prev.map((img, i) =>
            i === index
              ? {
                  ...img,
                  status: "success" as UploadStatus,
                  processedVariants: resizedPaths,
                  basename,
                  extension,
                  imageId: dbId,
                  previewUrl: newPreviewUrl,
                }
              : img
          );
          notifyProcessedChange(updated);
          return updated;
        });
      } catch (err: any) {
        console.error("Upload error:", err);
        // Stop upload if DB creation failed or any error occurs
        setImages((prev) =>
          prev.map((img, i) =>
            i === index
              ? { ...img, status: "error", errorMessage: err.message || "Upload failed" }
              : img
          )
        );
      }
    },
    [images, notifyProcessedChange, productId]
  );

  /** Upload all pending images explicitly */
  const handleUploadAll = useCallback(
    async (idOverride?: string) => {
      const effectiveId = idOverride || productId;
      if (!effectiveId || uploadingRef.current) return;

      uploadingRef.current = true;
      for (let i = 0; i < images.length; i++) {
        const img = images[i];
        if (img.isExisting || img.status === "success" || !img.file) continue;
        await uploadSingle(i, img.file, effectiveId);
      }
      uploadingRef.current = false;
    },
    [images, uploadSingle, productId]
  );

  /** Cleanup blob URLs */
  useEffect(() => {
    return () => {
      images.forEach((img) => {
        if (!img.isExisting && img.previewUrl.startsWith("blob:")) {
          URL.revokeObjectURL(img.previewUrl);
        }
      });
    };
  }, [images]);

  return {
    images,
    handleAddFiles,
    handleRemove,
    handleReorder,
    handleUploadAll,
    uploadSingle,
    updateProductId,
  };
}
