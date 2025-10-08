import { useEffect, useState, useCallback, useRef } from "react";
import { arrayMoveImmutable } from "array-move";
import { resizeImage } from "@/lib/imageResize";
import { getOriginalPath, getResizedPaths, getPreviewPath } from "@/lib/imagePaths";
import { getSignedUploadUrl, uploadViaSignedUrl } from "@/lib/imageUpload";
import {
  getSparseOrder,
  rebalanceOrders,
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

  /** Notify parent about successfully processed images */
  const notifyProcessedChange = useCallback(
    (updated: UploadableImage[]) => {
      onProcessedChange?.(
        updated
          .filter((img) => img.status === "success")
          .map((img) => ({
            basename: img.basename!,
            extension: img.extension!,
            order: img.order!,
            id: img.imageId,
          }))
      );
    },
    [onProcessedChange]
  );

  /** Initialize existing images */
  useEffect(() => {
    if (!existingImages?.length) return;

    const converted: UploadableImage[] = existingImages.map((img, idx) => {
      const originalPath = getOriginalPath(slug, img.basename, img.extension);
      const previewPath = getPreviewPath(slug, img.basename, img.extension);
      const previewUrl = `https://${process.env.NEXT_PUBLIC_SUPABASE_URL!.replace(/^https?:\/\//, '')}/storage/v1/object/public/product-images/${previewPath}`;
      const dummyFile = new File([], `existing-${img.id}`, { type: "image/jpeg" });

      return {
        file: dummyFile,
        status: "success" as UploadStatus,
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

  /** Add new files */
  const handleAddFiles = async (files: File[]) => {
    const valid = files.filter((f) => f.type.startsWith("image/") && !f.name.endsWith(".gif"));
    const newImages: UploadableImage[] = [];

    for (let i = 0; i < valid.length; i++) {
      const file = valid[i];
      let dbRow;
      try {
        // createImageDbRow now prepends timestamp to basename
        dbRow = await createImageDbRow(file, slug, getSparseOrder(images.length + i));
      } catch {
        continue;
      }

      newImages.push({
        file,
        status: "idle" as UploadStatus,
        previewUrl: URL.createObjectURL(file),
        id: `new-${dbRow.basename}-${i}`, // use DB's timestamped basename
        imageId: dbRow.id,
        basename: dbRow.basename, // timestamped
        extension: dbRow.extension,
        order: getSparseOrder(images.length + i),
      });
    }

    setImages((prev) => {
      const balanced = rebalanceOrders([...prev, ...newImages]);
      notifyProcessedChange(balanced);
      return balanced;
    });
  };

  /** Remove image */
  const handleRemove = async (index: number) => {
    const img = images[index];

    if (!img.isExisting && img.previewUrl) URL.revokeObjectURL(img.previewUrl);

    try {
      await deleteImageWithStorage(img);
    } catch {
      return;
    }

    setImages((prev) => {
      const balanced = rebalanceOrders(prev.filter((_, i) => i !== index));
      notifyProcessedChange(balanced);
      return balanced;
    });
  };

  /** Retry upload */
  const handleRetry = async (index: number) => {
    const img = images[index];
    if (img.isExisting) return;
    if (img.previewUrl) URL.revokeObjectURL(img.previewUrl);

    const resetImg: UploadableImage = {
      ...img,
      previewUrl: URL.createObjectURL(img.file),
      status: "idle" as UploadStatus,
      errorMessage: undefined,
    };

    setImages((prev) => {
      const next = prev.map((curr, i) => (i === index ? resetImg : curr));
      notifyProcessedChange(next);
      return next;
    });

    await uploadAndProcess(index, resetImg.file, img.imageId, img.basename);
  };

  /** Reorder images */
  const handleReorder = (from: number, to: number) => {
    setImages((prev) => {
      const next = arrayMoveImmutable(prev, from, to);
      const balanced = rebalanceOrders(next);
      notifyProcessedChange(balanced);
      return balanced;
    });
  };

  /** Upload and resize images with rollback on failure */
  const uploadAndProcess = async (index: number, file: File, imageId?: string, basename?: string) => {
    const imgToProcess = images[index];
    const fileName = basename || `${Date.now()}_${file.name}`;
    const originalPath = getOriginalPath(slug, fileName);

    setImages((prev) =>
      prev.map((img, i) =>
        i === index ? { ...img, status: "uploading" as UploadStatus, errorMessage: undefined } : img
      )
    );

    try {
      const { url: signedUrl } = await getSignedUploadUrl(originalPath);
      await uploadViaSignedUrl(signedUrl, file, file.type);

      setImages((prev) =>
        prev.map((img, i) =>
          i === index ? { ...img, status: "processing" as UploadStatus, originalPath } : img
        )
      );

      const resizedBlobs = await resizeImage(file, TARGET_WIDTHS);
      const resizedPaths = getResizedPaths(
        slug,
        fileName.replace(/\.[^/.]+$/, ""),
        file.name.split(".").pop()!
      );

      for (let i = 0; i < resizedPaths.length; i++) {
        const { url: resizedUrl } = await getSignedUploadUrl(resizedPaths[i]);
        await uploadViaSignedUrl(resizedUrl, resizedBlobs[i], file.type);
      }

      setImages((prev) => {
        const next = prev.map((img, i) =>
          i === index
            ? {
              ...img,
              status: "success" as UploadStatus,
              processedVariants: resizedPaths,
              basename: fileName.replace(/\.[^/.]+$/, ""),
              extension: file.name.split(".").pop()!,
              imageId,
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
          i === index ? { ...img, status: "error" as UploadStatus, errorMessage: err.message } : img
        )
      );
    }
  };

  /** Sequential auto-upload queue */
  useEffect(() => {
    if (uploadingRef.current) return;
    uploadingRef.current = true;

    const uploadQueue = async () => {
      for (let i = 0; i < images.length; i++) {
        const img = images[i];
        if (img.status === "idle" && !img.isExisting) {
          await uploadAndProcess(i, img.file, img.imageId, img.basename);
        }
      }
      uploadingRef.current = false;
    };

    uploadQueue();
  }, [images]);

  return { images, handleAddFiles, handleRemove, handleRetry, handleReorder };
}
