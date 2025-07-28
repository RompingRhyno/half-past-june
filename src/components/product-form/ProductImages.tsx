"use client";

import React from "react";
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { X, RotateCcw } from "lucide-react";
import { UploadableImage } from "./ProductImages.types";
import { useProductImageManager } from "./useProductImageManager";
import SortableImage from "./SortableImage";

type ProductImagesProps = {
  slug: string;
  existingImages?: {
    id: string;
    basename: string;
    extension: string;
  }[];
  onProcessedChange?: (processedImages: UploadableImage[]) => void;
};

export default function ProductImages({ slug, existingImages = [], onProcessedChange }: ProductImagesProps) {
  const sensors = useSensors(useSensor(PointerSensor));

  const {
    images,
    handleAddFiles,
    handleRemove,
    handleRetry,
    handleReorder,
  } = useProductImageManager(slug, existingImages, onProcessedChange);

  // Convert input change event to file array and call handleAddFiles
  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const filesArray = Array.from(e.target.files);
    handleAddFiles(filesArray);
    e.target.value = ""; // clear input so same file can be re-uploaded
  };

  // Map dnd-kit onDragEnd to handleReorder
  const onDragEnd = (event: any) => {
    const { active, over } = event;
    if (active.id !== over?.id) {
      const oldIndex = images.findIndex((img) => img.id === active.id);
      const newIndex = images.findIndex((img) => img.id === over?.id);
      if (oldIndex >= 0 && newIndex >= 0) {
        handleReorder(oldIndex, newIndex);
      }
    }
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium">Images</label>
      <input
        type="file"
        accept="image/*"
        multiple
        onChange={onFileChange}
        className="block w-full text-sm border border-gray-300 rounded p-2"
      />

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={images.map((img) => img.id)} strategy={verticalListSortingStrategy}>
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
