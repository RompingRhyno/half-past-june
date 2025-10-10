"use client";

import React, { useCallback, useMemo, forwardRef, useImperativeHandle } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { ProcessedImageInfo } from "./productImages.types";
import { useProductImageManager } from "./useProductImageManager";
import SortableImage from "./SortableImage";
import { UploadableImage } from "./productImages.types";

export type ProductImagesHandle = {
  uploadAll: () => Promise<void>;
};

export type ExistingImage = {
  id: string;
  basename: string;
  extension: string;
};

type ProductImagesProps = {
  slug: string;
  existingImages?: ExistingImage[];
  onProcessedChange?: (processed: ProcessedImageInfo[]) => void;
  onOrderChange?: (orderedImages: ProcessedImageInfo[]) => void;
};

const ProductImages = forwardRef<ProductImagesHandle, ProductImagesProps>(
  ({ slug, existingImages = [], onProcessedChange, onOrderChange }, ref) => {
    const sensors = useSensors(useSensor(PointerSensor));

    const {
      images,
      handleAddFiles,
      handleRemove,
      handleRetry,
      handleReorder,
      handleUploadAll,
    } = useProductImageManager(slug, existingImages, onProcessedChange);

    const reorderAndNotify = useCallback(
      (oldIndex: number, newIndex: number) => {
        const reordered: UploadableImage[] = handleReorder(oldIndex, newIndex);
        if (!onOrderChange) return;

        // Convert to ProcessedImageInfo[] only include images that are processed
        const processedOrdered = reordered
          .filter(
            (img) =>
              img.status === "success" &&
              typeof img.basename === "string" &&
              typeof img.extension === "string" &&
              typeof img.order === "number"
          )
          .map((img) => ({
            basename: img.basename!,
            extension: img.extension!,
            order: img.order!,
            id: img.imageId,
          }));

        onOrderChange(processedOrdered);
      },
      [handleReorder, onOrderChange]
    );

    // Expose uploadAll to parent via ref
    useImperativeHandle(
      ref,
      () => ({
        uploadAll: handleUploadAll,
      }),
      [handleUploadAll]
    );

    const onFileChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files) return;
        const filesArray = Array.from(e.target.files);
        handleAddFiles(filesArray);
        e.target.value = ""; // allow re-upload of the same file
      },
      [handleAddFiles]
    );

    const onDragEnd = useCallback(
      (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;

        const oldIndex = images.findIndex((img) => img.id === active.id);
        const newIndex = images.findIndex((img) => img.id === over.id);
        if (oldIndex >= 0 && newIndex >= 0) reorderAndNotify(oldIndex, newIndex);
      },
      [images, reorderAndNotify]
    );

    const imageIds = useMemo(() => images.map((img) => img.id), [images]);

    return (
      <div className="space-y-2">
        <label className="block font-medium mb-1" htmlFor="product-images-input">
          Images
        </label>
        <input
          id="product-images-input"
          type="file"
          accept="image/*"
          multiple
          onChange={onFileChange}
          className="block w-full text-sm border border-gray-300 rounded p-2"
          aria-label="Upload product images"
        />

        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext items={imageIds} strategy={verticalListSortingStrategy}>
            <div className="flex gap-2 flex-wrap">
              {images.map((img, index) => (
                <SortableImage
                  key={img.id}
                  image={img}
                  index={index}
                  onRemove={handleRemove}
                  onRetry={handleRetry}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      </div>
    );
  }
);

ProductImages.displayName = "ProductImages";

export default ProductImages;
