import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Platform,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

import { useCreateWalletPass } from "@/features/wallet/hooks/useCreateWalletPass";
import { useColors } from "@/hooks/use-colors";

/**
 * "Add to Google Wallet" CTA (Phase 13 — GWLT-01, kinded for gap 5b).
 *
 * Android-only per D-01/D-04. On iOS the component renders null — no
 * placeholder, no "Coming soon" copy.
 *
 * Props:
 *   kind     — "badge" (default) or "ticket". Default preserves backward
 *              compat: digital-id.tsx calls <GoogleWalletButton /> with no props.
 *   ticketId — Required when kind === "ticket". Passed to the backend as
 *              ticket_id; backend resolves Ticket.qr_code server-side.
 *
 * Tapping calls POST /me/wallet/pass/{kind} via useCreateWalletPass and opens
 * the returned save URL in the Google Wallet app via Linking.openURL.
 *
 * Brand chrome: uses the official Google Wallet button asset
 * (assets/wallet/add-to-google-wallet.png). Re-drawn buttons fail
 * Google's brand review (T-13-21).
 */
export type GoogleWalletButtonProps = {
  kind?: "badge" | "ticket"; // default "badge" — backward-compatible
  ticketId?: number; // required when kind === "ticket"
};

export function GoogleWalletButton(props: GoogleWalletButtonProps = {}) {
  const { kind = "badge", ticketId } = props;
  const colors = useColors();
  const { mutateAsync, isPending } = useCreateWalletPass({ kind, ticketId });

  // Dev-time sanity check: ticket kind requires ticketId
  if (__DEV__ && kind === "ticket" && ticketId === undefined) {
    console.warn(
      "[GoogleWalletButton] kind='ticket' but ticketId is undefined. " +
        "The backend will return 400. Pass ticketId={ticket.id} to this component.",
    );
  }

  if (Platform.OS !== "android") return null;

  const onPress = async () => {
    try {
      const { save_url } = await mutateAsync();
      const can = await Linking.canOpenURL(save_url);
      if (!can) {
        Alert.alert(
          "Wallet isn't available right now.",
          "Please try again later.",
        );
        return;
      }
      await Linking.openURL(save_url);
    } catch {
      Alert.alert(
        "Couldn't create your Wallet pass.",
        "Please check your connection and try again.",
      );
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        accessibilityLabel="Add to Google Wallet"
        accessibilityRole="button"
        onPress={onPress}
        disabled={isPending}
        activeOpacity={0.7}
        style={styles.touchable}
        testID="google-wallet-button"
      >
        {isPending ? (
          <ActivityIndicator color={colors.primary} />
        ) : (
          <Image
            source={require("@/assets/wallet/add-to-google-wallet.png")}
            style={styles.image}
            resizeMode="contain"
            accessibilityIgnoresInvertColors
          />
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    marginVertical: 24,
  },
  touchable: {
    minHeight: 48,
    minWidth: 220,
    alignItems: "center",
    justifyContent: "center",
  },
  image: {
    height: 48,
    width: 220,
  },
});
