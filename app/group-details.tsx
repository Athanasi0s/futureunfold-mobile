import { FeatureGate } from "@/components/feature-gate";
import { COLOR_WHITE_ON_ACCENT } from "@/constants/theme";
import { useConfigStore } from "@/features/config/stores/config-store";
import { useColors } from "@/hooks/use-colors";
import { useGetMyGroups, useJoinGroup } from "@/features/home/hooks";
import {
  useMyLocationSharingStatus,
  useConfirmToggleLocationSharing,
} from "@/features/map/hooks/useLocationSharing";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Alert,
  Share,
  StyleSheet,
  Switch,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import {
  AnimatedScrollView,
  HeaderNavBar,
} from "@/components/templates/parallax-header";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ThemedText } from "@/components/themed-text";
import { TenantBackgroundArt } from "@/components/tenant-background-art";
import { getTenantBackgroundSource } from "@/constants/tenant-assets";

const PLACEHOLDER_IMAGES = [
  "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&h=400&fit=crop",
  "https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=800&h=400&fit=crop",
  "https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=800&h=400&fit=crop",
  "https://images.unsplash.com/photo-1528605248644-14dd04022da1?w=800&h=400&fit=crop",
  "https://images.unsplash.com/photo-1591115765373-5207764f72e7?w=800&h=400&fit=crop",
  "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=800&h=400&fit=crop",
];

function getGroupTypeLabel(type: string, t: (key: string) => string) {
  switch (type) {
    case "topic":
      return t("groups.typeLabel_topic");
    case "venue":
      return t("groups.typeLabel_venue");
    case "interest":
      return t("groups.typeLabel_interest");
    default:
      return type;
  }
}

function getGroupTypeIcon(type: string): keyof typeof Ionicons.glyphMap {
  switch (type) {
    case "topic":
      return "book-outline";
    case "venue":
      return "location-outline";
    case "interest":
      return "heart-outline";
    default:
      return "people-outline";
  }
}

export default function GroupDetailsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const { t } = useTranslation();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { width } = useWindowDimensions();
  const hasBackgroundArt = Boolean(getTenantBackgroundSource());
  const artworkHeight = width * (1864 / 2100);
  const params = useLocalSearchParams<{
    id: string;
    title: string;
    description: string;
    group_type: string;
    ref_key: string;
    member_count: string;
    match_percentage: string;
    image_index: string;
  }>();

  const groupId = Number(params.id);
  const memberCount = Number(params.member_count) || 0;
  const matchPercentage = params.match_percentage
    ? Number(params.match_percentage)
    : null;
  const imageIndex = Number(params.image_index) || 0;
  const imageUrl = PLACEHOLDER_IMAGES[imageIndex % PLACEHOLDER_IMAGES.length];

  const { data: myGroups = [] } = useGetMyGroups();
  const joinGroup = useJoinGroup();
  const { data: sharingStatuses = [] } = useMyLocationSharingStatus();
  const locationToggle = useConfirmToggleLocationSharing();

  const isJoined = useMemo(
    () => myGroups.some((g) => g.id === groupId),
    [myGroups, groupId]
  );

  const isSharingLocation = useMemo(
    () => sharingStatuses.some((s) => s.group_id === groupId && s.sharing),
    [sharingStatuses, groupId]
  );

  const appName = useConfigStore((s) => s.appName);

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Join ${params.title || "this group"} on ${appName}!`,
        title: "Share Group",
      });
    } catch (error) {
      console.error("Error sharing group:", error);
    }
  };

  const handleJoin = () => {
    joinGroup.mutate(
      { group_id: groupId, ref_key: params.ref_key },
      {
        onSuccess: () => {
          Alert.alert(t("groups.joinedSuccess"), t("groups.joinedSuccessMessage", { title: params.title }));
        },
        onError: () => {
          Alert.alert(t("groups.joinError"), t("groups.joinErrorMessage"));
        },
      }
    );
  };

  return (
    <FeatureGate flag="groups">
    <View style={styles.container}>
      {hasBackgroundArt && (
        <TenantBackgroundArt
          variant="secondary"
          style={[styles.backgroundArt, { width, height: artworkHeight }]}
        />
      )}
      <Stack.Screen options={{ headerShown: false }} />

      <AnimatedScrollView
        headerMaxHeight={280}
        topBarHeight={90}
        renderHeaderComponent={() => (
          <View style={{ flex: 1 }}>
            <Image
              source={{ uri: imageUrl }}
              style={StyleSheet.absoluteFillObject}
              contentFit="cover"
            />
            <LinearGradient
              colors={["transparent", "rgba(0,0,0,0.85)"]}
              style={StyleSheet.absoluteFillObject}
            />
            <View style={{ flex: 1, justifyContent: "flex-end", flexDirection: "row", alignItems: "flex-end", padding: 16, gap: 8 }}>
              <ThemedText style={{ flex: 1, color: COLOR_WHITE_ON_ACCENT, fontSize: 26, fontWeight: "800", lineHeight: 32 }} numberOfLines={2}>
                {params.title}
              </ThemedText>
              {!isJoined && matchPercentage != null && (
                <View style={styles.matchBadge}>
                  <ThemedText style={styles.matchBadgeText}>
                    {t("groups.matchBadge", { percent: matchPercentage })}
                  </ThemedText>
                </View>
              )}
            </View>
          </View>
        )}
        renderTopNavBarComponent={() => (
          <HeaderNavBar intensity={60} tint="systemUltraThinMaterialDark" headerHeight={90}>
            <TouchableOpacity onPress={() => router.back()}>
              <Ionicons name="chevron-back" size={24} color={colors.text} />
            </TouchableOpacity>
            <ThemedText style={{ fontSize: 16, fontWeight: "700", color: colors.text }} numberOfLines={1}>
              {params.title}
            </ThemedText>
            <TouchableOpacity
              onPress={handleShare}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              accessibilityLabel="Share group"
            >
              <Ionicons name="share-outline" size={22} color={colors.text} />
            </TouchableOpacity>
          </HeaderNavBar>
        )}
        renderHeaderNavBarComponent={() => (
          <HeaderNavBar intensity={0} tint="dark" headerHeight={90}>
            <TouchableOpacity onPress={() => router.back()}>
              <Ionicons name="chevron-back" size={24} color={COLOR_WHITE_ON_ACCENT} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleShare}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              accessibilityLabel="Share group"
            >
              <Ionicons name="share-outline" size={22} color={COLOR_WHITE_ON_ACCENT} />
            </TouchableOpacity>
          </HeaderNavBar>
        )}
        style={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.contentContainer}>
        {/* Info Row */}
        <View style={styles.infoRow}>
          <View style={styles.infoPill}>
            <Ionicons
              name={getGroupTypeIcon(params.group_type)}
              size={14}
              color={colors.lightBlue}
            />
            <ThemedText style={styles.infoPillText}>
              {getGroupTypeLabel(params.group_type, t)}
            </ThemedText>
          </View>

          <View style={styles.infoPill}>
            <Ionicons name="people" size={14} color={colors.success} />
            <ThemedText style={styles.infoPillText}>
              {t("groups.members", { count: memberCount })}
            </ThemedText>
          </View>
        </View>

        {/* Description */}
        {params.description ? (
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>{t("groups.sectionAbout")}</ThemedText>
            <ThemedText style={styles.descriptionText}>{params.description}</ThemedText>
          </View>
        ) : null}

        {/* Details */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>{t("groups.sectionDetails")}</ThemedText>
          <View style={styles.detailRow}>
            <Ionicons
              name="pricetag-outline"
              size={18}
              color={colors.textSecondary}
            />
            <ThemedText style={styles.detailText}>
              {t("groups.detailType", { label: getGroupTypeLabel(params.group_type, t) })}
            </ThemedText>
          </View>
          <View style={styles.detailRow}>
            <Ionicons
              name="people-outline"
              size={18}
              color={colors.textSecondary}
            />
            <ThemedText style={styles.detailText}>
              {t("groups.detailMembersJoined", { count: memberCount })}
            </ThemedText>
          </View>
          {matchPercentage != null && (
            <View style={styles.detailRow}>
              <Ionicons
                name="sparkles-outline"
                size={18}
                color={colors.textSecondary}
              />
              <ThemedText style={styles.detailText}>
                {t("groups.detailMatchPercent", { percent: matchPercentage })}
              </ThemedText>
            </View>
          )}
        </View>

        {/* Location Sharing — only for joined groups */}
        {isJoined && (
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>{t("groups.sectionLocationSharing")}</ThemedText>
            <View style={styles.locationRow}>
              <View style={styles.locationInfo}>
                <Ionicons
                  name="location"
                  size={20}
                  color={isSharingLocation ? colors.lightBlue : colors.textSecondary}
                />
                <View style={styles.locationTextCol}>
                  <ThemedText style={styles.locationLabel}>
                    {t("groups.shareMyLocation")}
                  </ThemedText>
                  <ThemedText style={styles.locationHint}>
                    {isSharingLocation
                      ? t("groups.locationSharingActive")
                      : t("groups.locationSharingInactive")}
                  </ThemedText>
                </View>
              </View>
              <Switch
                value={isSharingLocation}
                onValueChange={(value) =>
                  locationToggle.toggle(
                    groupId,
                    value,
                    params.title,
                    memberCount,
                  )
                }
                trackColor={{
                  false: colors.cardBackground,
                  true: colors.lightBlue,
                }}
                thumbColor={COLOR_WHITE_ON_ACCENT}
              />
            </View>
          </View>
        )}
        </View>
      </AnimatedScrollView>

      {/* Bottom Buttons */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 12 }]}>
        {isJoined ? (
          <View style={styles.bottomRow}>
            <View style={[styles.joinedButton, styles.bottomButtonHalf]}>
              <Ionicons
                name="checkmark-circle"
                size={20}
                color={colors.textSecondary}
              />
              <ThemedText style={styles.joinedButtonText}>{t("groups.joined")}</ThemedText>
            </View>
            <TouchableOpacity
              style={[styles.chatButton, styles.bottomButtonHalf]}
              onPress={() =>
                router.push({
                  pathname: "/group-chat",
                  params: {
                    group_id: groupId.toString(),
                    title: params.title,
                  },
                })
              }
              activeOpacity={0.8}
            >
              <Ionicons name="chatbubbles-outline" size={20} color={COLOR_WHITE_ON_ACCENT} />
              <ThemedText style={styles.chatButtonText}>{t("groups.groupChat")}</ThemedText>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.joinButton}
            onPress={handleJoin}
            activeOpacity={0.8}
            disabled={joinGroup.isPending}
          >
            {joinGroup.isPending ? (
              <ActivityIndicator color={COLOR_WHITE_ON_ACCENT} size="small" />
            ) : (
              <>
                <Ionicons name="add-circle-outline" size={20} color={COLOR_WHITE_ON_ACCENT} />
                <ThemedText style={styles.joinButtonText}>{t("groups.joinGroup")}</ThemedText>
              </>
            )}
          </TouchableOpacity>
        )}
      </View>
    </View>
    </FeatureGate>
  );
}

const createStyles = (colors: ReturnType<typeof useColors>) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.gradientStart,
    },
    backgroundArt: {
      position: "absolute",
      top: 0,
      alignSelf: "center",
      opacity: 0.16,
    },
    matchBadge: {
      position: "absolute",
      bottom: 16,
      right: 16,
      backgroundColor: colors.matchBadgeBackground,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 12,
    },
    matchBadgeText: {
      fontSize: 13,
      fontWeight: "700",
      color: COLOR_WHITE_ON_ACCENT,
    },
    content: {
      flex: 1,
    },
    contentContainer: {
      padding: 20,
      paddingBottom: 32,
    },
    infoRow: {
      flexDirection: "row",
      gap: 10,
      marginBottom: 24,
    },
    infoPill: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      backgroundColor: colors.cardBackground,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: colors.cardBorder,
    },
    infoPillText: {
      fontSize: 13,
      fontWeight: "600",
      color: colors.text,
    },
    section: {
      marginBottom: 24,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: "700",
      color: colors.text,
      marginBottom: 10,
    },
    descriptionText: {
      fontSize: 15,
      color: colors.textSecondary,
      lineHeight: 22,
    },
    detailRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      paddingVertical: 8,
    },
    detailText: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    bottomBar: {
      paddingHorizontal: 20,
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: colors.cardBorder,
    },
    joinButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      backgroundColor: colors.lightBlue,
      paddingVertical: 14,
      borderRadius: 12,
    },
    joinButtonText: {
      fontSize: 16,
      fontWeight: "700",
      color: COLOR_WHITE_ON_ACCENT,
    },
    joinedButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      backgroundColor: colors.chipBackground,
      paddingVertical: 14,
      borderRadius: 12,
    },
    joinedButtonText: {
      fontSize: 16,
      fontWeight: "700",
      color: colors.textSecondary,
    },
    bottomRow: {
      flexDirection: "row",
      gap: 10,
    },
    bottomButtonHalf: {
      flex: 1,
    },
    chatButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      backgroundColor: colors.primary,
      paddingVertical: 14,
      borderRadius: 12,
    },
    chatButtonText: {
      fontSize: 16,
      fontWeight: "700",
      color: COLOR_WHITE_ON_ACCENT,
    },
    locationRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: colors.cardBackground,
      paddingHorizontal: 14,
      paddingVertical: 12,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.cardBorder,
    },
    locationInfo: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      flex: 1,
    },
    locationTextCol: {
      flex: 1,
    },
    locationLabel: {
      fontSize: 15,
      fontWeight: "600",
      color: colors.text,
    },
    locationHint: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 2,
    },
  });
