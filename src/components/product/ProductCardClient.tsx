"use client";

import dynamic from "next/dynamic";
import { useVisibility } from "@/hooks/useVisibility";
import { usePrefetchImages } from "@/hooks/usePrefetchImages";
import { getImageSrcSet } from "@/lib/imageSrcset";

const ProductCard = dynamic(() => import("./ProductCard"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-72 bg-gray-100 animate-pulse rounded-lg" />
  ),
});

interface ProductCardClientProps {
  product: {
    id: string;
    slug: string;
    name: string;
    description: string;
    images: { basename: string; extension: string; order: number }[];
  };
  eager?: boolean;
}

export default function ProductCardClient({
  product,
  eager = false,
}: ProductCardClientProps) {
  const [hydrationRef, visible] = useVisibility<HTMLDivElement>("600px");
  const [prefetchRef] = useVisibility<HTMLDivElement>("1000px");

  const shouldRender = eager || visible;

  // Prefetch top 3 images first
  const topImages = product.images
    .sort((a, b) => a.order - b.order)
    .slice(0, 3);
  const topPrefetchRef = usePrefetchImages(
    topImages,
    img => getImageSrcSet(product.id, img.basename, img.extension).src,
    { rootMargin: "1000px" }
  );

  // Prefetch remaining images (for gallery expansion)
  const remainingImages = product.images
    .sort((a, b) => a.order - b.order)
    .slice(3);
  const remainingPrefetchRef = usePrefetchImages(
    remainingImages,
    img => getImageSrcSet(product.id, img.basename, img.extension).src,
    { rootMargin: "1000px", staggerMs: 150 }
  );

  return (
    <div ref={prefetchRef}>
      <div ref={hydrationRef}>
        <div ref={topPrefetchRef}>
          <div ref={remainingPrefetchRef}>
            {shouldRender ? (
              <ProductCard product={product} />
            ) : (
              <div className="w-full h-72 bg-gray-100 animate-pulse rounded-lg" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
