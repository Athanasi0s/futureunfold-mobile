import { UserRole } from "@/api/schemas";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { TenantBackgroundArt } from "@/components/tenant-background-art";
import { UIButton } from "@/components/ui/ui-button";
import { UIVerticalSpacer } from "@/components/ui/UIVerticalSpacer";
import { useAuth } from "@/features/authentication/hooks/useAuth";
import { useSubmitOnboarding } from "@/features/onboarding/hooks/useSubmitOnboarding";
import { useGetOnboardingQuestions } from "@/features/onboarding/hooks/useGetOnboardingQuestions";
import { useConfigStore } from "@/features/config/stores/config-store";
import { useOnboardingStore } from "@/features/onboarding/stores/onboarding";
import { getTenantBackgroundSource } from "@/constants/tenant-assets";
import { useColors } from "@/hooks/use-colors";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams } from "expo-router";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  Alert,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const HERO_IMAGE_URL =
  "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=400&h=300&fit=crop";

type OnboardingData = {
  interest_ids: string;
  goal_ids: string;
  experience_level: string;
  discussion_topics: string;
  selected_role: string;
};

export default function CompletionScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<OnboardingData>();
  const { user } = useAuth();
  const { mutate: submitOnboarding, isPending: isSubmitting } =
    useSubmitOnboarding();
  const setShouldOpenOnboarding = useOnboardingStore(
    (state) => state.setShouldOpenOnboarding,
  );

  const { t } = useTranslation();
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { width } = useWindowDimensions();
  const hasBackgroundArt = Boolean(getTenantBackgroundSource());
  const artworkHeight = width * (1864 / 2100);

  const selectedRole = (params.selected_role as UserRole) ?? user?.role;

  const interestIds: number[] = params.interest_ids
    ? JSON.parse(params.interest_ids)
    : [];

  const handleComplete = () => {
    const goalIds = params.goal_ids ? JSON.parse(params.goal_ids) : [];
    const discussionTopics = params.discussion_topics
      ? JSON.parse(params.discussion_topics)
      : [];

    submitOnboarding(
      {
        interest_ids: interestIds as number[],
        goal_ids: goalIds,
        experience_level: params.experience_level || null,
        discussion_topics: discussionTopics,
        skip: false,
      },
      {
        onSuccess: () => {
          setShouldOpenOnboarding(false);
        },
        onError: () => {
          Alert.alert(
            t("schedule.errorTitle"),
            t("onboarding.completion.errorMessage"),
          );
        },
      },
    );
  };

  // Speaker has a different layout (buttons fixed at bottom)
  if (selectedRole === UserRole.speaker) {
    return (
      <ThemedView style={styles.container}>
        {hasBackgroundArt && (
          <TenantBackgroundArt
            variant="secondary"
            style={[styles.backgroundArt, { width, height: artworkHeight }]}
          />
        )}
        <LinearGradient
          colors={[
            colors.gradientStart,
            colors.gradientMiddle,
            colors.gradientEnd,
          ]}
          style={styles.gradient}
        >
          <SpeakerCompletion
            onComplete={handleComplete}
            isLoading={isSubmitting}
          />
        </LinearGradient>
      </ThemedView>
    );
  }

  const renderContent = () => {
    switch (selectedRole) {
      case UserRole.exhibitor:
        return (
          <ExhibitorCompletion
            onComplete={handleComplete}
            isLoading={isSubmitting}
          />
        );
      default:
        return (
          <AttendeeCompletion
            onComplete={handleComplete}
            isLoading={isSubmitting}
            interestIds={interestIds}
          />
        );
    }
  };

  return (
    <ThemedView style={styles.container}>
      {hasBackgroundArt && (
        <TenantBackgroundArt
          style={[styles.backgroundArt, { width, height: artworkHeight }]}
        />
      )}
      <LinearGradient
        colors={[
          colors.gradientStart,
          colors.gradientMiddle,
          colors.gradientEnd,
        ]}
        style={styles.gradient}
      >
        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 10 }]}
          showsVerticalScrollIndicator={false}
        >
          {renderContent()}
        </ScrollView>
      </LinearGradient>
    </ThemedView>
  );
}

type CompletionProps = {
  onComplete: () => void;
  isLoading: boolean;
};

function AttendeeCompletion({ onComplete, isLoading, interestIds }: CompletionProps & { interestIds: number[] }) {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { t } = useTranslation();
  const appName = useConfigStore((s) => s.appName);

  return (
    <View style={styles.content}>
      <HeroImage height={180} />
      <UIVerticalSpacer height={24} />

      <ThemedText style={styles.title}>{t("onboarding.completion.attendeeTitle")}</ThemedText>
      <ThemedText style={styles.subtitle}>
        {t("onboarding.completion.attendeeSubtitle", { appName })}
      </ThemedText>

      <UIVerticalSpacer height={24} />

      <ProfileSummaryCard />

      <UIVerticalSpacer height={16} />

      <InterestsCard interestIds={interestIds} />

      <UIVerticalSpacer height={32} />

      <UIButton
        title={t("onboarding.completion.attendeeButton", { appName })}
        icon="arrow-forward"
        onPress={onComplete}
        isLoading={isLoading}
        style={styles.ctaButton}
      />

      <UIVerticalSpacer height={12} />

      <ThemedText style={styles.footerNote}>
        {t("onboarding.completion.attendeeFooter")}
      </ThemedText>
    </View>
  );
}

function ExhibitorCompletion({ onComplete, isLoading }: CompletionProps) {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { t } = useTranslation();

  const checklistItems = [
    { label: t("onboarding.completion.checklistProfileVerified"), checked: true },
    { label: t("onboarding.completion.checklistBoothGuidelines"), checked: true },
    { label: t("onboarding.completion.checklistLeadScanner"), checked: true },
  ];

  return (
    <View style={styles.content}>
      <SuccessIcon />
      <UIVerticalSpacer height={16} />

      <ThemedText style={styles.exhibitorTitle}>{t("onboarding.completion.exhibitorTitle")}</ThemedText>
      <ThemedText style={styles.exhibitorSubtitle}>
        {t("onboarding.completion.exhibitorSubtitle")}
      </ThemedText>

      <UIVerticalSpacer height={24} />

      <ExhibitorHeroImage boothNumber="A-12" hallName="Main Hall" />

      <UIVerticalSpacer height={24} />

      <ExhibitorChecklist items={checklistItems} />

      <UIVerticalSpacer height={32} />

      <UIButton
        title={t("onboarding.completion.exhibitorButton")}
        icon="grid-view"
        onPress={onComplete}
        isLoading={isLoading}
        style={styles.ctaButton}
      />

      <UIVerticalSpacer height={12} />

      <TouchableOpacity onPress={onComplete} disabled={isLoading}>
        <ThemedText style={styles.secondaryLink}>{t("onboarding.completion.exhibitorSecondaryLink")}</ThemedText>
      </TouchableOpacity>
    </View>
  );
}

function SpeakerCompletion({ onComplete, isLoading }: CompletionProps) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { t } = useTranslation();
  const appName = useConfigStore((s) => s.appName);

  const sessionData = {
    topic: "The Future of AI",
    time: "May 27, 10:00 AM",
  };

  return (
    <View style={styles.speakerContainer}>
      <ScrollView
        style={styles.speakerScrollView}
        contentContainerStyle={[styles.speakerScrollContent, { paddingTop: insets.top + 10 }]}
        showsVerticalScrollIndicator={false}
      >
        <HeroImage />
        <UIVerticalSpacer height={32} />

        <ThemedText style={styles.speakerTitle}>{t("onboarding.completion.speakerTitle")}</ThemedText>
        <ThemedText style={styles.speakerSubtitle}>
          {t("onboarding.completion.speakerSubtitle", { appName })}
        </ThemedText>

        <UIVerticalSpacer height={24} />

        <SpeakerSessionCard topic={sessionData.topic} time={sessionData.time} />
      </ScrollView>

      <View style={styles.speakerButtonsContainer}>
        <UIButton
          title={t("onboarding.completion.speakerButton")}
          onPress={onComplete}
          isLoading={isLoading}
          style={styles.ctaButton}
        />

        <UIVerticalSpacer height={12} />

        <TouchableOpacity onPress={onComplete} disabled={isLoading}>
          <ThemedText style={styles.secondaryLink}>
            {t("onboarding.completion.speakerSecondaryLink")}
          </ThemedText>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function HeroImage({ height }: { height?: number }) {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View
      style={[styles.heroImageContainer, { height: height ? height : 300 }]}
    >
      <Image
        source={{ uri: HERO_IMAGE_URL }}
        style={styles.heroImage}
        contentFit="cover"
      />
      <LinearGradient
        colors={["transparent", colors.gradientEnd]}
        style={styles.heroImageOverlay}
      />
      <View style={styles.aiBadgeOverlay}>
        <View style={styles.aiBadgeInner}>
          <ThemedText style={styles.aiBadgeText}>AI</ThemedText>
        </View>
      </View>
    </View>
  );
}

function ProfileSummaryCard() {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { t } = useTranslation();

  return (
    <View style={styles.card}>
      <ThemedText style={styles.cardLabel}>{t("onboarding.completion.profileSummaryLabel")}</ThemedText>
      <UIVerticalSpacer height={12} />
      <View style={styles.profileRow}>
        <View style={styles.profileItem}>
          <ThemedText style={styles.profileItemLabel}>{t("onboarding.completion.profileRoleLabel")}</ThemedText>
          <ThemedText style={styles.profileItemValue}>{t("onboarding.completion.profileRoleValue")}</ThemedText>
        </View>
        <View style={styles.profileItem}>
          <ThemedText style={styles.profileItemLabel}>{t("onboarding.completion.profileEfficiencyLabel")}</ThemedText>
          <ThemedText style={styles.profileItemValue}>{t("onboarding.completion.profileEfficiencyValue")}</ThemedText>
        </View>
      </View>
      <UIVerticalSpacer height={12} />
      <View style={styles.proposalsSection}>
        <ThemedText style={styles.profileItemLabel}>{t("onboarding.completion.profileProposalsLabel")}</ThemedText>
        <ThemedText style={styles.profileItemValue}>{t("onboarding.completion.profileProposalsValue")}</ThemedText>
      </View>
    </View>
  );
}

function InterestsCard({ interestIds }: { interestIds: number[] }) {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { t } = useTranslation();
  const { data: questions } = useGetOnboardingQuestions();

  const interests = (questions?.interests ?? [])
    .filter((i) => interestIds.includes(i.id))
    .map((i) => i.name);

  if (interests.length === 0) return null;

  return (
    <View style={styles.card}>
      <ThemedText style={styles.cardLabel}>{t("onboarding.completion.interestsLabel")}</ThemedText>
      <UIVerticalSpacer height={12} />
      <View style={styles.interestTags}>
        {interests.map((interest) => (
          <View key={interest} style={styles.interestTag}>
            <ThemedText style={styles.interestTagText}>{interest}</ThemedText>
          </View>
        ))}
      </View>
    </View>
  );
}

function SuccessIcon() {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.successIcon}>
      <MaterialIcons name="check" size={24} color={colors.white} />
    </View>
  );
}

function ExhibitorHeroImage({
  boothNumber,
  hallName,
}: {
  boothNumber: string;
  hallName: string;
}) {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { t } = useTranslation();

  return (
    <View style={styles.exhibitorHeroContainer}>
      <Image
        source={{ uri: HERO_IMAGE_URL }}
        style={styles.heroImage}
        contentFit="cover"
      />
      <LinearGradient
        colors={["transparent", "rgba(0,0,0,0.8)"]}
        style={styles.exhibitorHeroOverlay}
      />
      <View style={styles.aiBadgeOverlay}>
        <View style={styles.aiBadgeInner}>
          <ThemedText style={styles.aiBadgeText}>AI</ThemedText>
        </View>
      </View>
      <View style={styles.boothInfoOverlay}>
        <View style={styles.boothInfoBadge}>
          <ThemedText style={styles.boothInfoLabel}>{t("onboarding.completion.assignedSpaceLabel")}</ThemedText>
          <ThemedText style={styles.boothInfoValue}>
            Booth {boothNumber} • {hallName}
          </ThemedText>
        </View>
      </View>
    </View>
  );
}

function ExhibitorChecklist({
  items,
}: {
  items: { label: string; checked: boolean }[];
}) {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.exhibitorChecklist}>
      {items.map((item) => (
        <View key={item.label} style={styles.exhibitorChecklistItem}>
          <View style={styles.exhibitorCheckCircle}>
            {item.checked && (
              <MaterialIcons
                name="check"
                size={16}
                color={colors.success}
              />
            )}
          </View>
          <ThemedText style={styles.exhibitorChecklistLabel}>
            {item.label}
          </ThemedText>
        </View>
      ))}
    </View>
  );
}

function SpeakerSessionCard({ topic, time }: { topic: string; time: string }) {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { t } = useTranslation();

  return (
    <View style={styles.speakerSessionCard}>
      <View style={styles.speakerSessionRow}>
        <View style={styles.speakerSessionIcon}>
          <MaterialIcons
            name="event-seat"
            size={20}
            color={colors.white}
          />
        </View>
        <View style={styles.speakerSessionTextContainer}>
          <ThemedText style={styles.speakerSessionLabel}>{t("onboarding.completion.topicLabel")}</ThemedText>
          <ThemedText style={styles.speakerSessionValue}>{topic}</ThemedText>
        </View>
      </View>

      <View style={styles.speakerSessionRow}>
        <View
          style={[styles.speakerSessionIcon, styles.speakerSessionIconTime]}
        >
          <MaterialIcons name="schedule" size={20} color={colors.white} />
        </View>
        <View style={styles.speakerSessionTextContainer}>
          <ThemedText style={styles.speakerSessionLabel}>{t("onboarding.completion.timeLabel")}</ThemedText>
          <ThemedText style={styles.speakerSessionValue}>{time}</ThemedText>
        </View>
      </View>
    </View>
  );
}

const createStyles = (colors: ReturnType<typeof useColors>) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    backgroundArt: {
      position: "absolute",
      top: 0,
      alignSelf: "center",
      opacity: 0.16,
    },
    gradient: {
      flex: 1,
    },
    scrollContent: {
      flexGrow: 1,
      paddingHorizontal: 24,
      paddingTop: 60,
      paddingBottom: 40,
    },
    content: {
      alignItems: "center",
    },
    title: {
      fontSize: 28,
      paddingTop: 20,
      fontWeight: "bold",
      color: colors.text,
      textAlign: "center",
    },
    subtitle: {
      fontSize: 16,
      color: colors.textSecondary,
      textAlign: "center",
      marginTop: 8,
      lineHeight: 24,
    },
    ctaButton: {
      width: "100%",
    },
    footerNote: {
      fontSize: 13,
      color: colors.textMuted,
      textAlign: "center",
    },
    secondaryLink: {
      fontSize: 16,
      color: colors.primary,
      fontWeight: "500",
    },
    // Hero Image
    heroImageContainer: {
      width: "100%",
      borderRadius: 20,
      overflow: "hidden",
      position: "relative",
    },
    heroImage: {
      width: "100%",
      height: "100%",
    },
    heroImageOverlay: {
      position: "absolute",
      bottom: 0,
      left: 0,
      right: 0,
      height: 80,
    },
    aiBadgeOverlay: {
      position: "absolute",
      top: "50%",
      left: "50%",
      transform: [{ translateX: -35 }, { translateY: -35 }],
    },
    aiBadgeInner: {
      width: 70,
      height: 70,
      borderRadius: 16,
      backgroundColor: "rgba(79, 70, 229, 0.8)",
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 2,
      borderColor: colors.primary,
    },
    aiBadgeText: {
      fontSize: 24,
      fontWeight: "bold",
      color: colors.white,
    },
    // Cards
    card: {
      width: "100%",
      backgroundColor: colors.cardBackground,
      borderRadius: 16,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.cardBorder,
    },
    cardLabel: {
      fontSize: 12,
      fontWeight: "600",
      color: colors.textSecondary,
      letterSpacing: 1,
    },
    // Profile Summary
    profileRow: {
      flexDirection: "row",
      gap: 24,
    },
    profileItem: {
      flex: 1,
    },
    profileItemLabel: {
      fontSize: 13,
      color: colors.textSecondary,
    },
    profileItemValue: {
      fontSize: 16,
      fontWeight: "600",
      color: colors.text,
      marginTop: 4,
    },
    proposalsSection: {
      borderTopWidth: 1,
      borderTopColor: colors.cardBorder,
      paddingTop: 12,
    },
    // Interests
    interestTags: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
    },
    interestTag: {
      backgroundColor: colors.chipBackground,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 20,
    },
    interestTagText: {
      fontSize: 14,
      color: colors.text,
    },
    // Booth
    boothCard: {
      width: "100%",
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      backgroundColor: colors.cardBackground,
      borderRadius: 12,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.cardBorder,
    },
    boothText: {
      fontSize: 16,
      fontWeight: "600",
      color: colors.text,
    },
    // Checklist
    checklistItem: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      paddingVertical: 12,
    },
    checklistItemBorder: {
      borderTopWidth: 1,
      borderTopColor: colors.cardBorder,
    },
    checkCircle: {
      width: 24,
      height: 24,
      borderRadius: 12,
      borderWidth: 2,
      borderColor: colors.border,
      alignItems: "center",
      justifyContent: "center",
    },
    checkCircleChecked: {
      backgroundColor: colors.success,
      borderColor: colors.success,
    },
    checklistLabel: {
      fontSize: 15,
      color: colors.text,
    },
    // Speaker Completion
    speakerContainer: {
      flex: 1,
    },
    speakerScrollView: {
      flex: 1,
    },
    speakerScrollContent: {
      paddingHorizontal: 24,
      paddingTop: 60,
      alignItems: "center",
    },
    speakerButtonsContainer: {
      paddingHorizontal: 24,
      paddingTop: 24,
      paddingBottom: 40,
      alignItems: "center",
    },
    speakerTitle: {
      fontSize: 32,
      fontWeight: "bold",
      color: colors.text,
      paddingTop: 20,
      textAlign: "center",
      fontFamily: "serif",
    },
    speakerSubtitle: {
      fontSize: 16,
      color: colors.textSecondary,
      textAlign: "center",
      marginTop: 8,
      fontStyle: "italic",
    },
    // Speaker Session Card
    speakerSessionCard: {
      width: "100%",
      backgroundColor: colors.cardBackground,
      borderRadius: 16,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      gap: 16,
    },
    speakerSessionRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    speakerSessionIcon: {
      width: 44,
      height: 44,
      borderRadius: 12,
      backgroundColor: colors.border,
      alignItems: "center",
      justifyContent: "center",
    },
    speakerSessionIconTime: {
      backgroundColor: colors.primary,
    },
    speakerSessionTextContainer: {
      flex: 1,
    },
    speakerSessionLabel: {
      fontSize: 12,
      fontWeight: "600",
      color: colors.primary,
      letterSpacing: 0.5,
      marginBottom: 2,
    },
    speakerSessionValue: {
      fontSize: 16,
      fontWeight: "600",
      color: colors.text,
    },
    // Exhibitor Completion
    successIcon: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: colors.success,
      alignItems: "center",
      justifyContent: "center",
    },
    exhibitorTitle: {
      fontSize: 28,
      paddingTop: 20,
      fontWeight: "bold",
      color: colors.text,
      textAlign: "center",
      fontFamily: "serif",
    },
    exhibitorSubtitle: {
      fontSize: 15,
      color: colors.textSecondary,
      textAlign: "center",
      marginTop: 8,
      lineHeight: 22,
    },
    exhibitorHeroContainer: {
      width: "100%",
      height: 200,
      borderRadius: 16,
      overflow: "hidden",
      position: "relative",
    },
    exhibitorHeroOverlay: {
      position: "absolute",
      bottom: 0,
      left: 0,
      right: 0,
      height: 100,
    },
    boothInfoOverlay: {
      position: "absolute",
      bottom: 16,
      left: 16,
    },
    boothInfoBadge: {
      backgroundColor: colors.cardBackground,
      borderRadius: 12,
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderWidth: 1,
      borderColor: colors.cardBorder,
    },
    boothInfoLabel: {
      fontSize: 10,
      fontWeight: "600",
      color: colors.textSecondary,
      letterSpacing: 0.5,
    },
    boothInfoValue: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.text,
      marginTop: 2,
    },
    exhibitorChecklist: {
      width: "100%",
      gap: 12,
    },
    exhibitorChecklistItem: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      backgroundColor: colors.cardBackground,
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 14,
      borderWidth: 1,
      borderColor: colors.cardBorder,
    },
    exhibitorCheckCircle: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: "rgba(34, 197, 94, 0.15)",
      alignItems: "center",
      justifyContent: "center",
    },
    exhibitorChecklistLabel: {
      fontSize: 15,
      color: colors.text,
    },
  });
