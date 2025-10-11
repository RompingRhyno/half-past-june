export const BASE_BUCKET = "product-images"; // Supabase storage bucket
export const TARGET_WIDTHS = [720, 900, 1080, 1296, 1512, 1728, 2048];

export function getOriginalPath(productId: string, basename: string, ext: string): string {
  return `${productId}/original/${basename}.${ext}`;
}

/**
 * Generate all resized variant paths (for responsive images).
 * Example:
 *   getResizedPaths("123", "abc", "jpg") →
 *     ["123/resized/abc_720x.jpg", "123/resized/abc_900x.jpg", ...]
 */
export function getResizedPaths(
  productId: string,
  basename: string,
  ext: string
): string[] {
  return TARGET_WIDTHS.map((width) => 
    `${productId}/resized/${basename}_${width}x.${ext}`
  );
}

/**
 * Generate path for the default preview image (720px version).
 * Example:
 *   getPreviewPath("123", "abc", "jpg") → "123/resized/abc_720x.jpg"
 */
export function getPreviewPath(productId: string, basename: string, ext: string): string {
  return `${productId}/resized/${basename}_720x.${ext}`;
}
