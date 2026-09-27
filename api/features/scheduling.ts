import { api } from "../client";
import type {
  AvailabilityOut,
  ConnectionsOut,
  CreateMeetingIn,
  MeetingActionIn,
  MeetingLocationOut,
  MeetingOut,
  MyMeetingsOut,
  RescheduleMeetingIn,
  ScheduleOverlapOut,
} from "../schemas";

// ============================================
// SCHEDULING API FUNCTIONS
// ============================================

/**
 * Get availability for a user (auth required)
 */
export function getAvailability(userId: number): Promise<AvailabilityOut> {
  return api.auth<AvailabilityOut>({
    url: `/scheduling/availability/${userId}`,
    method: "GET",
  });
}

/**
 * Get schedule conflicts (auth required)
 */
export function getConflicts(params: {
  userId: number;
  date: string;
  time: string;
}): Promise<ScheduleOverlapOut> {
  const searchParams = new URLSearchParams({
    user_id: params.userId.toString(),
    date: params.date,
    time: params.time,
  });
  return api.auth<ScheduleOverlapOut>({
    url: `/scheduling/conflicts?${searchParams.toString()}`,
    method: "GET",
  });
}

/**
 * Get available meeting locations (auth required)
 */
export function getLocations(params: {
  date: string;
  time: string;
}): Promise<MeetingLocationOut[]> {
  const searchParams = new URLSearchParams({
    date: params.date,
    time: params.time,
  });
  return api.auth<MeetingLocationOut[]>({
    url: `/scheduling/locations?${searchParams.toString()}`,
    method: "GET",
  });
}

/**
 * Create a meeting request (auth required)
 */
export function createMeeting(data: CreateMeetingIn): Promise<MeetingOut> {
  return api.auth<MeetingOut>({
    url: "/scheduling/meetings",
    method: "POST",
    data,
  });
}

/**
 * Get the current user's meetings (auth required)
 */
export function getMyMeetings(): Promise<MyMeetingsOut> {
  return api.auth<MyMeetingsOut>({
    url: "/scheduling/meetings",
    method: "GET",
  });
}

/**
 * Accept, decline, or cancel a meeting (auth required)
 */
export function updateMeetingAction(
  meetingId: number,
  data: MeetingActionIn,
): Promise<MeetingOut> {
  return api.auth<MeetingOut>({
    url: `/scheduling/meetings/${meetingId}`,
    method: "PATCH",
    data,
  });
}

/**
 * Get confirmed connections (deduped users from confirmed meetings) (auth required)
 */
export function getConnections(): Promise<ConnectionsOut> {
  return api.auth<ConnectionsOut>({
    url: "/scheduling/connections",
    method: "GET",
  });
}

/**
 * Reschedule a meeting with new time/location (auth required)
 */
export function rescheduleMeeting(
  meetingId: number,
  data: RescheduleMeetingIn,
): Promise<MeetingOut> {
  return api.auth<MeetingOut>({
    url: `/scheduling/meetings/${meetingId}/reschedule`,
    method: "PUT",
    data,
  });
}
