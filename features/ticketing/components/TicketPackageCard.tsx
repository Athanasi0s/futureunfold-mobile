import React from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useColors } from "@/hooks/use-colors";
import type { TicketPackageOut } from "@/api/schemas";
import { useTranslation } from "react-i18next";

import { COLOR_WHITE_ON_ACCENT } from "@/constants/theme";
import { ThemedText } from "@/components/themed-text";
type Props = {
  package: TicketPackageOut;
  onBuy: () => void;
  isBuying: boolean;
};

export function TicketPackageCard({ package: pkg, onBuy, isBuying }: Props) {
  const colors = useColors();
  const { t } = useTranslation();
  return (
    <View style={[styles.card, { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder }]}>
      <View style={styles.header}>
        <ThemedText style={[styles.name, { color: colors.text }]}>{pkg.name}</ThemedText>
        <ThemedText style={[styles.price, { color: colors.primary }]}>€{pkg.price_eur.toFixed(2)}</ThemedText>
      </View>
      {pkg.description && (
        <ThemedText style={[styles.description, { color: colors.textSecondary }]}>{pkg.description}</ThemedText>
      )}
      <View style={styles.features}>
        {pkg.features.map((f, i) => (
          <ThemedText key={i} style={[styles.feature, { color: colors.text }]}>✓ {f}</ThemedText>
        ))}
      </View>
      {pkg.max_quantity && (
        <ThemedText style={[styles.limited, { color: colors.textSecondary }]}>
          {t("tickets.packageCard.limited", { count: pkg.max_quantity })}
        </ThemedText>
      )}
      <TouchableOpacity
        style={[styles.button, { backgroundColor: colors.primary }, isBuying && styles.buttonDisabled]}
        onPress={onBuy}
        disabled={isBuying}
      >
        {isBuying ? (
          <ActivityIndicator color={COLOR_WHITE_ON_ACCENT} />
        ) : (
          <ThemedText style={styles.buttonText}>{t("tickets.packageCard.buyTicket")}</ThemedText>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 12, borderWidth: 1, padding: 16, marginBottom: 16 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  name: { fontSize: 18, fontWeight: "700", flex: 1 },
  price: { fontSize: 20, fontWeight: "800" },
  description: { fontSize: 14, marginBottom: 12, lineHeight: 20 },
  features: { marginBottom: 12 },
  feature: { fontSize: 14, marginBottom: 4 },
  limited: { fontSize: 12, marginBottom: 12, fontStyle: "italic" },
  button: { borderRadius: 8, paddingVertical: 14, alignItems: "center" },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: COLOR_WHITE_ON_ACCENT, fontWeight: "700", fontSize: 16 },
});
