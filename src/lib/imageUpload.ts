// /lib/imageUpload.ts
export async function getSignedUploadUrl(path: string): Promise<{ url: string }> {
  const res = await fetch("/api/images/signed-upload", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ path }),
  });

  const text = await res.text(); // get raw response for debugging
  if (!res.ok) throw new Error(`Failed to get signed upload URL: ${text}`);
  return JSON.parse(text);
}

export async function uploadViaSignedUrl(url: string, file: Blob, contentType: string) {
  const res = await fetch(url, {
    method: "PUT",
    headers: { "Content-Type": contentType },
    body: file,
  });
  if (!res.ok) throw new Error(`Failed to upload file (${res.status})`);
}
