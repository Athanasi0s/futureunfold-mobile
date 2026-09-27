import { SHADOW_BLACK } from "@/constants/data-colors";
import { useColors } from "@/hooks/use-colors";
import { ThemedText } from "@/components/themed-text";
import { TenantBackgroundArt } from "@/components/tenant-background-art";
import { getTenantBackgroundSource } from "@/constants/tenant-assets";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import {
  getAdminVenues,
  createAdminVenue,
  updateAdminVenue,
  deleteAdminVenue,
  type AdminVenue,
} from "@/features/admin/api-venues";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { useCallback, useMemo, useRef, useState } from "react";
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
  key: string;
  name: string;
  lat: string;
  lng: string;
  default_zoom: string;
  has_indoor: boolean;
  category: string;
  description: string;
  avatar_url: string;
  company: string;
  booth_number: string;
  extrusion_height: string;
  sort_order: string;
  is_active: boolean;
  capacity: string;
};

const EMPTY_FORM: FormData = {
  key: "",
  name: "",
  lat: "",
  lng: "",
  default_zoom: "15",
  has_indoor: false,
  category: "",
  description: "",
  avatar_url: "",
  company: "",
  booth_number: "",
  extrusion_height: "0",
  sort_order: "0",
  is_active: true,
  capacity: "",
};

export default function AdminVenuesScreen() {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const { width } = useWindowDimensions();
  const hasBackgroundArt = Boolean(getTenantBackgroundSource());
  const artworkHeight = width * (1864 / 2100);

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "venues", debouncedSearch],
    queryFn: () => getAdminVenues(debouncedSearch || undefined),
  });

  const createMutation = useMutation({
    mutationFn: createAdminVenue,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "venues"] });
      setShowModal(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data: d }: { id: number; data: Partial<AdminVenue> }) =>
      updateAdminVenue(id, d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "venues"] });
      setShowModal(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteAdminVenue,
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["admin", "venues"] }),
  });

  const handleSearchChange = useCallback((text: string) => {
    setSearch(text);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setDebouncedSearch(text);
    }, 300);
  }, []);

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setShowModal(true);
  };

  const openEdit = (venue: AdminVenue) => {
    setEditingId(venue.id);
    setForm({
      key: venue.key,
      name: venue.name,
      lat: String(venue.lat),
      lng: String(venue.lng),
      default_zoom: String(venue.default_zoom),
      has_indoor: venue.has_indoor,
      category: venue.category,
      description: venue.description || "",
      avatar_url: venue.avatar_url || "",
      company: venue.company || "",
      booth_number: venue.booth_number || "",
      extrusion_height: String(venue.extrusion_height),
      sort_order: String(venue.sort_order),
      is_active: venue.is_active,
      capacity: venue.capacity != null ? String(venue.capacity) : "",
    });
    setShowModal(true);
  };

  const handleSave = useCallback(() => {
    const lat = parseFloat(form.lat);
    const lng = parseFloat(form.lng);
    if (!form.name || !form.key || isNaN(lat) || isNaN(lng)) {
      Alert.alert(t("admin.venues.alert.validationTitle"), t("admin.venues.alert.validationMessage"));
      return;
    }

    const payload = {
      key: form.key,
      name: form.name,
      lat,
      lng,
      default_zoom: parseFloat(form.default_zoom) || 15,
      has_indoor: form.has_indoor,
      category: form.category,
      description: form.description || undefined,
      avatar_url: form.avatar_url || undefined,
      company: form.company || undefined,
      booth_number: form.booth_number || undefined,
      extrusion_height: parseFloat(form.extrusion_height) || 0,
      sort_order: parseInt(form.sort_order, 10) || 0,
      is_active: form.is_active,
      capacity: form.capacity ? parseInt(form.capacity, 10) : undefined,
    };

    if (editingId != null) {
      updateMutation.mutate({ id: editingId, data: payload });
    } else {
      createMutation.mutate(payload as Omit<AdminVenue, "id">);
    }
  }, [form, editingId, createMutation, updateMutation, t]);

  const handleDelete = useCallback(
    (venue: AdminVenue) => {
      Alert.alert(t("admin.venues.alert.deleteTitle"), t("admin.venues.alert.deleteMessage", { name: venue.name }), [
        { text: t("admin.venues.alert.cancel"), style: "cancel" },
        {
          text: t("admin.venues.alert.deleteConfirmButton"),
          style: "destructive",
          onPress: () => deleteMutation.mutate(venue.id),
        },
      ]);
    },
    [deleteMutation, t],
  );

  const renderVenue = ({ item }: { item: AdminVenue }) => (
    <TouchableOpacity
      style={styles.row}
      activeOpacity={0.7}
      onPress={() => openEdit(item)}
    >
      <View style={styles.rowInfo}>
        <View style={styles.rowHeader}>
          <ThemedText style={styles.rowName}>{item.name}</ThemedText>
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
              {item.is_active ? t("admin.venues.statusActive") : t("admin.venues.statusInactive")}
            </ThemedText>
          </View>
        </View>
        <ThemedText style={styles.rowSubtext}>
          {item.key} &middot; {item.category}
        </ThemedText>
        {item.has_indoor && (
          <View style={[styles.tagBadge, { backgroundColor: colors.primary + "20" }]}>
            <ThemedText style={[styles.tagText, { color: colors.primary }]}>
              {t("admin.venues.indoorMapBadge")}
            </ThemedText>
          </View>
        )}
      </View>
      <TouchableOpacity
        onPress={() => handleDelete(item)}
        style={styles.deleteBtn}
      >
        <Ionicons name="trash" size={18} color={colors.error} />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <>
      <Stack.Screen options={{ headerShown: true, title: t("admin.venues.title") }} />
      <SafeAreaView style={styles.container} edges={["bottom"]}>
        {hasBackgroundArt && (
          <TenantBackgroundArt
            variant="secondary"
            style={[styles.backgroundArt, { width, height: artworkHeight }]}
          />
        )}
        <View style={styles.searchContainer}>
          <Ionicons
            name="search"
            size={18}
            color={colors.placeholder}
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder={t("admin.venues.searchPlaceholder")}
            placeholderTextColor={colors.placeholder}
            value={search}
            onChangeText={handleSearchChange}
          />
        </View>

        {isLoading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <FlatList
            data={data ?? []}
            keyExtractor={(item) => String(item.id)}
            renderItem={renderVenue}
            contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 80 }]}
            ListEmptyComponent={
              <View style={styles.centered}>
                <ThemedText style={styles.emptyText}>
                  {t("admin.venues.emptyText")}
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
                    {editingId != null ? t("admin.venues.editTitle") : t("admin.venues.newTitle")}
                  </ThemedText>
                  <TouchableOpacity onPress={() => setShowModal(false)}>
                    <Ionicons name="close" size={24} color={colors.text} />
                  </TouchableOpacity>
                </View>

                <FormField
                  label={t("admin.venues.fields.key")}
                  value={form.key}
                  onChangeText={(key) => setForm((f) => ({ ...f, key }))}
                  editable={editingId == null}
                  colors={colors}
                  styles={styles}
                />
                <FormField
                  label={t("admin.venues.fields.name")}
                  value={form.name}
                  onChangeText={(name) => setForm((f) => ({ ...f, name }))}
                  colors={colors}
                  styles={styles}
                />
                <FormField
                  label={t("admin.venues.fields.category")}
                  value={form.category}
                  onChangeText={(category) => setForm((f) => ({ ...f, category }))}
                  colors={colors}
                  styles={styles}
                />
                <FormField
                  label={t("admin.venues.fields.latitude")}
                  helper="GPS coordinate for map placement"
                  value={form.lat}
                  onChangeText={(lat) => setForm((f) => ({ ...f, lat }))}
                  keyboardType="decimal-pad"
                  colors={colors}
                  styles={styles}
                />
                <FormField
                  label={t("admin.venues.fields.longitude")}
                  helper="GPS coordinate for map placement"
                  value={form.lng}
                  onChangeText={(lng) => setForm((f) => ({ ...f, lng }))}
                  keyboardType="decimal-pad"
                  colors={colors}
                  styles={styles}
                />
                <FormField
                  label={t("admin.venues.fields.defaultZoom")}
                  value={form.default_zoom}
                  onChangeText={(default_zoom) =>
                    setForm((f) => ({ ...f, default_zoom }))
                  }
                  keyboardType="decimal-pad"
                  colors={colors}
                  styles={styles}
                />
                <FormField
                  label={t("admin.venues.fields.description")}
                  value={form.description}
                  onChangeText={(description) =>
                    setForm((f) => ({ ...f, description }))
                  }
                  multiline
                  colors={colors}
                  styles={styles}
                />
                <FormField
                  label={t("admin.venues.fields.avatarUrl")}
                  value={form.avatar_url}
                  onChangeText={(avatar_url) =>
                    setForm((f) => ({ ...f, avatar_url }))
                  }
                  colors={colors}
                  styles={styles}
                />
                <FormField
                  label={t("admin.venues.fields.company")}
                  value={form.company}
                  onChangeText={(company) => setForm((f) => ({ ...f, company }))}
                  colors={colors}
                  styles={styles}
                />
                <FormField
                  label={t("admin.venues.fields.boothNumber")}
                  helper="Identifier for exhibitor booths"
                  value={form.booth_number}
                  onChangeText={(booth_number) =>
                    setForm((f) => ({ ...f, booth_number }))
                  }
                  colors={colors}
                  styles={styles}
                />
                <FormField
                  label={t("admin.venues.fields.extrusionHeight")}
                  helper="Building height for map visualization, in meters"
                  value={form.extrusion_height}
                  onChangeText={(extrusion_height) =>
                    setForm((f) => ({ ...f, extrusion_height }))
                  }
                  keyboardType="decimal-pad"
                  colors={colors}
                  styles={styles}
                />
                <FormField
                  label={t("admin.venues.fields.sortOrder")}
                  helper="Order in the venue list, lower numbers appear first"
                  value={form.sort_order}
                  onChangeText={(sort_order) =>
                    setForm((f) => ({ ...f, sort_order }))
                  }
                  keyboardType="number-pad"
                  colors={colors}
                  styles={styles}
                />
                <FormField
                  label={t("admin.venues.fields.capacity")}
                  helper="Maximum occupancy, used for crowd density"
                  value={form.capacity}
                  onChangeText={(capacity) => setForm((f) => ({ ...f, capacity }))}
                  keyboardType="number-pad"
                  colors={colors}
                  styles={styles}
                />

                <View style={styles.switchGroup}>
                  <View style={styles.switchRow}>
                    <ThemedText style={styles.fieldLabel}>{t("admin.venues.fields.active")}</ThemedText>
                    <Switch
                      value={form.is_active}
                      onValueChange={(is_active) =>
                        setForm((f) => ({ ...f, is_active }))
                      }
                      trackColor={{
                        false: colors.switchTrackOff,
                        true: colors.primary,
                      }}
                    />
                  </View>
                  <ThemedText style={styles.fieldHelper}>Inactive venues are hidden from attendees</ThemedText>
                </View>

                <View style={styles.switchGroup}>
                  <View style={styles.switchRow}>
                    <ThemedText style={styles.fieldLabel}>{t("admin.venues.fields.hasIndoorMap")}</ThemedText>
                    <Switch
                      value={form.has_indoor}
                      onValueChange={(has_indoor) =>
                        setForm((f) => ({ ...f, has_indoor }))
                      }
                      trackColor={{
                        false: colors.switchTrackOff,
                        true: colors.primary,
                      }}
                    />
                  </View>
                  <ThemedText style={styles.fieldHelper}>Enable to upload an indoor floor plan</ThemedText>
                </View>

                <TouchableOpacity
                  style={styles.saveButton}
                  onPress={handleSave}
                  disabled={
                    createMutation.isPending || updateMutation.isPending
                  }
                >
                  {createMutation.isPending || updateMutation.isPending ? (
                    <ActivityIndicator size="small" color={COLOR_WHITE_ON_ACCENT} />
                  ) : (
                    <ThemedText style={styles.saveButtonText}>{t("admin.venues.saveButton")}</ThemedText>
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
  helper,
  value,
  onChangeText,
  keyboardType,
  multiline,
  editable = true,
  colors,
  styles,
}: {
  label: string;
  helper?: string;
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
      {helper && (
        <ThemedText style={styles.fieldHelper}>{helper}</ThemedText>
      )}
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
    searchContainer: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.searchBackground,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.searchBorder,
      marginHorizontal: 16,
      marginVertical: 12,
      paddingHorizontal: 12,
    },
    searchIcon: {
      marginRight: 8,
    },
    searchInput: {
      flex: 1,
      height: 42,
      fontSize: 15,
      color: colors.text,
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
      paddingTop: 0,
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.cardBackground,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      padding: 14,
      marginBottom: 8,
    },
    rowInfo: {
      flex: 1,
    },
    rowHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      marginBottom: 4,
    },
    rowName: {
      fontSize: 15,
      fontWeight: "600",
      color: colors.text,
    },
    rowSubtext: {
      fontSize: 13,
      color: colors.textSecondary,
      marginBottom: 4,
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
    tagBadge: {
      alignSelf: "flex-start",
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 8,
    },
    tagText: {
      fontSize: 11,
      fontWeight: "600",
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
      marginBottom: 4,
    },
    fieldHelper: {
      fontSize: 11,
      color: colors.textSecondary,
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
    switchGroup: {
      marginBottom: 20,
    },
    switchRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 4,
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
