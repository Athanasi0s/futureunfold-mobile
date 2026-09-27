import { MaterialIcons } from "@expo/vector-icons";
import React from "react";
import { COLOR_WHITE_ON_ACCENT } from "@/constants/theme";
import {
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import type { PollOut } from "../../../api/schemas";
import { useColors } from "../../../hooks/use-colors";
import { useTranslation } from "react-i18next";
import { ThemedText } from "@/components/themed-text";

type PollVoteViewProps = {
  poll: PollOut;
  selectedOptionId: number | null;
  onSelectOption: (optionId: number) => void;
  onVote: () => void;
  isVoting: boolean;
};

/**
 * Poll voting view with radio buttons and vote button
 * Displayed when user hasn't voted yet
 */
export function PollVoteView({
  poll,
  selectedOptionId,
  onSelectOption,
  onVote,
  isVoting,
}: PollVoteViewProps) {
  const colors = useColors();
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      {/* Poll Header */}
      <View style={styles.header}>
        <View style={styles.liveIndicator}>
          <View style={[styles.liveDot, { backgroundColor: colors.primary }]} />
          <ThemedText style={[styles.liveText, { color: colors.primary }]}>
            {t("polls.voteView.livePoll")}
          </ThemedText>
        </View>
        <ThemedText style={[styles.voteCount, { color: colors.textSecondary }]}>
          {t("polls.voteView.votesCount", { count: poll.total_votes })}
        </ThemedText>
      </View>

      {/* Question */}
      <ThemedText style={[styles.question, { color: colors.textPrimary }]}>
        {poll.question}
      </ThemedText>

      {/* Options */}
      <View style={styles.optionsContainer}>
        {poll.options.map((option) => (
          <TouchableOpacity
            key={option.id}
            style={[
              styles.optionButton,
              {
                borderColor:
                  selectedOptionId === option.id
                    ? colors.primary
                    : colors.border,
                backgroundColor:
                  selectedOptionId === option.id
                    ? colors.primaryLight
                    : "transparent",
              },
            ]}
            onPress={() => onSelectOption(option.id)}
            disabled={isVoting}
          >
            <View style={[styles.radioOuter, { borderColor: colors.textSecondary }]}>
              {selectedOptionId === option.id && (
                <View
                  style={[
                    styles.radioInner,
                    { backgroundColor: colors.primary },
                  ]}
                />
              )}
            </View>
            <ThemedText
              style={[
                styles.optionText,
                {
                  color:
                    selectedOptionId === option.id
                      ? colors.primary
                      : colors.textPrimary,
                },
              ]}
            >
              {option.text}
            </ThemedText>
          </TouchableOpacity>
        ))}
      </View>

      {/* Vote Button */}
      <TouchableOpacity
        style={[
          styles.voteButton,
          {
            backgroundColor: selectedOptionId ? colors.primary : colors.border,
          },
        ]}
        onPress={onVote}
        disabled={!selectedOptionId || isVoting}
      >
        {isVoting ? (
          <ActivityIndicator color={COLOR_WHITE_ON_ACCENT} size="small" />
        ) : (
          <>
            <MaterialIcons name="how-to-vote" size={20} color={COLOR_WHITE_ON_ACCENT} />
            <ThemedText style={styles.voteButtonText}>{t("polls.voteView.submitVote")}</ThemedText>
          </>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  liveIndicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  liveDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  liveText: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  voteCount: {
    fontSize: 12,
    fontWeight: "500",
  },
  question: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 16,
    lineHeight: 22,
  },
  optionsContainer: {
    gap: 12,
    marginBottom: 20,
  },
  optionButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 12,
    borderWidth: 2,
    gap: 12,
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  optionText: {
    fontSize: 15,
    fontWeight: "500",
    flex: 1,
  },
  voteButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 14,
    borderRadius: 12,
    gap: 8,
  },
  voteButtonText: {
    color: COLOR_WHITE_ON_ACCENT,
    fontSize: 15,
    fontWeight: "700",
  },
});
