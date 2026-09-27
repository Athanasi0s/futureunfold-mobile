import { api } from "../../api/client";

export async function putMyInterests(interestIds: number[]) {
  return await api.auth<unknown>({
    url: "/me/interests",
    method: "PUT",
    data: { interest_ids: interestIds },
  });
}
