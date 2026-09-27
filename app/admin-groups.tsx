import { SHADOW_BLACK } from "@/constants/data-colors";
import { useColors } from "@/hooks/use-colors";
import { ThemedText } from "@/components/themed-text";
import { TenantBackgroundArt } from "@/components/tenant-background-art";
import { getTenantBackgroundSource } from "@/constants/tenant-assets";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import {
  getAdminGroups,
  createAdminGroup,
  updateAdminGroup,
  deleteAdminGroup,
  type AdminGroup,
} from "@/features/admin/api-groups";
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
const PAGE_SIZE = 20;

type FormData = {
  group_type: string;
  ref_key: string;
  title: string;
  description: string;
};

const EMPTY_FORM: FormData = {
  group_type: "",
  ref_key: "",
  title: "",
  description: "",
};

function formatTimestamp(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function AdminGroupsScreen() {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [offset, setOffset] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const { width } = useWindowDimensions();
  const hasBackgroundArt = Boolean(getTenantBackgroundSource());
  const artworkHeight = width * (1864 / 2100);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["admin", "groups", debouncedSearch, offset],
    queryFn: () =>
      getAdminGroups({
        search: debouncedSearch || undefined,
        offset,
        limit: PAGE_SIZE,
      }),
  });

  const createMutation = useMutation({
    mutationFn: createAdminGroup,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "groups"] });
      setShowModal(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      data: d,
    }: {
      id: number;
      data: Parameters<typeof updateAdminGroup>[1];
    }) => updateAdminGroup(id, d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "groups"] });
      setShowModal(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteAdminGroup,
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["admin", "groups"] }),
  });

  const handleSearchChange = useCallback((text: string) => {
    setSearch(text);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setDebouncedSearch(text);
      setOffset(0);
    }, 300);
  }, []);

  const handleEndReached = useCallback(() => {
    if (data && offset + PAGE_SIZE < data.total && !isFetching) {
      setOffset((prev) => prev + PAGE_SIZE);
    }
  }, [data, offset, isFetching]);

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setShowModal(true);
  };

  const openEdit = (group: AdminGroup) => {
    setEditingId(group.id);
    setForm({
      group_type: group.group_type,
      ref_key: group.ref_key,
      title: group.title,
      description: group.description || "",
    });
    setShowModal(true);
  };

  const handleSave = useCallback(() => {
    if (!form.title || !form.group_type || !form.ref_key) {
      Alert.alert(t("admin.groups.alert.validationTitle"), t("admin.groups.alert.validationMessage"));
      return;
    }

    if (editingId != null) {
      updateMutation.mutate({
        id: editingId,
        data: {
          group_type: form.group_type,
          title: form.title,
          description: form.description || undefined,
        },
      });
    } else {
      createMutation.mutate({
        group_type: form.group_type,
        ref_key: form.ref_key,
        title: form.title,
        description: form.description || undefined,
      });
    }
  }, [form, editingId, createMutation, updateMutation, t]);

  const handleDelete = useCallback(
    (group: AdminGroup) => {
      Alert.alert(t("admin.groups.alert.deleteTitle"), t("admin.groups.alert.deleteMessage", { title: group.title }), [
        { text: t("admin.groups.alert.cancel"), style: "cancel" },
        {
          text: t("admin.groups.alert.deleteConfirmButton"),
          style: "destructive",
          onPress: () => deleteMutation.mutate(group.id),
        },
      ]);
    },
    [deleteMutation, t],
  );

  const renderGroup = ({ item }: { item: AdminGroup }) => (
    <TouchableOpacity
      style={styles.row}
      activeOpacity={0.7}
      onPress={() => openEdit(item)}
    >
      <View style={styles.rowInfo}>
        <View style={styles.rowHeader}>
          <ThemedText style={styles.rowName}>{item.title}</ThemedText>
          <View
            style={[
              styles.typeBadge,
              { backgroundColor: colors.primary + "20" },
            ]}
          >
            <ThemedText style={[styles.typeText, { color: colors.primary }]}>
              {item.group_type}
            </ThemedText>
          </View>
        </View>
        <ThemedText style={styles.rowSubtext}>
          {item.member_count} members &middot; {formatTimestamp(item.created_at)}
        </ThemedText>
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
      <Stack.Screen options={{ headerShown: true, title: t("admin.groups.title") }} />
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
            placeholder={t("admin.groups.searchPlaceholder")}
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
            data={data?.items ?? []}
            keyExtractor={(item) => String(item.id)}
            renderItem={renderGroup}
            onEndReached={handleEndReached}
            onEndReachedThreshold={0.5}
            contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 80 }]}
            ListEmptyComponent={
              <View style={styles.centered}>
                <ThemedText style={styles.emptyText}>
                  {t("admin.groups.emptyText")}
                </ThemedText>
              </View>
            }
            ListFooterComponent={
              isFetching ? (
                <ActivityIndicator
                  size="small"
                  color={colors.primary}
                  style={styles.footerLoader}
                />
              ) : null
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
                    {editingId != null ? t("admin.groups.editTitle") : t("admin.groups.newTitle")}
                  </ThemedText>
                  <TouchableOpacity onPress={() => setShowModal(false)}>
                    <Ionicons name="close" size={24} color={colors.text} />
                  </TouchableOpacity>
                </View>

                <FormField
                  label={t("admin.groups.fields.groupType")}
                  value={form.group_type}
                  onChangeText={(group_type) =>
                    setForm((f) => ({ ...f, group_type }))
                  }
                  colors={colors}
                  styles={styles}
                />
                <FormField
                  label={t("admin.groups.fields.refKey")}
                  value={form.ref_key}
                  onChangeText={(ref_key) =>
                    setForm((f) => ({ ...f, ref_key }))
                  }
                  editable={editingId == null}
                  colors={colors}
                  styles={styles}
                />
                <FormField
                  label={t("admin.groups.fields.title")}
                  value={form.title}
                  onChangeText={(title) => setForm((f) => ({ ...f, title }))}
                  colors={colors}
                  styles={styles}
                />
                <FormField
                  label={t("admin.groups.fields.description")}
                  value={form.description}
                  onChangeText={(description) =>
                    setForm((f) => ({ ...f, description }))
                  }
                  multiline
                  colors={colors}
                  styles={styles}
                />

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
                    <ThemedText style={styles.saveButtonText}>{t("admin.groups.saveButton")}</ThemedText>
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
      paddingHorizontal: 16,
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
    },
    typeBadge: {
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 8,
    },
    typeText: {
      fontSize: 11,
      fontWeight: "600",
    },
    deleteBtn: {
      padding: 8,
    },
    footerLoader: {
      paddingVertical: 16,
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
