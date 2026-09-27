import { useColors } from "@/hooks/use-colors";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useMemo, useState } from "react";
import {
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { useTranslation } from "react-i18next";
import { useGoogleCalendarStatus } from "@/features/scheduling/hooks/useGoogleCalendar";
import { useGoogleCalendarAuth } from "@/features/scheduling/hooks/useGoogleCalendarAuth";
import { ThemedText } from "@/components/themed-text";

const DISMISSED_KEY = "gcal_prompt_dismissed";

export function GCalPromptCard() {
  const { t } = useTranslation();
  const { data: status } = useGoogleCalendarStatus();
  const { connect } = useGoogleCalendarAuth();
  const [dismissed, setDismissed] = useState(true); // default hidden
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);

  useEffect(() => {
    AsyncStorage.getItem(DISMISSED_KEY).then((val: string | null) => {
      setDismissed(val === "true");
    });
  }, []);

  // Don't show if connected, dismissed, or loading
  if (dismissed || status?.connected) {
    return null;
  }

  const handleDismiss = () => {
    setDismissed(true);
    AsyncStorage.setItem(DISMISSED_KEY, "true");
  };

  return (
    <View style={styles.card}>
      <Ionicons
        name="calendar-outline"
        size={22}
        color={colors.lightBlue}
      />
      <ThemedText style={styles.text}>
        {t("scheduling.gcalPrompt.text")}
      </ThemedText>
      <TouchableOpacity style={styles.connectButton} onPress={connect}>
        <ThemedText style={styles.connectText}>{t("scheduling.gcalPrompt.connect")}</ThemedText>
      </TouchableOpacity>
      <TouchableOpacity onPress={handleDismiss} hitSlop={8}>
        <Ionicons name="close" size={18} color={colors.textSecondary} />
      </TouchableOpacity>
    </View>
  );
}

const createStyles = (colors: ReturnType<typeof useColors>) =>
  StyleSheet.create({
    card: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      backgroundColor: colors.cardBackground,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      borderRadius: 12,
      paddingHorizontal: 14,
      paddingVertical: 12,
      marginBottom: 12,
    },
    text: {
      flex: 1,
      fontSize: 13,
      color: colors.text,
    },
    connectButton: {
      backgroundColor: colors.primaryLight,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 8,
    },
    connectText: {
      fontSize: 13,
      fontWeight: "600",
      color: colors.lightBlue,
    },
  });
