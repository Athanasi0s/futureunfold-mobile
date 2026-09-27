import { MaterialIcons } from "@expo/vector-icons";
import React from "react";
import {
  StyleSheet,
  View,
} from "react-native";
import type { PollOut } from "../../../api/schemas";
import { useColors } from "../../../hooks/use-colors";
import { ThemedText } from "@/components/themed-text";

type PollResultsViewProps = {
  poll: PollOut;
};

/**
 * Poll results view with progress bars showing vote percentages
 * Displayed after user has voted
 */
export function PollResultsView({ poll }: PollResultsViewProps) {
  const colors = useColors();

  // Calculate percentages for each option
  const optionsWithPercentage = poll.options.map((option) => ({
    ...option,
    percentage:
      poll.total_votes > 0
        ? Math.round((option.vote_count / poll.total_votes) * 100)
        : 0,
  }));

  // Find the winning option (highest vote count)
  const maxVotes = Math.max(...poll.options.map((o) => o.vote_count));

  return (
    <View style={styles.container}>
      {/* Poll Header */}
      <View style={styles.header}>
        <View style={styles.liveIndicator}>
          <View style={[styles.liveDot, { backgroundColor: colors.primary }]} />
          <ThemedText style={[styles.liveText, { color: colors.primary }]}>
            Live Poll
          </ThemedText>
        </View>
        <ThemedText style={[styles.voteCount, { color: colors.textSecondary }]}>
          {poll.total_votes} votes
        </ThemedText>
      </View>

      {/* Question */}
      <ThemedText style={[styles.question, { color: colors.textPrimary }]}>
        {poll.question}
      </ThemedText>

      {/* Results */}
      <View style={styles.resultsContainer}>
        {optionsWithPercentage.map((option) => {
          const isUserVote = poll.user_voted_option_id === option.id;
          const isWinning = option.vote_count === maxVotes && maxVotes > 0;

          return (
            <View
              key={option.id}
              style={[
                styles.resultItem,
                {
                  borderColor: isUserVote ? colors.primary : colors.border,
                  backgroundColor: isUserVote
                    ? colors.primaryLight
                    : "transparent",
                },
              ]}
            >
              {/* Progress bar background */}
              <View
                style={[
                  styles.progressBar,
                  {
                    width: `${option.percentage}%`,
                    backgroundColor: isUserVote
                      ? `${colors.primary}40`
                      : `${colors.primary}20`,
                  },
                ]}
              />

              {/* Content */}
              <View style={styles.resultContent}>
                <View style={styles.resultLeft}>
                  {isUserVote && (
                    <MaterialIcons
                      name="check-circle"
                      size={18}
                      color={colors.primary}
                    />
                  )}
                  <ThemedText
                    style={[
                      styles.optionText,
                      {
                        color: isUserVote ? colors.primary : colors.textPrimary,
                        fontWeight: isWinning ? "700" : "500",
                      },
                    ]}
                  >
                    {option.text}
                  </ThemedText>
                </View>
                <ThemedText
                  style={[
                    styles.percentageText,
                    {
                      color: isUserVote ? colors.primary : colors.textSecondary,
                      fontWeight: isWinning ? "700" : "600",
                    },
                  ]}
                >
                  {option.percentage}%
                </ThemedText>
              </View>
            </View>
          );
        })}
      </View>

      {/* Voted indicator */}
      <View style={styles.votedIndicator}>
        <MaterialIcons name="check" size={16} color={colors.success} />
        <ThemedText style={[styles.votedText, { color: colors.success }]}>
          You voted • Results update live
        </ThemedText>
      </View>
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
  resultsContainer: {
    gap: 12,
    marginBottom: 16,
  },
  resultItem: {
    borderRadius: 12,
    borderWidth: 2,
    overflow: "hidden",
    position: "relative",
  },
  progressBar: {
    position: "absolute",
    top: 0,
    left: 0,
    bottom: 0,
    borderRadius: 10,
  },
  resultContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 14,
    zIndex: 1,
  },
  resultLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  optionText: {
    fontSize: 15,
  },
  percentageText: {
    fontSize: 15,
    marginLeft: 8,
  },
  votedIndicator: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingTop: 8,
  },
  votedText: {
    fontSize: 12,
    fontWeight: "500",
  },
});
