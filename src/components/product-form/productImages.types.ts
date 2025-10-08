export type UploadStatus = "idle" | "uploading" | "processing" | "success" | "error";

export type UploadableImage = {
  file: File;
  status: UploadStatus;
  previewUrl: string;
  originalPath?: string;
  processedVariants?: string[];
  errorMessage?: string;
  id: string;
  isExisting?: boolean;
  basename?: string;
  extension?: string;
  imageId?: string; // used for existing images in DB
  order?: number;
};

export type ProcessedImageInfo = {
  basename: string;
  extension: string;
  order: number;
  id?: string;
};