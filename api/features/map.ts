import { api } from "../client";
import type { OutdoorMapProperties, MapEntityProfile } from "../schemas";

export interface GeoJSONFeature {
  type: "Feature";
  properties: OutdoorMapProperties;
  geometry: {
    type: "Polygon";
    coordinates: number[][][];
  };
}

export interface GeoJSONFeatureCollection {
  type: "FeatureCollection";
  features: GeoJSONFeature[];
}

export function getOutdoorMap(): Promise<GeoJSONFeatureCollection> {
  return api.basic<GeoJSONFeatureCollection>({
    url: "/outdoor-map",
    method: "GET",
  });
}

export async function getWalkingRoute(
  origin: [number, number],
  destination: [number, number],
): Promise<GeoJSON.LineString | null> {
  const token = process.env.EXPO_PUBLIC_MAPBOX_TOKEN;
  const coords = `${origin[0]},${origin[1]};${destination[0]},${destination[1]}`;
  const url = `https://api.mapbox.com/directions/v5/mapbox/walking/${coords}?geometries=geojson&overview=full&access_token=${token}`;
  const res = await fetch(url);
  const data = await res.json();
  if (data.code !== "Ok" || !data.routes?.length) return null;
  return data.routes[0].geometry;
}

export function getEntityProfile(entityId: number): Promise<MapEntityProfile> {
  return api.basic<MapEntityProfile>({
    url: `/venues/${entityId}/profile`,
    method: "GET",
  });
}
