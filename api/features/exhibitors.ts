import { api } from "../client";
import type {
  SessionOut,
  ExhibitorChatMessagesListOut,
  ExhibitorChatMessageOut,
  SendExhibitorChatMessageInput,
  StaffOut,
  StaffIn,
  ShowcaseOut,
  ShowcaseIn,
} from "../schemas";

type CheckExhibitorEmailOut = {
  allowed: boolean;
};

export function checkExhibitorEmail(email: string): Promise<CheckExhibitorEmailOut> {
  return api.auth<CheckExhibitorEmailOut>({
    url: "/exhibitors/check-email",
    method: "POST",
    data: { email },
  });
}

export function getExhibitorSessions(exhibitorId: number): Promise<SessionOut[]> {
  return api.auth<SessionOut[]>({
    url: `/exhibitors/${exhibitorId}/sessions`,
    method: "GET",
  });
}

export function getExhibitorChatMessages(
  exhibitorId: number,
  offset = 0,
  limit = 50
): Promise<ExhibitorChatMessagesListOut> {
  return api.auth<ExhibitorChatMessagesListOut>({
    url: `/exhibitors/${exhibitorId}/chat?limit=${limit}&offset=${offset}`,
    method: "GET",
  });
}

export function sendExhibitorChatMessage(
  exhibitorId: number,
  data: SendExhibitorChatMessageInput
): Promise<ExhibitorChatMessageOut> {
  return api.auth<ExhibitorChatMessageOut>({
    url: `/exhibitors/${exhibitorId}/chat`,
    method: "POST",
    data,
  });
}

export function getExhibitorStaff(): Promise<StaffOut[]> {
  return api.auth<StaffOut[]>({
    url: "/exhibitors/staff",
    method: "GET",
  });
}

export function addExhibitorStaff(data: StaffIn): Promise<StaffOut> {
  return api.auth<StaffOut>({
    url: "/exhibitors/staff",
    method: "POST",
    data,
  });
}

export function deleteExhibitorStaff(staffId: number): Promise<void> {
  return api.auth<void>({
    url: `/exhibitors/staff/${staffId}`,
    method: "DELETE",
  });
}

export function getExhibitorShowcases(): Promise<ShowcaseOut[]> {
  return api.auth<ShowcaseOut[]>({
    url: "/exhibitors/showcases",
    method: "GET",
  });
}

export function addExhibitorShowcase(data: ShowcaseIn): Promise<ShowcaseOut> {
  return api.auth<ShowcaseOut>({
    url: "/exhibitors/showcases",
    method: "POST",
    data,
  });
}

export function deleteExhibitorShowcase(showcaseId: number): Promise<void> {
  return api.auth<void>({
    url: `/exhibitors/showcases/${showcaseId}`,
    method: "DELETE",
  });
}
