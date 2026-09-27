import { Modal, Pressable, StyleSheet, View } from "react-native";
import { ThemedText } from "@/components/themed-text";
import { useColors } from "@/hooks/use-colors";

/**
 * Phase 13 — non-destructive confirmation modal shown before POST.
 * Replaces the prior `Alert.alert(..., style:'destructive')` pattern
 * (UI-SPEC §Destructive Confirmations: Send is a routine action).
 *
 * `colors.sessionCardOverlay` is the closest token to a generic dim
 * overlay in the current palette; Plan 13-08 will formalise an
 * `overlay` slot.
 */
export function SendConfirmModal({
  visible,
  audienceLabel,
  deeplinkLabel,
  ageBandLabel,
  isPending,
  onConfirm,
  onCancel,
}: {
  visible: boolean;
  audienceLabel: string;
  deeplinkLabel: string;
  ageBandLabel?: string;
  isPending: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const colors = useColors();
  const showAgeBand = ageBandLabel && ageBandLabel !== "All ages";
  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View
        style={[styles.overlay, { backgroundColor: colors.sessionCardOverlay }]}
      >
        <View
          style={[styles.card, { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder }]}
          testID="send-confirm-modal"
        >
          <ThemedText style={[styles.title, { color: colors.text }]}>
            Send this push?
          </ThemedText>
          <ThemedText style={[styles.body, { color: colors.textSecondary }]}>
            To {audienceLabel}
            {"\n"}Link: {deeplinkLabel}
            {showAgeBand ? `\nAges: ${ageBandLabel}` : ""}
          </ThemedText>
          <View style={styles.actions}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Cancel"
              onPress={onCancel}
              disabled={isPending}
              style={[
                styles.btn,
                { borderColor: colors.border, opacity: isPending ? 0.6 : 1 },
              ]}
              testID="send-confirm-cancel"
            >
              <ThemedText style={{ color: colors.text }}>Cancel</ThemedText>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Send"
              onPress={onConfirm}
              disabled={isPending}
              style={[
                styles.btnPrimary,
                {
                  backgroundColor: colors.primary,
                  opacity: isPending ? 0.6 : 1,
                },
              ]}
              testID="send-confirm-send"
            >
              <ThemedText style={{ color: colors.white, fontWeight: "700" }}>
                Send
              </ThemedText>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  card: {
    width: "100%",
    maxWidth: 380,
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 12,
  },
  body: {
    fontSize: 14,
    fontWeight: "400",
    marginBottom: 20,
    lineHeight: 20,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
  },
  btn: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  btnPrimary: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
});
