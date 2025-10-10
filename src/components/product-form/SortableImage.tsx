"use client";

import React from "react";
import { X, RotateCcw } from "lucide-react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { UploadableImage } from "./productImages.types";

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
      {/* Draggable preview */}
      <div {...listeners} className="cursor-move w-full h-full relative">
        <img
          src={image.previewUrl}
          alt={`Image ${index}`}
          className={`object-cover w-full h-full ${
            image.status === "processing" || image.status === "uploading"
              ? "opacity-70"
              : "opacity-100"
          }`}
        />

        {/* Loading spinner overlay */}
        {(image.status === "uploading" || image.status === "processing") && (
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-white"></div>
          </div>
        )}

        {/* Error overlay */}
        {image.status === "error" && !image.isExisting && (
          <div className="absolute inset-0 flex flex-col items-center justify-end p-1 z-20">
            {image.errorMessage && (
              <div className="text-xs text-white bg-red-500 p-1 rounded max-w-full truncate mb-1 shadow">
                {image.errorMessage}
              </div>
            )}
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onRetry(index);
              }}
              className="bg-white rounded-full p-1"
            >
              <RotateCcw size={16} />
            </button>
          </div>
        )}
      </div>

      {/* Remove button (always visible except when error retry shows above) */}
      {(image.status === "idle" || image.status === "success") && (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onRemove(index);
          }}
          className="absolute top-1 right-1 bg-white bg-opacity-75 rounded-full p-1 text-red-600 hover:text-red-800 z-10 shadow"
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
}
