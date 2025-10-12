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
import { ProcessedImageInfo, UploadableImage, ExistingImage } from "./productImages.types";
import { useProductImageManager } from "./useProductImageManager";
import SortableImage from "./SortableImage";

export type ProductImagesHandle = {
  uploadAll: (productIdOverride?: string) => Promise<void>;
  updateProductId: (newId: string) => void;
  getProcessedImages: () => ProcessedImageInfo[];
};

type ProductImagesProps = {
  productId: string | null;
  existingImages?: ExistingImage[];
  onProcessedChange?: (processed: ProcessedImageInfo[]) => void;
  onOrderChange?: (orderedImages: ProcessedImageInfo[]) => void;
};

const ProductImages = forwardRef<ProductImagesHandle, ProductImagesProps>(
  ({ productId, existingImages = [], onProcessedChange, onOrderChange }, ref) => {
    const sensors = useSensors(useSensor(PointerSensor));

    const {
      images,
      handleAddFiles,
      handleRemove,
      handleReorder,
      handleUploadAll,
      uploadSingle,
      updateProductId: hookUpdateProductId, // rename to avoid collision
    } = useProductImageManager(productId, existingImages, onProcessedChange);

    /** Expose imperative methods */
    useImperativeHandle(
      ref,
      () => ({
        // Upload all pending images, optionally overriding productId
        uploadAll: async (productIdOverride?: string) => {
          const idToUse = productIdOverride || productId;
          if (!idToUse) return;
          await handleUploadAll(idToUse);
        },

        // Update internal productId in the hook; queued images are not auto-uploaded
        updateProductId: (newId: string) => {
          hookUpdateProductId(newId); // call hook method
        },

        // Return all successfully processed images
        getProcessedImages: () =>
          images
            .filter(
              (img) =>
                img.status === "success" &&
                img.basename &&
                img.extension &&
                typeof img.order === "number"
            )
            .map((img) => ({
              id: img.imageId!,
              basename: img.basename!,
              extension: img.extension!,
              order: img.order!,
            })),
      }),
      [images, handleUploadAll, hookUpdateProductId, productId]
    );

    /** Handle file input */
    const onFileChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files) return;
        handleAddFiles(Array.from(e.target.files));
        e.target.value = "";
      },
      [handleAddFiles]
    );

    /** Handle drag-and-drop reordering */
    const reorderAndNotify = useCallback(
      (oldIndex: number, newIndex: number) => {
        const reordered: UploadableImage[] = handleReorder(oldIndex, newIndex);
        if (!onOrderChange) return;

        const processedOrdered = reordered
          .filter(
            (img) =>
              img.status === "success" &&
              img.basename &&
              img.extension &&
              typeof img.order === "number"
          )
          .map((img) => ({
            id: img.imageId!,
            basename: img.basename!,
            extension: img.extension!,
            order: img.order!,
          }));

        onOrderChange(processedOrdered);
      },
      [handleReorder, onOrderChange]
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
                  onRetry={img.file ? () => uploadSingle(index, img.file!) : undefined}
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
