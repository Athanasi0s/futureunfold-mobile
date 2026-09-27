import { api } from "../client";
import type {
  GroupLocations,
  LocationSharingStatus,
} from "../schemas";

export function toggleLocationSharing(
  groupId: number,
  sharing: boolean,
): Promise<{ sharing: boolean }> {
  return api.auth<{ sharing: boolean }>({
    url: `/groups/${groupId}/location-sharing`,
    method: "PUT",
    data: { sharing },
  });
}

export function updateMyLocation(
  latitude: number,
  longitude: number,
): Promise<{ updated_groups: number }> {
  return api.auth<{ updated_groups: number }>({
    url: "/me/location",
    method: "PUT",
    data: { latitude, longitude },
  });
}

export function getGroupLocations(
  groupId: number,
  maxAgeMinutes?: number,
): Promise<GroupLocations> {
  const params = maxAgeMinutes ? `?max_age_minutes=${maxAgeMinutes}` : "";
  return api.auth<GroupLocations>({
    url: `/groups/${groupId}/locations${params}`,
    method: "GET",
  });
}

export function getMyLocationSharingStatus(): Promise<LocationSharingStatus[]> {
  return api.auth<LocationSharingStatus[]>({
    url: "/me/location-sharing",
    method: "GET",
  });
}
