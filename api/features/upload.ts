import { getAuthToken } from "@/lib/secure-storage";
import { getApiBaseUrl } from "@/api/base-url";

export type UploadResponse = { url: string };

/**
 * Upload a file to the server. Returns the URL of the uploaded file.
 * Uses fetch directly to handle multipart/form-data with proper auth.
 */
export async function uploadFile(
  uri: string,
  filename: string,
  mimeType: string,
): Promise<UploadResponse> {
  const token = await getAuthToken();

  const formData = new FormData();
  // React Native FormData accepts object with uri/name/type for file uploads
  formData.append("file", { uri, name: filename, type: mimeType } as unknown as Blob);

  const response = await fetch(`${getApiBaseUrl()}/upload`, {
    method: "POST",
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      // Do NOT set Content-Type — fetch sets it automatically with boundary for FormData
    },
    body: formData,
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "Upload failed");
    throw new Error(`Upload failed (${response.status}): ${text}`);
  }

  return response.json() as Promise<UploadResponse>;
}
