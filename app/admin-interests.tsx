import { useColors } from "@/hooks/use-colors";
import { ThemedText } from "@/components/themed-text";
import { TenantBackgroundArt } from "@/components/tenant-background-art";
import { getTenantBackgroundSource } from "@/constants/tenant-assets";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import {
  getAdminInterests,
  createAdminInterest,
  updateAdminInterest,
  deleteAdminInterest,
  getAdminGoals,
  createAdminGoal,
  updateAdminGoal,
  deleteAdminGoal,
  type AdminInterest,
  type AdminGoal,
} from "@/features/admin/api-interests";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import { COLOR_WHITE_ON_ACCENT } from "@/constants/theme";
export default function AdminInterestsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { t } = useTranslation();
  const qc = useQueryClient();

  // Interest state
  const [newInterestName, setNewInterestName] = useState("");
  const [editingInterest, setEditingInterest] = useState<AdminInterest | null>(
    null,
  );
  const [editInterestName, setEditInterestName] = useState("");

  // Goal state
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [editingGoal, setEditingGoal] = useState<AdminGoal | null>(null);
  const [goalForm, setGoalForm] = useState({
    name: "",
    description: "",
    display_order: "0",
  });
  const { width } = useWindowDimensions();
  const hasBackgroundArt = Boolean(getTenantBackgroundSource());
  const artworkHeight = width * (1864 / 2100);

  // Queries
  const { data: interests, isLoading: loadingInterests } = useQuery({
    queryKey: ["admin", "interests"],
    queryFn: getAdminInterests,
  });

  const { data: goals, isLoading: loadingGoals } = useQuery({
    queryKey: ["admin", "goals"],
    queryFn: getAdminGoals,
  });

  // Interest mutations
  const createInterestMutation = useMutation({
    mutationFn: createAdminInterest,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "interests"] });
      setNewInterestName("");
    },
  });

  const updateInterestMutation = useMutation({
    mutationFn: ({ id, name }: { id: number; name: string }) =>
      updateAdminInterest(id, name),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "interests"] });
      setEditingInterest(null);
    },
  });

  const deleteInterestMutation = useMutation({
    mutationFn: deleteAdminInterest,
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["admin", "interests"] }),
  });

  // Goal mutations
  const createGoalMutation = useMutation({
    mutationFn: createAdminGoal,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "goals"] });
      setShowGoalModal(false);
    },
  });

  const updateGoalMutation = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number;
      data: Parameters<typeof updateAdminGoal>[1];
    }) => updateAdminGoal(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "goals"] });
      setShowGoalModal(false);
    },
  });

  const deleteGoalMutation = useMutation({
    mutationFn: deleteAdminGoal,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "goals"] }),
  });

  const handleAddInterest = useCallback(() => {
    const name = newInterestName.trim();
    if (!name) return;
    createInterestMutation.mutate(name);
  }, [newInterestName, createInterestMutation]);

  const handleSaveInterestEdit = useCallback(() => {
    if (!editingInterest || !editInterestName.trim()) return;
    updateInterestMutation.mutate({
      id: editingInterest.id,
      name: editInterestName.trim(),
    });
  }, [editingInterest, editInterestName, updateInterestMutation]);

  const handleDeleteInterest = useCallback(
    (interest: AdminInterest) => {
      Alert.alert(t("admin.interests.alert.deleteInterestTitle"), t("admin.interests.alert.deleteInterestMessage", { name: interest.name }), [
        { text: t("admin.interests.alert.cancel"), style: "cancel" },
        {
          text: t("admin.interests.alert.deleteConfirmButton"),
          style: "destructive",
          onPress: () => deleteInterestMutation.mutate(interest.id),
        },
      ]);
    },
    [deleteInterestMutation, t],
  );

  const openCreateGoal = () => {
    setEditingGoal(null);
    setGoalForm({ name: "", description: "", display_order: "0" });
    setShowGoalModal(true);
  };

  const openEditGoal = (goal: AdminGoal) => {
    setEditingGoal(goal);
    setGoalForm({
      name: goal.name,
      description: goal.description || "",
      display_order: String(goal.display_order),
    });
    setShowGoalModal(true);
  };

  const handleSaveGoal = useCallback(() => {
    if (!goalForm.name.trim()) {
      Alert.alert(t("admin.interests.alert.validationTitle"), t("admin.interests.alert.validationMessage"));
      return;
    }
    if (editingGoal) {
      updateGoalMutation.mutate({
        id: editingGoal.id,
        data: {
          name: goalForm.name.trim(),
          description: goalForm.description || undefined,
          display_order: parseInt(goalForm.display_order, 10) || 0,
        },
      });
    } else {
      createGoalMutation.mutate({
        name: goalForm.name.trim(),
        description: goalForm.description || undefined,
        display_order: parseInt(goalForm.display_order, 10) || undefined,
      });
    }
  }, [goalForm, editingGoal, createGoalMutation, updateGoalMutation, t]);

  const handleDeleteGoal = useCallback(
    (goal: AdminGoal) => {
      Alert.alert(t("admin.interests.alert.deleteGoalTitle"), t("admin.interests.alert.deleteGoalMessage", { name: goal.name }), [
        { text: t("admin.interests.alert.cancel"), style: "cancel" },
        {
          text: t("admin.interests.alert.deleteConfirmButton"),
          style: "destructive",
          onPress: () => deleteGoalMutation.mutate(goal.id),
        },
      ]);
    },
    [deleteGoalMutation, t],
  );

  const isLoading = loadingInterests || loadingGoals;

  const renderInterest = ({ item }: { item: AdminInterest }) => {
    const isEditing = editingInterest?.id === item.id;
    return (
      <View style={styles.itemRow}>
        {isEditing ? (
          <View style={styles.editRow}>
            <TextInput
              style={styles.editInput}
              value={editInterestName}
              onChangeText={setEditInterestName}
              autoFocus
              placeholderTextColor={colors.placeholder}
            />
            <TouchableOpacity
              onPress={handleSaveInterestEdit}
              style={styles.actionButton}
            >
              <Ionicons name="checkmark" size={20} color={colors.success} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setEditingInterest(null)}
              style={styles.actionButton}
            >
              <Ionicons name="close" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <TouchableOpacity
              style={styles.itemContent}
              onPress={() => {
                setEditingInterest(item);
                setEditInterestName(item.name);
              }}
            >
              <ThemedText style={styles.itemName}>{item.name}</ThemedText>
              <View
                style={[
                  styles.countBadge,
                  { backgroundColor: colors.primary + "20" },
                ]}
              >
                <ThemedText
                  style={[styles.countText, { color: colors.primary }]}
                >
                  {item.usage_count}
                </ThemedText>
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handleDeleteInterest(item)}
              style={styles.actionButton}
            >
              <Ionicons name="trash" size={16} color={colors.error} />
            </TouchableOpacity>
          </>
        )}
      </View>
    );
  };

  const renderGoal = ({ item }: { item: AdminGoal }) => (
    <TouchableOpacity
      style={styles.itemRow}
      activeOpacity={0.7}
      onPress={() => openEditGoal(item)}
    >
      <View style={styles.itemContent}>
        <View>
          <ThemedText style={styles.itemName}>{item.name}</ThemedText>
          {item.description ? (
            <ThemedText style={styles.itemDescription} numberOfLines={1}>
              {item.description}
            </ThemedText>
          ) : null}
        </View>
        <View style={styles.goalMeta}>
          <View
            style={[
              styles.countBadge,
              { backgroundColor: colors.primary + "20" },
            ]}
          >
            <ThemedText style={[styles.countText, { color: colors.primary }]}>
              {item.usage_count}
            </ThemedText>
          </View>
          <ThemedText style={styles.orderText}>#{item.display_order}</ThemedText>
        </View>
      </View>
      <TouchableOpacity
        onPress={() => handleDeleteGoal(item)}
        style={styles.actionButton}
      >
        <Ionicons name="trash" size={16} color={colors.error} />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <>
      <Stack.Screen
        options={{ headerShown: true, title: t("admin.interests.title") }}
      />
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
          <ScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 24 }]}>
            {/* Interests Section */}
            <View style={styles.section}>
              <ThemedText style={styles.sectionTitle}>{t("admin.interests.interestsSectionTitle")}</ThemedText>
              <View style={styles.addRow}>
                <TextInput
                  style={styles.addInput}
                  placeholder={t("admin.interests.newInterestPlaceholder")}
                  placeholderTextColor={colors.placeholder}
                  value={newInterestName}
                  onChangeText={setNewInterestName}
                  onSubmitEditing={handleAddInterest}
                />
                <TouchableOpacity
                  style={styles.addButton}
                  onPress={handleAddInterest}
                  disabled={createInterestMutation.isPending}
                >
                  {createInterestMutation.isPending ? (
                    <ActivityIndicator size="small" color={COLOR_WHITE_ON_ACCENT} />
                  ) : (
                    <Ionicons name="add" size={20} color={COLOR_WHITE_ON_ACCENT} />
                  )}
                </TouchableOpacity>
              </View>
              <FlatList
                data={interests ?? []}
                keyExtractor={(item) => String(item.id)}
                renderItem={renderInterest}
                scrollEnabled={false}
                ListEmptyComponent={
                  <ThemedText style={styles.emptyText}>
                    {t("admin.interests.noInterests")}
                  </ThemedText>
                }
              />
            </View>

            {/* Goals Section */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <ThemedText style={styles.sectionTitle}>{t("admin.interests.goalsSectionTitle")}</ThemedText>
                <TouchableOpacity
                  style={styles.addButton}
                  onPress={openCreateGoal}
                >
                  <Ionicons name="add" size={20} color={COLOR_WHITE_ON_ACCENT} />
                </TouchableOpacity>
              </View>
              <FlatList
                data={goals ?? []}
                keyExtractor={(item) => String(item.id)}
                renderItem={renderGoal}
                scrollEnabled={false}
                ListEmptyComponent={
                  <ThemedText style={styles.emptyText}>{t("admin.interests.noGoals")}</ThemedText>
                }
              />
            </View>
          </ScrollView>
        )}

        {/* Goal Create/Edit Modal */}
        <Modal visible={showGoalModal} animationType="slide" transparent>
          <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === "ios" ? "padding" : "height"}>
            <View style={[styles.modalContent, { paddingBottom: insets.bottom + 20 }]}>
              <View style={styles.modalHeader}>
                <ThemedText style={styles.modalTitle}>
                  {editingGoal ? t("admin.interests.editGoalTitle") : t("admin.interests.newGoalTitle")}
                </ThemedText>
                <TouchableOpacity onPress={() => setShowGoalModal(false)}>
                  <Ionicons name="close" size={24} color={colors.text} />
                </TouchableOpacity>
              </View>

              <View style={styles.field}>
                <ThemedText style={styles.fieldLabel}>{t("admin.interests.fields.name")}</ThemedText>
                <TextInput
                  style={styles.fieldInput}
                  value={goalForm.name}
                  onChangeText={(name) =>
                    setGoalForm((f) => ({ ...f, name }))
                  }
                  placeholderTextColor={colors.placeholder}
                />
              </View>
              <View style={styles.field}>
                <ThemedText style={styles.fieldLabel}>{t("admin.interests.fields.description")}</ThemedText>
                <TextInput
                  style={[styles.fieldInput, styles.fieldMultiline]}
                  value={goalForm.description}
                  onChangeText={(description) =>
                    setGoalForm((f) => ({ ...f, description }))
                  }
                  multiline
                  placeholderTextColor={colors.placeholder}
                />
              </View>
              <View style={styles.field}>
                <ThemedText style={styles.fieldLabel}>{t("admin.interests.fields.displayOrder")}</ThemedText>
                <TextInput
                  style={styles.fieldInput}
                  value={goalForm.display_order}
                  onChangeText={(display_order) =>
                    setGoalForm((f) => ({ ...f, display_order }))
                  }
                  keyboardType="number-pad"
                  placeholderTextColor={colors.placeholder}
                />
              </View>

              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleSaveGoal}
                disabled={
                  createGoalMutation.isPending || updateGoalMutation.isPending
                }
              >
                {createGoalMutation.isPending ||
                updateGoalMutation.isPending ? (
                  <ActivityIndicator size="small" color={COLOR_WHITE_ON_ACCENT} />
                ) : (
                  <ThemedText style={styles.saveButtonText}>{t("admin.interests.saveButton")}</ThemedText>
                )}
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </Modal>
      </SafeAreaView>
    </>
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
      fontSize: 14,
      paddingVertical: 12,
      textAlign: "center",
    },
    scrollContent: {
      padding: 16,
    },
    section: {
      marginBottom: 24,
    },
    sectionHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 12,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: "700",
      color: colors.text,
      marginBottom: 12,
    },
    addRow: {
      flexDirection: "row",
      gap: 8,
      marginBottom: 12,
    },
    addInput: {
      flex: 1,
      backgroundColor: colors.inputBackground,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: 12,
      paddingVertical: 10,
      fontSize: 14,
      color: colors.text,
    },
    addButton: {
      width: 42,
      height: 42,
      borderRadius: 8,
      backgroundColor: colors.primary,
      justifyContent: "center",
      alignItems: "center",
    },
    itemRow: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.cardBackground,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      padding: 12,
      marginBottom: 6,
    },
    itemContent: {
      flex: 1,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    itemName: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.text,
    },
    itemDescription: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 2,
    },
    goalMeta: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    countBadge: {
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 8,
    },
    countText: {
      fontSize: 11,
      fontWeight: "700",
    },
    orderText: {
      fontSize: 12,
      color: colors.textSubtle,
    },
    editRow: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    editInput: {
      flex: 1,
      backgroundColor: colors.inputBackground,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.primary,
      paddingHorizontal: 12,
      paddingVertical: 8,
      fontSize: 14,
      color: colors.text,
    },
    actionButton: {
      padding: 6,
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
