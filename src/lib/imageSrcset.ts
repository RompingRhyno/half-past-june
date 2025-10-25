import { BASE_BUCKET, TARGET_WIDTHS } from "./imagePaths";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL as string;

export interface ImageSrcSet {
  src: string;
  srcSet: string;
  sizes: string;
}

/**
 * Generate responsive src, srcSet, and sizes for a given image.
 */
export function getImageSrcSet(
  productId: string,
  basename: string,
  ext: string
): ImageSrcSet {
  const baseUrl = `${SUPABASE_URL}/storage/v1/object/public/${BASE_BUCKET}`;
  const src = `${baseUrl}/${productId}/resized/${basename}_720x.${ext}`;

  const srcSet = TARGET_WIDTHS.map(
    (w) => `${baseUrl}/${productId}/resized/${basename}_${w}x.${ext} ${w}w`
  ).join(", ");

  const sizes = "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw";

  return { src, srcSet, sizes };
}
