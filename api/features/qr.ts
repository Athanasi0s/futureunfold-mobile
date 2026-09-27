import { api } from "../client";
import type {
    LeaderboardEntryOut,
    QrCodeOut,
    ScanLogOut,
    ScanOut,
} from "../schemas";

// ============================================
// QR / POINTS API FUNCTIONS
// ============================================

/**
 * Get QR code info for the current user (user_id + points)
 */
export function getMyQr(): Promise<QrCodeOut> {
  return api.auth<QrCodeOut>({ url: "/qr/me", method: "GET" });
}

/**
 * Scan another user's QR code (awards points)
 * - Exhibitor scanning attendee → +10 pts to attendee
 * - 409 if already scanned
 * - 400 if self-scan
 */
export function scanQr(userId: number): Promise<ScanOut> {
  return api.auth<ScanOut>({
    url: "/qr/scan",
    method: "POST",
    data: { user_id: userId },
  });
}

export type ScanHistoryDirection = "scanned_by_me" | "scanned_me" | "all";

/**
 * Get scan history for the current user
 * @param direction Filter by "scanned_by_me", "scanned_me", or "all" (default)
 */
export function getScanHistory(
  direction: ScanHistoryDirection = "all",
): Promise<ScanLogOut[]> {
  const params = direction !== "all" ? `?direction=${direction}` : "";
  return api.auth<ScanLogOut[]>({ url: `/qr/history${params}`, method: "GET" });
}

/**
 * Get the points leaderboard
 */
export function getLeaderboard(limit = 50): Promise<LeaderboardEntryOut[]> {
  return api.auth<LeaderboardEntryOut[]>({
    url: `/qr/leaderboard?limit=${limit}`,
    method: "GET",
  });
}
