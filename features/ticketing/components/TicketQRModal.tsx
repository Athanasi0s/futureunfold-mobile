import React, { useRef, useCallback } from "react";
import {
  Alert,
  Modal,
  Platform,
  View,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from "react-native";
import QRCode from "react-native-qrcode-svg";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import * as FileSystem from "expo-file-system/legacy";
import { useConfigStore } from "@/features/config/stores/config-store";
import { ID_CARD_COLORS } from "@/constants/data-colors";
import { useColors } from "@/hooks/use-colors";
import type { TicketOut } from "@/api/schemas";
import { useTranslation } from "react-i18next";

import { COLOR_WHITE_ON_ACCENT } from "@/constants/theme";
import { GoogleWalletButton } from "@/components/wallet/GoogleWalletButton";
import { ThemedText } from "@/components/themed-text";

type Props = {
  ticket: TicketOut | null;
  onClose: () => void;
};

export function TicketQRModal({ ticket, onClose }: Props) {
  const colors = useColors();
  const { t } = useTranslation();
  const appName = useConfigStore((s) => s.appName);
  const qrRef = useRef<any>(null);

  const getQrBase64 = useCallback((): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (!qrRef.current) return reject(new Error("QR ref not ready"));
      qrRef.current.toDataURL((data: string) => resolve(data));
    });
  }, []);

  if (!ticket) return null;

  async function handleDownloadPdf() {
    if (!ticket) return;
    try {
      let qrDataUri = "";
      try {
        const base64 = await getQrBase64();
        qrDataUri = `data:image/png;base64,${base64}`;
      } catch {
        // fallback — no QR image in PDF
      }

      const html = `
        <html><body style="font-family:sans-serif;padding:40px;text-align:center">
          <h1>${appName} Festival</h1>
          <h2>${ticket.package_name}</h2>
          <p>Ticket ID: ${ticket.id}</p>
          <p>Purchased: ${new Date(ticket.created_at).toLocaleDateString()}</p>
          ${qrDataUri
            ? `<div style="margin:24px 0"><img src="${qrDataUri}" width="200" height="200" /></div>`
            : `<p>QR Code: ${ticket.qr_code}</p>`
          }
          <p style="font-size:11px;color:${ID_CARD_COLORS.labelInk}">Present this QR code at the entrance.</p>
        </body></html>
      `;
      const { uri } = await Print.printToFileAsync({ html });

      if (Platform.OS === "android") {
        try {
          const permissions = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
          if (!permissions.granted) {
            // Fallback to share sheet if user cancels
            await Sharing.shareAsync(uri, { mimeType: "application/pdf" });
            return;
          }
          const destUri = await FileSystem.StorageAccessFramework.createFileAsync(
            permissions.directoryUri,
            "ticket.pdf",
            "application/pdf"
          );
          const pdfBase64 = await FileSystem.readAsStringAsync(uri, {
            encoding: FileSystem.EncodingType.Base64,
          });
          await FileSystem.writeAsStringAsync(destUri, pdfBase64, {
            encoding: FileSystem.EncodingType.Base64,
          });
          Alert.alert("Saved", "Ticket saved to Downloads");
        } catch (error) {
          Alert.alert("Error", "Couldn't save ticket. Check storage permissions and try again.");
        }
      } else {
        // iOS: share-to-files UX (acceptable per research)
        await Sharing.shareAsync(uri, { mimeType: "application/pdf", dialogTitle: "Save Ticket" });
      }
    } catch (e) {
      // PDF generation failed or sharing cancelled — silently ignore
    }
  }

  return (
    <Modal visible={true} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <ScrollView style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={styles.content}>
        <ThemedText style={[styles.title, { color: colors.text }]}>{ticket.package_name}</ThemedText>
        <ThemedText style={[styles.status, { color: ticket.status === "used" ? colors.error : colors.primary }]}>
          {ticket.status.toUpperCase()}
        </ThemedText>
        <View style={styles.qrContainer}>
          <QRCode
            value={ticket.qr_code}
            size={220}
            backgroundColor={ID_CARD_COLORS.paper}
            color={ID_CARD_COLORS.ink}
            ecl="M"
            getRef={(ref: any) => (qrRef.current = ref)}
          />
        </View>
        <ThemedText style={[styles.date, { color: colors.textSecondary }]}>
          Purchased: {new Date(ticket.created_at).toLocaleDateString()}
        </ThemedText>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.primary }]}
          onPress={handleDownloadPdf}
        >
          <ThemedText style={styles.buttonText}>Save Ticket</ThemedText>
        </TouchableOpacity>
        {/* Phase 13 gap 5a — per-ticket Google Wallet button.
            Renders null on iOS (Platform.OS gate inside GoogleWalletButton). */}
        <GoogleWalletButton kind="ticket" ticketId={ticket.id} />
        <TouchableOpacity style={[styles.closeButton, { borderColor: colors.cardBorder }]} onPress={onClose}>
          <ThemedText style={[styles.closeText, { color: colors.text }]}>{t("common.close")}</ThemedText>
        </TouchableOpacity>
      </ScrollView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 24, alignItems: "center" },
  title: { fontSize: 22, fontWeight: "700", marginBottom: 8 },
  status: { fontSize: 14, fontWeight: "600", marginBottom: 24 },
  qrContainer: { backgroundColor: COLOR_WHITE_ON_ACCENT, padding: 16, borderRadius: 12, marginBottom: 16 },
  date: { fontSize: 14, marginBottom: 24 },
  button: { width: "100%", borderRadius: 8, paddingVertical: 14, alignItems: "center", marginBottom: 12 },
  buttonText: { color: COLOR_WHITE_ON_ACCENT, fontWeight: "700", fontSize: 16 },
  closeButton: { width: "100%", borderRadius: 8, paddingVertical: 14, alignItems: "center", borderWidth: 1 },
  closeText: { fontWeight: "600", fontSize: 16 },
});
