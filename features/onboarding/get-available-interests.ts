import { api } from "../../api/client";

export type Interest = {
  id: number;
  name: string;
};

export async function getInterests() {
  return await api.basic<Interest[]>({
    url: "/interests",
    method: "GET",
  });
}
