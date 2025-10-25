"use client";

import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { useState, useCallback, useMemo, useEffect } from "react";
import { getImageSrcSet } from "@/lib/imageSrcset";
import { prefetchScheduler } from "@/lib/prefetchScheduler";

interface ProductCardProps {
  product: {
    id: string;
    slug: string;
    name: string;
    description: string;
    images: { basename: string; extension: string; order: number }[];
  };
  onClick?: (slug: string) => void;
}

export default function ProductCard({ product, onClick }: ProductCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const sortedImages = useMemo(
    () => [...product.images].sort((a, b) => a.order - b.order),
    [product.images]
  );
  const topImages = sortedImages.slice(0, 3);
  const remainingImages = sortedImages.slice(3);

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!expanded) return;
      if (e.key === "ArrowRight") setActiveIndex((i) => (i + 1) % sortedImages.length);
      if (e.key === "ArrowLeft") setActiveIndex((i) => (i - 1 + sortedImages.length) % sortedImages.length);
      if (e.key === "Escape") setExpanded(false);
    },
    [expanded, sortedImages.length]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  // Prefetch remaining images after top 3 (collapsed)
  useEffect(() => {
    remainingImages.forEach((img, i) => {
      const { src } = getImageSrcSet(product.id, img.basename, img.extension);
      setTimeout(() => prefetchScheduler.enqueue(src), i * 150);
    });
  }, [remainingImages, product.id]);

  // Prefetch expanded view images
  useEffect(() => {
    if (!expanded) return;

    const activeImg = sortedImages[activeIndex];
    const { src: activeSrc } = getImageSrcSet(product.id, activeImg.basename, activeImg.extension);
    prefetchScheduler.enqueue(activeSrc);

    sortedImages.forEach((img, i) => {
      if (i === activeIndex) return;
      const { src } = getImageSrcSet(product.id, img.basename, img.extension);
      prefetchScheduler.enqueue(src);
    });
  }, [expanded, activeIndex, sortedImages, product.id]);

  const handleGalleryClick = (index: number) => {
    setActiveIndex(index);
    const img = sortedImages[index];
    const { src } = getImageSrcSet(product.id, img.basename, img.extension);
    prefetchScheduler.enqueue(src);
  };

  const handleCardClick = () => {
    setExpanded((prev) => !prev);
  };

  return (
    <motion.div
      layout
      transition={{ duration: 0.5, ease: "easeInOut" }}
      className="w-full bg-white shadow rounded-2xl overflow-hidden cursor-pointer"
      onClick={onClick ? () => onClick(product.slug) : handleCardClick}
    >
      <AnimatePresence>
        {!expanded ? (
          // Collapsed layout
          <motion.div layout className="grid grid-cols-3 gap-2 p-2">
            {topImages.map((img, i) => {
              const { src, srcSet, sizes } = getImageSrcSet(product.id, img.basename, img.extension);
              return (
                <div key={i} className="relative aspect-square overflow-hidden rounded-xl">
                  <img
                    src={src}
                    srcSet={srcSet}
                    sizes={sizes}
                    alt={product.name}
                    className="object-cover w-full h-full transition-transform duration-300 hover:scale-105"
                    loading={i === 0 ? "eager" : "lazy"}
                  />
                  {i === 0 && (
                    <div className="absolute bottom-0 left-0 w-full bg-black/50 text-white p-2 text-lg font-semibold">
                      {product.name}
                    </div>
                  )}
                </div>
              );
            })}

            {topImages.length < 3 && (
              <div className="col-span-1 flex items-center justify-center p-4">
                <p className="text-gray-700 text-sm line-clamp-3">
                  {product.description} <span className="text-blue-600">...see more</span>
                </p>
              </div>
            )}
          </motion.div>
        ) : (
          // Expanded layout
          <motion.div layout className="flex flex-col md:flex-row">
            {/* Left: image + gallery */}
            <div className="flex-1 flex flex-col bg-black">
              {/* First image with fixed height */}
              <div
                className="relative w-full"
                style={{ height: "0", paddingBottom: "100%" }} // maintain collapsed square height
              >
                <img
                  src={getImageSrcSet(product.id, sortedImages[activeIndex].basename, sortedImages[activeIndex].extension).src}
                  alt={`${product.name} image ${activeIndex + 1}`}
                  className="object-contain w-full h-full absolute top-0 left-0"
                  loading="lazy"
                />
              </div>

              {/* Gallery thumbnails below */}
              <div className="flex gap-2 p-2 overflow-x-auto mt-2">
                {sortedImages.map((img, i) => {
                  const { src } = getImageSrcSet(product.id, img.basename, img.extension);
                  return (
                    <button
                      key={i}
                      className={`w-16 h-16 relative border-2 ${i === activeIndex ? "border-blue-500" : "border-transparent"}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleGalleryClick(i);
                      }}
                    >
                      <Image src={src} alt="thumb" fill className="object-cover rounded" />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Right: description */}
            <div className="flex-1 overflow-y-auto p-6">
              <h2 className="text-2xl font-bold mb-4">{product.name}</h2>
              <p className="text-gray-700 whitespace-pre-line">{product.description}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
