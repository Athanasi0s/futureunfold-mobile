import React from "react";
import { StyleSheet, View } from "react-native";
import QRCode from "react-native-qrcode-svg";
import { ID_CARD_COLORS } from "@/constants/data-colors";

interface QRCodeDisplayProps {
  /** User ID to encode in the QR code */
  userId: number;
  /** Exact admission payload supplied by EVENTORA, when available. */
  value?: string | null;
  /** Size of the QR code (default: 200) */
  size?: number;
  /** Background color (default: white) */
  backgroundColor?: string;
  /** QR code color (default: black) */
  color?: string;
}

/**
 * Generates a QR code containing a deep link URL for user profile
 * Format: festapp://user/{userId}
 */
export function QRCodeDisplay({
  userId,
  value,
  size = 200,
  backgroundColor = ID_CARD_COLORS.paper,
  color = ID_CARD_COLORS.ink,
}: QRCodeDisplayProps) {
  // URL format for deep linking
  const qrValue = value?.trim() || `festapp://user/${userId}`;

  return (
    <View style={[styles.container, { backgroundColor }]}>
      <QRCode
        value={qrValue}
        size={size}
        backgroundColor={backgroundColor}
        color={color}
        ecl="M" // Medium error correction
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
});

export default QRCodeDisplay;
