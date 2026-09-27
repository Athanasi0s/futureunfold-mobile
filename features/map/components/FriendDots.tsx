import MapboxGL from "@rnmapbox/maps";
import React, { useMemo } from "react";
import {
  StyleSheet,
  View,
} from "react-native";
import type { UserLocation } from "@/api/schemas";
import { MapColors } from "../constants/colors";
import { useMapStore } from "../stores/map-store";
import { useTranslation } from "react-i18next";
import { ThemedText } from "@/components/themed-text";

interface FriendDotsProps {
  locations: UserLocation[];
  onPressFriend?: (friend: UserLocation) => void;
}

function getInitials(name: string): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

function minutesAgo(isoDate: string): number {
  return Math.floor((Date.now() - new Date(isoDate).getTime()) / 60_000);
}

/**
 * Spread overlapping points by a small offset so they don't stack.
 */
function spreadCoordinates(
  locations: UserLocation[],
): { location: UserLocation; lng: number; lat: number }[] {
  const seen = new Map<string, number>();
  return locations.map((loc) => {
    const key = `${loc.latitude.toFixed(4)},${loc.longitude.toFixed(4)}`;
    const count = seen.get(key) ?? 0;
    seen.set(key, count + 1);
    const angle = (count * Math.PI * 2) / 6; // spread in a circle
    const offset = count * 0.00005; // ~5m offset per overlap
    return {
      location: loc,
      lng: loc.longitude + offset * Math.cos(angle),
      lat: loc.latitude + offset * Math.sin(angle),
    };
  });
}

export default function FriendDots({
  locations,
  onPressFriend,
}: FriendDotsProps) {
  const { t } = useTranslation();
  const selectedFriendId = useMapStore((s) => s.selectedFriendId);
  const selectFriend = useMapStore((s) => s.selectFriend);
  const selectedFriend = selectedFriendId
    ? locations.find((l) => l.user_id === selectedFriendId) ?? null
    : null;

  const geoJSON = useMemo(() => {
    const spread = spreadCoordinates(locations);
    return {
      type: "FeatureCollection" as const,
      features: spread.map(({ location, lng, lat }) => ({
        type: "Feature" as const,
        geometry: {
          type: "Point" as const,
          coordinates: [lng, lat],
        },
        properties: {
          user_id: location.user_id,
          full_name: location.full_name,
          initials: getInitials(location.full_name),
          group_color: location.group_color,
          group_id: location.group_id,
          updated_at: location.updated_at,
        },
      })),
    };
  }, [locations]);

  if (locations.length === 0) return null;

  return (
    <>
      <MapboxGL.ShapeSource
        id="friend-dots-source"
        shape={geoJSON}
        onPress={(e) => {
          const feature = e.features?.[0];
          if (!feature?.properties) return;
          const userId = feature.properties.user_id as number;
          const friend = locations.find((l) => l.user_id === userId);
          if (friend) {
            selectFriend(friend.user_id);
            onPressFriend?.(friend);
          }
        }}
      >
        {/* Outer ring */}
        <MapboxGL.CircleLayer
          id="friend-dot-ring"
          style={{
            circleRadius: 16,
            circleColor: ["get", "group_color"],
            circleOpacity: 0.25,
          }}
        />
        {/* Inner dot */}
        <MapboxGL.CircleLayer
          id="friend-dot-center"
          style={{
            circleRadius: 10,
            circleColor: ["get", "group_color"],
            circleStrokeWidth: 2,
            circleStrokeColor: MapColors.text,
          }}
        />
        {/* Initials text */}
        <MapboxGL.SymbolLayer
          id="friend-dot-labels"
          style={{
            textField: ["get", "initials"],
            textSize: 9,
            textColor: MapColors.text,
            textAllowOverlap: true,
            textIgnorePlacement: true,
            textFont: ["DIN Pro Bold", "Arial Unicode MS Bold"],
          }}
        />
      </MapboxGL.ShapeSource>

      {/* Callout for selected friend */}
      {selectedFriend && (
        <MapboxGL.MarkerView
          id="friend-callout"
          coordinate={[selectedFriend.longitude, selectedFriend.latitude]}
          anchor={{ x: 0.5, y: 1.2 }}
        >
          <View style={styles.callout}>
            <ThemedText style={styles.calloutName}>{selectedFriend.full_name}</ThemedText>
            <View style={styles.calloutRow}>
              <View
                style={[
                  styles.colorDot,
                  { backgroundColor: selectedFriend.group_color },
                ]}
              />
              <ThemedText style={styles.calloutGroup}>
                Group #{selectedFriend.group_id}
              </ThemedText>
            </View>
            <ThemedText style={styles.calloutTime}>
              {minutesAgo(selectedFriend.updated_at) === 0
                ? t("exhibitor.leads.timeJustNow")
                : `${minutesAgo(selectedFriend.updated_at)} ${t("exhibitor.leads.timeMinAgo")}`}
            </ThemedText>
          </View>
        </MapboxGL.MarkerView>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  callout: {
    backgroundColor: "rgba(28, 28, 46, 0.95)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    minWidth: 120,
    alignItems: "center",
  },
  calloutName: {
    color: MapColors.text,
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 2,
  },
  calloutRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 2,
  },
  colorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  calloutGroup: {
    color: MapColors.textSecondary,
    fontSize: 11,
  },
  calloutTime: {
    color: MapColors.textSecondary,
    fontSize: 11,
  },
});
