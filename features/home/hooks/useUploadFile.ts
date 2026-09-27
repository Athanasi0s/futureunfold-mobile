import { useMutation } from "@tanstack/react-query";
import { uploadFile } from "@/api/features/upload";

type UploadParams = { uri: string; filename: string; mimeType: string };

export const useUploadFile = () => {
  return useMutation({
    mutationFn: ({ uri, filename, mimeType }: UploadParams) =>
      uploadFile(uri, filename, mimeType),
  });
};
