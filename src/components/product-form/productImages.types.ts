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
};
