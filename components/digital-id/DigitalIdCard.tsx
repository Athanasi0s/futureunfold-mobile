import { MeOut } from "@/api/schemas";
import {
  ID_CARD_COLORS,
  ROLE_COLORS,
  SHADOW_BLACK,
} from "@/constants/data-colors";
import { COLOR_WHITE_ON_ACCENT } from "@/constants/theme";
import { useConfigStore } from "@/features/config/stores/config-store";
import { useColors } from "@/hooks/use-colors";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  Image,
  StyleSheet,
  View,
} from "react-native";
import { useTranslation } from "react-i18next";
import { QRCodeDisplay } from "./QRCodeDisplay";
import { ThemedText } from "@/components/themed-text";

// Role display configuration - speaker color uses brand token
function getRoleConfig(brandColor: string): Record<
  string,
  { icon: keyof typeof Ionicons.glyphMap; color: string }
> {
  return {
    speaker: { icon: "mic", color: brandColor },
    exhibitor: {
      icon: "storefront-outline",
      color: ROLE_COLORS.exhibitor,
    },
    admin: { icon: "shield-checkmark", color: ROLE_COLORS.admin },
    attendee: { icon: "person", color: ROLE_COLORS.attendee },
  };
}

interface DigitalIdCardProps {
  user: MeOut;
  eventName?: string;
  eventSubtitle?: string;
  eventDate?: string;
  eventLocation?: string;
}

export function DigitalIdCard({
  user,
  eventName,
  eventSubtitle,
  eventDate = "Nov 24, 2026",
  eventLocation = "Main Hall Entry",
}: DigitalIdCardProps) {
  const { t } = useTranslation();
  const colors = useColors();
  const appName = useConfigStore((s) => s.appName);
  const resolvedEventName = eventName ?? `${appName} 2026`;
  const resolvedEventSubtitle =
    eventSubtitle ?? t("digitalId.card.eventSubtitle");
  return (
    <View style={styles.card}>
      {/* Scan instruction */}
      <View style={styles.scanHeader}>
        <ThemedText style={styles.scanLabel}>{t("digitalId.card.scanForEntry")}</ThemedText>
      </View>

      {/* QR Code */}
      <View style={styles.qrContainer}>
        <QRCodeDisplay userId={user.id} value={user.eventora_qr_code} size={180} />
      </View>

      {/* Dashed divider */}
      <View style={styles.dashedDivider} />

      {/* Event Info */}
      <View style={styles.eventInfo}>
        <ThemedText style={styles.eventName}>{resolvedEventName}</ThemedText>
        <ThemedText style={styles.eventSubtitle}>{resolvedEventSubtitle}</ThemedText>

        <View style={styles.eventDetails}>
          <View style={styles.detailColumn}>
            <ThemedText style={styles.detailLabel}>{t("digitalId.card.dateLabel")}</ThemedText>
            <ThemedText style={styles.detailValue}>{eventDate}</ThemedText>
          </View>
          <View style={[styles.detailColumn, styles.detailColumnRight]}>
            <ThemedText style={styles.detailLabel}>{t("digitalId.card.locationLabel")}</ThemedText>
            <ThemedText style={[styles.detailValue, styles.locationValue, { color: colors.brand }]}>
              {eventLocation}
            </ThemedText>
          </View>
        </View>
      </View>
    </View>
  );
}

interface UserAvatarSectionProps {
  user: MeOut;
}

export function UserAvatarSection({ user }: UserAvatarSectionProps) {
  const { t } = useTranslation();
  const colors = useColors();
  const ROLE_CONFIG = getRoleConfig(colors.brand);
  const roleConfig = ROLE_CONFIG[user.role] || ROLE_CONFIG.attendee;
  const userInitial = user.full_name?.charAt(0).toUpperCase() || "U";
  const roleLabel = t(`digitalId.card.roleLabels.${user.role}`, { defaultValue: user.role.toUpperCase() });

  return (
    <View style={styles.avatarSection}>
      {/* Avatar with ring */}
      <View style={styles.avatarContainer}>
        {user.avatar_url ? (
          <Image source={{ uri: user.avatar_url }} style={styles.avatar} />
        ) : (
          <View
            style={[
              styles.avatarPlaceholder,
              { backgroundColor: roleConfig.color },
            ]}
          >
            <ThemedText style={styles.avatarInitial}>{userInitial}</ThemedText>
          </View>
        )}
        <View style={[styles.avatarRing, { borderColor: roleConfig.color }]} />
      </View>

      {/* Name and role badge */}
      <ThemedText style={styles.userName}>{user.full_name || t("digitalId.card.userFallback")}</ThemedText>

      {user.company && <ThemedText style={styles.userCompany}>{user.company}</ThemedText>}

      <View style={[styles.roleBadge, { backgroundColor: roleConfig.color }]}>
        <Ionicons name={roleConfig.icon} size={12} color={COLOR_WHITE_ON_ACCENT} />
        <ThemedText style={styles.roleLabel}>{roleLabel}</ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // Avatar Section
  avatarSection: {
    alignItems: "center",
    marginBottom: 24,
  },
  avatarContainer: {
    position: "relative",
    marginBottom: 12,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
  },
  avatarPlaceholder: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitial: {
    fontSize: 36,
    fontWeight: "700",
    color: COLOR_WHITE_ON_ACCENT,
  },
  avatarRing: {
    position: "absolute",
    top: -4,
    left: -4,
    right: -4,
    bottom: -4,
    borderRadius: 52,
    borderWidth: 4,
  },
  userName: {
    fontSize: 24,
    fontWeight: "700",
    color: COLOR_WHITE_ON_ACCENT,
    marginBottom: 4,
  },
  userCompany: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.7)",
    marginBottom: 12,
  },
  roleBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  roleLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: COLOR_WHITE_ON_ACCENT,
    letterSpacing: 1.5,
  },

  // Card
  card: {
    backgroundColor: ID_CARD_COLORS.paper,
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: SHADOW_BLACK,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.05)",
  },
  scanHeader: {
    paddingTop: 20,
    paddingBottom: 12,
    alignItems: "center",
  },
  scanLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: ID_CARD_COLORS.labelInk,
    letterSpacing: 2,
  },
  qrContainer: {
    alignItems: "center",
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  dashedDivider: {
    height: 1,
    marginHorizontal: 24,
    borderStyle: "dashed",
    borderWidth: 1,
    borderColor: ID_CARD_COLORS.divider,
  },
  eventInfo: {
    padding: 24,
    paddingTop: 20,
  },
  eventName: {
    fontSize: 22,
    fontWeight: "900",
    color: ID_CARD_COLORS.ink,
    marginBottom: 4,
    textAlign: "center",
  },
  eventSubtitle: {
    fontSize: 13,
    color: ID_CARD_COLORS.subtleInk,
    fontWeight: "500",
    marginBottom: 20,
    textAlign: "center",
  },
  eventDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  detailColumn: {
    flex: 1,
  },
  detailColumnRight: {
    alignItems: "flex-end",
  },
  detailLabel: {
    fontSize: 9,
    fontWeight: "700",
    color: ID_CARD_COLORS.labelInk,
    letterSpacing: 1,
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 13,
    fontWeight: "700",
    color: ID_CARD_COLORS.ink,
  },
  locationValue: {
    color: ID_CARD_COLORS.ink,
    fontWeight: "800",
  },
});

export default DigitalIdCard;
