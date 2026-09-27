import { api } from "@/api/client";

export type BroadcastPushPayload = {
  title: string;
  body: string;
  role_filter?: string;
  deeplink?: string;
};

export const sendBroadcastPush = (data: BroadcastPushPayload) =>
  api.auth<{ sent_count: number; message: string }>({
    url: "/admin/push/broadcast",
    method: "POST",
    data,
  });
