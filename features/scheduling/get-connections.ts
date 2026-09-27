import { getConnections as getConnectionsApi } from "@/api/features/scheduling";

export async function getConnections() {
  return await getConnectionsApi();
}
