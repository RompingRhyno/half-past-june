import { useEffect, useState, useCallback, useRef } from "react";
import { arrayMoveImmutable } from "array-move";
import { resizeImage } from "@/lib/imageResize";
import { getOriginalPath, getResizedPaths, getPreviewPath } from "@/lib/imagePaths";
import { getSignedUploadUrl, uploadViaSignedUrl } from "@/lib/imageUpload";
import {
  getSparseOrder,
  rebalanceOrders,
  reorderAndRebalance,
  createImageDbRow,
  deleteImageWithStorage,
} from "@/lib/imageManagerHelpers";
import { UploadableImage } from "./productImages.types";
import { TARGET_WIDTHS } from "@/lib/imagePaths";

export type ExistingImage = {
  id: string;
  basename: string;
  extension: string;
  order?: number;
};

export type ProcessedImageInfo = {
  basename: string;
  extension: string;
  order: number;
  id?: string;
};

export type UploadStatus = "idle" | "uploading" | "processing" | "success" | "error";

export function useProductImageManager(
  slug: string,
  existingImages?: ExistingImage[],
  onProcessedChange?: (processed: ProcessedImageInfo[]) => void
) {
  const [images, setImages] = useState<UploadableImage[]>([]);
  const uploadingRef = useRef(false);

  /** Notify parent only of successfully processed images */
  const notifyProcessedChange = useCallback(
    (updated: UploadableImage[]) => {
      if (!onProcessedChange) return;
      const processed = updated
        .filter((img) => img.status === "success")
        .map((img) => ({
          basename: img.basename!,
          extension: img.extension!,
          order: img.order!,
          id: img.imageId,
        }));
      onProcessedChange(processed);
    },
    [onProcessedChange]
  );

  /** Initialize existing images sorted by order */
  useEffect(() => {
    if (!existingImages?.length) return;

    const sorted = [...existingImages].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

    const converted: UploadableImage[] = sorted.map((img, idx) => {
      const originalPath = getOriginalPath(slug, img.basename, img.extension);
      const previewPath = getPreviewPath(slug, img.basename, img.extension);
      const previewUrl = `https://${process.env.NEXT_PUBLIC_SUPABASE_URL!.replace(
        /^https?:\/\//,
        ""
      )}/storage/v1/object/public/product-images/${previewPath}`;
      const dummyFile = new File([], `existing-${img.id}`, { type: "image/jpeg" });

      return {
        file: dummyFile,
        status: "success",
        previewUrl,
        originalPath,
        processedVariants: getResizedPaths(slug, img.basename, img.extension),
        id: `existing-${img.id}`,
        isExisting: true,
        basename: img.basename,
        extension: img.extension,
        imageId: img.id,
        order: img.order ?? getSparseOrder(idx),
      };
    });

    const balanced = rebalanceOrders(converted);
    setImages(balanced);
    notifyProcessedChange(balanced);
  }, [existingImages, slug, notifyProcessedChange]);

  /** Add new files — create local preview only */
  const handleAddFiles = useCallback((files: File[]) => {
    const valid = files.filter(
      (f) => f.type.startsWith("image/") && !f.name.endsWith(".gif")
    );

    const newImages: UploadableImage[] = valid.map((file, i) => ({
      file,
      status: "idle",
      previewUrl: URL.createObjectURL(file),
      id: `local-${Date.now()}-${i}`,
      order: getSparseOrder(images.length + i),
    }));

    setImages((prev) => rebalanceOrders([...prev, ...newImages]));
  }, [images.length]);

  /** Remove image (local or existing) */
  const handleRemove = useCallback(async (index: number) => {
    const img = images[index];

    if (!img.isExisting && img.previewUrl?.startsWith("blob:")) {
      URL.revokeObjectURL(img.previewUrl);
    }

    try {
      await deleteImageWithStorage(img);
    } catch {
      // ignore deletion errors
    }

    setImages((prev) => {
      const balanced = rebalanceOrders(prev.filter((_, i) => i !== index));
      notifyProcessedChange(balanced);
      return balanced;
    });
  }, [images, notifyProcessedChange]);

  /** Retry upload immediately for one image */
  const handleRetry = useCallback(async (index: number) => {
    const img = images[index];
    if (img.isExisting || img.status === "success") return;

    const resetImg: UploadableImage = { ...img, status: "idle", errorMessage: undefined };

    setImages((prev) => prev.map((curr, i) => (i === index ? resetImg : curr)));
    await uploadSingle(index, resetImg.file);
  }, [images]);

  /** Reorder images with sparse order */
  const handleReorder = useCallback(
    (from: number, to: number): UploadableImage[] => {
      const next = [...images];
      const [moved] = next.splice(from, 1); // remove moved image
      next.splice(to, 0, moved); // insert at new index

      // Determine new sparse order for moved image
      const prev = next[to - 1]?.order ?? 0;
      const nextOrder = next[to + 1]?.order ?? prev + 20; // some default gap if at end
      const newOrder = prev + Math.floor((nextOrder - prev) / 2);

      moved.order = newOrder;

      // Check if collision occurred
      const collision = next.some((img, idx) => {
        if (idx === 0) return false;
        return next[idx].order! <= next[idx - 1].order!;
      });

      const balanced = collision ? rebalanceOrders(next) : next;

      setImages(balanced);
      notifyProcessedChange(balanced);

      return balanced;
    },
    [images, notifyProcessedChange]
  );

  /** Upload and resize one image */
  const uploadSingle = useCallback(async (
    index: number,
    file: File,
    imageId?: string,
    basename?: string
  ) => {
    const imgToProcess = images[index];
    const fileExt = file.name.split(".").pop()!;
    const fileNameBase = basename || `${Date.now()}_${file.name}`;
    const originalPath = getOriginalPath(slug, fileNameBase);

    setImages((prev) =>
      prev.map((img, i) =>
        i === index ? { ...img, status: "uploading", errorMessage: undefined } : img
      )
    );

    try {
      // Upload original
      const { url: signedUrl } = await getSignedUploadUrl(originalPath);
      await uploadViaSignedUrl(signedUrl, file, file.type);

      setImages((prev) =>
        prev.map((img, i) =>
          i === index ? { ...img, status: "processing", originalPath } : img
        )
      );

      // Resize and upload variants
      const resizedBlobs = await resizeImage(file, TARGET_WIDTHS);
      const resizedPaths = getResizedPaths(slug, fileNameBase, fileExt);

      for (let i = 0; i < resizedPaths.length; i++) {
        const { url: resizedUrl } = await getSignedUploadUrl(resizedPaths[i]);
        await uploadViaSignedUrl(resizedUrl, resizedBlobs[i], file.type);
      }

      // Update to Supabase preview URL
      const newPreviewUrl = `https://${process.env.NEXT_PUBLIC_SUPABASE_URL!.replace(
        /^https?:\/\//,
        ""
      )}/storage/v1/object/public/product-images/${getPreviewPath(
        slug,
        fileNameBase,
        fileExt
      )}`;

      setImages((prev) => {
        const next = prev.map((img, i) =>
          i === index
            ? {
              ...img,
              status: "success" as UploadStatus,
              processedVariants: resizedPaths,
              basename: fileNameBase,
              extension: fileExt,
              imageId,
              previewUrl: newPreviewUrl,
            }
            : img
        );
        notifyProcessedChange(next);
        return next;
      });

    } catch (err: any) {
      console.error("Upload error:", err);

      if (imageId) {
        try {
          await deleteImageWithStorage({ ...imgToProcess, imageId });
        } catch (deleteErr) {
          console.error("Rollback deletion failed:", deleteErr);
        }
      }

      setImages((prev) =>
        prev.map((img, i) =>
          i === index ? { ...img, status: "error", errorMessage: err.message } : img
        )
      );
    }
  }, [images, slug, notifyProcessedChange]);

  /** Upload all pending images — call from form submit */
  const handleUploadAll = useCallback(async (): Promise<void> => {
    if (uploadingRef.current) return;
    uploadingRef.current = true;

    for (let i = 0; i < images.length; i++) {
      const img = images[i];
      if (img.isExisting || img.status === "success") continue;

      try {
        const dbRow = await createImageDbRow(img.file, slug, img.order);
        await uploadSingle(i, img.file, dbRow.id, dbRow.basename);
      } catch (err) {
        console.error("Failed to upload image:", err);
      }
    }

    uploadingRef.current = false;
  }, [images, slug, uploadSingle]);

  /** Cleanup object URLs on unmount */
  useEffect(() => {
    return () => {
      images.forEach((img) => {
        if (!img.isExisting && img.previewUrl?.startsWith("blob:")) {
          URL.revokeObjectURL(img.previewUrl);
        }
      });
    };
  }, [images]);

  return {
    images,
    handleAddFiles,
    handleRemove,
    handleRetry,
    handleReorder,
    handleUploadAll,
  };
}
