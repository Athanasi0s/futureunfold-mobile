import MapboxGL from "@rnmapbox/maps";
import React, { useMemo } from "react";
import { MapColors } from "../constants/colors";

interface LocationDotProps {
  coordinate: [number, number];
}

export default function LocationDot({ coordinate }: LocationDotProps) {
  const pointGeoJSON = useMemo(
    () => ({
      type: "FeatureCollection" as const,
      features: [
        {
          type: "Feature" as const,
          geometry: {
            type: "Point" as const,
            coordinates: coordinate,
          },
          properties: {},
        },
      ],
    }),
    [coordinate],
  );

  return (
    <MapboxGL.ShapeSource id="location-dot-source" shape={pointGeoJSON}>
      <MapboxGL.CircleLayer
        id="location-dot-ring"
        style={{
          circleRadius: 14,
          circleColor: MapColors.locationDot,
          circleOpacity: 0.2,
        }}
      />
      <MapboxGL.CircleLayer
        id="location-dot-center"
        style={{
          circleRadius: 6,
          circleColor: MapColors.locationDot,
          circleStrokeWidth: 2,
          circleStrokeColor: MapColors.text,
        }}
      />
    </MapboxGL.ShapeSource>
  );
}
