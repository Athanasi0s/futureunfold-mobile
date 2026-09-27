import React, { useState } from "react";
import {
  View,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { SafeAreaView } from "react-native-safe-area-context";
import { COLOR_WHITE_ON_ACCENT } from "@/constants/theme";
import { useColors } from "@/hooks/use-colors";
import { useValidateTicket } from "@/features/ticketing/hooks/useValidateTicket";
import type { TicketValidateOut } from "@/api/schemas";
import { useTranslation } from "react-i18next";
import { ThemedText } from "@/components/themed-text";

type ValidationResult =
  | { kind: "success"; data: TicketValidateOut }
  | { kind: "error"; message: string };

export function ValidateTicketScreen() {
  const colors = useColors();
  const { t } = useTranslation();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [result, setResult] = useState<ValidationResult | null>(null);
  const { mutate: validate, isPending } = useValidateTicket();

  function handleBarCodeScanned({ data }: { data: string }) {
    if (scanned || isPending) return;
    setScanned(true);

    validate(data, {
      onSuccess: (res) => setResult({ kind: "success", data: res }),
      onError: (err: any) => {
        const detail = err?.response?.data?.detail ?? "Validation failed.";
        setResult({ kind: "error", message: detail });
      },
    });
  }

  function reset() {
    setScanned(false);
    setResult(null);
  }

  if (!permission?.granted) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <ThemedText style={[styles.text, { color: colors.text }]}>{t("scan.validateTicket.cameraPermissionRequired")}</ThemedText>
        <TouchableOpacity style={[styles.button, { backgroundColor: colors.primary }]} onPress={requestPermission}>
          <ThemedText style={styles.buttonText}>{t("scan.grantPermission")}</ThemedText>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  if (result) {
    const isSuccess = result.kind === "success";
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.resultCard, { backgroundColor: isSuccess ? colors.success : colors.error, opacity: 0.85 }]}>
          <ThemedText style={styles.resultStatus}>
            {isSuccess ? t("scan.validateTicket.valid") : t("scan.validateTicket.invalid")}
          </ThemedText>
          {result.kind === "success" && (
            <>
              <ThemedText style={styles.resultText}>{t("scan.validateTicket.buyer", { name: result.data.buyer_name })}</ThemedText>
              <ThemedText style={styles.resultText}>{t("scan.validateTicket.ticket", { name: result.data.package_name })}</ThemedText>
              <ThemedText style={styles.resultText}>
                {t("scan.validateTicket.purchased", { date: new Date(result.data.purchased_at).toLocaleDateString() })}
              </ThemedText>
            </>
          )}
          {result.kind === "error" && (
            <ThemedText style={styles.resultText}>{result.message}</ThemedText>
          )}
        </View>
        <TouchableOpacity style={[styles.button, { backgroundColor: colors.primary }]} onPress={reset}>
          <ThemedText style={styles.buttonText}>{t("scan.validateTicket.scanAnother")}</ThemedText>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ThemedText style={[styles.header, { color: colors.text }]}>{t("scan.validateTicket.header")}</ThemedText>
      <CameraView
        style={styles.camera}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
      />
      <ThemedText style={[styles.hint, { color: colors.textSecondary }]}>
        {t("scan.validateTicket.hint")}
      </ThemedText>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, alignItems: "center" },
  header: { fontSize: 20, fontWeight: "700", marginBottom: 16 },
  camera: { width: "100%", aspectRatio: 1, borderRadius: 12, marginBottom: 16 },
  hint: { fontSize: 14, textAlign: "center" },
  text: { fontSize: 16, marginBottom: 16, textAlign: "center" },
  resultCard: { width: "100%", borderRadius: 12, padding: 24, marginBottom: 24, alignItems: "center" },
  resultStatus: { color: COLOR_WHITE_ON_ACCENT, fontSize: 18, fontWeight: "800", marginBottom: 12 },
  resultText: { color: COLOR_WHITE_ON_ACCENT, fontSize: 15, marginBottom: 4, opacity: 0.9 },
  button: { width: "100%", borderRadius: 8, paddingVertical: 14, alignItems: "center" },
  buttonText: { color: COLOR_WHITE_ON_ACCENT, fontWeight: "700", fontSize: 16 },
});
