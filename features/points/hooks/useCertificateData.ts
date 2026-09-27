import { useQuery } from "@tanstack/react-query";
import { getCertificateData } from "@/api/features/rewards";

export function useCertificateData() {
  return useQuery({
    queryKey: ["certificate-data"],
    queryFn: getCertificateData,
  });
}
