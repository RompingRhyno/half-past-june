const BASE_BUCKET = "product-images"; // Supabase storage bucket
const TARGET_WIDTHS = [720, 1080, 1512];


export function getOriginalPath(slug: string, basename: string, ext: string): string;
export function getOriginalPath(slug: string, filename: string): string;
export function getOriginalPath(slug: string, namePart: string, ext?: string): string {
  if (ext !== undefined) {
    return `${slug}/original/${namePart}.${ext}`;
  }
  return `${slug}/original/${namePart}`;
}

export function getResizedPaths(
  slug: string,
  basename: string,
  ext: string
): string[] {
  return TARGET_WIDTHS.map((width) => 
    `${slug}/resized/${basename}_${width}x.${ext}`
  );
}

export function getPreviewPath(slug: string, basename: string, ext: string): string {
  return `${slug}/resized/${basename}_720x.${ext}`;
}