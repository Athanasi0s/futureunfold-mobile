import React from "react";
import {
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { BADGE_RED } from "@/constants/data-colors";
import { MapColors } from "../constants/colors";
import { useMapStore } from "../stores/map-store";
import { ThemedText } from "@/components/themed-text";

interface FriendToggleProps {
  onPress: () => void;
}

export default function FriendToggle({ onPress }: FriendToggleProps) {
  const showFriends = useMapStore((s) => s.showFriends);
  const activeGroupIds = useMapStore((s) => s.activeGroupIds);
  const activeCount = activeGroupIds.length;

  return (
    <TouchableOpacity
      style={[styles.button, showFriends && styles.buttonActive]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Ionicons
        name="people"
        size={20}
        color={showFriends ? MapColors.text : MapColors.textSecondary}
      />
      {activeCount > 0 && showFriends && (
        <View style={styles.badge}>
          <ThemedText style={styles.badgeText}>{activeCount}</ThemedText>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(28, 28, 46, 0.9)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  buttonActive: {
    backgroundColor: "rgba(74, 144, 217, 0.8)",
    borderColor: "rgba(74, 144, 217, 0.5)",
  },
  badge: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: BADGE_RED,
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "rgba(28, 28, 46, 0.9)",
  },
  badgeText: {
    color: MapColors.text,
    fontSize: 10,
    fontWeight: "700",
  },
});
