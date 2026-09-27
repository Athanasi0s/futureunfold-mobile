import { BottomSheet } from "@/components/ui/bottom-sheet";
import { useAuthStore } from "@/features/authentication/stores/auth";
import { useGetExhibitorSessions } from "@/features/exhibitors/hooks/useGetExhibitorSessions";
import { usePatchSession } from "@/features/exhibitors/hooks/usePatchSession";
import { getSpeakers } from "@/api/features/program";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import { useTranslation } from "react-i18next";
import {
  Alert,
  Image,
  ScrollView,
  StatusBar,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useState } from "react";
import type { SpeakerBriefOut } from "@/api/schemas";
import { useColors } from "@/hooks/use-colors";

import { COLOR_WHITE_ON_ACCENT } from "@/constants/theme";
import { ThemedText } from "@/components/themed-text";
import { TenantBackgroundArt } from "@/components/tenant-background-art";
import { getTenantBackgroundSource } from "@/constants/tenant-assets";
export default function SessionSpeakersScreen() {
  const { t } = useTranslation();
  const colors = useColors();
  const styles = getStyles(colors);
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();
  const id = Number(sessionId);

  const user = useAuthStore((s) => s.user);
  const { data: sessions = [] } = useGetExhibitorSessions(user?.id);
  const session = sessions.find((s) => s.id === id);

  const { data: allSpeakers = [] } = useQuery({
    queryKey: ["speakers"],
    queryFn: getSpeakers,
    staleTime: 60000,
  });

  const patchSession = usePatchSession(id);
  const [addSheetVisible, setAddSheetVisible] = useState(false);
  const [search, setSearch] = useState("");
  const { width } = useWindowDimensions();
  const hasBackgroundArt = Boolean(getTenantBackgroundSource());
  const artworkHeight = width * (1864 / 2100);

  const currentSpeakers: SpeakerBriefOut[] = session?.speakers ?? [];

  const currentIds = currentSpeakers.map((sp) => sp.user_id);
  const availableToAdd = allSpeakers.filter((sp) => !currentIds.includes(sp.user_id));
  const filteredSpeakers = search.trim()
    ? availableToAdd.filter((sp) =>
        sp.full_name.toLowerCase().includes(search.toLowerCase())
      )
    : availableToAdd;

  function handleRemoveSpeaker(userId: number) {
    Alert.alert(t("exhibitor.speakers.alertRemove"), t("exhibitor.speakers.alertRemoveMsg"), [
      { text: t("exhibitor.speakers.alertCancel"), style: "cancel" },
      {
        text: t("exhibitor.speakers.alertRemoveBtn"),
        style: "destructive",
        onPress: () => {
          const newIds = currentIds.filter((id) => id !== userId);
          patchSession.mutate({ speaker_ids: newIds });
        },
      },
    ]);
  }

  function handleAddSpeaker(userId: number) {
    const newIds = [...currentIds, userId];
    patchSession.mutate(
      { speaker_ids: newIds },
      { onSuccess: () => setAddSheetVisible(false) }
    );
  }

  return (
    <View style={styles.container}>
      {hasBackgroundArt && (
        <TenantBackgroundArt
          variant="secondary"
          style={[styles.backgroundArt, { width, height: artworkHeight }]}
        />
      )}
      <StatusBar barStyle="light-content" />

      <SafeAreaView style={styles.headerSafe}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="chevron-back" size={24} color={COLOR_WHITE_ON_ACCENT} />
          </TouchableOpacity>
          <ThemedText style={styles.headerTitle}>{t("exhibitor.speakers.title")}</ThemedText>
          <View style={{ width: 24 }} />
        </View>
      </SafeAreaView>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <ThemedText style={styles.sectionLabel}>{t("exhibitor.speakers.currentSpeakers")}</ThemedText>

        <View style={styles.card}>
          {currentSpeakers.length === 0 && (
            <View style={styles.emptyState}>
              <ThemedText style={styles.emptyText}>{t("exhibitor.speakers.noSpeakersAdded")}</ThemedText>
            </View>
          )}
          {currentSpeakers.map((sp, index) => (
            <View
              key={sp.user_id}
              style={[
                styles.speakerRow,
                index < currentSpeakers.length - 1 && styles.rowBorder,
              ]}
            >
              {/* Remove button */}
              <TouchableOpacity
                style={styles.removeBtn}
                onPress={() => handleRemoveSpeaker(sp.user_id)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="remove-circle" size={24} color={colors.error} />
              </TouchableOpacity>

              {/* Avatar */}
              {sp.avatar_url ? (
                <Image source={{ uri: sp.avatar_url }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <ThemedText style={styles.avatarInitial}>
                    {(sp.full_name || "?").charAt(0)}
                  </ThemedText>
                </View>
              )}

              {/* Info */}
              <View style={styles.speakerInfo}>
                <ThemedText style={styles.speakerName}>{sp.full_name}</ThemedText>
                {sp.company ? (
                  <ThemedText style={styles.speakerCompany}>{sp.company}</ThemedText>
                ) : null}
              </View>

              {/* Drag handle */}
              <Ionicons name="reorder-three" size={22} color={colors.border} />
            </View>
          ))}
        </View>

        {/* Add button */}
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => setAddSheetVisible(true)}
          activeOpacity={0.8}
        >
          <Ionicons name="add-circle-outline" size={20} color={colors.brand} />
          <ThemedText style={styles.addBtnText}>{t("exhibitor.speakers.addNew")}</ThemedText>
        </TouchableOpacity>
      </ScrollView>

      {/* Add Speaker Bottom Sheet */}
      <BottomSheet
        visible={addSheetVisible}
        onClose={() => {
          setAddSheetVisible(false);
          setSearch("");
        }}
      >
        <View style={styles.sheetInner}>
        <ThemedText style={styles.sheetTitle}>{t("exhibitor.speakers.addSheet")}</ThemedText>
        <View style={styles.searchWrap}>
          <Ionicons name="search-outline" size={16} color={colors.textTertiary} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
            placeholder={t("exhibitor.speakers.searchByName")}
            placeholderTextColor={colors.textTertiary}
            autoCorrect={false}
            autoCapitalize="none"
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch("")} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close-circle" size={16} color={colors.textTertiary} />
            </TouchableOpacity>
          )}
        </View>
        {filteredSpeakers.length === 0 ? (
          <View style={styles.emptyState}>
            <ThemedText style={styles.emptyText}>
              {availableToAdd.length === 0 ? t("exhibitor.speakers.noAvailable") : t("exhibitor.speakers.noResults")}
            </ThemedText>
          </View>
        ) : (
          <ScrollView style={styles.sheetScroll} showsVerticalScrollIndicator={false}>
            {filteredSpeakers.map((sp, index) => (
              <TouchableOpacity
                key={sp.user_id}
                style={[
                  styles.sheetRow,
                  index < filteredSpeakers.length - 1 && styles.rowBorder,
                ]}
                onPress={() => handleAddSpeaker(sp.user_id)}
                disabled={patchSession.isPending}
              >
                {sp.avatar_url ? (
                  <Image source={{ uri: sp.avatar_url }} style={styles.avatar} />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <ThemedText style={styles.avatarInitial}>
                      {(sp.full_name || "?").charAt(0)}
                    </ThemedText>
                  </View>
                )}
                <View style={styles.speakerInfo}>
                  <ThemedText style={styles.speakerName}>{sp.full_name}</ThemedText>
                  {sp.company ? (
                    <ThemedText style={styles.speakerCompany}>{sp.company}</ThemedText>
                  ) : null}
                </View>
                <Ionicons name="add-circle-outline" size={22} color={colors.brand} />
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
        </View>
      </BottomSheet>
    </View>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
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
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.08)",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLOR_WHITE_ON_ACCENT,
  },
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 40,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.textTertiary,
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 12,
  },
  card: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    overflow: "hidden",
    marginBottom: 4,
  },
  speakerRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.06)",
  },
  removeBtn: {
    width: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  avatarPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.cardBackground,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarInitial: {
    fontSize: 16,
    fontWeight: "700",
    color: COLOR_WHITE_ON_ACCENT,
  },
  speakerInfo: {
    flex: 1,
  },
  speakerName: {
    fontSize: 15,
    fontWeight: "600",
    color: COLOR_WHITE_ON_ACCENT,
    marginBottom: 2,
  },
  speakerCompany: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  emptyState: {
    paddingVertical: 28,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 13,
    color: colors.textTertiary,
  },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    marginTop: 8,
  },
  addBtnText: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.brand,
  },

  // Bottom sheet
  sheetTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: COLOR_WHITE_ON_ACCENT,
    marginBottom: 12,
  },
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.cardBackground,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    paddingHorizontal: 12,
    marginBottom: 12,
    gap: 8,
  },
  searchIcon: {
    flexShrink: 0,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: COLOR_WHITE_ON_ACCENT,
    paddingVertical: 11,
  },
  sheetInner: {
    flex: 1,
  },
  sheetScroll: {
    flex: 1,
  },
  sheetRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    gap: 12,
  },
});
