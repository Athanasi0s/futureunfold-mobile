import { api } from "../client";
import type {
    AgendaItemOut,
    FavoriteResponseOut,
    ProgramFilters,
    SendSessionChatMessageInput,
    SessionChatMessage,
    SessionChatMessagesListOut,
    SessionCreateInput,
    SessionDetailOut,
    SessionOut,
    SessionPatchInput,
    SpeakerBriefOut,
    SpeakerWithSessionsOut,
    VenueOut,
} from "../schemas";

// ============================================
// PROGRAM & SESSIONS API FUNCTIONS
// ============================================

/**
 * Get all sessions with optional filters
 */
export function getProgram(filters?: ProgramFilters): Promise<SessionOut[]> {
  const params = new URLSearchParams();
  if (filters?.date) params.append("date", filters.date);
  if (filters?.topic) params.append("topic", filters.topic);
  if (filters?.search) params.append("search", filters.search);

  const queryString = params.toString();
  const url = queryString ? `/program?${queryString}` : "/program";

  return api.basic<SessionOut[]>({ url, method: "GET" });
}

/**
 * Get session detail with slides logic
 */
export function getSession(id: number): Promise<SessionDetailOut> {
  return api.basic<SessionDetailOut>({ url: `/sessions/${id}`, method: "GET" });
}

/**
 * Get all speakers
 */
export function getSpeakers(): Promise<SpeakerBriefOut[]> {
  return api.basic<SpeakerBriefOut[]>({ url: "/speakers", method: "GET" });
}

/**
 * Get speaker detail with their sessions
 */
export function getSpeaker(id: number): Promise<SpeakerWithSessionsOut> {
  return api.basic<SpeakerWithSessionsOut>({
    url: `/speakers/${id}`,
    method: "GET",
  });
}


/**
 * Get all venues
 */
export function getVenues(): Promise<VenueOut[]> {
  return api.basic<VenueOut[]>({ url: "/venues", method: "GET" });
}

// ============================================
// AGENDA API FUNCTIONS (Auth required)
// ============================================

/**
 * Get user's saved sessions (auth required)
 */
export function getMyAgenda(): Promise<AgendaItemOut[]> {
  return api.auth<AgendaItemOut[]>({ url: "/my-agenda", method: "GET" });
}

/**
 * Add session to user's agenda (auth required)
 */
export function addFavorite(sessionId: number): Promise<FavoriteResponseOut> {
  return api.auth<FavoriteResponseOut>({
    url: `/sessions/${sessionId}/favorite`,
    method: "POST",
    data: {},
  });
}

/**
 * Remove session from user's agenda (auth required)
 */
export function removeFavorite(sessionId: number): Promise<void> {
  return api.auth<void>({
    url: `/sessions/${sessionId}/favorite`,
    method: "DELETE",
  });
}

/**
 * Get a specific user's agenda (auth required)
 */
export function getUserAgenda(userId: number): Promise<AgendaItemOut[]> {
  return api.auth<AgendaItemOut[]>({
    url: `/users/${userId}/agenda`,
    method: "GET",
  });
}

// ============================================
// SESSION CREATION (Exhibitor only)
// ============================================

/**
 * Create a new session (auth required, exhibitor role only)
 */
export function createSession(data: SessionCreateInput): Promise<SessionOut> {
  return api.auth<SessionOut>({ url: "/sessions", method: "POST", data });
}

/**
 * Patch a session (auth required, exhibitor role only)
 */
export function patchSession(id: number, data: SessionPatchInput): Promise<SessionOut> {
  return api.auth<SessionOut>({ url: `/sessions/${id}`, method: "PATCH", data });
}

// ============================================
// SESSION CHAT API FUNCTIONS (Auth required)
// ============================================

/**
 * Get chat messages for a session (paginated, newest first)
 */
export function getSessionChatMessages(
  sessionId: number,
  offset = 0,
  limit = 50
): Promise<SessionChatMessagesListOut> {
  return api.auth<SessionChatMessagesListOut>({
    url: `/sessions/${sessionId}/chat?limit=${limit}&offset=${offset}`,
    method: "GET",
  });
}

/**
 * Send a chat message to a session
 */
export function sendSessionChatMessage(
  sessionId: number,
  data: SendSessionChatMessageInput
): Promise<SessionChatMessage> {
  return api.auth<SessionChatMessage>({
    url: `/sessions/${sessionId}/chat`,
    method: "POST",
    data,
  });
}
