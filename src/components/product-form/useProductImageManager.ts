// hooks/useProductImageManager.ts
import { useEffect, useState, useCallback } from "react";
import { arrayMoveImmutable } from "array-move";
import { toast } from "sonner";
import { supabase } from "@/lib/supabaseClient";
import {
  getOriginalPath,
  getResizedPaths,
  getPreviewPath,
} from "@/lib/imagePaths";
import { UploadableImage } from "./ProductImages.types";

export type UploadStatus = "idle" | "uploading" | "processing" | "success" | "error";

export type ExistingImage = {
  id: string;
  basename: string;
  extension: string;
};

type ProcessImageResponse = {
  success: boolean;
  variants?: Array<{ width: number; path: string; size_bytes: number }>;
  errors?: Array<{ width: number; error: string }>;
};

export function useProductImageManager(
  slug: string,
  existingImages?: ExistingImage[],
  onProcessedChange?: (processed: UploadableImage[]) => void
) {
  const [images, setImages] = useState<UploadableImage[]>([]);

  useEffect(() => {
    if (!existingImages?.length) return;

    const converted = existingImages.map((img) => {
      const file = new File([], `existing-${img.id}`, { type: "image/jpeg" });
      const originalPath = getOriginalPath(slug, img.basename, img.extension);
      return {
        file,
        status: "success" as UploadStatus,
        previewUrl: getPreviewPath(slug, img.basename, img.extension),
        originalPath,
        processedVariants: getResizedPaths(slug, img.basename, img.extension),
        id: `existing-${img.id}`,
        isExisting: true,
      };
    });

    setImages(converted);
    notifyProcessedChange(converted);
  }, [existingImages]);

  const notifyProcessedChange = useCallback(
    (updated: UploadableImage[]) => {
      onProcessedChange?.(updated.filter((img) => img.status === "success"));
    },
    [onProcessedChange]
  );

  const handleAddFiles = (files: File[]) => {
    const valid = files.filter(
      (f) => f.type.startsWith("image/") && !f.name.endsWith(".gif")
    );

    const newImages: UploadableImage[] = valid.map((file, i) => ({
      file,
      status: "idle",
      previewUrl: URL.createObjectURL(file),
      id: `new-${file.name}-${Date.now()}-${i}`,
    }));

    const next = [...images, ...newImages];
    setImages(next);
    notifyProcessedChange(next);
  };

  const handleRemove = async (index: number) => {
    const img = images[index];

    if (!img.isExisting && img.previewUrl) {
      URL.revokeObjectURL(img.previewUrl);
    }

    if (img.originalPath && !img.isExisting) {
      try {
        const toDelete = [img.originalPath, ...(img.processedVariants || [])];
        await supabase.storage.from("product-images").remove(toDelete);
      } catch (err) {
        console.error(err);
        toast.error("Failed to delete image");
      }
    }

    const next = images.filter((_, i) => i !== index);
    setImages(next);
    notifyProcessedChange(next);
  };

  const handleRetry = async (index: number) => {
    const img = images[index];
    if (img.isExisting) return;

    if (img.previewUrl) URL.revokeObjectURL(img.previewUrl);

    if (img.originalPath) {
      await supabase.storage
        .from("product-images")
        .remove([img.originalPath, ...(img.processedVariants || [])]);
    }

    const newPreview = URL.createObjectURL(img.file);
    const resetImg = {
      ...img,
      previewUrl: newPreview,
      status: "idle" as UploadStatus,
      errorMessage: undefined,
    };

    const next = images.map((curr, i) => (i === index ? resetImg : curr));
    setImages(next);
    notifyProcessedChange(next);
    await uploadAndProcess(index, resetImg.file);
  };

  const handleReorder = (from: number, to: number) => {
    const next = arrayMoveImmutable(images, from, to);
    setImages(next);
    notifyProcessedChange(next);
  };

  const uploadAndProcess = async (index: number, file: File) => {
    const fileName = `${Date.now()}_${file.name}`;
    const filePath = getOriginalPath(slug, fileName);

    setImages((prev) =>
      prev.map((img, i) =>
        i === index ? { ...img, status: "uploading", errorMessage: undefined } : img
      )
    );

    try {
      const { error } = await supabase.storage
        .from("product-images")
        .upload(filePath, file);
      if (error) throw new Error(error.message);

      setImages((prev) =>
        prev.map((img, i) =>
          i === index ? { ...img, status: "processing", originalPath: filePath } : img
        )
      );

      const res = await fetch(
        "https://jbxvsqrmkyswvjcuwwkr.supabase.co/functions/v1/process-image",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ path: filePath }),
        }
      );

      const json: ProcessImageResponse = await res.json();
      if (!res.ok) {
        const errorMessage = json?.errors?.map(e => e.error).join(", ") || "Processing failed";
        throw new Error(errorMessage);
      }

      const processed = json.variants?.map((v) => v.path) || [];

      setImages((prev) =>
        prev.map((img, i) =>
          i === index
            ? {
                ...img,
                status: "success",
                originalPath: filePath,
                processedVariants: processed,
              }
            : img
        )
      );

      notifyProcessedChange(
        images.map((img, i) =>
          i === index
            ? {
                ...img,
                status: "success",
                originalPath: filePath,
                processedVariants: processed,
              }
            : img
        )
      );
    } catch (err: any) {
      setImages((prev) =>
        prev.map((img, i) =>
          i === index ? { ...img, status: "error", errorMessage: err.message } : img
        )
      );
    }
  };

  useEffect(() => {
    images.forEach((img, i) => {
      if (img.status === "idle" && !img.isExisting) {
        uploadAndProcess(i, img.file);
      }
    });
  }, [images]);

  return {
    images,
    handleAddFiles,
    handleRemove,
    handleRetry,
    handleReorder,
  };
}
