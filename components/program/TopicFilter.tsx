import { useColors } from "@/hooks/use-colors";
import React from "react";
import {
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { useTranslation } from "react-i18next";
import { ThemedText } from "@/components/themed-text";

interface TopicFilterProps {
  topics: string[];
  selectedTopic: string | null; // null means "All Topics"
  onSelectTopic: (topic: string | null) => void;
}

export function TopicFilter({
  topics,
  selectedTopic,
  onSelectTopic,
}: TopicFilterProps) {
  const { t } = useTranslation();
  const colors = useColors();

  const activeBg = colors.textPrimary;
  const activeText = colors.background;
  const inactiveBorderColor = colors.border;
  const inactiveText = colors.textSecondary;

  const isAllSelected = selectedTopic === null;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {/* "All Topics" chip */}
      <TouchableOpacity
        style={[
          styles.chip,
          isAllSelected
            ? { backgroundColor: activeBg }
            : { borderColor: inactiveBorderColor, borderWidth: 1 },
        ]}
        onPress={() => onSelectTopic(null)}
        activeOpacity={0.7}
      >
        <ThemedText
          style={[
            styles.chipText,
            { color: isAllSelected ? activeText : inactiveText },
            isAllSelected && styles.chipTextActive,
          ]}
        >
          {t("program.topicFilter.allTopics")}
        </ThemedText>
      </TouchableOpacity>

      {/* Topic chips */}
      {topics.map((topic) => {
        const isSelected = selectedTopic === topic;
        return (
          <TouchableOpacity
            key={topic}
            style={[
              styles.chip,
              isSelected
                ? { backgroundColor: activeBg }
                : { borderColor: inactiveBorderColor, borderWidth: 1 },
            ]}
            onPress={() => onSelectTopic(topic)}
            activeOpacity={0.7}
          >
            <ThemedText
              style={[
                styles.chipText,
                { color: isSelected ? activeText : inactiveText },
                isSelected && styles.chipTextActive,
              ]}
            >
              {topic}
            </ThemedText>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

// Helper to extract unique topics from sessions
export function extractUniqueTopics(
  sessions: { topic_tags?: string[] | null }[],
): string[] {
  const topicSet = new Set<string>();

  sessions.forEach((session) => {
    session.topic_tags?.forEach((tag) => {
      topicSet.add(tag);
    });
  });

  return Array.from(topicSet).sort();
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 8,
  },
  chip: {
    height: 32,
    paddingHorizontal: 16,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  chipText: {
    fontSize: 12,
    fontWeight: "500",
  },
  chipTextActive: {
    fontWeight: "600",
  },
});
