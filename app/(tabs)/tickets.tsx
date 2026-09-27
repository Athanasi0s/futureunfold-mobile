import React, { useState } from "react";
import {
  View,
  ScrollView,
  RefreshControl,
  StyleSheet,
  Alert,
  TouchableOpacity,
  useWindowDimensions,
} from "react-native";
import { useTranslation } from "react-i18next";
import { SafeAreaView } from "react-native-safe-area-context";
import { useColors } from "@/hooks/use-colors";
import { useTicketPackages } from "@/features/ticketing/hooks/useTicketPackages";
import { useCreateCheckout } from "@/features/ticketing/hooks/useCreateCheckout";
import { useMyTickets } from "@/features/ticketing/hooks/useMyTickets";
import { TicketPackageCard } from "@/features/ticketing/components/TicketPackageCard";
import { TicketQRModal } from "@/features/ticketing/components/TicketQRModal";
import { TICKET_STATUS_COLORS as STATUS_COLORS } from "@/constants/data-colors";
import type { TicketOut } from "@/api/schemas";
import { ThemedText } from "@/components/themed-text";
import { TenantBackgroundArt } from "@/components/tenant-background-art";
import { getTenantBackgroundSource } from "@/constants/tenant-assets";

export default function TicketsScreen() {
  const { t } = useTranslation();
  const colors = useColors();
  const { data: packages, isLoading, isError, refetch } = useTicketPackages();
  const { mutate: startCheckout, isPending: isBuying, variables: buyingPackageId } = useCreateCheckout();
  const { data: myTickets } = useMyTickets();
  const [selectedTicket, setSelectedTicket] = useState<TicketOut | null>(null);
  const { width } = useWindowDimensions();
  const hasBackgroundArt = Boolean(getTenantBackgroundSource());
  const artworkHeight = width * (1864 / 2100);

  function handleBuy(packageId: number) {
    startCheckout(packageId, {
      onError: () => Alert.alert(t("tickets.purchaseFailed"), t("tickets.purchaseFailedMessage")),
    });
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {hasBackgroundArt && (
        <TenantBackgroundArt
          variant="secondary"
          style={[styles.backgroundArt, { width, height: artworkHeight }]}
        />
      )}
      <ScrollView
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} />}
        contentContainerStyle={styles.content}
      >
        <ThemedText style={[styles.sectionHeader, { color: colors.text }]}>{t("tickets.myTickets")}</ThemedText>
        {(!myTickets || myTickets.length === 0) ? (
          <ThemedText style={[styles.placeholder, { color: colors.textSecondary }]}>
            {t("tickets.noTickets")}
          </ThemedText>
        ) : (
          myTickets.map((ticket) => (
            <TouchableOpacity
              key={ticket.id}
              style={[styles.ticketRow, { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder }]}
              onPress={() => setSelectedTicket(ticket)}
            >
              <View style={styles.ticketInfo}>
                <ThemedText style={[styles.ticketName, { color: colors.text }]}>{ticket.package_name}</ThemedText>
                <ThemedText style={[styles.ticketDate, { color: colors.textSecondary }]}>
                  {new Date(ticket.created_at).toLocaleDateString()}
                </ThemedText>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: STATUS_COLORS[ticket.status] + "22" }]}>
                <ThemedText style={[styles.statusText, { color: STATUS_COLORS[ticket.status] }]}>
                  {ticket.status.toUpperCase()}
                </ThemedText>
              </View>
            </TouchableOpacity>
          ))
        )}

        <ThemedText style={[styles.sectionHeader, { color: colors.text }]}>{t("tickets.buyATicket")}</ThemedText>
        {isError && (
          <ThemedText style={[styles.error, { color: colors.error }]}>
            {t("tickets.loadError")}
          </ThemedText>
        )}
        {packages?.map((pkg) => (
          <TicketPackageCard
            key={pkg.id}
            package={pkg}
            onBuy={() => handleBuy(pkg.id)}
            isBuying={isBuying && buyingPackageId === pkg.id}
          />
        ))}
      </ScrollView>
      <TicketQRModal ticket={selectedTicket} onClose={() => setSelectedTicket(null)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  backgroundArt: {
    position: "absolute",
    top: 0,
    alignSelf: "center",
    opacity: 0.16,
  },
  content: { padding: 16 },
  sectionHeader: { fontSize: 20, fontWeight: "700", marginTop: 8, marginBottom: 16 },
  error: { marginBottom: 16 },
  placeholder: { fontSize: 14, fontStyle: "italic" },
  ticketRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
  },
  ticketInfo: { flex: 1 },
  ticketName: { fontSize: 16, fontWeight: "600", marginBottom: 4 },
  ticketDate: { fontSize: 13 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  statusText: { fontSize: 12, fontWeight: "600" },
});
