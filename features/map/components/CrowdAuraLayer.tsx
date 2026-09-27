import React, { useMemo } from "react";
import MapboxGL from "@rnmapbox/maps";
import type { DensityBucket } from "@/api/schemas";
import { CROWD_DENSITY_COLORS } from "@/constants/data-colors";
import { polygonCentroid } from "@/features/map/utils/geometry";
import { useMapStore } from "../stores/map-store";

interface CrowdAuraLayerProps {
  densityMap: Map<number, DensityBucket>;
  geoData: GeoJSON.FeatureCollection;
}

export default function CrowdAuraLayer({ densityMap, geoData }: CrowdAuraLayerProps) {
  const filters = useMapStore((s) => s.filters);

  const auraGeoJSON = useMemo<GeoJSON.FeatureCollection>(() => {
    const features: GeoJSON.Feature[] = [];

    for (const feature of geoData.features) {
      const props = feature.properties as any;
      const id = Number(props.id);
      const category = props.category as string;
      const bucket = densityMap.get(id);

      // Skip venues not in density data or filtered out
      if (!bucket) continue;
      if (!filters[category as keyof typeof filters]) continue;
      if (feature.geometry?.type !== "Polygon") continue;

      const centroid = polygonCentroid((feature.geometry as any).coordinates);

      features.push({
        type: "Feature",
        properties: { venue_id: id, bucket },
        geometry: { type: "Point", coordinates: centroid },
      });
    }

    return { type: "FeatureCollection", features };
  }, [densityMap, geoData, filters]);

  if (auraGeoJSON.features.length === 0) return null;

  return (
    <MapboxGL.ShapeSource id="crowd-aura-source" shape={auraGeoJSON}>
      {/* Solid inner circle */}
      <MapboxGL.CircleLayer
        id="crowd-aura-layer"
        style={{
          circleColor: [
            "match",
            ["get", "bucket"],
            "green", CROWD_DENSITY_COLORS.green,
            "yellow", CROWD_DENSITY_COLORS.yellow,
            "orange", CROWD_DENSITY_COLORS.orange,
            "red", CROWD_DENSITY_COLORS.red,
            CROWD_DENSITY_COLORS.green,
          ],
          circleRadius: 20,
          circleOpacity: 0.45,
          circleBlur: 0.3,
          circleStrokeWidth: 2,
          circleStrokeColor: [
            "match",
            ["get", "bucket"],
            "green", CROWD_DENSITY_COLORS.green,
            "yellow", CROWD_DENSITY_COLORS.yellow,
            "orange", CROWD_DENSITY_COLORS.orange,
            "red", CROWD_DENSITY_COLORS.red,
            CROWD_DENSITY_COLORS.green,
          ],
          circleStrokeOpacity: 0.7,
        }}
      />
    </MapboxGL.ShapeSource>
  );
}
