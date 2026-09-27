import { SHADOW_BLACK } from "@/constants/data-colors";
import { useColors } from "@/hooks/use-colors";
import { ThemedText } from "@/components/themed-text";
import { TenantBackgroundArt } from "@/components/tenant-background-art";
import { getTenantBackgroundSource } from "@/constants/tenant-assets";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import {
  useAdminTicketPackages,
  useCreateTicketPackage,
  useUpdateTicketPackage,
  useDeleteTicketPackage,
} from "@/features/admin/hooks/useAdminTickets";
import type { TicketPackageAdmin } from "@/features/admin/api";
import { Stack } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

import { COLOR_WHITE_ON_ACCENT } from "@/constants/theme";
type FormData = {
  name: string;
  price_eur: string;
  description: string;
  features: string;
  stripe_price_id: string;
  max_quantity: string;
  is_active: boolean;
};

const EMPTY_FORM: FormData = {
  name: "",
  price_eur: "",
  description: "",
  features: "",
  stripe_price_id: "",
  max_quantity: "",
  is_active: true,
};

export default function AdminTicketPackagesScreen() {
  const { t } = useTranslation();
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const insets = useSafeAreaInsets();

  const { data, isLoading } = useAdminTicketPackages();
  const createMutation = useCreateTicketPackage();
  const updateMutation = useUpdateTicketPackage();
  const deleteMutation = useDeleteTicketPackage();

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const { width } = useWindowDimensions();
  const hasBackgroundArt = Boolean(getTenantBackgroundSource());
  const artworkHeight = width * (1864 / 2100);

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setShowModal(true);
  };

  const openEdit = (pkg: TicketPackageAdmin) => {
    setEditingId(pkg.id);
    setForm({
      name: pkg.name,
      price_eur: String(pkg.price_eur),
      description: pkg.description || "",
      features: pkg.features.join(", "),
      stripe_price_id: pkg.stripe_price_id,
      max_quantity: pkg.max_quantity != null ? String(pkg.max_quantity) : "",
      is_active: pkg.is_active,
    });
    setShowModal(true);
  };

  const handleSave = useCallback(() => {
    const features = form.features
      .split(",")
      .map((f) => f.trim())
      .filter(Boolean);
    const price = parseFloat(form.price_eur);
    const maxQty = form.max_quantity ? parseInt(form.max_quantity, 10) : undefined;

    if (editingId != null) {
      updateMutation.mutate(
        {
          id: editingId,
          data: {
            name: form.name || undefined,
            price_eur: isNaN(price) ? undefined : price,
            description: form.description || undefined,
            features: features.length ? features : undefined,
            max_quantity: maxQty,
            is_active: form.is_active,
          },
        },
        { onSuccess: () => setShowModal(false) },
      );
    } else {
      if (!form.name || !form.stripe_price_id || isNaN(price)) {
        Alert.alert(t("admin.ticketPackages.alert.validationTitle"), t("admin.ticketPackages.alert.validationMessage"));
        return;
      }
      createMutation.mutate(
        {
          name: form.name,
          price_eur: price,
          description: form.description || undefined,
          features: features.length ? features : undefined,
          stripe_price_id: form.stripe_price_id,
          max_quantity: maxQty,
          is_active: form.is_active,
        },
        { onSuccess: () => setShowModal(false) },
      );
    }
  }, [form, editingId, createMutation, updateMutation, t]);

  const handleDelete = useCallback(
    (pkg: TicketPackageAdmin) => {
      Alert.alert(t("admin.ticketPackages.alert.deleteTitle"), t("admin.ticketPackages.alert.deleteMessage", { name: pkg.name }), [
        { text: t("admin.ticketPackages.alert.cancel"), style: "cancel" },
        {
          text: t("admin.ticketPackages.alert.deleteConfirmButton"),
          style: "destructive",
          onPress: () => deleteMutation.mutate(pkg.id),
        },
      ]);
    },
    [deleteMutation, t],
  );

  const renderPackage = ({ item }: { item: TicketPackageAdmin }) => (
    <TouchableOpacity
      style={styles.packageRow}
      activeOpacity={0.7}
      onPress={() => openEdit(item)}
    >
      <View style={styles.packageInfo}>
        <View style={styles.packageHeader}>
          <ThemedText style={styles.packageName}>{item.name}</ThemedText>
          <View
            style={[
              styles.statusBadge,
              {
                backgroundColor: item.is_active
                  ? colors.success + "20"
                  : colors.textSecondary + "20",
              },
            ]}
          >
            <ThemedText
              style={[
                styles.statusText,
                {
                  color: item.is_active
                    ? colors.success
                    : colors.textSecondary,
                },
              ]}
            >
              {item.is_active ? t("admin.ticketPackages.statusActive") : t("admin.ticketPackages.statusInactive")}
            </ThemedText>
          </View>
        </View>
        <ThemedText style={styles.packagePrice}>
          EUR {item.price_eur.toFixed(2)}
        </ThemedText>
        <ThemedText style={styles.stripeId}>{item.stripe_price_id}</ThemedText>
      </View>
      <View style={styles.actionBtns}>
        <TouchableOpacity
          onPress={() => openEdit(item)}
          style={styles.editBtn}
        >
          <Ionicons name="pencil" size={18} color={colors.primary} />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => handleDelete(item)}
          style={styles.deleteBtn}
        >
          <Ionicons name="trash" size={18} color={colors.error} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <>
      <Stack.Screen options={{ headerShown: true, title: t("admin.ticketPackages.title") }} />
      <SafeAreaView style={styles.container} edges={["bottom"]}>
        {hasBackgroundArt && (
          <TenantBackgroundArt
            variant="secondary"
            style={[styles.backgroundArt, { width, height: artworkHeight }]}
          />
        )}
        {isLoading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <FlatList
            data={data ?? []}
            keyExtractor={(item) => String(item.id)}
            renderItem={renderPackage}
            contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 80 }]}
            ListEmptyComponent={
              <View style={styles.centered}>
                <ThemedText style={styles.emptyText}>
                  {t("admin.ticketPackages.emptyText")}
                </ThemedText>
              </View>
            }
          />
        )}

        <TouchableOpacity style={[styles.fab, { bottom: 24 + insets.bottom }]} onPress={openCreate}>
          <Ionicons name="add" size={28} color={COLOR_WHITE_ON_ACCENT} />
        </TouchableOpacity>

        <Modal visible={showModal} animationType="slide" transparent>
          <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === "ios" ? "padding" : "height"}>
            <View style={[styles.modalContent, { paddingBottom: insets.bottom + 20 }]}>
              <ScrollView>
                <View style={styles.modalHeader}>
                  <ThemedText style={styles.modalTitle}>
                    {editingId != null ? t("admin.ticketPackages.editTitle") : t("admin.ticketPackages.newTitle")}
                  </ThemedText>
                  <TouchableOpacity onPress={() => setShowModal(false)}>
                    <Ionicons name="close" size={24} color={colors.text} />
                  </TouchableOpacity>
                </View>

                <FormField
                  label={t("admin.ticketPackages.fields.name")}
                  value={form.name}
                  onChangeText={(name) => setForm((f) => ({ ...f, name }))}
                  colors={colors}
                  styles={styles}
                />
                <FormField
                  label={t("admin.ticketPackages.fields.price")}
                  value={form.price_eur}
                  onChangeText={(price_eur) => setForm((f) => ({ ...f, price_eur }))}
                  keyboardType="decimal-pad"
                  colors={colors}
                  styles={styles}
                />
                <FormField
                  label={t("admin.ticketPackages.fields.description")}
                  value={form.description}
                  onChangeText={(description) => setForm((f) => ({ ...f, description }))}
                  multiline
                  colors={colors}
                  styles={styles}
                />
                <FormField
                  label={t("admin.ticketPackages.fields.features")}
                  value={form.features}
                  onChangeText={(features) => setForm((f) => ({ ...f, features }))}
                  colors={colors}
                  styles={styles}
                />
                <FormField
                  label={t("admin.ticketPackages.fields.stripePriceId")}
                  value={form.stripe_price_id}
                  onChangeText={(stripe_price_id) => setForm((f) => ({ ...f, stripe_price_id }))}
                  editable={editingId == null}
                  colors={colors}
                  styles={styles}
                />
                <FormField
                  label={t("admin.ticketPackages.fields.maxQuantity")}
                  value={form.max_quantity}
                  onChangeText={(max_quantity) => setForm((f) => ({ ...f, max_quantity }))}
                  keyboardType="number-pad"
                  colors={colors}
                  styles={styles}
                />

                <View style={styles.switchRow}>
                  <ThemedText style={styles.fieldLabel}>{t("admin.ticketPackages.fields.active")}</ThemedText>
                  <Switch
                    value={form.is_active}
                    onValueChange={(is_active) => setForm((f) => ({ ...f, is_active }))}
                    trackColor={{
                      false: colors.switchTrackOff,
                      true: colors.primary,
                    }}
                  />
                </View>

                <TouchableOpacity
                  style={styles.saveButton}
                  onPress={handleSave}
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  {createMutation.isPending || updateMutation.isPending ? (
                    <ActivityIndicator size="small" color={COLOR_WHITE_ON_ACCENT} />
                  ) : (
                    <ThemedText style={styles.saveButtonText}>{t("admin.ticketPackages.saveButton")}</ThemedText>
                  )}
                </TouchableOpacity>
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </Modal>
      </SafeAreaView>
    </>
  );
}

function FormField({
  label,
  value,
  onChangeText,
  keyboardType,
  multiline,
  editable = true,
  colors,
  styles,
}: {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  keyboardType?: "default" | "decimal-pad" | "number-pad";
  multiline?: boolean;
  editable?: boolean;
  colors: ReturnType<typeof useColors>;
  styles: ReturnType<typeof createStyles>;
}) {
  return (
    <View style={styles.field}>
      <ThemedText style={styles.fieldLabel}>{label}</ThemedText>
      <TextInput
        style={[
          styles.fieldInput,
          multiline && styles.fieldMultiline,
          !editable && styles.fieldDisabled,
        ]}
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        multiline={multiline}
        editable={editable}
        placeholderTextColor={colors.placeholder}
      />
    </View>
  );
}

const createStyles = (colors: ReturnType<typeof useColors>) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    backgroundArt: {
      position: "absolute",
      top: 0,
      alignSelf: "center",
      opacity: 0.16,
    },
    centered: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      paddingTop: 40,
    },
    emptyText: {
      color: colors.textSecondary,
      fontSize: 15,
    },
    list: {
      padding: 16,
    },
    packageRow: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.cardBackground,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      padding: 14,
      marginBottom: 8,
    },
    packageInfo: {
      flex: 1,
    },
    packageHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      marginBottom: 4,
    },
    packageName: {
      fontSize: 15,
      fontWeight: "600",
      color: colors.text,
    },
    statusBadge: {
      paddingHorizontal: 6,
      paddingVertical: 1,
      borderRadius: 6,
    },
    statusText: {
      fontSize: 10,
      fontWeight: "700",
    },
    packagePrice: {
      fontSize: 14,
      fontWeight: "700",
      color: colors.primary,
      marginBottom: 2,
    },
    stripeId: {
      fontSize: 11,
      color: colors.textSubtle,
    },
    actionBtns: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
    },
    editBtn: {
      padding: 8,
    },
    deleteBtn: {
      padding: 8,
    },
    fab: {
      position: "absolute",
      bottom: 24,
      right: 24,
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: colors.primary,
      justifyContent: "center",
      alignItems: "center",
      elevation: 4,
      shadowColor: SHADOW_BLACK,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 4,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.6)",
      justifyContent: "flex-end",
    },
    modalContent: {
      backgroundColor: colors.gradientStart,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      padding: 20,
      maxHeight: "80%",
    },
    modalHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 16,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: "700",
      color: colors.text,
    },
    field: {
      marginBottom: 14,
    },
    fieldLabel: {
      fontSize: 13,
      fontWeight: "600",
      color: colors.label,
      marginBottom: 6,
    },
    fieldInput: {
      backgroundColor: colors.inputBackground,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: 12,
      paddingVertical: 10,
      fontSize: 14,
      color: colors.text,
    },
    fieldMultiline: {
      height: 80,
      textAlignVertical: "top",
    },
    fieldDisabled: {
      opacity: 0.5,
    },
    switchRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 20,
    },
    saveButton: {
      backgroundColor: colors.primary,
      borderRadius: 10,
      paddingVertical: 14,
      alignItems: "center",
      marginBottom: 20,
    },
    saveButtonText: {
      fontSize: 16,
      fontWeight: "700",
      color: COLOR_WHITE_ON_ACCENT,
    },
  });
