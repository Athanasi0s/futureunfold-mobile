import { useColors } from "@/hooks/use-colors";
import { ThemedText } from "@/components/themed-text";
import { TenantBackgroundArt } from "@/components/tenant-background-art";
import { useAuthStore } from "@/features/authentication/stores/auth";
import { getTenantBackgroundSource } from "@/constants/tenant-assets";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, Stack } from "expo-router";
import { useMemo } from "react";
import { ScrollView, StyleSheet, TouchableOpacity, useWindowDimensions, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";

type ScopeKey =
  | "validate_ticket"
  | "ticket_packages"
  | "user_reports"
  | "manage_sessions";

type AdminCard = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  description: string;
  route: string;
  requiredRole?: "admin";
  requiredScope?: ScopeKey;
};

export default function AdminDashboard() {
  const router = useRouter();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { t } = useTranslation();

  const user = useAuthStore((s) => s.user);
  const { width } = useWindowDimensions();
  const hasBackgroundArt = Boolean(getTenantBackgroundSource());
  const artworkHeight = width * (1864 / 2100);

  const ADMIN_CARDS: AdminCard[] = useMemo(
    () => [
      {
        icon: "people",
        label: t("admin.dashboard.cards.users.label"),
        description: t("admin.dashboard.cards.users.description"),
        route: "/admin-users",
        requiredRole: "admin",
      },
      {
        icon: "color-palette",
        label: t("admin.dashboard.cards.theme.label"),
        description: t("admin.dashboard.cards.theme.description"),
        route: "/admin-theme",
        requiredRole: "admin",
      },
      {
        icon: "stats-chart",
        label: t("admin.dashboard.cards.statistics.label"),
        description: t("admin.dashboard.cards.statistics.description"),
        route: "/admin-stats",
        requiredRole: "admin",
      },
      {
        icon: "pricetag",
        label: t("admin.dashboard.cards.ticketPackages.label"),
        description: t("admin.dashboard.cards.ticketPackages.description"),
        route: "/admin-ticket-packages",
        requiredScope: "ticket_packages",
      },
      {
        icon: "document-text",
        label: t("admin.dashboard.cards.auditLog.label"),
        description: t("admin.dashboard.cards.auditLog.description"),
        route: "/admin-audit-log",
        requiredRole: "admin",
      },
      {
        icon: "location",
        label: t("admin.dashboard.cards.venues.label"),
        description: t("admin.dashboard.cards.venues.description"),
        route: "/admin-venues",
        requiredRole: "admin",
      },
      {
        icon: "people-circle",
        label: t("admin.dashboard.cards.groups.label"),
        description: t("admin.dashboard.cards.groups.description"),
        route: "/admin-groups",
        requiredRole: "admin",
      },
      {
        icon: "heart",
        label: t("admin.dashboard.cards.interests.label"),
        description: t("admin.dashboard.cards.interests.description"),
        route: "/admin-interests",
        requiredRole: "admin",
      },
      {
        icon: "ribbon",
        label: t("admin.dashboard.cards.certificate.label"),
        description: t("admin.dashboard.cards.certificate.description"),
        route: "/admin-certificate",
        requiredRole: "admin",
      },
      {
        icon: "brush",
        label: "Branding",
        description: "App name & logo",
        route: "/admin-branding",
        requiredRole: "admin",
      },
      {
        icon: "toggle",
        label: "Feature Toggles",
        description: "Enable or disable app features",
        route: "/admin-features",
        requiredRole: "admin",
      },
      {
        icon: "settings",
        label: t("admin.dashboard.cards.configuration.label"),
        description: t("admin.dashboard.cards.configuration.description"),
        route: "/admin-config",
        requiredRole: "admin",
      },
      {
        icon: "megaphone",
        label: t("admin.dashboard.cards.push.label"),
        description: t("admin.dashboard.cards.push.description"),
        route: "/admin-push",
        requiredRole: "admin",
      },
      {
        icon: "flag",
        label: t("admin.dashboard.cards.reports.label"),
        description: t("admin.dashboard.cards.reports.description"),
        route: "/admin-reports",
        requiredScope: "user_reports",
      },
      {
        icon: "qr-code",
        label: "Validate Ticket",
        description: "Scan and validate attendee tickets",
        route: "/validate-ticket",
        requiredScope: "validate_ticket",
      },
      {
        icon: "shield-checkmark",
        label: t("admin.dashboard.cards.moderatorPermissions.label"),
        description: t("admin.dashboard.cards.moderatorPermissions.description"),
        route: "/admin-moderator-permissions",
        requiredRole: "admin",
      },
      {
        icon: "calendar",
        label: t("admin.dashboard.cards.sessions.label"),
        description: t("admin.dashboard.cards.sessions.description"),
        route: "/admin-sessions",
        requiredScope: "manage_sessions",
      },
    ],
    [t],
  );

  const visibleCards = useMemo(() => {
    if (user?.role === "admin") return ADMIN_CARDS;
    if (user?.role === "moderator") {
      const perms = user.moderator_permissions ?? {
        validate_ticket: false,
        ticket_packages: false,
        user_reports: false,
        manage_sessions: false,
      };
      return ADMIN_CARDS.filter((c) => {
        if (c.requiredRole === "admin") return false;
        if (c.requiredScope) return perms[c.requiredScope] === true;
        return false;
      });
    }
    return [];
  }, [user, ADMIN_CARDS]);

  return (
    <>
      <Stack.Screen options={{ headerShown: true, title: t("admin.dashboard.title") }} />
      <SafeAreaView style={styles.container} edges={["bottom"]}>
        {hasBackgroundArt && (
          <TenantBackgroundArt
            variant="secondary"
            style={[styles.backgroundArt, { width, height: artworkHeight }]}
          />
        )}
        <ScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 32 }]}>
          {visibleCards.length === 0 ? (
            <ThemedText style={styles.emptyText}>
              {t("admin.dashboard.moderatorEmpty")}
            </ThemedText>
          ) : (
            <View style={styles.grid}>
              {visibleCards.map((card) => (
                <TouchableOpacity
                  key={card.route}
                  style={styles.card}
                  activeOpacity={0.7}
                  onPress={() => router.push(card.route as any)}
                >
                  <View style={styles.iconContainer}>
                    <Ionicons
                      name={card.icon}
                      size={28}
                      color={colors.primary}
                    />
                  </View>
                  <ThemedText style={styles.cardLabel}>{card.label}</ThemedText>
                  <ThemedText style={styles.cardDescription}>
                    {card.description}
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

const createStyles = (colors: ReturnType<typeof useColors>) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    backgroundArt: {
      position: "absolute",
      top: 0,
      alignSelf: "center",
      opacity: 0.16,
    },
    scrollContent: {
      padding: 16,
      paddingBottom: 32,
    },
    grid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 12,
    },
    card: {
      width: "48%",
      backgroundColor: colors.cardBackground,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      padding: 16,
      minHeight: 130,
    },
    iconContainer: {
      width: 44,
      height: 44,
      borderRadius: 10,
      backgroundColor: colors.primaryLight,
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 12,
    },
    cardLabel: {
      fontSize: 16,
      fontWeight: "700",
      color: colors.text,
      marginBottom: 4,
    },
    cardDescription: {
      fontSize: 12,
      color: colors.textSecondary,
      lineHeight: 16,
    },
    emptyText: {
      fontSize: 16,
      color: colors.textSecondary,
      textAlign: "center",
      paddingVertical: 32,
      paddingHorizontal: 16,
    },
  });
