import MapboxGL from "@rnmapbox/maps";
import React, { useMemo } from "react";
import { MapColors } from "../constants/colors";

interface RouteLayerProps {
  geometry: GeoJSON.LineString;
}

const ROUTE_LINE_STYLE = {
  lineColor: MapColors.locationDot,
  lineWidth: 5,
  lineCap: "round" as const,
  lineJoin: "round" as const,
  lineOpacity: 0.9,
  lineDasharray: [0, 2, 1],
};

const ROUTE_CASING_STYLE = {
  lineColor: MapColors.text,
  lineWidth: 8,
  lineCap: "round" as const,
  lineJoin: "round" as const,
  lineOpacity: 0.3,
};

const DEST_CIRCLE_STYLE = {
  circleRadius: 10,
  circleColor: MapColors.locationDot,
  circleStrokeWidth: 3,
  circleStrokeColor: MapColors.text,
  circlePitchAlignment: "map" as const,
};

export default function RouteLayer({ geometry }: RouteLayerProps) {
  const routeFeature = useMemo<GeoJSON.FeatureCollection>(
    () => ({
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          properties: {},
          geometry,
        },
      ],
    }),
    [geometry],
  );

  const destinationPoint = useMemo<GeoJSON.FeatureCollection>(() => {
    const coords = geometry.coordinates;
    const last = coords[coords.length - 1];
    return {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          properties: {},
          geometry: { type: "Point", coordinates: last },
        },
      ],
    };
  }, [geometry]);

  return (
    <>
      <MapboxGL.ShapeSource id="route-source" shape={routeFeature}>
        {/* White casing behind for contrast against dark map */}
        <MapboxGL.LineLayer
          id="route-line-casing"
          style={ROUTE_CASING_STYLE}
        />
        {/* Blue walking route line */}
        <MapboxGL.LineLayer
          id="route-line"
          style={ROUTE_LINE_STYLE}
        />
      </MapboxGL.ShapeSource>

      <MapboxGL.ShapeSource id="route-dest-source" shape={destinationPoint}>
        <MapboxGL.CircleLayer
          id="route-dest-circle"
          style={DEST_CIRCLE_STYLE}
        />
      </MapboxGL.ShapeSource>
    </>
  );
}
