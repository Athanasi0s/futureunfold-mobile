import type { CertificateDataOut } from "@/api/schemas";
import { getApiBaseUrl } from "@/api/base-url";
import { CERTIFICATE_DEFAULTS } from "@/constants/data-colors";
import { COLOR_WHITE_ON_ACCENT } from "@/constants/theme";
import { useConfigStore } from "@/features/config/stores/config-store";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Image } from "expo-image";
import React from "react";
import { useTranslation } from "react-i18next";
import {
  StyleSheet,
  View,
} from "react-native";
import { ThemedText } from "@/components/themed-text";

type Props = {
  data: CertificateDataOut;
};

const CATEGORY_DESCRIPTIONS: Record<string, (count: number) => string> = {
  "Session Explorer": (c) => `Attended ${c} session${c !== 1 ? "s" : ""}`,
  "Social Butterfly": (c) => `Scanned ${c} QR code${c !== 1 ? "s" : ""}`,
  "Network Builder": (c) => `Joined ${c} group${c !== 1 ? "s" : ""}`,
  "Community Leader": (c) => `Sent ${c} message${c !== 1 ? "s" : ""}`,
  "Meeting Master": (c) => `${c} confirmed meeting${c !== 1 ? "s" : ""}`,
  "Early Bird": (c) => `Earned ${c} point${c !== 1 ? "s" : ""} on day 1`,
  "Poll Champion": (c) => `Voted in ${c} poll${c !== 1 ? "s" : ""}`,
  "Festival Veteran": (c) => `Earned ${c} total points`,
  "Curious Mind": (c) => `Explored ${c} session type${c !== 1 ? "s" : ""}`,
  "Team Player": (c) => `Active in ${c} group${c !== 1 ? "s" : ""}`,
};

const CERT_DIMS = {
  landscape: { width: 800, height: 566 },
  portrait: { width: 566, height: 800 },
};

const LEGACY_CERTIFICATE_NAME_PATTERN = /panath[eē]nea/i;

export const CertificateView = React.forwardRef<View, Props>(({ data }, ref) => {
  const { template } = data;
  const { t } = useTranslation();
  const appName = useConfigStore((s) => s.appName);
  const festivalName = LEGACY_CERTIFICATE_NAME_PATTERN.test(template.festival_name)
    ? `${appName} 2026`
    : template.festival_name;

  const orientation = (template as any).orientation ?? "landscape";
  const dims = CERT_DIMS[orientation as keyof typeof CERT_DIMS];
  const isPortrait = orientation === "portrait";

  const customTitles = (template as any).milestone_titles ?? {};

  // Show more milestones in portrait (more vertical space)
  const maxMilestones = isPortrait ? 5 : 3;

  return (
    <View ref={ref} style={{ width: dims.width, height: dims.height, overflow: "hidden" }} collapsable={false}>
      <LinearGradient
        colors={template.background_gradient?.length === 2 ? template.background_gradient : [CERTIFICATE_DEFAULTS.gradientStart, CERTIFICATE_DEFAULTS.gradientEnd]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      {/* Decorative border */}
      <View style={[styles.borderFrame, { borderColor: template.border_color }]}>
        {/* Top section */}
        <View style={styles.topSection}>
          {template.logo_url ? (
            <Image
              source={{ uri: template.logo_url.startsWith("/")
                ? `${getApiBaseUrl()}${template.logo_url}`
                : template.logo_url
              }}
              style={{ width: 60, height: 60, marginBottom: 8 }}
              contentFit="contain"
            />
          ) : null}
          <ThemedText style={[styles.festivalName, { fontSize: isPortrait ? 32 : 28 }]}>
            {festivalName}
          </ThemedText>
          <ThemedText style={styles.tagline}>
            {template.tagline}
          </ThemedText>
        </View>

        {/* Middle section */}
        <View style={styles.middleSection}>
          <ThemedText style={styles.certHeader}>
            {t("certificate.certHeader")}
          </ThemedText>
          <View style={styles.divider}>
            <View style={[styles.dividerLine, { backgroundColor: template.accent_color }]} />
          </View>
          <ThemedText style={styles.userName}>{data.user_name}</ThemedText>
        </View>

        {/* Milestones section */}
        <View style={styles.milestonesSection}>
          {data.top_milestones.slice(0, maxMilestones).map((milestone, index) => {
            const categoryKey = milestone.category.toLowerCase().replace(/ /g, "_");
            const displayTitle = customTitles[categoryKey] || milestone.category;
            const descFn = CATEGORY_DESCRIPTIONS[milestone.category];
            const description = descFn ? descFn(milestone.count) : `${milestone.count} ${t("certificate.activitiesUnit")}`;
            return (
              <View key={index} style={styles.milestonePill}>
                <Ionicons
                  name={milestone.icon as keyof typeof Ionicons.glyphMap}
                  size={18}
                  color={template.accent_color}
                />
                <View style={styles.milestoneInfo}>
                  <ThemedText style={styles.milestoneCategory}>{displayTitle}</ThemedText>
                  <ThemedText style={styles.milestoneDescription}>{description}</ThemedText>
                </View>
                <View style={[styles.rankBadge, { backgroundColor: `${template.accent_color}30` }]}>
                  <ThemedText style={[styles.rankLabel, { color: template.accent_color }]}>
                    {milestone.rank_label}
                  </ThemedText>
                </View>
              </View>
            );
          })}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <View style={[styles.footerLine, { backgroundColor: template.border_color }]} />
          <ThemedText style={styles.footerText}>
            {t("certificate.footer", { appName })}
          </ThemedText>
        </View>
      </View>
    </View>
  );
});

CertificateView.displayName = "CertificateView";

const styles = StyleSheet.create({
  borderFrame: {
    flex: 1,
    margin: 8,
    borderWidth: 4,
    borderRadius: 16,
    padding: 20,
    justifyContent: "space-between",
  },
  topSection: {
    alignItems: "center",
    paddingTop: 8,
  },
  festivalName: {
    fontWeight: "900",
    letterSpacing: 1,
    textAlign: "center",
    color: COLOR_WHITE_ON_ACCENT,
    textShadowColor: "rgba(0, 0, 0, 0.35)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  tagline: {
    fontSize: 12,
    fontWeight: "700",
    marginTop: 4,
    textAlign: "center",
    color: COLOR_WHITE_ON_ACCENT,
    opacity: 0.82,
  },
  middleSection: {
    alignItems: "center",
    paddingVertical: 16,
  },
  certHeader: {
    fontSize: 14,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 2,
    color: COLOR_WHITE_ON_ACCENT,
    opacity: 0.78,
  },
  divider: {
    width: "60%",
    alignItems: "center",
    marginVertical: 12,
  },
  dividerLine: {
    height: 2,
    width: "100%",
    borderRadius: 1,
  },
  userName: {
    fontSize: 26,
    fontWeight: "800",
    color: COLOR_WHITE_ON_ACCENT,
    textAlign: "center",
    letterSpacing: -0.5,
  },
  milestonesSection: {
    gap: 8,
    paddingHorizontal: 4,
  },
  milestonePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
  },
  milestoneInfo: {
    flex: 1,
  },
  milestoneCategory: {
    fontSize: 13,
    fontWeight: "600",
    color: COLOR_WHITE_ON_ACCENT,
  },
  milestoneDescription: {
    fontSize: 10,
    fontWeight: "500",
    color: COLOR_WHITE_ON_ACCENT,
    opacity: 0.72,
    marginTop: 1,
  },
  rankBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  rankLabel: {
    fontSize: 11,
    fontWeight: "700",
  },
  footer: {
    alignItems: "center",
    paddingTop: 8,
  },
  footerLine: {
    height: 1,
    width: "80%",
    marginBottom: 10,
    opacity: 0.3,
  },
  footerText: {
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 1,
    color: COLOR_WHITE_ON_ACCENT,
    opacity: 0.72,
  },
});
