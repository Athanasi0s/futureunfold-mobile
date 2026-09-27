import type { OutdoorMapProperties } from "@/api/schemas";
import { FeatureGate } from "@/components/feature-gate";
import { useConfigStore } from "@/features/config/stores/config-store";
import { getWalkingRoute } from "@/api/features/map";
import CompassButton from "@/features/map/components/CompassButton";
import EntitySheet from "@/features/map/components/EntitySheet";
import FilterChips from "@/features/map/components/FilterChips";
import FriendDots from "@/features/map/components/FriendDots";
import FriendToggle from "@/features/map/components/FriendToggle";
import GroupPickerSheet from "@/features/map/components/GroupPickerSheet";
import LocationButton from "@/features/map/components/LocationButton";
import LocationDot from "@/features/map/components/LocationDot";
import CrowdAuraLayer from "@/features/map/components/CrowdAuraLayer";
import CrowdLegend from "@/features/map/components/CrowdLegend";
import CrowdToggle from "@/features/map/components/CrowdToggle";
import RouteLayer from "@/features/map/components/RouteLayer";
import { useDensity } from "@/features/map/hooks/useDensity";
import {
  CategoryColors,
  HighlightColors,
  MapColors,
} from "@/features/map/constants/colors";
import { darkMapStyle } from "@/features/map/constants/map-style";
import { useFriendLocations } from "@/features/map/hooks/useFriendLocations";
import { useGetOutdoorMap } from "@/features/map/hooks/useGetOutdoorMap";
import { useMyLocationSharingStatus } from "@/features/map/hooks/useLocationSharing";
import { useLocationWatcher } from "@/features/map/hooks/useLocationWatcher";
import { useMapStore } from "@/features/map/stores/map-store";
import { polygonCentroid } from "@/features/map/utils/geometry";
import type BottomSheet from "@gorhom/bottom-sheet";
import MapboxGL from "@rnmapbox/maps";
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
} from "react-native";
import { useTranslation } from "react-i18next";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ThemedText } from "@/components/themed-text";
import { TenantBackgroundArt } from "@/components/tenant-background-art";
import { getTenantBackgroundSource } from "@/constants/tenant-assets";

type OnPressEvent = {
  features: GeoJSON.Feature[];
  coordinates: { latitude: number; longitude: number };
  point: { x: number; y: number };
};

MapboxGL.setAccessToken(process.env.EXPO_PUBLIC_MAPBOX_TOKEN ?? "");

const ATHENS_CENTER: [number, number] = [23.7257, 37.9755];

type CategoryKey = "exhibitor" | "stage" | "amenity" | "sponsor";

const CATEGORY_OPACITY: Record<CategoryKey, number> = {
  exhibitor: 0.6,
  stage: 0.4,
  amenity: 0.5,
  sponsor: 0.5,
};

function makeColorExpression(
  category: CategoryKey,
  selectedId: number | null,
): any {
  const baseColor = CategoryColors[category];
  if (selectedId === null) return baseColor;
  return [
    "case",
    ["==", ["get", "id"], selectedId],
    HighlightColors[category],
    baseColor,
  ];
}

function makeHeightExpression(selectedId: number | null): any {
  if (selectedId === null) return ["get", "extrusion_height"];
  return [
    "case",
    ["==", ["get", "id"], selectedId],
    ["+", ["get", "extrusion_height"], 5],
    ["get", "extrusion_height"],
  ];
}

export default function MapScreen() {
  const { t } = useTranslation();
  const cameraRef = useRef<MapboxGL.Camera>(null);
  const sheetRef = useRef<BottomSheet>(null);
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [heading, setHeading] = useState(0);
  const appName = useConfigStore((s) => s.appName);
  const { width } = useWindowDimensions();
  const hasBackgroundArt = Boolean(getTenantBackgroundSource());
  const artworkHeight = width * (1864 / 2100);

  // Individual selectors — only re-render when that specific value changes
  const filters = useMapStore((s) => s.filters);
  const selectedEntityId = useMapStore((s) => s.selectedEntityId);
  const selectedEntity = useMapStore((s) => s.selectedEntity);
  const selectEntity = useMapStore((s) => s.selectEntity);
  const clearSelection = useMapStore((s) => s.clearSelection);
  const routeGeometry = useMapStore((s) => s.routeGeometry);
  const isLoadingRoute = useMapStore((s) => s.isLoadingRoute);
  const setRoute = useMapStore((s) => s.setRoute);
  const setLoadingRoute = useMapStore((s) => s.setLoadingRoute);
  const clearRoute = useMapStore((s) => s.clearRoute);

  const clearFriendCallout = useMapStore((s) => s.clearFriendCallout);

  // Friend tracking state
  const showFriends = useMapStore((s) => s.showFriends);
  const activeGroupIds = useMapStore((s) => s.activeGroupIds);
  const toggleShowFriends = useMapStore((s) => s.toggleShowFriends);
  const [pickerVisible, setPickerVisible] = useState(false);

  // Crowd view state
  const showCrowdView = useMapStore((s) => s.showCrowdView);
  const { densityMap } = useDensity(showCrowdView);

  const { data: sharingStatuses = [] } = useMyLocationSharingStatus();
  const { data: friendLocations = [] } = useFriendLocations(
    showFriends ? activeGroupIds : [],
  );

  // Watch and report location when sharing in at least one group
  const isSharingInAnyGroup = sharingStatuses.length > 0;
  useLocationWatcher(isSharingInAnyGroup);

  const { data: geoData, isLoading } = useGetOutdoorMap();

  // Fly to venue on data load
  useEffect(() => {
    if (geoData && cameraRef.current) {
      setTimeout(() => {
        cameraRef.current?.setCamera({
          centerCoordinate: ATHENS_CENTER,
          zoomLevel: 15.3,
          pitch: 45,
          heading: 0,
          animationDuration: 1500,
          animationMode: "flyTo",
        });
      }, 500);
    }
  }, [geoData]);

  // Open/close sheet when selection changes
  useEffect(() => {
    if (selectedEntity) {
      sheetRef.current?.snapToIndex(0);
    } else {
      sheetRef.current?.close();
    }
  }, [selectedEntity]);

  const handleFeaturePress = useCallback(
    (event: OnPressEvent) => {
      const feature = event.features[0];
      if (!feature?.properties) return;
      if (feature.geometry?.type !== "Polygon") return;
      const props = feature.properties as unknown as OutdoorMapProperties;
      const id = Number(props.id);
      selectEntity({ ...props, id });
    },
    [selectEntity],
  );

  const handleMapPress = useCallback(() => {
    clearSelection();
    clearRoute();
    clearFriendCallout();
    sheetRef.current?.close();
  }, [clearSelection, clearRoute, clearFriendCallout]);

  const handleCtaPress = useCallback(
    (entityId: number) => {
      router.push({
        pathname: "/map-entity/[id]",
        params: { id: entityId.toString() },
      });
    },
    [router],
  );

  const handleNavigatePress = useCallback(
    async (entityId: number) => {
      if (!geoData) return;
      const feature = geoData.features.find(
        (f) => f.properties.id === entityId,
      );
      if (!feature) return;

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(t("map.permissionNeeded"), t("map.locationPermissionRequired"));
        return;
      }

      setLoadingRoute(true);
      sheetRef.current?.close();

      try {
        const loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        const origin: [number, number] = [loc.coords.longitude, loc.coords.latitude];
        const dest = polygonCentroid(feature.geometry.coordinates);

        const route = await getWalkingRoute(origin, dest);
        if (!route) {
          Alert.alert(t("map.noRoute"), t("map.noRouteFound"));
          setLoadingRoute(false);
          return;
        }

        setRoute(route);

        // Fit camera to show the full route
        const allCoords = route.coordinates as [number, number][];
        const lngs = allCoords.map((c) => c[0]);
        const lats = allCoords.map((c) => c[1]);
        const ne: [number, number] = [Math.max(...lngs), Math.max(...lats)];
        const sw: [number, number] = [Math.min(...lngs), Math.min(...lats)];

        cameraRef.current?.fitBounds(ne, sw, [80, 80, 200, 80], 1000);
      } catch {
        Alert.alert(t("map.routeError"), t("map.routeErrorMessage"));
        setLoadingRoute(false);
      }
    },
    [geoData, setRoute, setLoadingRoute, t],
  );

  const handleCameraChanged = useCallback(
    (state: { properties: { heading: number } }) => {
      setHeading(state.properties.heading);
    },
    [],
  );

  const handleResetNorth = useCallback(() => {
    cameraRef.current?.setCamera({
      heading: 0,
      animationDuration: 500,
      animationMode: "easeTo",
    });
  }, []);

  const handleLocationPress = useCallback(() => {
    cameraRef.current?.setCamera({
      centerCoordinate: ATHENS_CENTER,
      zoomLevel: 15.3,
      pitch: 45,
      heading: 0,
      animationDuration: 1000,
      animationMode: "flyTo",
    });
  }, []);

  const activeCategories = useMemo(
    () => Object.entries(filters)
      .filter(([_, active]) => active)
      .map(([cat]) => cat),
    [filters],
  );

  const labelFilter = useMemo<any>(() => {
    if (activeCategories.length === 0) return ["==", "category", "__none__"];
    return ["in", ["get", "category"], ["literal", activeCategories]];
  }, [activeCategories]);

  // Memoize venue label shape to avoid new reference on every render
  const venueLabelShape = useMemo<GeoJSON.FeatureCollection>(
    () => ({
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          properties: { name: `${appName} Festival` },
          geometry: { type: "Point", coordinates: ATHENS_CENTER },
        },
      ],
    }),
    [appName],
  );

  // Memoize extrusion styles — only recompute when selectedEntityId changes
  const extrusionStyles = useMemo(() => ({
    exhibitor: {
      visibility: filters.exhibitor ? ("visible" as const) : ("none" as const),
      fillExtrusionColor: makeColorExpression("exhibitor", selectedEntityId),
      fillExtrusionOpacity: CATEGORY_OPACITY.exhibitor,
      fillExtrusionHeight: makeHeightExpression(selectedEntityId),
      fillExtrusionBase: 0,
    },
    stage: {
      visibility: filters.stage ? ("visible" as const) : ("none" as const),
      fillExtrusionColor: makeColorExpression("stage", selectedEntityId),
      fillExtrusionOpacity: CATEGORY_OPACITY.stage,
      fillExtrusionHeight: makeHeightExpression(selectedEntityId),
      fillExtrusionBase: 0,
    },
    amenity: {
      visibility: filters.amenity ? ("visible" as const) : ("none" as const),
      fillExtrusionColor: makeColorExpression("amenity", selectedEntityId),
      fillExtrusionOpacity: CATEGORY_OPACITY.amenity,
      fillExtrusionHeight: makeHeightExpression(selectedEntityId),
      fillExtrusionBase: 0,
    },
    sponsor: {
      visibility: filters.sponsor ? ("visible" as const) : ("none" as const),
      fillExtrusionColor: makeColorExpression("sponsor", selectedEntityId),
      fillExtrusionOpacity: CATEGORY_OPACITY.sponsor,
      fillExtrusionHeight: makeHeightExpression(selectedEntityId),
      fillExtrusionBase: 0,
    },
  }), [filters, selectedEntityId]);

  return (
    <FeatureGate flag="map">
    <View testID="map-screen" style={styles.container}>
      {hasBackgroundArt && (
        <TenantBackgroundArt
          variant="secondary"
          style={[styles.backgroundArt, { width, height: artworkHeight }]}
        />
      )}
      <MapboxGL.MapView
        style={styles.map}
        styleJSON={JSON.stringify(darkMapStyle)}
        pitchEnabled={true}
        rotateEnabled={true}
        compassEnabled={false}
        scaleBarEnabled={false}
        attributionEnabled={false}
        logoEnabled={false}
        onPress={handleMapPress}
        onCameraChanged={handleCameraChanged}
      >
        <MapboxGL.Camera
          ref={cameraRef}
          defaultSettings={{
            centerCoordinate: ATHENS_CENTER,
            zoomLevel: 13,
            pitch: 0,
            heading: 0,
          }}
        />

        {/* Crowd density aura — ground circles below buildings */}
        {showCrowdView && geoData && densityMap.size > 0 && (
          <CrowdAuraLayer densityMap={densityMap} geoData={geoData as GeoJSON.FeatureCollection} />
        )}

        {geoData && (
          <MapboxGL.ShapeSource
            id="outdoor-map-source"
            shape={geoData as GeoJSON.FeatureCollection}
            onPress={handleFeaturePress}
          >
            {/* @ts-expect-error — Mapbox GL expression types are overly strict */}
            <MapboxGL.FillExtrusionLayer
              id="extrusion-exhibitor"
              filter={["==", ["get", "category"], "exhibitor"]}
              style={extrusionStyles.exhibitor}
            />
            {/* @ts-expect-error — Mapbox GL expression types are overly strict */}
            <MapboxGL.FillExtrusionLayer
              id="extrusion-stage"
              filter={["==", ["get", "category"], "stage"]}
              style={extrusionStyles.stage}
            />
            {/* @ts-expect-error — Mapbox GL expression types are overly strict */}
            <MapboxGL.FillExtrusionLayer
              id="extrusion-amenity"
              filter={["==", ["get", "category"], "amenity"]}
              style={extrusionStyles.amenity}
            />
            {/* @ts-expect-error — Mapbox GL expression types are overly strict */}
            <MapboxGL.FillExtrusionLayer
              id="extrusion-sponsor"
              filter={["==", ["get", "category"], "sponsor"]}
              style={extrusionStyles.sponsor}
            />

            {/* Entity name labels — fade in as you zoom past the venue label */}
            <MapboxGL.SymbolLayer
              id="entity-labels"
              minZoomLevel={14.5}
              filter={labelFilter}
              style={{
                textField: ["get", "name"],
                textSize: [
                  "interpolate",
                  ["linear"],
                  ["zoom"],
                  14.5, 8,
                  15, 11,
                  16, 14,
                  17, 16,
                  18, 20,
                ],
                textOpacity: [
                  "interpolate",
                  ["linear"],
                  ["zoom"],
                  14.5, 0,
                  15.5, 1,
                ],
                textColor: MapColors.text,
                textHaloColor: "rgba(13, 17, 23, 0.85)",
                textHaloWidth: 1.5,
                textFont: ["DIN Pro Medium", "Arial Unicode MS Regular"],
                textAnchor: "center",
                textOffset: [0, 0],
                textAllowOverlap: false,
                textIgnorePlacement: false,
                symbolSortKey: ["get", "extrusion_height"],
              }}
            />
          </MapboxGL.ShapeSource>
        )}

        {/* Venue-level label — visible at low zoom, fades out as you zoom in */}
        <MapboxGL.ShapeSource
          id="venue-label-source"
          shape={venueLabelShape}
        >
          <MapboxGL.SymbolLayer
            id="venue-label"
            minZoomLevel={12}
            maxZoomLevel={15.5}
            style={{
              textField: `${appName} Festival`,
              textSize: ["interpolate", ["linear"], ["zoom"], 12, 14, 14, 20, 15.5, 24],
              textColor: MapColors.ctaButton,
              textHaloColor: "rgba(13, 17, 23, 0.9)",
              textHaloWidth: 2,
              textFont: ["DIN Pro Bold", "Arial Unicode MS Bold"],
              textAnchor: "center",
              textOpacity: ["interpolate", ["linear"], ["zoom"], 14.5, 1, 15.5, 0],
            }}
          />
        </MapboxGL.ShapeSource>

        {/* Friend location dots — above buildings, below user dot */}
        {showFriends && friendLocations.length > 0 && (
          <FriendDots locations={friendLocations} />
        )}

        <LocationDot coordinate={ATHENS_CENTER} />

        {routeGeometry && <RouteLayer geometry={routeGeometry} />}
      </MapboxGL.MapView>

      {/* Loading overlay */}
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={MapColors.ctaButton} />
        </View>
      )}

      {/* Filter chips — top */}
      <FilterChips />

      {/* Compass — top right */}
      <View style={[styles.compassContainer, { top: insets.top + 64 }]}>
        <CompassButton heading={heading} onResetNorth={handleResetNorth} />
      </View>

      {/* Crowd toggle — bottom left */}
      <View style={styles.crowdToggleContainer}>
        <CrowdToggle />
      </View>

      {/* Crowd legend — above crowd toggle, auto-dismiss */}
      {showCrowdView && <CrowdLegend />}

      {/* Friend toggle — above location button */}
      <View style={styles.friendToggleContainer}>
        <FriendToggle
          onPress={() => {
            if (!showFriends) {
              toggleShowFriends();
              setPickerVisible(true);
            } else {
              setPickerVisible(true);
            }
          }}
        />
      </View>

      {/* Location — bottom right */}
      <View style={styles.locationContainer}>
        <LocationButton onPress={handleLocationPress} />
      </View>

      {/* Group picker sheet */}
      <GroupPickerSheet
        visible={pickerVisible}
        onClose={() => setPickerVisible(false)}
        sharingGroups={sharingStatuses}
      />

      {/* Clear route button */}
      {routeGeometry && (
        <Pressable style={styles.clearRouteBtn} onPress={clearRoute}>
          <ThemedText style={styles.clearRouteBtnText}>{t("map.clearRoute")}</ThemedText>
        </Pressable>
      )}

      {/* Route loading indicator */}
      {isLoadingRoute && (
        <View style={styles.routeLoading}>
          <ActivityIndicator size="small" color={MapColors.locationDot} />
          <ThemedText style={styles.routeLoadingText}>{t("map.findingRoute")}</ThemedText>
        </View>
      )}

      {/* Entity bottom sheet */}
      <EntitySheet
        ref={sheetRef}
        onCtaPress={handleCtaPress}
        onNavigatePress={handleNavigatePress}
      />
    </View>
    </FeatureGate>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: MapColors.background,
  },
  backgroundArt: {
    position: "absolute",
    top: 0,
    alignSelf: "center",
    opacity: 0.16,
  },
  map: {
    flex: 1,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(13, 17, 23, 0.7)",
  },
  compassContainer: {
    position: "absolute",
    right: 16,
  },
  crowdToggleContainer: {
    position: "absolute",
    left: 16,
    bottom: 100,
  },
  friendToggleContainer: {
    position: "absolute",
    right: 16,
    bottom: 156,
  },
  locationContainer: {
    position: "absolute",
    right: 16,
    bottom: 100,
  },
  clearRouteBtn: {
    position: "absolute",
    bottom: 160,
    alignSelf: "center",
    backgroundColor: "rgba(13, 17, 23, 0.85)",
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
  },
  clearRouteBtnText: {
    color: MapColors.text,
    fontSize: 14,
    fontWeight: "600",
  },
  routeLoading: {
    position: "absolute",
    bottom: 160,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(13, 17, 23, 0.85)",
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  routeLoadingText: {
    color: MapColors.text,
    fontSize: 14,
  },
});
