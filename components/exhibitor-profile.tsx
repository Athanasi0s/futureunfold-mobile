import { UserProfileOut } from "@/api/schemas";
import { useColors } from "@/hooks/use-colors";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useCallback } from "react";
import { useTranslation } from "react-i18next";
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// ============================================
// EXHIBITOR MOCK DATA
// ============================================

import { COLOR_WHITE_ON_ACCENT } from "@/constants/theme";
import { ThemedText } from "@/components/themed-text";
const MOCK_COVER_IMAGE =
  "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&q=80";

const MOCK_BOOTH_LOCATION = "Hall 3, Booth B12";

const MOCK_PRODUCTS = [
  {
    id: 1,
    title: "AI Analytics Suite",
    subtitle: "Real-time data insights powered by machine learning",
    image:
      "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&q=80",
  },
  {
    id: 2,
    title: "Cloud Integration Platform",
    subtitle: "Seamless connectivity across your entire tech stack",
    image:
      "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=400&q=80",
  },
];

const MOCK_TEAM = [
  {
    id: 1,
    name: "Sarah Chen",
    role: "Head of Partnerships",
    avatar:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&q=80",
  },
  {
    id: 2,
    name: "Marcus Johnson",
    role: "Solutions Architect",
    avatar:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80",
  },
  {
    id: 3,
    name: "Emily Park",
    role: "Product Manager",
    avatar:
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&q=80",
  },
];

interface ExhibitorProfileProps {
  user: UserProfileOut;
  isOwnProfile: boolean;
  onBack: () => void;
  onMoreMenu: () => void;
  onRequestMeeting: () => void;
  onMessage: () => void;
  /** Shared styles from the parent (header, section, divider, etc.) */
  sharedStyles: {
    container: object;
    header: object;
    headerButton: object;
    headerTitle: object;
    scrollView: object;
    scrollContent: object;
    avatarInitial: object;
    divider: object;
    section: object;
    sectionHeader: object;
    sectionTitle: object;
    bioText: object;
    bottomBar: object;
  };
}

export function ExhibitorProfile({
  user,
  isOwnProfile,
  onBack,
  onMoreMenu,
  onRequestMeeting,
  onMessage,
  sharedStyles,
}: ExhibitorProfileProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const colors = useColors();
  const exStyles = getExStyles(colors);
  const backgroundColor = colors.background;
  const cardBg = colors.cardBackground;
  const textColor = colors.text;
  const textSecondary = colors.textSecondary;
  const borderColor = colors.cardBorder;
  const tagBg = colors.chipBackground;
  const insets = useSafeAreaInsets();

  const handleViewOnMap = () => {
    Alert.alert(t("exhibitor.profile.viewOnMap"), `Navigate to ${MOCK_BOOTH_LOCATION}`);
  };

  const handleJoinCompanyGroup = useCallback(() => {
    router.push({
      pathname: "/exhibitor-chat",
      params: {
        exhibitor_id: String(user.id),
        name: user.company || user.full_name,
      },
    });
  }, [user, router]);

  return (
    <View style={[sharedStyles.container, { backgroundColor }]}>
      {/* Header */}
      <View
        style={[sharedStyles.header, { backgroundColor: `${backgroundColor}CC`, paddingTop: insets.top + 10 }]}
      >
        <TouchableOpacity style={sharedStyles.headerButton} onPress={onBack}>
          <Ionicons name="chevron-back" size={22} color={textColor} />
        </TouchableOpacity>
        <ThemedText style={[sharedStyles.headerTitle, { color: textSecondary }]}>
          {t("exhibitor.profile.header")}
        </ThemedText>
        {!isOwnProfile ? (
          <TouchableOpacity style={sharedStyles.headerButton} onPress={onMoreMenu}>
            <Ionicons name="ellipsis-horizontal" size={24} color={textColor} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={sharedStyles.headerButton}>
            <Ionicons name="share-outline" size={22} color={textColor} />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        style={sharedStyles.scrollView}
        contentContainerStyle={sharedStyles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Cover Image -- TODO: replace with real API data */}
        {__DEV__ && (
          <View style={exStyles.coverContainer}>
            <Image
              source={{ uri: MOCK_COVER_IMAGE }}
              style={exStyles.coverImage}
            />
            <View style={exStyles.coverOverlay} />
          </View>
        )}

        {/* Avatar overlapping cover */}
        <View style={exStyles.avatarOverlapContainer}>
          <View style={exStyles.avatarWrapper}>
            {user.avatar_url ? (
              <Image
                source={{ uri: user.avatar_url }}
                style={exStyles.exhibitorAvatar}
              />
            ) : (
              <View
                style={[
                  exStyles.exhibitorAvatarPlaceholder,
                  { backgroundColor: tagBg },
                ]}
              >
                <ThemedText
                  style={[sharedStyles.avatarInitial, { color: textSecondary }]}
                >
                  {(user.full_name || "?").charAt(0)}
                </ThemedText>
              </View>
            )}
          </View>
        </View>

        {/* Company Info */}
        <View style={exStyles.companyInfoSection}>
          <View style={exStyles.companyNameRow}>
            <ThemedText style={[exStyles.companyName, { color: textColor }]}>
              {user.company || user.full_name}
            </ThemedText>
            <Ionicons name="checkmark-circle" size={22} color={colors.lightBlue} />
          </View>
          <ThemedText style={[exStyles.companySubtitle, { color: textSecondary }]}>
            {user.full_name}
            {/* TODO: replace MOCK_BOOTH_LOCATION with real API data */}
            {__DEV__ && MOCK_BOOTH_LOCATION && ` \u2022 ${MOCK_BOOTH_LOCATION}`}
          </ThemedText>
        </View>

        {/* Action Buttons */}
        <View style={exStyles.actionButtonsRow}>
          <TouchableOpacity
            style={exStyles.requestMeetingBtn}
            onPress={onRequestMeeting}
          >
            <Ionicons name="calendar-outline" size={18} color={COLOR_WHITE_ON_ACCENT} />
            <ThemedText style={exStyles.requestMeetingBtnText}>{t("exhibitor.profile.requestMeeting")}</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[exStyles.messageBtnOutline, { borderColor }]}
            onPress={onMessage}
          >
            <Ionicons name="chatbubble-outline" size={18} color={textColor} />
            <ThemedText
              style={[exStyles.messageBtnOutlineText, { color: textColor }]}
            >
              {t("exhibitor.profile.message")}
            </ThemedText>
          </TouchableOpacity>
        </View>

        {/* View on Map -- TODO: replace with real booth location data */}
        {__DEV__ && (
          <TouchableOpacity
            style={exStyles.viewOnMapLink}
            onPress={handleViewOnMap}
          >
            <Ionicons name="location-outline" size={18} color={colors.lightBlue} />
            <ThemedText style={exStyles.viewOnMapText}>{t("exhibitor.profile.viewOnMap")}</ThemedText>
          </TouchableOpacity>
        )}

        {/* Divider */}
        <View style={[sharedStyles.divider, { backgroundColor: borderColor }]} />

        {/* About Us */}
        {user.bio && (
          <View style={sharedStyles.section}>
            <View style={sharedStyles.sectionHeader}>
              <Ionicons
                name="information-circle-outline"
                size={20}
                color={colors.primary}
              />
              <ThemedText style={[sharedStyles.sectionTitle, { color: textColor }]}>
                {t("exhibitor.profile.aboutUs")}
              </ThemedText>
            </View>
            <ThemedText style={[sharedStyles.bioText, { color: textSecondary }]}>
              {user.bio}
            </ThemedText>
          </View>
        )}

        {/* Product Showcase -- TODO: replace MOCK_PRODUCTS with real API data */}
        {__DEV__ && (
          <View style={sharedStyles.section}>
            <View style={sharedStyles.sectionHeader}>
              <Ionicons name="cube-outline" size={20} color={colors.primary} />
              <ThemedText style={[sharedStyles.sectionTitle, { color: textColor }]}>
                {t("exhibitor.profile.productShowcase")}
              </ThemedText>
            </View>
            <View style={exStyles.productsContainer}>
              {MOCK_PRODUCTS.map((product) => (
                <View
                  key={product.id}
                  style={[
                    exStyles.productCard,
                    { backgroundColor: cardBg, borderColor },
                  ]}
                >
                  <Image
                    source={{ uri: product.image }}
                    style={exStyles.productImage}
                  />
                  <View style={exStyles.productInfo}>
                    <ThemedText
                      style={[exStyles.productTitle, { color: textColor }]}
                      numberOfLines={1}
                    >
                      {product.title}
                    </ThemedText>
                    <ThemedText
                      style={[
                        exStyles.productSubtitle,
                        { color: textSecondary },
                      ]}
                      numberOfLines={2}
                    >
                      {product.subtitle}
                    </ThemedText>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Team at Festival -- TODO: replace MOCK_TEAM with real API data */}
        {__DEV__ && (
          <View style={sharedStyles.section}>
            <View style={sharedStyles.sectionHeader}>
              <Ionicons name="people-outline" size={20} color={colors.primary} />
              <ThemedText style={[sharedStyles.sectionTitle, { color: textColor }]}>
                {t("exhibitor.profile.teamAtFestival")}
              </ThemedText>
            </View>
            <View style={exStyles.teamContainer}>
              {MOCK_TEAM.map((member) => (
                <View
                  key={member.id}
                  style={[
                    exStyles.teamCard,
                    { backgroundColor: cardBg, borderColor },
                  ]}
                >
                  <Image
                    source={{ uri: member.avatar }}
                    style={exStyles.teamAvatar}
                  />
                  <View style={exStyles.teamInfo}>
                    <ThemedText
                      style={[exStyles.teamName, { color: textColor }]}
                      numberOfLines={1}
                    >
                      {member.name}
                    </ThemedText>
                    <ThemedText
                      style={[exStyles.teamRole, { color: textSecondary }]}
                      numberOfLines={1}
                    >
                      {member.role}
                    </ThemedText>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Spacer for bottom bar */}
        <View style={{ height: insets.bottom + 104 }} />
      </ScrollView>

      {/* Bottom Bar - Join Company Group */}
      <View style={[sharedStyles.bottomBar, { paddingBottom: insets.bottom + 16 }]}>
        <TouchableOpacity
          style={exStyles.joinGroupButton}
          onPress={handleJoinCompanyGroup}
        >
          <Ionicons name="chatbubbles-outline" size={20} color={colors.background} />
          <ThemedText style={exStyles.joinGroupButtonText}>{t("exhibitor.profile.joinCompanyGroup")}</ThemedText>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ============================================
// EXHIBITOR-SPECIFIC STYLES
// ============================================
const getExStyles = (colors: any) => StyleSheet.create({
  coverContainer: {
    height: 180,
    width: "100%",
    position: "relative",
  },
  coverImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  coverOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.2)",
  },
  avatarOverlapContainer: {
    alignItems: "center",
    marginTop: -48,
    marginBottom: 12,
  },
  avatarWrapper: {
    borderRadius: 52,
    borderWidth: 4,
    borderColor: colors.surfacePrimary,
    overflow: "hidden",
  },
  exhibitorAvatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
  },
  exhibitorAvatarPlaceholder: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: "center",
    alignItems: "center",
  },
  companyInfoSection: {
    alignItems: "center",
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  companyNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  companyName: {
    fontSize: 24,
    fontWeight: "700",
  },
  companySubtitle: {
    fontSize: 14,
    marginTop: 6,
    textAlign: "center",
  },
  actionButtonsRow: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  requestMeetingBtn: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    backgroundColor: colors.followUp,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  requestMeetingBtnText: {
    color: COLOR_WHITE_ON_ACCENT,
    fontSize: 14,
    fontWeight: "700",
  },
  messageBtnOutline: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
  },
  messageBtnOutlineText: {
    fontSize: 14,
    fontWeight: "700",
  },
  viewOnMapLink: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginBottom: 24,
  },
  viewOnMapText: {
    color: colors.lightBlue,
    fontSize: 14,
    fontWeight: "600",
  },
  productsContainer: {
    gap: 12,
  },
  productCard: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
  },
  productImage: {
    width: "100%",
    height: 140,
    resizeMode: "cover",
  },
  productInfo: {
    padding: 14,
  },
  productTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 4,
  },
  productSubtitle: {
    fontSize: 13,
    lineHeight: 18,
  },
  teamContainer: {
    gap: 12,
  },
  teamCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    gap: 14,
  },
  teamAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  teamInfo: {
    flex: 1,
  },
  teamName: {
    fontSize: 15,
    fontWeight: "700",
  },
  teamRole: {
    fontSize: 13,
    marginTop: 2,
  },
  joinGroupButton: {
    flex: 1,
    height: 56,
    borderRadius: 16,
    backgroundColor: colors.followUp,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    shadowColor: colors.success,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  joinGroupButtonText: {
    color: colors.background,
    fontSize: 16,
    fontWeight: "700",
  },
});
