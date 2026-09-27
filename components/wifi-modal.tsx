import * as Clipboard from "expo-clipboard";
import { Ionicons } from "@expo/vector-icons";
import { useColors } from "@/hooks/use-colors";
import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { useConfigStore } from "@/features/config/stores/config-store";

import { COLOR_WHITE_ON_ACCENT } from "@/constants/theme";
import { ThemedText } from "@/components/themed-text";
type Props = {
  visible: boolean;
  onClose: () => void;
};

type WifiConfig = {
  wifi_ssid?: string | null;
  wifi_password?: string | null;
};

export function WifiModal({ visible, onClose }: Props) {
  const colors = useColors();
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);
  const storeSsid = useConfigStore((s) => s.wifiSsid);
  const storePassword = useConfigStore((s) => s.wifiPassword);
  const fetchAndCacheConfig = useConfigStore((s) => s.fetchAndCacheConfig);
  const [wifiConfig, setWifiConfig] = useState<WifiConfig>({
    wifi_ssid: storeSsid,
    wifi_password: storePassword,
  });

  // Refresh from /config on every open so the modal shows the latest admin-set values
  useEffect(() => {
    if (!visible) return;
    setWifiConfig({ wifi_ssid: storeSsid, wifi_password: storePassword });
    (async () => {
      await fetchAndCacheConfig();
      const fresh = useConfigStore.getState();
      setWifiConfig({
        wifi_ssid: fresh.wifiSsid,
        wifi_password: fresh.wifiPassword,
      });
    })();
  }, [fetchAndCacheConfig, storePassword, storeSsid, visible]);

  // Reset transient UI when modal closes
  useEffect(() => {
    if (!visible) {
      setCopied(false);
    }
  }, [visible]);

  const hasCredentials = !!wifiConfig.wifi_ssid && !!wifiConfig.wifi_password;

  const handleCopyPassword = async () => {
    if (!wifiConfig.wifi_password) return;
    await Clipboard.setStringAsync(wifiConfig.wifi_password);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable
        style={styles.overlay}
        onPress={onClose}
      >
        <Pressable
          accessibilityLabel="WiFi credentials modal"
          style={[styles.card, { backgroundColor: colors.cardBackground }]}
          onPress={() => {/* Prevent backdrop press from propagating */}}
        >
          {/* Icon */}
          <View style={styles.iconRow}>
            <Ionicons name="wifi" size={28} color={colors.primary} />
          </View>

          {/* Heading */}
          <ThemedText style={[styles.heading, { color: colors.text }]}>
            {t("wifi.modalTitle", { defaultValue: "WiFi Network" })}
          </ThemedText>

          {/* Separator */}
          <View style={[styles.separator, { backgroundColor: colors.cardBorder }]} />

          {hasCredentials ? (
            <>
              {/* Network Name */}
              <ThemedText style={[styles.label, { color: colors.textSecondary }]}>
                {t("wifi.networkNameLabel", { defaultValue: "Network Name" })}
              </ThemedText>
              <ThemedText style={[styles.value, { color: colors.text }]}>
                {wifiConfig.wifi_ssid}
              </ThemedText>

              {/* Password */}
              <ThemedText style={[styles.label, { color: colors.textSecondary }]}>
                {t("wifi.passwordLabel", { defaultValue: "Password" })}
              </ThemedText>
              <ThemedText style={[styles.value, { color: colors.text }]}>
                {"••••••••"}
              </ThemedText>

              {/* Copy Password Button */}
              <TouchableOpacity
                style={[styles.copyButton, { backgroundColor: colors.primary }]}
                onPress={handleCopyPassword}
                activeOpacity={0.8}
              >
                <ThemedText style={styles.copyButtonText}>
                  {copied
                    ? t("wifi.copied", { defaultValue: "Copied!" })
                    : t("wifi.copyPassword", { defaultValue: "Copy Password" })}
                </ThemedText>
              </TouchableOpacity>
            </>
          ) : (
            <ThemedText style={[styles.notConfigured, { color: colors.textSecondary }]}>
              {t("wifi.notConfigured", { defaultValue: "Not configured yet" })}
            </ThemedText>
          )}

          {/* Done Button */}
          <TouchableOpacity
            style={styles.doneButton}
            onPress={onClose}
            activeOpacity={0.7}
          >
            <ThemedText style={[styles.doneText, { color: colors.textSecondary }]}>
              {t("common.done", { defaultValue: "Done" })}
            </ThemedText>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  card: {
    width: "85%",
    borderRadius: 16,
    paddingHorizontal: 24,
    paddingVertical: 24,
  },
  iconRow: {
    alignItems: "center",
    marginBottom: 12,
  },
  heading: {
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 16,
  },
  separator: {
    height: 1,
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 4,
  },
  value: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 14,
  },
  notConfigured: {
    fontSize: 14,
    fontStyle: "italic",
    textAlign: "center",
    marginBottom: 16,
  },
  copyButton: {
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
    marginBottom: 8,
  },
  copyButtonText: {
    color: COLOR_WHITE_ON_ACCENT,
    fontSize: 15,
    fontWeight: "600",
  },
  doneButton: {
    paddingVertical: 12,
    alignItems: "center",
  },
  doneText: {
    fontSize: 14,
    fontWeight: "700",
  },
});
