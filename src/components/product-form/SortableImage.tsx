"use client";

import React from "react";
import { X, RotateCcw } from "lucide-react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { UploadableImage } from "./ProductImages.types";

type SortableImageProps = {
  image: UploadableImage;
  index: number;
  onRemove: (index: number) => void;
  onRetry: (index: number) => void;
};

export default function SortableImage({
  image,
  index,
  onRemove,
  onRetry,
}: SortableImageProps) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: image.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    borderColor:
      image.status === "success"
        ? "green"
        : image.status === "error"
        ? "red"
        : "transparent",
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      className="relative w-24 h-24 border-2 rounded overflow-hidden"
    >
      <div {...listeners} className="cursor-move w-full h-full">
        <img
          src={image.previewUrl}
          alt={`Image ${index}`}
          className="object-cover w-full h-full"
        />
      </div>

      {(image.status === "uploading" || image.status === "processing") && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-10">
          <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-white"></div>
        </div>
      )}

      {image.status === "error" && !image.isExisting && (
        <div className="absolute inset-0 flex flex-col items-center justify-end p-1">
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onRetry(index);
            }}
            className="bg-white rounded-full p-1 z-20 mb-1"
          >
            <RotateCcw size={16} />
          </button>
          {image.errorMessage && (
            <div className="text-xs text-white bg-red-500 p-1 rounded max-w-full truncate">
              {image.errorMessage}
            </div>
          )}
        </div>
      )}

      {(image.status === "idle" || image.status === "success") && (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onRemove(index);
          }}
          className="absolute top-1 right-1 bg-white bg-opacity-75 rounded-full p-1 text-red-600 hover:text-red-800 z-10"
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
}
