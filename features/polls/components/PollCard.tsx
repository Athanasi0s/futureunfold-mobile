import React, { useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  View,
} from "react-native";
import { useColors } from "../../../hooks/use-colors";
import { useGetPoll, useVotePoll } from "../hooks";
import { useTranslation } from "react-i18next";
import { PollResultsView } from "./PollResultsView";
import { PollVoteView } from "./PollVoteView";
import { ThemedText } from "@/components/themed-text";

type PollCardProps = {
  pollId: number;
};

/**
 * Main Poll card component that handles fetching poll data
 * and switching between vote and results views
 */
export function PollCard({ pollId }: PollCardProps) {
  const colors = useColors();
  const { t } = useTranslation();
  const [selectedOptionId, setSelectedOptionId] = useState<number | null>(null);

  const {
    data: poll,
    isLoading,
    isError,
    error,
  } = useGetPoll(pollId, {
    refetchInterval: 5000,
  });

  const voteMutation = useVotePoll(pollId);

  const handleVote = () => {
    if (!poll || !selectedOptionId) return;

    voteMutation.mutate(
      { option_id: selectedOptionId },
      {
        onSuccess: () => {
          setSelectedOptionId(null);
        },
        onError: (err: any) => {
          // Error will be shown in UI
          console.error("Vote error:", err);
        },
      },
    );
  };

  // Loading state
  if (isLoading) {
    return (
      <View
        style={[
          styles.card,
          {
            backgroundColor: `${colors.primary}10`,
            borderColor: `${colors.primary}30`,
          },
        ]}
      >
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={colors.primary} size="small" />
          <ThemedText style={[styles.loadingText, { color: colors.textSecondary }]}>
            {t("polls.card.loading")}
          </ThemedText>
        </View>
      </View>
    );
  }

  // Error state - poll might not exist
  if (isError || !poll) {
    // Check for 404 in various error structures
    const status =
      (error as any)?.response?.status ||
      (error as any)?.status ||
      (error as any)?.statusCode;

    // If it's a 404, the poll doesn't exist - don't show anything
    if (status === 404) {
      return null;
    }

    // For other errors, show error UI
    return (
      <View
        style={[
          styles.card,
          {
            backgroundColor: `${colors.error}10`,
            borderColor: `${colors.error}30`,
          },
        ]}
      >
        <View style={styles.errorContainer}>
          <ThemedText style={[styles.errorText, { color: colors.error }]}>
            {t("polls.card.unableToLoad")}
          </ThemedText>
        </View>
      </View>
    );
  }

  // Inactive poll - show results to everyone
  if (!poll.is_active) {
    return (
      <View
        style={[
          styles.card,
          {
            backgroundColor: `${colors.textSecondary}10`,
            borderColor: `${colors.textSecondary}30`,
          },
        ]}
      >
        <View style={styles.inactiveHeader}>
          <ThemedText style={[styles.inactiveText, { color: colors.textSecondary }]}>
            {t("polls.card.ended")}
          </ThemedText>
          {poll.user_voted_option_id && (
            <ThemedText style={[styles.votedBadge, { color: colors.success }]}>
              {t("polls.card.voted")}
            </ThemedText>
          )}
        </View>
        <PollResultsView poll={poll} />
      </View>
    );
  }

  // Check if user has already voted
  const hasVoted = poll.user_voted_option_id !== null;

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: `${colors.primary}10`,
          borderColor: `${colors.primary}30`,
        },
      ]}
    >
      {hasVoted ? (
        <PollResultsView poll={poll} />
      ) : (
        <PollVoteView
          poll={poll}
          selectedOptionId={selectedOptionId}
          onSelectOption={setSelectedOptionId}
          onVote={handleVote}
          isVoting={voteMutation.isPending}
        />
      )}

      {/* Error message */}
      {voteMutation.isError && (
        <View style={styles.errorBanner}>
          <ThemedText style={[styles.errorBannerText, { color: colors.error }]}>
            {(voteMutation.error as any)?.response?.data?.detail ||
              t("polls.card.voteFailed")}
          </ThemedText>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 2,
    overflow: "hidden",
    marginBottom: 16,
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    fontWeight: "500",
  },
  errorContainer: {
    padding: 24,
    alignItems: "center",
  },
  errorText: {
    fontSize: 14,
    fontWeight: "500",
  },
  inactiveHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  inactiveText: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  votedBadge: {
    fontSize: 12,
    fontWeight: "600",
  },
  question: {
    fontSize: 16,
    fontWeight: "700",
    lineHeight: 22,
  },
  errorBanner: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  errorBannerText: {
    fontSize: 13,
    fontWeight: "500",
    textAlign: "center",
  },
});
