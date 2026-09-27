import { Modal, Pressable, StyleSheet, View } from "react-native";
import { ThemedText } from "@/components/themed-text";
import { useColors } from "@/hooks/use-colors";
import type { BroadcastPushOut } from "@/api/schemas";

/**
 * Phase 13 — PUSH-04 (updated for gap 6a, Plan 13-11).
 *
 * Renders total / iOS / Android / Unknown counts from BroadcastPushOut
 * as a 4-row breakdown so the admin can always read the math.
 * `unknown_count` buckets legacy push tokens that registered before the
 * platform column existed (Plan 13-02 migration t6a7b8c9d0e1) — helper
 * line explains this so the admin understands why the numbers add up.
 *
 * Returns null when no result is in scope so callers can pass `result`
 * directly without a wrapper conditional.
 */
export function DeviceBreakdownModal({
  result,
  onDismiss,
}: {
  result: BroadcastPushOut | null;
  onDismiss: () => void;
}) {
  const colors = useColors();
  if (!result) return null;

  const rows: { label: string; value: number; accent?: boolean }[] = [
    { label: "Total", value: result.total_devices, accent: true },
    { label: "iOS", value: result.ios_count },
    { label: "Android", value: result.android_count },
    { label: "Unknown", value: result.unknown_count },
  ];

  const hasUnknown = result.unknown_count > 0;

  return (
    <Modal transparent visible animationType="fade" onRequestClose={onDismiss}>
      <View style={[styles.overlay, { backgroundColor: colors.sessionCardOverlay }]}>
        <View
          style={[
            styles.card,
            { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder },
          ]}
          testID="device-breakdown-modal"
        >
          <ThemedText style={[styles.title, { color: colors.text }]}>Push sent</ThemedText>

          {rows.map((row) => (
            <View
              key={row.label}
              style={styles.row}
              testID={`breakdown-row-${row.label.toLowerCase()}`}
            >
              <ThemedText style={[styles.rowLabel, { color: colors.textSecondary }]}>
                {row.label}
              </ThemedText>
              <ThemedText
                style={[
                  row.accent ? styles.rowValueAccent : styles.rowValue,
                  { color: row.accent ? colors.primary : colors.text },
                ]}
              >
                {row.value}
              </ThemedText>
            </View>
          ))}

          {hasUnknown ? (
            <ThemedText style={[styles.helper, { color: colors.textSecondary }]}>
              Unknown are push tokens registered before the platform field was
              added. They will move to iOS or Android as users reopen the app.
            </ThemedText>
          ) : null}

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Done"
            onPress={onDismiss}
            style={[styles.btnPrimary, { backgroundColor: colors.primary }]}
            testID="device-breakdown-done"
          >
            <ThemedText style={{ color: colors.white, fontWeight: "700" }}>Done</ThemedText>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  card: {
    width: "100%",
    maxWidth: 380,
    borderRadius: 16,
    borderWidth: 1,
    padding: 24,
  },
  title: { fontSize: 18, fontWeight: "700", textAlign: "center", marginBottom: 16 },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
  },
  rowLabel: { fontSize: 14, fontWeight: "400" },
  rowValue: { fontSize: 16, fontWeight: "600" },
  rowValueAccent: { fontSize: 28, fontWeight: "700" },
  helper: {
    fontSize: 12,
    fontWeight: "400",
    marginTop: 12,
    marginBottom: 16,
    lineHeight: 16,
    textAlign: "center",
  },
  btnPrimary: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 12,
  },
});
