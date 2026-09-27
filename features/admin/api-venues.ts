import { api } from "@/api/client";

// Types
export type AdminVenue = {
  id: number;
  key: string;
  name: string;
  lat: number;
  lng: number;
  default_zoom: number;
  has_indoor: boolean;
  category: string;
  description?: string;
  avatar_url?: string;
  company?: string;
  booth_number?: string;
  extrusion_height: number;
  sort_order: number;
  is_active: boolean;
  capacity?: number;
  geojson_geometry?: Record<string, unknown>;
};

export type AdminVenueFloor = {
  id: number;
  venue_id: number;
  floor_number: number;
  geojson: Record<string, unknown>;
};

export const getAdminVenues = (search?: string) => {
  const params = new URLSearchParams();
  if (search) params.set("search", search);
  const qs = params.toString();
  return api.auth<AdminVenue[]>({
    url: `/admin/venues${qs ? `?${qs}` : ""}`,
    method: "GET",
  });
};

export const createAdminVenue = (data: Omit<AdminVenue, "id">) =>
  api.auth<AdminVenue>({
    url: "/admin/venues",
    method: "POST",
    data,
  });

export const updateAdminVenue = (id: number, data: Partial<AdminVenue>) =>
  api.auth<AdminVenue>({
    url: `/admin/venues/${id}`,
    method: "PATCH",
    data,
  });

export const deleteAdminVenue = (id: number) =>
  api.auth<{ status: string }>({
    url: `/admin/venues/${id}`,
    method: "DELETE",
  });

export const getVenueFloors = (venueId: number) =>
  api.auth<AdminVenueFloor[]>({
    url: `/admin/venues/${venueId}/floors`,
    method: "GET",
  });

export const createVenueFloor = (
  venueId: number,
  geojson: Record<string, unknown>,
) =>
  api.auth<AdminVenueFloor>({
    url: `/admin/venues/${venueId}/floors`,
    method: "POST",
    data: { geojson },
  });

export const deleteVenueFloor = (venueId: number, floorNumber: number) =>
  api.auth<{ status: string }>({
    url: `/admin/venues/${venueId}/floors/${floorNumber}`,
    method: "DELETE",
  });
