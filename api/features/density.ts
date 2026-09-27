import { api } from "../client";
import type { DensityResponse } from "../schemas";

export async function getVenueDensity(): Promise<DensityResponse> {
  return api.basic<DensityResponse>({
    url: "/venues/density",
    method: "GET",
  });
}
