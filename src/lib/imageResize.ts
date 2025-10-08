export async function resizeImage(file: File, widths: number[]): Promise<Blob[]> {
  const bitmap = await createImageBitmap(file);
  const blobs: Blob[] = [];

  for (const width of widths) {
    const scale = width / bitmap.width;
    const height = Math.round(bitmap.height * scale);
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(bitmap, 0, 0, width, height);

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((b) => {
        if (b) resolve(b);
        else reject(new Error("Failed to create blob from canvas"));
      }, file.type, 0.85);
    });

    blobs.push(blob);
  }

  return blobs;
}
