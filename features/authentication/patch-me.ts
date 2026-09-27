import { patchMe as patchMeApi } from "@/api/features/auth";
import type { MeUpdateIn } from "@/api/schemas";

export async function patchMe(data: MeUpdateIn) {
  return await patchMeApi(data);
}
