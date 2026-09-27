import { useQuery } from "@tanstack/react-query";
import { getConnections } from "../get-connections";

export const useGetConnections = () => {
  return useQuery({
    queryKey: ["scheduling", "connections"],
    queryFn: () => getConnections(),
  });
};
