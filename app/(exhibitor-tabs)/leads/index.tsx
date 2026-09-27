import { LEAD_SCORE_COLORS } from "@/constants/data-colors";
import { useConfigStore } from "@/features/config/stores/config-store";
import { useScanHistory } from "@/features/points/hooks";
import { useColors } from "@/hooks/use-colors";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  FlatList,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ThemedText } from "@/components/themed-text";
import { TenantBackgroundArt } from "@/components/tenant-background-art";
import { getTenantBackgroundSource } from "@/constants/tenant-assets";

type FilterType = "all" | "hot" | "vip" | "followup";

function getLeadBadgeKey(points: number): string {
  if (points >= 20) return "hot";
  if (points >= 10) return "vip";
  if (points >= 5) return "followup";
  return "lead";
}

function getLeadBadgeStyle(points: number): { color: string; bg: string } {
  if (points >= 20) return LEAD_SCORE_COLORS.hot;
  if (points >= 10) return LEAD_SCORE_COLORS.vip;
  if (points >= 5) return LEAD_SCORE_COLORS.followup;
  return LEAD_SCORE_COLORS.lead;
}

export default function LeadsScreen() {
  const colors = useColors();
  const router = useRouter();
  const { t } = useTranslation();
  const appName = useConfigStore((s) => s.appName);
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");
  const [refreshing, setRefreshing] = useState(false);
  const { width } = useWindowDimensions();
  const hasBackgroundArt = Boolean(getTenantBackgroundSource());
  const artworkHeight = width * (1864 / 2100);

  const { data: scanHistory = [], refetch } = useScanHistory("scanned_by_me");

  const filtered = useMemo(() => {
    let list = scanHistory;

    if (activeFilter === "hot") list = list.filter((l) => l.points_awarded >= 20);
    else if (activeFilter === "vip")
      list = list.filter((l) => l.points_awarded >= 10 && l.points_awarded < 20);
    else if (activeFilter === "followup")
      list = list.filter((l) => l.points_awarded >= 5 && l.points_awarded < 10);

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((l) => l.scanned_name.toLowerCase().includes(q));
    }

    return list;
  }, [scanHistory, activeFilter, search]);

  const counts = useMemo(
    () => ({
      all: scanHistory.length,
      hot: scanHistory.filter((l) => l.points_awarded >= 20).length,
      vip: scanHistory.filter(
        (l) => l.points_awarded >= 10 && l.points_awarded < 20,
      ).length,
      followup: scanHistory.filter(
        (l) => l.points_awarded >= 5 && l.points_awarded < 10,
      ).length,
    }),
    [scanHistory],
  );

  const onRefresh = () => {
    setRefreshing(true);
    refetch().finally(() => setRefreshing(false));
  };

  const styles = makeStyles(colors);

  const filters: { key: FilterType; label: string }[] = [
    { key: "all", label: `${t("exhibitor.leads.filterAll")} (${counts.all})` },
    { key: "hot", label: t("exhibitor.leads.filterHot") },
    { key: "vip", label: t("exhibitor.leads.filterVip") },
    { key: "followup", label: t("exhibitor.leads.filterFollowUp") },
  ];

  return (
    <View style={styles.container}>
      {hasBackgroundArt && (
        <TenantBackgroundArt
          variant="secondary"
          style={[styles.backgroundArt, { width, height: artworkHeight }]}
        />
      )}
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <SafeAreaView style={styles.headerSafe}>
        <View style={styles.header}>
          <View style={styles.headerText}>
            <ThemedText style={styles.headerTitle}>{t("exhibitor.leads.title")}</ThemedText>
            <ThemedText style={styles.headerSubtitle}>{t("exhibitor.leads.subtitle", { appName })}</ThemedText>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.iconButton}>
              <Ionicons name="options-outline" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton}>
              <Ionicons name="download-outline" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Search */}
        <View style={styles.searchRow}>
          <Ionicons
            name="search-outline"
            size={16}
            color={colors.textTertiary}
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder={t("exhibitor.leads.searchPlaceholder")}
            placeholderTextColor={colors.textTertiary}
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch("")}>
              <Ionicons name="close-circle" size={16} color={colors.textTertiary} />
            </TouchableOpacity>
          )}
        </View>

        {/* Filter chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterScroll}
          contentContainerStyle={styles.filterContent}
        >
          {filters.map((f) => {
            const active = activeFilter === f.key;
            return (
              <TouchableOpacity
                key={f.key}
                style={[styles.filterChip, active && styles.filterChipActive]}
                onPress={() => setActiveFilter(f.key)}
              >
                <ThemedText
                  style={[
                    styles.filterChipText,
                    active && styles.filterChipTextActive,
                  ]}
                >
                  {f.label}
                </ThemedText>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </SafeAreaView>

      {/* List */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.brand}
          />
        }
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="people-outline" size={48} color={colors.textTertiary} />
            <ThemedText style={styles.emptyTitle}>{t("exhibitor.leads.emptyNoLeads")}</ThemedText>
            <ThemedText style={styles.emptySubtitle}>
              {scanHistory.length === 0
                ? t("exhibitor.leads.emptyScan")
                : t("exhibitor.leads.emptyAdjust")}
            </ThemedText>
          </View>
        }
        renderItem={({ item }) => {
          const badgeKey = getLeadBadgeKey(item.points_awarded);
          const badge = getLeadBadgeStyle(item.points_awarded);
          const badgeLabels: Record<string, string> = {
            hot: t("exhibitor.leads.badgeHot"),
            vip: t("exhibitor.leads.badgeVip"),
            followup: t("exhibitor.leads.badgeFollowUp"),
            lead: t("exhibitor.leads.badgeLead"),
          };
          return (
            <TouchableOpacity
              style={styles.card}
              activeOpacity={0.7}
              onPress={() =>
                router.push({
                  pathname: "/user/[id]",
                  params: { id: String(item.scanned_id) },
                })
              }
            >
              <View style={styles.avatar}>
                <Ionicons name="person" size={22} color={colors.brand} />
              </View>

              <View style={styles.cardBody}>
                <View style={styles.cardTopRow}>
                  <ThemedText style={styles.cardName} numberOfLines={1}>
                    {item.scanned_name}
                  </ThemedText>
                  <ThemedText style={styles.cardTime}>
                    {(() => {
                      const diff = Date.now() - new Date(item.created_at).getTime();
                      const mins = Math.floor(diff / 60000);
                      if (mins < 1) return t("exhibitor.leads.timeJustNow");
                      if (mins < 60) return `${mins} ${t("exhibitor.leads.timeMinAgo")}`;
                      const hrs = Math.floor(mins / 60);
                      if (hrs < 24) return `${hrs}${t("exhibitor.leads.timeHAgo")}`;
                      return `${Math.floor(hrs / 24)}${t("exhibitor.leads.timeDAgo")}`;
                    })()}
                  </ThemedText>
                </View>
                <ThemedText style={styles.cardPoints}>{t("exhibitor.leads.ptsAwarded", { pts: item.points_awarded })}</ThemedText>
                <View style={styles.badgeRow}>
                  <View style={[styles.badge, { backgroundColor: badge.bg }]}>
                    <ThemedText style={[styles.badgeText, { color: badge.color }]}>
                      {badgeLabels[badgeKey]}
                    </ThemedText>
                  </View>
                </View>
              </View>

              <Ionicons
                name="chevron-forward"
                size={18}
                color={colors.textTertiary}
                style={styles.chevron}
              />
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}

function makeStyles(colors: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.surfacePrimary,
    },
    backgroundArt: {
      position: "absolute",
      top: 0,
      alignSelf: "center",
      opacity: 0.16,
    },
    headerSafe: {
      backgroundColor: colors.surfaceSecondary,
      borderBottomWidth: 1,
      borderBottomColor: "rgba(255,255,255,0.08)",
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingTop: 4,
      paddingBottom: 12,
    },
    headerText: {
      flex: 1,
    },
    headerTitle: {
      fontSize: 22,
      fontWeight: "700",
      color: colors.textPrimary,
    },
    headerSubtitle: {
      fontSize: 12,
      color: colors.textTertiary,
      marginTop: 2,
    },
    headerActions: {
      flexDirection: "row",
      gap: 8,
    },
    iconButton: {
      width: 36,
      height: 36,
      borderRadius: 10,
      backgroundColor: colors.brandLight,
      alignItems: "center",
      justifyContent: "center",
    },
    searchRow: {
      flexDirection: "row",
      alignItems: "center",
      marginHorizontal: 16,
      marginBottom: 12,
      backgroundColor: colors.searchBackground,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.searchBorder,
      paddingHorizontal: 10,
      height: 40,
    },
    searchIcon: {
      marginRight: 8,
    },
    searchInput: {
      flex: 1,
      fontSize: 14,
      color: colors.textPrimary,
    },
    filterScroll: {
      marginBottom: 12,
    },
    filterContent: {
      paddingHorizontal: 16,
      gap: 8,
    },
    filterChip: {
      paddingHorizontal: 14,
      paddingVertical: 6,
      borderRadius: 20,
      backgroundColor: colors.chipBackground,
      borderWidth: 1,
      borderColor: "transparent",
    },
    filterChipActive: {
      backgroundColor: colors.brandLight,
      borderColor: colors.brand,
    },
    filterChipText: {
      fontSize: 13,
      fontWeight: "600",
      color: colors.textTertiary,
    },
    filterChipTextActive: {
      color: colors.brand,
    },
    listContent: {
      paddingHorizontal: 16,
      paddingTop: 12,
      paddingBottom: 100,
    },
    separator: {
      height: 8,
    },
    card: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.surfaceSecondary,
      borderRadius: 14,
      padding: 14,
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.06)",
    },
    avatar: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: colors.brandLight,
      borderWidth: 2,
      borderColor: colors.brandBorder,
      alignItems: "center",
      justifyContent: "center",
    },
    cardBody: {
      flex: 1,
      marginLeft: 12,
    },
    cardTopRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 2,
    },
    cardName: {
      fontSize: 15,
      fontWeight: "700",
      color: colors.textPrimary,
      flex: 1,
      marginRight: 8,
    },
    cardTime: {
      fontSize: 11,
      color: colors.textTertiary,
    },
    cardPoints: {
      fontSize: 12,
      color: colors.textSecondary,
      marginBottom: 6,
    },
    badgeRow: {
      flexDirection: "row",
      gap: 6,
    },
    badge: {
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 6,
    },
    badgeText: {
      fontSize: 9,
      fontWeight: "800",
      letterSpacing: 0.4,
    },
    chevron: {
      marginLeft: 4,
    },
    empty: {
      alignItems: "center",
      justifyContent: "center",
      paddingTop: 80,
      paddingHorizontal: 32,
      gap: 12,
    },
    emptyTitle: {
      fontSize: 18,
      fontWeight: "700",
      color: colors.textPrimary,
    },
    emptySubtitle: {
      fontSize: 13,
      color: colors.textTertiary,
      textAlign: "center",
      lineHeight: 20,
    },
  });
}
