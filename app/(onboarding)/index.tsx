import { UserRole } from "@/api/schemas";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { TenantBackgroundArt } from "@/components/tenant-background-art";
import { ProgressBar } from "@/components/ui/progress-bar";
import { UIButton } from "@/components/ui/ui-button";
import { UIVerticalSpacer } from "@/components/ui/UIVerticalSpacer";
import { useAuth } from "@/features/authentication/hooks/useAuth";
import { usePatchMe } from "@/features/authentication/hooks/usePatchMe";
import {
  DiscussionTopic,
  ExperienceLevel,
  Goal,
  Interest,
} from "@/features/onboarding/get-onboarding-questions";
import { useCheckExhibitorEmail } from "@/features/onboarding/hooks/useCheckExhibitorEmail";
import { useGetOnboardingQuestions } from "@/features/onboarding/hooks/useGetOnboardingQuestions";
import { useSubmitOnboarding } from "@/features/onboarding/hooks/useSubmitOnboarding";
import { useOnboardingStore } from "@/features/onboarding/stores/onboarding";
import { useGoogleCalendarAuth } from "@/features/scheduling/hooks/useGoogleCalendarAuth";
import { useGoogleCalendarStatus } from "@/features/scheduling/hooks/useGoogleCalendar";
import { COLOR_WHITE_ON_ACCENT, GOOGLE_BRAND_BLUE } from "@/constants/theme";
import { getTenantBackgroundSource } from "@/constants/tenant-assets";
import { useColors } from "@/hooks/use-colors";
import DateTimePicker from "@react-native-community/datetimepicker";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { router } from "expo-router";
import { useCallback, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Alert,
  LayoutChangeEvent,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";

type RoleOption = {
  role: UserRole;
  title: string;
  description: string;
  icon: keyof typeof MaterialIcons.glyphMap;
};

const getRoleOptions = (t: (key: string) => string): RoleOption[] => [
  {
    role: UserRole.attendee,
    title: t("onboarding.roleAttendeeTitle"),
    description: t("onboarding.roleAttendeeDescription"),
    icon: "person",
  },
  {
    role: UserRole.speaker,
    title: t("onboarding.roleSpeakerTitle"),
    description: t("onboarding.roleSpeakerDescription"),
    icon: "mic",
  },
  {
    role: UserRole.exhibitor,
    title: t("onboarding.roleExhibitorTitle"),
    description: t("onboarding.roleExhibitorDescription"),
    icon: "storefront",
  },
];

const TOTAL_STEPS = 6;

export default function Onboarding() {
  const { user } = useAuth();
  const { data: questions } = useGetOnboardingQuestions();
  useCheckExhibitorEmail(user?.email);
  const { mutate: submitOnboarding, isPending: isSubmitting } =
    useSubmitOnboarding();
  const { mutate: patchMe, isPending: isPatchingRole } = usePatchMe();

  const { t } = useTranslation();
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const filteredRoleOptions = useMemo(() => {
    const roleOptions = getRoleOptions(t);
    // if (exhibitorCheck?.allowed === false) {
    //   return roleOptions.filter((option) => option.role !== UserRole.exhibitor);
    // }
    return roleOptions;
  }, [t]);

  const [currentStep, setCurrentStep] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [selectedInterests, setSelectedInterests] = useState<Set<number>>(
    new Set(),
  );
  const [selectedGoals, setSelectedGoals] = useState<Set<number>>(new Set());
  const [selectedExperienceLevel, setSelectedExperienceLevel] = useState<
    string | null
  >(null);
  const [selectedDiscussionTopics, setSelectedDiscussionTopics] = useState<
    Set<string>
  >(new Set());
  const [dateOfBirth, setDateOfBirth] = useState<string | null>(null);
  const [gender, setGender] = useState<"male" | "female" | "prefer_not_to_say" | null>(null);
  const [showDobPicker, setShowDobPicker] = useState(false);
  const setShouldOpenOnboarding = useOnboardingStore(
    (state) => state.setShouldOpenOnboarding,
  );

  const { connect: connectGcal, isConnecting: gcalConnecting, error: gcalError } = useGoogleCalendarAuth();
  const { data: gcalStatus } = useGoogleCalendarStatus();

  const sectionPositions = useRef<{ [key: string]: number }>({});
  const { width } = useWindowDimensions();
  const hasBackgroundArt = Boolean(getTenantBackgroundSource());
  const artworkHeight = width * (1864 / 2100);

  const handleFinish = () => {
    const onboardingParams = {
      interest_ids: JSON.stringify(Array.from(selectedInterests)),
      goal_ids: JSON.stringify(Array.from(selectedGoals)),
      experience_level: selectedExperienceLevel || "",
      discussion_topics: JSON.stringify(Array.from(selectedDiscussionTopics)),
      selected_role: selectedRole || "",
    };

    const navigateNext = () => {
      if (selectedRole === UserRole.exhibitor) {
        router.push({
          pathname: "/(onboarding)/create-session",
          params: onboardingParams,
        });
      } else {
        router.push({
          pathname: "/(onboarding)/completion",
          params: onboardingParams,
        });
      }
    };

    // Save demographics if provided
    const saveDemographicsAndProceed = () => {
      if (dateOfBirth || gender) {
        patchMe(
          { date_of_birth: dateOfBirth, gender: gender },
          {
            onSuccess: () => {
              if (selectedRole) {
                patchMe({ role: selectedRole }, { onSuccess: navigateNext });
              } else {
                navigateNext();
              }
            },
            onError: () => {
              // If demographics save fails, still proceed
              if (selectedRole) {
                patchMe({ role: selectedRole }, { onSuccess: navigateNext });
              } else {
                navigateNext();
              }
            },
          },
        );
      } else if (selectedRole) {
        patchMe(
          { role: selectedRole },
          {
            onSuccess: navigateNext,
            onError: (error: any) => {
              const message =
                error?.response?.data?.detail ||
                error?.message ||
                "Failed to update role";
              Alert.alert(t("schedule.errorTitle"), message);
            },
          },
        );
      } else {
        navigateNext();
      }
    };

    saveDemographicsAndProceed();
  };

  const handleSkip = () => {
    console.log("Onboarding skipped by user");
    submitOnboarding(
      {
        interest_ids: [],
        goal_ids: [],
        experience_level: null,
        discussion_topics: [],
        skip: true,
      },

      {
        onSuccess: () => {
          console.log("Onboarding completed successfully");
          setShouldOpenOnboarding(false);
        },
        onError: () => {
          Alert.alert(t("schedule.errorTitle"), t("onboarding.skipError"));
        },
      },
    );
  };

  const filteredInterests = useMemo(() => {
    if (!questions?.interests) return [];
    if (!searchQuery.trim()) return questions.interests;
    return questions.interests.filter((interest) =>
      interest.name.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [questions?.interests, searchQuery]);

  const toggleInterest = (interestId: number) => {
    setSelectedInterests((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(interestId)) {
        newSet.delete(interestId);
      } else {
        newSet.add(interestId);
      }
      return newSet;
    });
  };

  const toggleGoal = (goalId: number) => {
    setSelectedGoals((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(goalId)) {
        newSet.delete(goalId);
      } else {
        newSet.add(goalId);
      }
      return newSet;
    });
  };

  const toggleDiscussionTopic = (topicValue: string) => {
    setSelectedDiscussionTopics((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(topicValue)) {
        newSet.delete(topicValue);
      } else {
        newSet.add(topicValue);
      }
      return newSet;
    });
  };

  const handleSectionLayout = useCallback(
    (sectionName: string) => (event: LayoutChangeEvent) => {
      sectionPositions.current[sectionName] = event.nativeEvent.layout.y;
    },
    [],
  );

  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const scrollY = event.nativeEvent.contentOffset.y;
      const offset = 100;

      const positions = sectionPositions.current;
      let step = 1;

      if (
        positions.demographics &&
        scrollY >= positions.demographics - offset
      ) {
        step = 6;
      } else if (
        positions.discussionTopics &&
        scrollY >= positions.discussionTopics - offset
      ) {
        step = 5;
      } else if (
        positions.experienceLevel &&
        scrollY >= positions.experienceLevel - offset
      ) {
        step = 4;
      } else if (positions.goals && scrollY >= positions.goals - offset) {
        step = 3;
      } else if (
        positions.interests &&
        scrollY >= positions.interests - offset
      ) {
        step = 2;
      }

      setCurrentStep(step);
    },
    [],
  );

  const isLoading = isSubmitting || isPatchingRole;

  return (
    <ThemedView style={styles.container}>
      {hasBackgroundArt && (
        <TenantBackgroundArt
          variant="secondary"
          style={[styles.backgroundArt, { width, height: artworkHeight }]}
        />
      )}
      <ThemedView style={styles.content}>
        <ProgressBar
          title={t("onboarding.buttonPersonalize")}
          steps={TOTAL_STEPS}
          curStep={currentStep}
        />
        <UIVerticalSpacer height={15} />
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          onScroll={handleScroll}
          scrollEventThrottle={16}
        >
          {/* Role Section */}
          <View onLayout={handleSectionLayout("role")}>
            <QuestionSection title={t("onboarding.selectRoleTitle")} styles={styles}>
              <ThemedText style={styles.sectionDescription}>
                {t("onboarding.selectRoleDescription")}
              </ThemedText>
              <RolesList
                roles={filteredRoleOptions}
                selectedRole={selectedRole}
                onSelectRole={setSelectedRole}
              />
            </QuestionSection>
          </View>

          <UIVerticalSpacer height={20} />

          {/* Interests Section */}
          <View onLayout={handleSectionLayout("interests")}>
            <QuestionSection title={t("onboarding.customizeTrailTitle")} styles={styles}>
              <ThemedText style={styles.sectionDescription}>
                {t("onboarding.customizeTrailDescription")}
              </ThemedText>
              <SearchInputText
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              <UIVerticalSpacer height={5} />
              <InterestsList
                interests={filteredInterests}
                selectedInterests={selectedInterests}
                onToggleInterest={toggleInterest}
              />
            </QuestionSection>
          </View>

          <UIVerticalSpacer height={20} />

          {/* Goals Section */}
          <View onLayout={handleSectionLayout("goals")}>
            <QuestionSection title={t("onboarding.goalsTitle")} styles={styles}>
              <ThemedText style={styles.sectionDescription}>
                {t("onboarding.goalsDescription")}
              </ThemedText>
              <GoalsList
                goals={questions?.goals ?? []}
                selectedGoals={selectedGoals}
                onToggleGoal={toggleGoal}
              />
            </QuestionSection>
          </View>

          <UIVerticalSpacer height={20} />

          {/* Experience Level Section */}
          <View onLayout={handleSectionLayout("experienceLevel")}>
            <QuestionSection title={t("onboarding.levelTitle")} styles={styles}>
              <ThemedText style={styles.sectionDescription}>
                {t("onboarding.levelDescription")}
              </ThemedText>
              <ExperienceLevelList
                experienceLevels={questions?.experience_levels ?? []}
                selectedLevel={selectedExperienceLevel}
                onSelectLevel={setSelectedExperienceLevel}
              />
            </QuestionSection>
          </View>

          <UIVerticalSpacer height={20} />

          {/* Discussion Topics Section */}
          <View onLayout={handleSectionLayout("discussionTopics")}>
            <QuestionSection title={t("onboarding.discussTitle")} styles={styles}>
              <ThemedText style={styles.sectionDescription}>
                {t("onboarding.discussDescription")}
              </ThemedText>
              <DiscussionTopicsList
                topics={questions?.discussion_topics ?? []}
                selectedTopics={selectedDiscussionTopics}
                onToggleTopic={toggleDiscussionTopic}
              />
            </QuestionSection>
          </View>

          <UIVerticalSpacer height={20} />

          {/* Demographics Section */}
          <View onLayout={handleSectionLayout("demographics")}>
            <View style={styles.questionSection}>
              <View style={styles.demographicsHeader}>
                <ThemedText style={styles.questionTitle}>A bit about you</ThemedText>
                <TouchableOpacity
                  onPress={() => {
                    setDateOfBirth(null);
                    setGender(null);
                  }}
                >
                  <ThemedText style={styles.skipText}>Skip</ThemedText>
                </TouchableOpacity>
              </View>
              <ThemedText style={styles.sectionDescription}>
                This helps us show better event stats. You can skip this.
              </ThemedText>

              {/* Date of Birth */}
              <View style={styles.demoFieldGroup}>
                <ThemedText style={styles.demoFieldLabel}>Date of birth</ThemedText>
                <TouchableOpacity
                  style={styles.dobButton}
                  onPress={() => setShowDobPicker(true)}
                  activeOpacity={0.7}
                >
                  <ThemedText style={dateOfBirth ? styles.dobValueText : styles.dobPlaceholderText}>
                    {dateOfBirth
                      ? (() => {
                          const parts = dateOfBirth.split("-");
                          return parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : dateOfBirth;
                        })()
                      : "Select date"}
                  </ThemedText>
                </TouchableOpacity>
                {showDobPicker && (
                  <DateTimePicker
                    value={dateOfBirth ? new Date(dateOfBirth) : new Date(1990, 0, 1)}
                    mode="date"
                    display={Platform.OS === "ios" ? "spinner" : "default"}
                    maximumDate={new Date()}
                    onChange={(event, selectedDate) => {
                      setShowDobPicker(Platform.OS === "ios");
                      if (event.type === "set" && selectedDate) {
                        const year = selectedDate.getFullYear();
                        const month = String(selectedDate.getMonth() + 1).padStart(2, "0");
                        const day = String(selectedDate.getDate()).padStart(2, "0");
                        setDateOfBirth(`${year}-${month}-${day}`);
                      }
                    }}
                  />
                )}
                {dateOfBirth ? (
                  <TouchableOpacity onPress={() => setDateOfBirth(null)}>
                    <ThemedText style={styles.clearText}>Clear</ThemedText>
                  </TouchableOpacity>
                ) : null}
              </View>

              {/* Gender */}
              <View style={styles.demoFieldGroup}>
                <ThemedText style={styles.demoFieldLabel}>Gender</ThemedText>
                <View style={styles.genderChipsRow}>
                  {(["male", "female", "prefer_not_to_say"] as const).map((genderOption) => {
                    const labels: Record<string, string> = {
                      male: "Male",
                      female: "Female",
                      prefer_not_to_say: "Prefer not to say",
                    };
                    const isSelected = gender === genderOption;
                    return (
                      <TouchableOpacity
                        key={genderOption}
                        style={[
                          styles.genderChip,
                          isSelected && styles.genderChipSelected,
                        ]}
                        onPress={() => setGender(isSelected ? null : genderOption)}
                        activeOpacity={0.7}
                        accessibilityRole="radio"
                        accessibilityState={{ selected: isSelected }}
                      >
                        <ThemedText style={[styles.genderChipText, isSelected && styles.genderChipTextSelected]}>
                          {labels[genderOption]}
                        </ThemedText>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            </View>
          </View>

          <UIVerticalSpacer height={20} />

          {/* Calendar Section (does NOT count as a step) */}
          <View onLayout={handleSectionLayout("calendar")}>
            <View style={styles.calendarCard}>
              <View style={styles.calendarHeader}>
                <MaterialIcons name="event" size={28} color={GOOGLE_BRAND_BLUE} />
                <ThemedText style={styles.calendarTitle}>
                  {t("onboarding.calendarTitle")}
                </ThemedText>
              </View>
              <ThemedText style={styles.calendarDescription}>
                {t("onboarding.calendarDescription")}
              </ThemedText>
              <View style={styles.calendarBullets}>
                <ThemedText style={styles.calendarBullet}>
                  • {t("onboarding.calendarBullet1")}
                </ThemedText>
                <ThemedText style={styles.calendarBullet}>
                  • {t("onboarding.calendarBullet2")}
                </ThemedText>
                <ThemedText style={styles.calendarBullet}>
                  • {t("onboarding.calendarBullet3")}
                </ThemedText>
              </View>
              {gcalStatus?.connected ? (
                <View style={styles.calendarConnected}>
                  <MaterialIcons name="check-circle" size={24} color={colors.success} />
                  <ThemedText style={styles.calendarConnectedText}>
                    {t("settings.gcalConnected")}
                  </ThemedText>
                </View>
              ) : (
                <>
                  {gcalError && (
                    <ThemedText style={styles.calendarError}>
                      {t("onboarding.calendarError")}
                    </ThemedText>
                  )}
                  <TouchableOpacity
                    style={styles.calendarConnectButton}
                    onPress={connectGcal}
                    disabled={gcalConnecting}
                    activeOpacity={0.7}
                  >
                    <MaterialIcons name="event" size={20} color={COLOR_WHITE_ON_ACCENT} />
                    <ThemedText style={styles.calendarConnectText}>
                      {gcalConnecting
                        ? t("common.loading")
                        : gcalError
                          ? t("common.retry")
                          : t("settings.gcalConnect")}
                    </ThemedText>
                  </TouchableOpacity>
                  <ThemedText style={styles.calendarSkip}>
                    {t("onboarding.calendarSkip")}
                  </ThemedText>
                </>
              )}
            </View>
          </View>

          <UIVerticalSpacer height={30} />

          {/* Buttons at the end of scroll */}
          <ThemedView style={styles.buttonsSection}>
            <UIButton
              title={t("onboarding.buttonFinish")}
              icon="check"
              onPress={handleFinish}
              isLoading={isLoading}
            />
            <UIButton
              title={t("onboarding.buttonSkipForNow")}
              variant="text"
              onPress={handleSkip}
            />
          </ThemedView>
        </ScrollView>
      </ThemedView>
    </ThemedView>
  );
}

function QuestionSection({
  title,
  children,
  styles,
}: {
  title: string;
  children: React.ReactNode;
  styles: ReturnType<typeof createStyles>;
}) {
  return (
    <ThemedView style={styles.questionSection}>
      <ThemedText style={styles.questionTitle}>{title}</ThemedText>
      {children}
    </ThemedView>
  );
}

function SearchInputText({
  value,
  onChangeText,
}: {
  value: string;
  onChangeText: (text: string) => void;
}) {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { t } = useTranslation();

  return (
    <ThemedView style={styles.searchContainer}>
      <ThemedView style={styles.searchInputWrapper}>
        <MaterialIcons
          name="search"
          size={20}
          color={colors.icon}
          style={styles.searchIcon}
        />
        <TextInput
          placeholder={t("common.search")}
          placeholderTextColor={colors.icon}
          value={value}
          onChangeText={onChangeText}
          style={styles.searchInput}
        />
      </ThemedView>
    </ThemedView>
  );
}

function RolesList({
  roles,
  selectedRole,
  onSelectRole,
}: {
  roles: RoleOption[];
  selectedRole: UserRole | null;
  onSelectRole: (role: UserRole) => void;
}) {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <ThemedView style={styles.rolesList}>
      {roles.map((option) => (
        <RoleCard
          key={option.role}
          option={option}
          isSelected={selectedRole === option.role}
          onPress={() => onSelectRole(option.role)}
        />
      ))}
    </ThemedView>
  );
}

function RoleCard({
  option,
  isSelected,
  onPress,
}: {
  option: RoleOption;
  isSelected: boolean;
  onPress: () => void;
}) {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={[
        styles.roleCard,
        {
          borderColor: isSelected ? colors.primary : colors.border,
          backgroundColor: isSelected
            ? colors.primaryLight
            : colors.inputBackground,
        },
      ]}
    >
      <View
        style={[
          styles.roleIconContainer,
          {
            backgroundColor: isSelected ? colors.primary : colors.border,
          },
        ]}
      >
        <MaterialIcons name={option.icon} size={24} color={colors.white} />
      </View>
      <View style={styles.roleTextContainer}>
        <ThemedText style={styles.roleTitle}>{option.title}</ThemedText>
        <ThemedText
          style={[styles.roleDescription, { color: colors.textSecondary }]}
        >
          {option.description}
        </ThemedText>
      </View>
      {isSelected && (
        <MaterialIcons
          name="check-circle"
          size={24}
          color={colors.primary}
          style={styles.checkIcon}
        />
      )}
    </TouchableOpacity>
  );
}

function InterestsList({
  interests,
  selectedInterests,
  onToggleInterest,
}: {
  interests: Interest[];
  selectedInterests: Set<number>;
  onToggleInterest: (id: number) => void;
}) {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { t } = useTranslation();

  if (interests.length === 0) {
    return (
      <ThemedView style={styles.emptyState}>
        <ThemedText style={styles.emptyStateText}>
          {t("onboarding.noInterestsFound")}
        </ThemedText>
      </ThemedView>
    );
  }
  return (
    <ThemedView style={styles.chipsList}>
      {interests.map((item) => (
        <SelectableChip
          key={item.id}
          label={item.name}
          isSelected={selectedInterests.has(item.id)}
          onPress={() => onToggleInterest(item.id)}
        />
      ))}
    </ThemedView>
  );
}

function GoalsList({
  goals,
  selectedGoals,
  onToggleGoal,
}: {
  goals: Goal[];
  selectedGoals: Set<number>;
  onToggleGoal: (id: number) => void;
}) {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);

  if (goals.length === 0) {
    return null;
  }
  return (
    <ThemedView style={styles.chipsList}>
      {goals.map((item) => (
        <SelectableChip
          key={item.id}
          label={item.name}
          isSelected={selectedGoals.has(item.id)}
          onPress={() => onToggleGoal(item.id)}
        />
      ))}
    </ThemedView>
  );
}

function ExperienceLevelList({
  experienceLevels,
  selectedLevel,
  onSelectLevel,
}: {
  experienceLevels: ExperienceLevel[];
  selectedLevel: string | null;
  onSelectLevel: (level: string) => void;
}) {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);

  if (experienceLevels.length === 0) {
    return null;
  }
  return (
    <ThemedView style={styles.rowsList}>
      {experienceLevels.map((item) => (
        <SelectableRow
          key={item.value}
          label={item.label}
          sublabel={item.years}
          isSelected={selectedLevel === item.value}
          onPress={() => onSelectLevel(item.value)}
        />
      ))}
    </ThemedView>
  );
}

function DiscussionTopicsList({
  topics,
  selectedTopics,
  onToggleTopic,
}: {
  topics: DiscussionTopic[];
  selectedTopics: Set<string>;
  onToggleTopic: (value: string) => void;
}) {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);

  if (topics.length === 0) {
    return null;
  }
  return (
    <ThemedView style={styles.rowsList}>
      {topics.map((item) => (
        <SelectableRow
          key={item.value}
          label={item.label}
          isSelected={selectedTopics.has(item.value)}
          onPress={() => onToggleTopic(item.value)}
        />
      ))}
    </ThemedView>
  );
}

function SelectableChip({
  label,
  isSelected,
  onPress,
}: {
  label: string;
  isSelected: boolean;
  onPress: () => void;
}) {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={[
        styles.chip,
        {
          borderColor: isSelected
            ? colors.lightBlue
            : colors.inputBackground,
          backgroundColor: isSelected
            ? colors.lightBlue
            : colors.inputBackground,
        },
      ]}
    >
      <ThemedText style={styles.chipText} numberOfLines={1}>
        {label}
      </ThemedText>
      {isSelected && (
        <MaterialIcons
          name="check"
          size={20}
          color={colors.text}
          style={styles.chipCheck}
        />
      )}
    </TouchableOpacity>
  );
}

function SelectableRow({
  label,
  sublabel,
  isSelected,
  onPress,
}: {
  label: string;
  sublabel?: string;
  isSelected: boolean;
  onPress: () => void;
}) {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={[
        styles.selectableRow,
        {
          borderColor: isSelected
            ? colors.lightBlue
            : colors.inputBackground,
          backgroundColor: isSelected
            ? colors.lightBlue
            : colors.inputBackground,
        },
      ]}
    >
      <ThemedView style={styles.radioOuter}>
        {isSelected && <ThemedView style={styles.radioInner} />}
      </ThemedView>
      <ThemedView style={styles.rowTextContainer}>
        <ThemedText style={styles.rowLabel}>{label}</ThemedText>
        {sublabel && (
          <ThemedText style={styles.rowSublabel}>{sublabel}</ThemedText>
        )}
      </ThemedView>
    </TouchableOpacity>
  );
}

const createStyles = (colors: ReturnType<typeof useColors>) =>
  StyleSheet.create({
    container: {
      flex: 1,
      alignItems: "center",
      paddingTop: 10,
    },
    backgroundArt: {
      position: "absolute",
      top: 0,
      alignSelf: "center",
      opacity: 0.16,
    },
    content: {
      width: "100%",
      padding: 16,
      gap: 5,
      flex: 1,
    },
    scrollContent: {
      paddingBottom: 40,
    },
    sectionDescription: {
      marginBottom: 10,
    },
    questionSection: {
      gap: 10,
    },
    questionTitle: {
      fontWeight: "bold",
      fontSize: 20,
    },
    buttonsSection: {
      gap: 10,
    },
    // Search
    searchContainer: {
      gap: 10,
    },
    searchInputWrapper: {
      position: "relative",
    },
    searchIcon: {
      position: "absolute",
      left: 16,
      top: 12,
      zIndex: 1,
    },
    searchInput: {
      borderWidth: 1,
      padding: 12,
      paddingLeft: 48,
      borderRadius: 50,
      borderColor: colors.inputBackground,
      color: colors.text,
      backgroundColor: colors.inputBackground,
    },
    // Roles
    rolesList: {
      gap: 12,
      paddingTop: 10,
    },
    roleCard: {
      flexDirection: "row",
      alignItems: "center",
      padding: 16,
      borderRadius: 12,
      borderWidth: 2,
      gap: 12,
    },
    roleIconContainer: {
      width: 48,
      height: 48,
      borderRadius: 24,
      alignItems: "center",
      justifyContent: "center",
    },
    roleTextContainer: {
      flex: 1,
      gap: 4,
    },
    roleTitle: {
      fontSize: 18,
      fontWeight: "600",
    },
    roleDescription: {
      fontSize: 14,
    },
    checkIcon: {
      marginLeft: 8,
    },
    // Chips
    chipsList: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 12,
      paddingTop: 10,
    },
    chip: {
      paddingHorizontal: 13,
      paddingVertical: 8,
      borderRadius: 50,
      borderWidth: 1,
      position: "relative",
    },
    chipText: {
      fontSize: 15,
      fontWeight: "500",
      color: colors.text,
    },
    chipCheck: {
      position: "absolute",
      top: -6,
      right: -4,
      fontWeight: "bold",
    },
    // Rows
    rowsList: {
      gap: 10,
      paddingTop: 10,
    },
    selectableRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderRadius: 12,
      borderWidth: 1,
    },
    radioOuter: {
      width: 24,
      height: 24,
      borderRadius: 12,
      borderWidth: 2,
      borderColor: colors.icon,
      backgroundColor: "transparent",
      alignItems: "center",
      justifyContent: "center",
      marginRight: 12,
    },
    radioInner: {
      width: 12,
      height: 12,
      borderRadius: 6,
      backgroundColor: colors.text,
    },
    rowTextContainer: {
      flex: 1,
    },
    rowLabel: {
      fontSize: 15,
      fontWeight: "500",
      color: colors.text,
    },
    rowSublabel: {
      fontSize: 13,
      color: colors.icon,
    },
    // Empty state
    emptyState: {
      paddingVertical: 10,
    },
    emptyStateText: {
      fontSize: 15,
      fontWeight: "500",
    },
    // Demographics
    demographicsHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    skipText: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    demoFieldGroup: {
      gap: 8,
    },
    demoFieldLabel: {
      fontSize: 14,
      fontWeight: "700",
      color: colors.text,
    },
    dobButton: {
      borderWidth: 1,
      borderColor: colors.inputBackground,
      backgroundColor: colors.inputBackground,
      borderRadius: 10,
      paddingHorizontal: 14,
      paddingVertical: 13,
    },
    dobValueText: {
      fontSize: 15,
      color: colors.text,
    },
    dobPlaceholderText: {
      fontSize: 15,
      color: colors.textSecondary,
    },
    clearText: {
      fontSize: 13,
      color: colors.textSecondary,
      marginTop: 4,
    },
    genderChipsRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
    },
    genderChip: {
      borderWidth: 1,
      borderColor: colors.cardBorder,
      backgroundColor: colors.cardBackground,
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 8,
    },
    genderChipSelected: {
      borderColor: colors.primary,
      backgroundColor: colors.primary + "20",
    },
    genderChipText: {
      fontSize: 13,
      color: colors.text,
    },
    genderChipTextSelected: {
      color: colors.primary,
    },
    // Calendar section
    calendarCard: {
      backgroundColor: "rgba(66, 133, 244, 0.08)",
      borderWidth: 1,
      borderColor: "rgba(66, 133, 244, 0.25)",
      borderRadius: 16,
      padding: 20,
      gap: 12,
    },
    calendarHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
    calendarTitle: {
      fontSize: 20,
      fontWeight: "bold",
    },
    calendarDescription: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    calendarBullets: {
      gap: 4,
    },
    calendarBullet: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    calendarConnectButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      backgroundColor: GOOGLE_BRAND_BLUE,
      borderRadius: 12,
      paddingVertical: 14,
      marginTop: 4,
    },
    calendarConnectText: {
      fontSize: 16,
      fontWeight: "600",
      color: COLOR_WHITE_ON_ACCENT,
    },
    calendarSkip: {
      fontSize: 13,
      color: colors.textSecondary,
      textAlign: "center",
    },
    calendarConnected: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      paddingVertical: 12,
    },
    calendarConnectedText: {
      fontSize: 16,
      fontWeight: "600",
      color: colors.success,
    },
    calendarError: {
      fontSize: 13,
      color: colors.error,
      textAlign: "center",
    },
  });
