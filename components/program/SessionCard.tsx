import type { SessionOut } from "@/api/schemas";
import { SessionStatusBadge } from "@/components/SessionStatusBadge";
import { SESSION_TYPE_COLORS, SHADOW_BLACK } from "@/constants/data-colors";
import { useColors } from "@/hooks/use-colors";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  Image,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { useTranslation } from "react-i18next";
import { ThemedText } from "@/components/themed-text";

function getTypeColors(type: string, brandColor: string, brandLight: string) {
  const key = type.toLowerCase();
  if (key === "keynote") return { bg: brandLight, text: brandColor };
  if (key === "networking") return { bg: brandLight, text: brandColor };
  return SESSION_TYPE_COLORS[key] || SESSION_TYPE_COLORS.talk;
}

interface SessionCardProps {
  session: SessionOut;
  isFavorite: boolean;
  onPress?: () => void;
  onFavoritePress?: () => void;
}

export function SessionCard({
  session,
  isFavorite,
  onPress,
  onFavoritePress,
}: SessionCardProps) {
  const { t } = useTranslation();
  const colors = useColors();
  const cardBg = colors.inputBackground;
  const textPrimary = colors.text;
  const textSecondary = colors.textSecondary;
  const borderColor = colors.cardBorder;
  const favoriteBg = colors.chipBackground;
  const avatarPlaceholderBg = colors.surfaceSecondary;
  const avatarPlaceholderText = colors.textSecondary;
  const moreAvatarBg = colors.chipBackground;
  const moreAvatarText = colors.textSecondary;

  const typeColors = getTypeColors(session.type, colors.brand, colors.brandLight);

  // Calculate duration in minutes
  const startTime = new Date(session.start_time);
  const endTime = new Date(session.end_time);
  const durationMinutes = Math.round(
    (endTime.getTime() - startTime.getTime()) / 60000,
  );

  // Check if this is a special session (break/networking)
  const isSpecialSession = ["break", "networking", "lunch"].includes(
    session.type.toLowerCase(),
  );

  const isCancelled = session.is_cancelled === true;

  if (isSpecialSession) {
    return (
      <View
        style={[
          styles.specialCard,
          { borderColor: typeColors.text },
          isCancelled && { opacity: 0.6 },
        ]}
      >
        <View style={styles.specialContent}>
          <Ionicons
            name={
              session.type.toLowerCase() === "lunch" ||
              session.type.toLowerCase() === "networking"
                ? "restaurant"
                : "cafe"
            }
            size={28}
            color={typeColors.text}
            style={styles.specialIcon}
          />
          {isCancelled ? (
            <View style={styles.cancelledBadgeWrap}>
              <SessionStatusBadge session={session} size="sm" />
            </View>
          ) : null}
          <ThemedText
            style={[
              styles.specialTitle,
              { color: textPrimary },
              isCancelled && {
                textDecorationLine: "line-through" as const,
                color: textSecondary,
              },
            ]}
          >
            {session.title}
          </ThemedText>
          <ThemedText style={[styles.specialSubtitle, { color: textSecondary }]}>
            {session.venue?.name || t("program.sessionCard.allVenues")} • {durationMinutes}m
          </ThemedText>
        </View>
      </View>
    );
  }

  const hasSingleSpeaker = session.speakers.length === 1;
  const hasMultipleSpeakers = session.speakers.length > 1;

  return (
    <TouchableOpacity
      style={[
        styles.card,
        { backgroundColor: cardBg, borderColor },
        isCancelled && { opacity: 0.6 },
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.cardContent}>
        <View style={styles.mainContent}>
          {/* Type badge and duration */}
          <View style={styles.metaRow}>
            <View
              style={[styles.typeBadge, { backgroundColor: typeColors.bg }]}
            >
              <ThemedText style={[styles.typeBadgeText, { color: typeColors.text }]}>
                {session.type.toUpperCase()}
              </ThemedText>
            </View>
            {isCancelled ? (
              <SessionStatusBadge session={session} size="sm" />
            ) : null}
            {durationMinutes > 0 && (
              <ThemedText style={[styles.duration, { color: textSecondary }]}>
                {t("program.sessionCard.duration", { count: durationMinutes })}
              </ThemedText>
            )}
          </View>

          {/* Title */}
          <ThemedText
            style={[
              styles.title,
              { color: textPrimary },
              isCancelled && {
                textDecorationLine: "line-through" as const,
                color: textSecondary,
              },
            ]}
            numberOfLines={2}
          >
            {session.title}
          </ThemedText>

          {/* Speakers */}
          <View style={styles.speakersRow}>
            {hasSingleSpeaker && (
              <>
                <View style={styles.avatarContainer}>
                  {session.speakers[0].avatar_url ? (
                    <Image
                      source={{ uri: session.speakers[0].avatar_url }}
                      style={[styles.avatar, styles.stackedAvatar]}
                    />
                  ) : (
                    <View
                      style={[
                        styles.avatar,
                        styles.avatarPlaceholder,
                        { backgroundColor: avatarPlaceholderBg },
                      ]}
                    >
                      <ThemedText
                        style={[
                          styles.avatarInitial,
                          { color: avatarPlaceholderText },
                        ]}
                      >
                        {(session.speakers[0].full_name || "?").charAt(0)}
                      </ThemedText>
                    </View>
                  )}
                </View>
                <View style={styles.speakerInfo}>
                  <ThemedText style={[styles.speakerName, { color: textPrimary }]}>
                    {session.speakers[0].full_name}
                  </ThemedText>
                  {session.venue && (
                    <View style={styles.locationRow}>
                      <Ionicons
                        name="location"
                        size={12}
                        color={textSecondary}
                      />
                      <ThemedText
                        style={[styles.locationText, { color: textSecondary }]}
                      >
                        {session.venue?.name}
                      </ThemedText>
                    </View>
                  )}
                </View>
              </>
            )}

            {hasMultipleSpeakers && (
              <>
                <View style={styles.avatarStack}>
                  {session.speakers.slice(0, 2).map((speaker, index) => (
                    <View
                      key={speaker.user_id}
                      style={[
                        styles.stackedAvatarWrapper,
                        { borderColor: cardBg, marginLeft: index > 0 ? -8 : 0, zIndex: 10 - index },
                      ]}
                    >
                      {speaker.avatar_url ? (
                        <Image
                          source={{ uri: speaker.avatar_url }}
                          style={[styles.avatar, styles.stackedAvatar]}
                        />
                      ) : (
                        <View
                          style={[
                            styles.avatar,
                            styles.stackedAvatar,
                            styles.avatarPlaceholder,
                            { backgroundColor: avatarPlaceholderBg },
                          ]}
                        >
                          <ThemedText
                            style={[
                              styles.avatarInitial,
                              { color: avatarPlaceholderText },
                            ]}
                          >
                            {(speaker.full_name || "?").charAt(0)}
                          </ThemedText>
                        </View>
                      )}
                    </View>
                  ))}
                  {session.speakers.length > 2 && (
                    <View
                      style={[
                        styles.stackedAvatarWrapper,
                        { borderColor: cardBg, marginLeft: -8, zIndex: 1 },
                      ]}
                    >
                      <View
                        style={[
                          styles.avatar,
                          styles.stackedAvatar,
                          styles.moreAvatar,
                          { backgroundColor: moreAvatarBg },
                        ]}
                      >
                        <ThemedText style={[styles.moreAvatarText, { color: moreAvatarText }]}>
                          +{session.speakers.length - 2}
                        </ThemedText>
                      </View>
                    </View>
                  )}
                </View>
                <View style={styles.speakerInfo}>
                  <ThemedText style={[styles.speakerName, { color: textPrimary }]}>
                    {t("program.sessionCard.multipleSpeakers")}
                  </ThemedText>
                  {session.venue && (
                    <View style={styles.locationRow}>
                      <Ionicons
                        name="location"
                        size={12}
                        color={textSecondary}
                      />
                      <ThemedText
                        style={[styles.locationText, { color: textSecondary }]}
                      >
                        {session.venue.name}
                      </ThemedText>
                    </View>
                  )}
                </View>
              </>
            )}

            {session.speakers.length === 0 && session.venue && (
              <View style={styles.locationRow}>
                <Ionicons name="location" size={12} color={textSecondary} />
                <ThemedText style={[styles.locationText, { color: textSecondary }]}>
                  {session.venue.name}
                </ThemedText>
              </View>
            )}
          </View>
        </View>

        {/* Favorite button */}
        <TouchableOpacity
          style={[
            styles.favoriteButton,
            {
              backgroundColor: isFavorite
                ? colors.brandLight
                : favoriteBg,
            },
          ]}
          onPress={onFavoritePress}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons
            name={isFavorite ? "heart" : "heart-outline"}
            size={20}
            color={isFavorite ? colors.brand : textSecondary}
          />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    shadowColor: SHADOW_BLACK,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  cardContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  mainContent: {
    flex: 1,
    marginRight: 12,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  typeBadgeText: {
    fontSize: 10,
    fontWeight: "700",
  },
  duration: {
    fontSize: 12,
    fontWeight: "500",
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    lineHeight: 22,
    marginBottom: 12,
  },
  speakersRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  avatarContainer: {},
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  avatarPlaceholder: {
    justifyContent: "center",
    alignItems: "center",
  },
  avatarInitial: {
    fontSize: 14,
    fontWeight: "600",
  },
  avatarStack: {
    flexDirection: "row",
    alignItems: "center",
  },
  stackedAvatarWrapper: {
    borderWidth: 2,
    borderRadius: 18,
  },
  stackedAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  moreAvatar: {
    justifyContent: "center",
    alignItems: "center",
  },
  moreAvatarText: {
    fontSize: 10,
    fontWeight: "700",
  },
  speakerInfo: {
    flex: 1,
  },
  speakerName: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 2,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  locationText: {
    fontSize: 12,
  },
  favoriteButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  // Special session styles (breaks, networking)
  specialCard: {
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderStyle: "dashed",
    backgroundColor: "rgba(25, 79, 240, 0.03)", // subtle bg, not brand-critical
  },
  specialContent: {
    alignItems: "center",
  },
  specialIcon: {
    marginBottom: 8,
  },
  specialTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 4,
  },
  specialSubtitle: {
    fontSize: 12,
  },
  cancelledBadgeWrap: {
    marginBottom: 4,
  },
});
