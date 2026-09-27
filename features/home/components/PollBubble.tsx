import { useColors } from "@/hooks/use-colors";
import { votePoll } from "@/api/features/polls";
import { useQueryClient } from "@tanstack/react-query";
import { useGetPoll } from "@/features/polls/hooks/useGetSessionPoll";
import { ThemedText } from "@/components/themed-text";
import {
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

type PollBubbleProps = {
  pollId: number;
  question: string;
  groupId: number;
};

export function PollBubble({ pollId, question, groupId }: PollBubbleProps) {
  const colors = useColors();
  const queryClient = useQueryClient();
  const { data: poll, isLoading } = useGetPoll(pollId, { enabled: !!pollId });

  const hasVoted = poll != null && poll.user_voted_option_id !== null;

  const handleVote = async (optionId: number) => {
    if (hasVoted) return;
    try {
      await votePoll(pollId, { option_id: optionId });
      queryClient.invalidateQueries({ queryKey: ["poll", pollId] });
      queryClient.invalidateQueries({ queryKey: ["groupMessages", groupId] });
    } catch {
      // silently fail; poll may have closed
    }
  };

  if (isLoading) {
    return (
      <View
        style={[
          styles.container,
          { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder },
        ]}
      >
        <ThemedText style={[styles.question, { color: colors.text }]}>{question}</ThemedText>
        <ActivityIndicator color={colors.primary} size="small" style={{ marginTop: 8 }} />
      </View>
    );
  }

  if (!poll) {
    return (
      <View
        style={[
          styles.container,
          { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder },
        ]}
      >
        <ThemedText style={[styles.question, { color: colors.text }]}>{question}</ThemedText>
      </View>
    );
  }

  const totalVotes = poll.total_votes || 1; // avoid divide-by-zero

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder },
      ]}
    >
      <ThemedText style={[styles.question, { color: colors.text }]}>{poll.question}</ThemedText>

      <View style={styles.optionsList}>
        {poll.options.map((option) => {
          const isSelected = poll.user_voted_option_id === option.id;
          const percentage = poll.total_votes > 0
            ? Math.round((option.vote_count / poll.total_votes) * 100)
            : 0;

          return (
            <TouchableOpacity
              key={option.id}
              activeOpacity={hasVoted ? 1 : 0.7}
              onPress={() => handleVote(option.id)}
              style={styles.optionRow}
            >
              {/* Progress bar track */}
              <View
                style={[
                  styles.barTrack,
                  { backgroundColor: colors.cardBorder ?? colors.border },
                ]}
              >
                {hasVoted && (
                  <View
                    style={[
                      styles.barFill,
                      {
                        width: `${percentage}%`,
                        backgroundColor: isSelected
                          ? colors.primary
                          : colors.lightBlue ?? colors.link,
                      },
                    ]}
                  />
                )}
              </View>

              {/* Label row */}
              <View style={styles.optionLabelRow}>
                <ThemedText
                  style={[
                    styles.optionText,
                    { color: colors.text },
                    isSelected && styles.optionTextSelected,
                  ]}
                  numberOfLines={2}
                >
                  {option.text}
                </ThemedText>
                {hasVoted && (
                  <ThemedText style={[styles.percentageText, { color: colors.textSubtle }]}>
                    {percentage}%
                  </ThemedText>
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      <ThemedText style={[styles.totalVotes, { color: colors.textSubtle }]}>
        {poll.total_votes} {poll.total_votes === 1 ? "vote" : "votes"}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    gap: 10,
    maxWidth: 280,
  },
  question: {
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 20,
  },
  optionsList: {
    gap: 6,
  },
  optionRow: {
    borderRadius: 8,
    overflow: "hidden",
  },
  barTrack: {
    height: 36,
    borderRadius: 8,
    overflow: "hidden",
    justifyContent: "center",
  },
  barFill: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    borderRadius: 8,
  },
  optionLabelRow: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 10,
  },
  optionText: {
    fontSize: 13,
    flex: 1,
  },
  optionTextSelected: {
    fontWeight: "600",
  },
  percentageText: {
    fontSize: 12,
    marginLeft: 6,
  },
  totalVotes: {
    fontSize: 11,
    textAlign: "right",
  },
});
