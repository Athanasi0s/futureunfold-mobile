import { useQuery } from "@tanstack/react-query";
import { getMyInterests } from "../get-my-interests";

export const useGetMyInterests = () => {
  return useQuery({
    queryKey: ["my-interests"],
    queryFn: getMyInterests,
  });
};
