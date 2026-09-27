import { api } from "../../api/client";
import type { Interest } from "./get-available-interests";

export async function getMyInterests() {
  return await api.auth<Interest[]>({
    url: "/me/interests",
    method: "GET",
  });
}
