import React, {
  useCallback,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
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
import { Ionicons } from "@expo/vector-icons";
import { Stack } from "expo-router";
import { useTranslation } from "react-i18next";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import DateTimePicker, {
  type DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import * as ImagePicker from "expo-image-picker";

import { SHADOW_BLACK } from "@/constants/data-colors";
import { COLOR_WHITE_ON_ACCENT } from "@/constants/theme";
import { useColors } from "@/hooks/use-colors";
import { ThemedText } from "@/components/themed-text";
import { TenantBackgroundArt } from "@/components/tenant-background-art";
import { getTenantBackgroundSource } from "@/constants/tenant-assets";
import { EntityPicker } from "@/components/EntityPicker";
import { SessionStatusBadge } from "@/components/SessionStatusBadge";
import { uploadFile } from "@/api/features/upload";
import type {
  SessionOut,
  SessionCreateInput,
  SessionPatchInput,
} from "@/api/schemas";
import {
  getAdminSessions,
  createAdminSession,
  updateAdminSession,
  deleteAdminSession,
  getSessionImpact,
  cancelAdminSession,
  notifyUpdateSession,
  getAdminExhibitors,
  getAdminSpeakerUsers,
  getAdminVenues,
  type AdminExhibitor,
  type AdminUser,
  type AdminVenue,
  type SessionImpact,
} from "@/features/admin/api-sessions";

// ---------- Session type options ----------

const SESSION_TYPES = [
  "talk",
  "workshop",
  "panel",
  "keynote",
  "networking",
  "break",
  "lunch",
] as const;

// ---------- Zod schema ----------

const sessionFormSchema = z
  .object({
    title: z.string().min(1, "titleRequired"),
    description: z.string().optional().default(""),
    type: z.string().min(1, "typeRequired"),
    start_time: z.string().min(1, "startRequired"),
    end_time: z.string().min(1, "endRequired"),
    topic_tags: z.array(z.string()).optional().default([]),
    image_url: z.string().optional().nullable(),
    venue_id: z
      .number({
        message: "venueRequired",
      })
      .int(),
    speaker_ids: z.array(z.number()).optional().default([]),
    exhibitor_id: z.number().int().optional().nullable(),
  })
  .refine(
    (v) => {
      const start = new Date(v.start_time).getTime();
      const end = new Date(v.end_time).getTime();
      if (!Number.isFinite(start) || !Number.isFinite(end)) return true;
      return end > start;
    },
    {
      path: ["end_time"],
      message: "endBeforeStart",
    },
  );

type SessionFormValues = z.infer<typeof sessionFormSchema>;

const EMPTY_FORM: SessionFormValues = {
  title: "",
  description: "",
  type: "talk",
  start_time: "",
  end_time: "",
  topic_tags: [],
  image_url: null,
  // venue_id intentionally unset — cast to trigger validation
  venue_id: undefined as unknown as number,
  speaker_ids: [],
  exhibitor_id: null,
};

// ---------- Helpers ----------

function formatDateLabel(iso: string | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return "";
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatTimeLabel(iso: string | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return "";
  return d.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatRowStart(iso: string): string {
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return iso;
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function toFormValues(session: SessionOut): SessionFormValues {
  return {
    title: session.title,
    description: session.description ?? "",
    type: session.type,
    start_time: session.start_time,
    end_time: session.end_time,
    topic_tags: session.topic_tags ?? [],
    image_url: session.image_url ?? null,
    venue_id: session.venue?.id as unknown as number,
    speaker_ids: session.speakers?.map((s) => s.user_id) ?? [],
    exhibitor_id: session.exhibitor_id ?? null,
  };
}

function toCreateInput(values: SessionFormValues): SessionCreateInput {
  return {
    title: values.title,
    description: values.description || null,
    start_time: values.start_time,
    end_time: values.end_time,
    type: values.type,
    topic_tags: values.topic_tags?.length ? values.topic_tags : null,
    venue_id: values.venue_id ?? null,
    speaker_ids: values.speaker_ids ?? [],
    image_url: values.image_url ?? null,
    exhibitor_id: values.exhibitor_id ?? null,
  };
}

function toPatchInput(values: SessionFormValues): SessionPatchInput {
  return {
    title: values.title,
    description: values.description || null,
    type: values.type,
    topic_tags: values.topic_tags?.length ? values.topic_tags : [],
    image_url: values.image_url ?? null,
    start_time: values.start_time,
    end_time: values.end_time,
    venue_id: values.venue_id ?? null,
    speaker_ids: values.speaker_ids ?? [],
    exhibitor_id: values.exhibitor_id ?? null,
  };
}

// ---------- Screen ----------

export default function AdminSessionsScreen() {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [timeframe, setTimeframe] = useState<"upcoming" | "past" | "all">(
    "upcoming",
  );
  const [showCancelled, setShowCancelled] = useState(false);

  const [formModalVisible, setFormModalVisible] = useState(false);
  const [editingSession, setEditingSession] = useState<SessionOut | null>(null);

  const [cancelModalVisible, setCancelModalVisible] = useState(false);
  const [notifyModalVisible, setNotifyModalVisible] = useState(false);
  const [impactData, setImpactData] = useState<SessionImpact | null>(null);
  const [pendingPatch, setPendingPatch] = useState<{
    values: SessionFormValues;
    timeChanged: boolean;
    venueChanged: boolean;
  } | null>(null);

  const [venuePickerVisible, setVenuePickerVisible] = useState(false);
  const [speakerPickerVisible, setSpeakerPickerVisible] = useState(false);
  const [exhibitorPickerVisible, setExhibitorPickerVisible] = useState(false);
  const [typePickerVisible, setTypePickerVisible] = useState(false);

  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);

  const [imageUploading, setImageUploading] = useState(false);
  const [tagDraft, setTagDraft] = useState("");
  const { width } = useWindowDimensions();
  const hasBackgroundArt = Boolean(getTenantBackgroundSource());
  const artworkHeight = width * (1864 / 2100);

  // Cache of selected entities for display + picker initialValue
  const [selectedVenue, setSelectedVenue] = useState<AdminVenue | null>(null);
  const [selectedSpeakers, setSelectedSpeakers] = useState<AdminUser[]>([]);
  const [selectedExhibitor, setSelectedExhibitor] =
    useState<AdminExhibitor | null>(null);

  // ---------- Form ----------

  const form = useForm<SessionFormValues>({
    resolver: zodResolver(sessionFormSchema) as never,
    defaultValues: EMPTY_FORM,
  });

  // ---------- Query ----------

  const { data: sessions, isLoading } = useQuery({
    queryKey: [
      "admin",
      "sessions",
      { search: debouncedSearch, timeframe, showCancelled },
    ],
    queryFn: () =>
      getAdminSessions({
        search: debouncedSearch || undefined,
        timeframe,
        show_cancelled: showCancelled,
      }),
  });

  // ---------- Mutations ----------

  const invalidateAfterWrite = useCallback(() => {
    qc.invalidateQueries({ queryKey: ["admin", "sessions"] });
    qc.invalidateQueries({ queryKey: ["program"] });
  }, [qc]);

  const createMutation = useMutation({
    mutationFn: (data: SessionCreateInput) => createAdminSession(data),
    onSuccess: () => {
      invalidateAfterWrite();
      closeFormModal();
    },
    onError: (err: unknown) => {
      Alert.alert(
        t("admin.sessions.genericError"),
        (err as Error)?.message ?? "",
      );
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: SessionPatchInput }) =>
      updateAdminSession(id, data),
    onSuccess: () => {
      invalidateAfterWrite();
      closeFormModal();
    },
    onError: (err: unknown) => {
      Alert.alert(
        t("admin.sessions.genericError"),
        (err as Error)?.message ?? "",
      );
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteAdminSession(id),
    onSuccess: () => {
      invalidateAfterWrite();
      closeFormModal();
    },
    onError: (err: unknown) => {
      Alert.alert(
        t("admin.sessions.genericError"),
        (err as Error)?.message ?? "",
      );
    },
  });

  const cancelMutation = useMutation({
    mutationFn: (id: number) => cancelAdminSession(id),
    onSuccess: () => {
      invalidateAfterWrite();
      setCancelModalVisible(false);
      setFormModalVisible(false);
      Alert.alert(
        t("admin.sessions.cancel.successTitle"),
        t("admin.sessions.cancel.successBody"),
      );
    },
    onError: (err: unknown) => {
      Alert.alert(
        t("admin.sessions.genericError"),
        (err as Error)?.message ?? "",
      );
    },
  });

  const notifyMutation = useMutation({
    mutationFn: ({
      id,
      fields,
    }: {
      id: number;
      fields: ("time" | "venue")[];
    }) => notifyUpdateSession(id, fields),
  });

  // ---------- Search debounce ----------

  const handleSearchChange = useCallback((text: string) => {
    setSearch(text);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setDebouncedSearch(text);
    }, 300);
  }, []);

  // ---------- Open/close form ----------

  const openCreateModal = useCallback(() => {
    setEditingSession(null);
    form.reset(EMPTY_FORM);
    setSelectedVenue(null);
    setSelectedSpeakers([]);
    setSelectedExhibitor(null);
    setTagDraft("");
    setFormModalVisible(true);
  }, [form]);

  const openEditModal = useCallback(
    (session: SessionOut) => {
      setEditingSession(session);
      form.reset(toFormValues(session));
      // Hydrate display caches from session payload
      if (session.venue) {
        setSelectedVenue({
          id: session.venue.id,
          key: session.venue.key,
          name: session.venue.name,
          lat: session.venue.lat,
          lng: session.venue.lng,
          default_zoom: session.venue.default_zoom ?? 15,
          has_indoor: !!session.venue.has_indoor,
          category: "",
          extrusion_height: 0,
          sort_order: 0,
          is_active: true,
        });
      } else {
        setSelectedVenue(null);
      }
      setSelectedSpeakers(
        (session.speakers ?? []).map((s) => ({
          id: s.user_id,
          email: "",
          full_name: s.full_name,
          role: "speaker",
        })),
      );
      setSelectedExhibitor(null);
      setTagDraft("");
      setFormModalVisible(true);
    },
    [form],
  );

  const closeFormModal = useCallback(() => {
    setFormModalVisible(false);
    setEditingSession(null);
    setImpactData(null);
    setPendingPatch(null);
  }, []);

  // ---------- Submit ----------

  const onSubmit = async (values: SessionFormValues) => {
    if (!editingSession) {
      createMutation.mutate(toCreateInput(values));
      return;
    }

    // Edit mode
    const timeChanged =
      values.start_time !== editingSession.start_time ||
      values.end_time !== editingSession.end_time;
    const venueChanged = values.venue_id !== (editingSession.venue?.id ?? null);

    if (editingSession.is_cancelled || (!timeChanged && !venueChanged)) {
      updateMutation.mutate({
        id: editingSession.id,
        data: toPatchInput(values),
      });
      return;
    }

    try {
      const impact = await getSessionImpact(editingSession.id);
      if (impact.favorites === 0) {
        updateMutation.mutate({
          id: editingSession.id,
          data: toPatchInput(values),
        });
        return;
      }
      setImpactData(impact);
      setPendingPatch({ values, timeChanged, venueChanged });
      setNotifyModalVisible(true);
    } catch {
      // Fall back to silent save on impact fetch failure
      updateMutation.mutate({
        id: editingSession.id,
        data: toPatchInput(values),
      });
    }
  };

  const handleNotifyUpdateChoice = useCallback(
    async (notify: boolean) => {
      if (!editingSession || !pendingPatch) {
        setNotifyModalVisible(false);
        return;
      }
      setNotifyModalVisible(false);
      const { values, timeChanged, venueChanged } = pendingPatch;
      // Fire PATCH first
      try {
        await new Promise<SessionOut>((resolve, reject) => {
          updateMutation.mutate(
            {
              id: editingSession.id,
              data: toPatchInput(values),
            },
            { onSuccess: resolve, onError: reject },
          );
        });
      } catch {
        return;
      }
      if (notify) {
        const fields: ("time" | "venue")[] = [];
        if (timeChanged) fields.push("time");
        if (venueChanged) fields.push("venue");
        if (fields.length) {
          notifyMutation.mutate({ id: editingSession.id, fields });
        }
      }
      setPendingPatch(null);
    },
    [editingSession, pendingPatch, updateMutation, notifyMutation],
  );

  // ---------- Cancel flow ----------

  const openCancelConfirm = useCallback(async () => {
    if (!editingSession) return;
    setImpactData(null);
    setCancelModalVisible(true);
    try {
      const impact = await getSessionImpact(editingSession.id);
      setImpactData(impact);
    } catch {
      // leave impactData null — modal still renders with placeholders
    }
  }, [editingSession]);

  const confirmCancel = useCallback(() => {
    if (!editingSession) return;
    cancelMutation.mutate(editingSession.id);
  }, [editingSession, cancelMutation]);

  // ---------- Restore flow (uncancel) ----------

  const handleRestore = useCallback(() => {
    if (!editingSession) return;
    updateMutation.mutate(
      {
        id: editingSession.id,
        data: { is_cancelled: false },
      },
      {
        onSuccess: () => {
          Alert.alert(
            t("admin.sessions.restore.successTitle"),
            t("admin.sessions.restore.successBody"),
          );
        },
      },
    );
  }, [editingSession, updateMutation, t]);

  // ---------- Delete flow ----------

  const handleDelete = useCallback(() => {
    if (!editingSession) return;
    Alert.alert(
      t("admin.sessions.deleteConfirmTitle"),
      t("admin.sessions.deleteConfirmMessage", {
        title: editingSession.title,
      }),
      [
        { text: t("admin.sessions.deleteCancel"), style: "cancel" },
        {
          text: t("admin.sessions.deleteConfirm"),
          style: "destructive",
          onPress: () => deleteMutation.mutate(editingSession.id),
        },
      ],
    );
  }, [editingSession, deleteMutation, t]);

  // ---------- Image upload ----------

  const handlePickImage = useCallback(async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });
    if (result.canceled || !result.assets?.[0]) return;
    const asset = result.assets[0];
    setImageUploading(true);
    try {
      const mime = asset.mimeType ?? "image/jpeg";
      const name = asset.fileName ?? `session-${Date.now()}.jpg`;
      const upload = await uploadFile(asset.uri, name, mime);
      form.setValue("image_url", upload.url, { shouldValidate: true });
    } catch (e) {
      Alert.alert(
        t("admin.sessions.genericError"),
        (e as Error)?.message ?? "",
      );
    } finally {
      setImageUploading(false);
    }
  }, [form, t]);

  // ---------- Datetime picker handlers ----------

  const onDateChange = useCallback(
    (
      field: "start_time" | "end_time",
      kind: "date" | "time",
      event: DateTimePickerEvent,
      date?: Date,
    ) => {
      if (Platform.OS === "android") {
        if (field === "start_time" && kind === "date")
          setShowStartDatePicker(false);
        if (field === "start_time" && kind === "time")
          setShowStartTimePicker(false);
        if (field === "end_time" && kind === "date")
          setShowEndDatePicker(false);
        if (field === "end_time" && kind === "time")
          setShowEndTimePicker(false);
      }
      if (event.type !== "set" || !date) return;
      const current = form.getValues(field);
      const base =
        current && Number.isFinite(new Date(current).getTime())
          ? new Date(current)
          : new Date();
      if (kind === "date") {
        base.setFullYear(date.getFullYear(), date.getMonth(), date.getDate());
      } else {
        base.setHours(date.getHours(), date.getMinutes(), 0, 0);
      }
      form.setValue(field, base.toISOString(), { shouldValidate: true });
    },
    [form],
  );

  // ---------- Tag input ----------

  const handleSubmitTag = useCallback(() => {
    const tag = tagDraft.trim();
    if (!tag) return;
    const current = form.getValues("topic_tags") ?? [];
    if (!current.includes(tag)) {
      form.setValue("topic_tags", [...current, tag], { shouldValidate: true });
    }
    setTagDraft("");
  }, [tagDraft, form]);

  const handleRemoveTag = useCallback(
    (tag: string) => {
      const current = form.getValues("topic_tags") ?? [];
      form.setValue(
        "topic_tags",
        current.filter((t) => t !== tag),
        { shouldValidate: true },
      );
    },
    [form],
  );

  // ---------- Render row ----------

  const renderRow = ({ item }: { item: SessionOut }) => (
    <TouchableOpacity
      style={[
        styles.row,
        item.is_cancelled === true && styles.rowCancelled,
      ]}
      activeOpacity={0.7}
      onPress={() => openEditModal(item)}
    >
      <View style={styles.rowHeader}>
        <ThemedText style={styles.rowTitle} numberOfLines={1}>
          {item.title}
        </ThemedText>
        <SessionStatusBadge session={item} size="sm" />
      </View>
      <ThemedText style={styles.rowMeta} numberOfLines={1}>
        {formatRowStart(item.start_time)}
        {item.venue?.name ? ` · ${item.venue.name}` : " · —"}
        {` · ${(item.speakers?.length ?? 0)} ${t("admin.sessions.speakersShort")}`}
      </ThemedText>
      {item.topic_tags && item.topic_tags.length > 0 ? (
        <View style={styles.tagsRow}>
          {item.topic_tags.slice(0, 6).map((tag) => (
            <View key={tag} style={styles.tagChip}>
              <ThemedText style={styles.tagText}>{tag}</ThemedText>
            </View>
          ))}
        </View>
      ) : null}
    </TouchableOpacity>
  );

  // ---------- Empty state ----------

  const emptyCopyKey = useMemo(() => {
    if (debouncedSearch) return "admin.sessions.emptySearch";
    if (timeframe === "upcoming") return "admin.sessions.emptyUpcoming";
    if (timeframe === "past") return "admin.sessions.emptyPast";
    return "admin.sessions.emptyAll";
  }, [debouncedSearch, timeframe]);

  // ---------- JSX ----------

  return (
    <>
      <Stack.Screen
        options={{ headerShown: true, title: t("admin.sessions.title") }}
      />
      <SafeAreaView style={styles.container} edges={["bottom"]}>
        {hasBackgroundArt && (
          <TenantBackgroundArt
            variant="secondary"
            style={[styles.backgroundArt, { width, height: artworkHeight }]}
          />
        )}
        {/* Search */}
        <View style={styles.searchContainer}>
          <Ionicons
            name="search"
            size={18}
            color={colors.placeholder}
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder={t("admin.sessions.searchPlaceholder")}
            placeholderTextColor={colors.placeholder}
            value={search}
            onChangeText={handleSearchChange}
          />
        </View>

        {/* Segmented control */}
        <View style={styles.segmentedContainer}>
          {(["upcoming", "past", "all"] as const).map((opt) => {
            const active = timeframe === opt;
            return (
              <TouchableOpacity
                key={opt}
                style={[
                  styles.segmentBtn,
                  active && styles.segmentBtnActive,
                ]}
                activeOpacity={0.7}
                onPress={() => setTimeframe(opt)}
              >
                <ThemedText
                  style={[
                    styles.segmentText,
                    active && styles.segmentTextActive,
                  ]}
                >
                  {t(`admin.sessions.timeframe.${opt}`)}
                </ThemedText>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Show cancelled toggle */}
        <View style={styles.showCancelledRow}>
          <ThemedText style={styles.showCancelledLabel}>
            {t("admin.sessions.showCancelled")}
          </ThemedText>
          <Switch
            value={showCancelled}
            onValueChange={setShowCancelled}
            trackColor={{
              false: colors.switchTrackOff,
              true: colors.primary,
            }}
            thumbColor={COLOR_WHITE_ON_ACCENT}
          />
        </View>

        {/* List */}
        {isLoading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <FlatList
            data={sessions ?? []}
            keyExtractor={(s) => String(s.id)}
            renderItem={renderRow}
            contentContainerStyle={[
              styles.list,
              { paddingBottom: insets.bottom + 100 },
            ]}
            ListEmptyComponent={
              <View style={styles.centered}>
                <ThemedText style={styles.emptyText}>
                  {t(emptyCopyKey, { search: debouncedSearch })}
                </ThemedText>
              </View>
            }
          />
        )}

        {/* FAB */}
        <TouchableOpacity
          style={[styles.fab, { bottom: 24 + insets.bottom }]}
          onPress={openCreateModal}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={28} color={COLOR_WHITE_ON_ACCENT} />
        </TouchableOpacity>

        {/* Form modal */}
        {formModalVisible ? (
          <Modal visible animationType="slide" transparent>
            <KeyboardAvoidingView
              style={styles.modalOverlay}
              behavior={Platform.OS === "ios" ? "padding" : "height"}
            >
              <View
                style={[
                  styles.modalContent,
                  { paddingBottom: insets.bottom + 20 },
                ]}
              >
                <View style={styles.modalHeader}>
                  <ThemedText style={styles.modalTitle}>
                    {editingSession
                      ? t("admin.sessions.editTitle")
                      : t("admin.sessions.newTitle")}
                  </ThemedText>
                  <View style={styles.modalHeaderActions}>
                    {editingSession ? (
                      <TouchableOpacity
                        onPress={handleDelete}
                        style={styles.modalHeaderIcon}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      >
                        <Ionicons
                          name="trash"
                          size={20}
                          color={colors.error}
                        />
                      </TouchableOpacity>
                    ) : null}
                    <TouchableOpacity
                      onPress={closeFormModal}
                      style={styles.modalHeaderIcon}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <Ionicons name="close" size={24} color={colors.text} />
                    </TouchableOpacity>
                  </View>
                </View>

                <ScrollView
                  contentContainerStyle={styles.modalScroll}
                  keyboardShouldPersistTaps="handled"
                >
                  {/* Title */}
                  <Controller
                    control={form.control}
                    name="title"
                    render={({ field, fieldState }) => (
                      <View style={styles.field}>
                        <ThemedText style={styles.fieldLabel}>
                          {t("admin.sessions.fields.title")}
                        </ThemedText>
                        <TextInput
                          style={styles.fieldInput}
                          value={field.value}
                          onChangeText={field.onChange}
                          placeholderTextColor={colors.placeholder}
                        />
                        {fieldState.error ? (
                          <ThemedText style={styles.fieldError}>
                            {t(
                              `admin.sessions.errors.${fieldState.error.message}`,
                            )}
                          </ThemedText>
                        ) : null}
                      </View>
                    )}
                  />

                  {/* Description */}
                  <Controller
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <View style={styles.field}>
                        <ThemedText style={styles.fieldLabel}>
                          {t("admin.sessions.fields.description")}
                        </ThemedText>
                        <TextInput
                          style={[styles.fieldInput, styles.fieldInputMulti]}
                          multiline
                          textAlignVertical="top"
                          value={field.value ?? ""}
                          onChangeText={field.onChange}
                          placeholderTextColor={colors.placeholder}
                        />
                      </View>
                    )}
                  />

                  {/* Type */}
                  <Controller
                    control={form.control}
                    name="type"
                    render={({ field, fieldState }) => (
                      <View style={styles.field}>
                        <ThemedText style={styles.fieldLabel}>
                          {t("admin.sessions.fields.type")}
                        </ThemedText>
                        <TouchableOpacity
                          style={styles.fieldInput}
                          onPress={() => setTypePickerVisible(true)}
                          activeOpacity={0.7}
                        >
                          <ThemedText style={styles.fieldInputText}>
                            {field.value ||
                              t("admin.sessions.fields.typePlaceholder")}
                          </ThemedText>
                          <Ionicons
                            name="chevron-down"
                            size={18}
                            color={colors.textSecondary}
                          />
                        </TouchableOpacity>
                        {fieldState.error ? (
                          <ThemedText style={styles.fieldError}>
                            {t(
                              `admin.sessions.errors.${fieldState.error.message}`,
                            )}
                          </ThemedText>
                        ) : null}
                      </View>
                    )}
                  />

                  {/* Start date/time */}
                  <Controller
                    control={form.control}
                    name="start_time"
                    render={({ field, fieldState }) => (
                      <View style={styles.field}>
                        <ThemedText style={styles.fieldLabel}>
                          {t("admin.sessions.fields.startTime")}
                        </ThemedText>
                        <View style={styles.dateTimeRow}>
                          <TouchableOpacity
                            style={styles.dateTimeBtn}
                            onPress={() => setShowStartDatePicker(true)}
                          >
                            <Ionicons
                              name="calendar-outline"
                              size={16}
                              color={colors.textSecondary}
                            />
                            <ThemedText style={styles.dateTimeText}>
                              {formatDateLabel(field.value) ||
                                t("admin.sessions.fields.pickDate")}
                            </ThemedText>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={styles.dateTimeBtn}
                            onPress={() => setShowStartTimePicker(true)}
                          >
                            <Ionicons
                              name="time-outline"
                              size={16}
                              color={colors.textSecondary}
                            />
                            <ThemedText style={styles.dateTimeText}>
                              {formatTimeLabel(field.value) ||
                                t("admin.sessions.fields.pickTime")}
                            </ThemedText>
                          </TouchableOpacity>
                        </View>
                        {fieldState.error ? (
                          <ThemedText style={styles.fieldError}>
                            {t(
                              `admin.sessions.errors.${fieldState.error.message}`,
                            )}
                          </ThemedText>
                        ) : null}
                        {showStartDatePicker ? (
                          <DateTimePicker
                            value={
                              field.value &&
                              Number.isFinite(new Date(field.value).getTime())
                                ? new Date(field.value)
                                : new Date()
                            }
                            mode="date"
                            onChange={(e, d) =>
                              onDateChange("start_time", "date", e, d)
                            }
                          />
                        ) : null}
                        {showStartTimePicker ? (
                          <DateTimePicker
                            value={
                              field.value &&
                              Number.isFinite(new Date(field.value).getTime())
                                ? new Date(field.value)
                                : new Date()
                            }
                            mode="time"
                            onChange={(e, d) =>
                              onDateChange("start_time", "time", e, d)
                            }
                          />
                        ) : null}
                      </View>
                    )}
                  />

                  {/* End date/time */}
                  <Controller
                    control={form.control}
                    name="end_time"
                    render={({ field, fieldState }) => (
                      <View style={styles.field}>
                        <ThemedText style={styles.fieldLabel}>
                          {t("admin.sessions.fields.endTime")}
                        </ThemedText>
                        <View style={styles.dateTimeRow}>
                          <TouchableOpacity
                            style={styles.dateTimeBtn}
                            onPress={() => setShowEndDatePicker(true)}
                          >
                            <Ionicons
                              name="calendar-outline"
                              size={16}
                              color={colors.textSecondary}
                            />
                            <ThemedText style={styles.dateTimeText}>
                              {formatDateLabel(field.value) ||
                                t("admin.sessions.fields.pickDate")}
                            </ThemedText>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={styles.dateTimeBtn}
                            onPress={() => setShowEndTimePicker(true)}
                          >
                            <Ionicons
                              name="time-outline"
                              size={16}
                              color={colors.textSecondary}
                            />
                            <ThemedText style={styles.dateTimeText}>
                              {formatTimeLabel(field.value) ||
                                t("admin.sessions.fields.pickTime")}
                            </ThemedText>
                          </TouchableOpacity>
                        </View>
                        {fieldState.error ? (
                          <ThemedText style={styles.fieldError}>
                            {t(
                              `admin.sessions.errors.${fieldState.error.message}`,
                            )}
                          </ThemedText>
                        ) : null}
                        {showEndDatePicker ? (
                          <DateTimePicker
                            value={
                              field.value &&
                              Number.isFinite(new Date(field.value).getTime())
                                ? new Date(field.value)
                                : new Date()
                            }
                            mode="date"
                            onChange={(e, d) =>
                              onDateChange("end_time", "date", e, d)
                            }
                          />
                        ) : null}
                        {showEndTimePicker ? (
                          <DateTimePicker
                            value={
                              field.value &&
                              Number.isFinite(new Date(field.value).getTime())
                                ? new Date(field.value)
                                : new Date()
                            }
                            mode="time"
                            onChange={(e, d) =>
                              onDateChange("end_time", "time", e, d)
                            }
                          />
                        ) : null}
                      </View>
                    )}
                  />

                  {/* Topic tags */}
                  <Controller
                    control={form.control}
                    name="topic_tags"
                    render={({ field }) => (
                      <View style={styles.field}>
                        <ThemedText style={styles.fieldLabel}>
                          {t("admin.sessions.fields.topicTags")}
                        </ThemedText>
                        <TextInput
                          style={styles.fieldInput}
                          value={tagDraft}
                          onChangeText={setTagDraft}
                          onSubmitEditing={handleSubmitTag}
                          placeholder={t(
                            "admin.sessions.fields.tagPlaceholder",
                          )}
                          placeholderTextColor={colors.placeholder}
                          returnKeyType="done"
                        />
                        {field.value && field.value.length ? (
                          <View style={styles.tagsRow}>
                            {field.value.map((tag) => (
                              <TouchableOpacity
                                key={tag}
                                style={styles.tagChipEditable}
                                onPress={() => handleRemoveTag(tag)}
                                activeOpacity={0.7}
                              >
                                <ThemedText style={styles.tagText}>
                                  {tag}
                                </ThemedText>
                                <Ionicons
                                  name="close"
                                  size={12}
                                  color={colors.primary}
                                  style={styles.tagRemoveIcon}
                                />
                              </TouchableOpacity>
                            ))}
                          </View>
                        ) : null}
                      </View>
                    )}
                  />

                  {/* Image */}
                  <Controller
                    control={form.control}
                    name="image_url"
                    render={({ field }) => (
                      <View style={styles.field}>
                        <ThemedText style={styles.fieldLabel}>
                          {t("admin.sessions.fields.image")}
                        </ThemedText>
                        {imageUploading ? (
                          <View
                            style={[
                              styles.imageUploadArea,
                              styles.imageUploadAreaCenter,
                            ]}
                          >
                            <ActivityIndicator
                              size="small"
                              color={colors.primary}
                            />
                            <ThemedText style={styles.imageUploadHelper}>
                              {t("admin.sessions.fields.imageUploading")}
                            </ThemedText>
                          </View>
                        ) : field.value ? (
                          <View style={styles.imageUploaded}>
                            <Image
                              source={{ uri: field.value }}
                              style={styles.imagePreview}
                              resizeMode="cover"
                            />
                            <TouchableOpacity
                              style={styles.imageRemoveBtn}
                              onPress={() => field.onChange(null)}
                            >
                              <Ionicons
                                name="trash"
                                size={18}
                                color={colors.error}
                              />
                            </TouchableOpacity>
                          </View>
                        ) : (
                          <TouchableOpacity
                            style={[
                              styles.imageUploadArea,
                              styles.imageUploadAreaEmpty,
                            ]}
                            onPress={handlePickImage}
                            activeOpacity={0.7}
                          >
                            <Ionicons
                              name="image-outline"
                              size={32}
                              color={colors.textSecondary}
                            />
                            <ThemedText style={styles.imageUploadHelper}>
                              {t("admin.sessions.fields.imageUploadCta")}
                            </ThemedText>
                          </TouchableOpacity>
                        )}
                      </View>
                    )}
                  />

                  {/* Venue */}
                  <Controller
                    control={form.control}
                    name="venue_id"
                    render={({ fieldState }) => (
                      <View style={styles.field}>
                        <ThemedText style={styles.fieldLabel}>
                          {t("admin.sessions.fields.venue")}
                        </ThemedText>
                        <TouchableOpacity
                          style={styles.fieldInput}
                          onPress={() => setVenuePickerVisible(true)}
                          activeOpacity={0.7}
                        >
                          <Ionicons
                            name="location-outline"
                            size={16}
                            color={colors.textSecondary}
                            style={styles.fieldInputIcon}
                          />
                          <ThemedText style={styles.fieldInputText}>
                            {selectedVenue?.name ||
                              t("admin.sessions.fields.venuePlaceholder")}
                          </ThemedText>
                          <Ionicons
                            name="chevron-forward"
                            size={18}
                            color={colors.textSecondary}
                          />
                        </TouchableOpacity>
                        {fieldState.error ? (
                          <ThemedText style={styles.fieldError}>
                            {t(
                              `admin.sessions.errors.${fieldState.error.message}`,
                            )}
                          </ThemedText>
                        ) : null}
                      </View>
                    )}
                  />

                  {/* Speakers */}
                  <View style={styles.field}>
                    <ThemedText style={styles.fieldLabel}>
                      {t("admin.sessions.fields.speakers")}
                    </ThemedText>
                    <TouchableOpacity
                      style={styles.fieldInput}
                      onPress={() => setSpeakerPickerVisible(true)}
                      activeOpacity={0.7}
                    >
                      <Ionicons
                        name="people-outline"
                        size={16}
                        color={colors.textSecondary}
                        style={styles.fieldInputIcon}
                      />
                      <ThemedText style={styles.fieldInputText}>
                        {selectedSpeakers.length
                          ? selectedSpeakers
                              .map((s) => s.full_name)
                              .join(", ")
                          : t("admin.sessions.fields.speakersPlaceholder")}
                      </ThemedText>
                      <Ionicons
                        name="chevron-forward"
                        size={18}
                        color={colors.textSecondary}
                      />
                    </TouchableOpacity>
                  </View>

                  {/* Exhibitor */}
                  <View style={styles.field}>
                    <ThemedText style={styles.fieldLabel}>
                      {t("admin.sessions.fields.exhibitor")}
                    </ThemedText>
                    <TouchableOpacity
                      style={styles.fieldInput}
                      onPress={() => setExhibitorPickerVisible(true)}
                      activeOpacity={0.7}
                    >
                      <Ionicons
                        name="briefcase-outline"
                        size={16}
                        color={colors.textSecondary}
                        style={styles.fieldInputIcon}
                      />
                      <ThemedText style={styles.fieldInputText}>
                        {selectedExhibitor?.full_name ||
                          t("admin.sessions.fields.exhibitorPlaceholder")}
                      </ThemedText>
                      {selectedExhibitor ? (
                        <TouchableOpacity
                          onPress={() => {
                            setSelectedExhibitor(null);
                            form.setValue("exhibitor_id", null);
                          }}
                          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                        >
                          <Ionicons
                            name="close-circle"
                            size={18}
                            color={colors.textSecondary}
                          />
                        </TouchableOpacity>
                      ) : (
                        <Ionicons
                          name="chevron-forward"
                          size={18}
                          color={colors.textSecondary}
                        />
                      )}
                    </TouchableOpacity>
                  </View>

                  {/* Cancel / Restore action (edit mode only) */}
                  {editingSession ? (
                    editingSession.is_cancelled ? (
                      <TouchableOpacity
                        style={styles.restoreButton}
                        onPress={handleRestore}
                        activeOpacity={0.8}
                      >
                        <Ionicons
                          name="refresh"
                          size={18}
                          color={colors.primary}
                        />
                        <ThemedText style={styles.restoreButtonText}>
                          {t("admin.sessions.restore.action")}
                        </ThemedText>
                      </TouchableOpacity>
                    ) : (
                      <TouchableOpacity
                        style={styles.cancelButton}
                        onPress={openCancelConfirm}
                        activeOpacity={0.8}
                      >
                        <Ionicons
                          name="close-circle"
                          size={18}
                          color={colors.error}
                        />
                        <ThemedText style={styles.cancelButtonText}>
                          {t("admin.sessions.cancel.action")}
                        </ThemedText>
                      </TouchableOpacity>
                    )
                  ) : null}
                </ScrollView>

                {/* Save button */}
                <TouchableOpacity
                  style={[
                    styles.saveButton,
                    (createMutation.isPending || updateMutation.isPending) &&
                      styles.saveButtonDisabled,
                  ]}
                  onPress={form.handleSubmit(onSubmit)}
                  disabled={createMutation.isPending || updateMutation.isPending}
                  activeOpacity={0.8}
                >
                  {createMutation.isPending || updateMutation.isPending ? (
                    <ActivityIndicator color={COLOR_WHITE_ON_ACCENT} size="small" />
                  ) : (
                    <ThemedText style={styles.saveButtonText}>
                      {editingSession
                        ? t("admin.sessions.saveButton")
                        : t("admin.sessions.createButton")}
                    </ThemedText>
                  )}
                </TouchableOpacity>
              </View>
            </KeyboardAvoidingView>
          </Modal>
        ) : null}

        {/* Cancel confirmation modal */}
        {cancelModalVisible && editingSession ? (
          <Modal visible animationType="fade" transparent>
            <View style={styles.cancelModalOverlay}>
              <View style={styles.cancelModalCard}>
                <View style={styles.cancelModalIconWrap}>
                  <Ionicons
                    name="warning"
                    size={40}
                    color={colors.error}
                  />
                </View>
                <ThemedText style={styles.cancelModalTitle}>
                  {t("admin.sessions.cancel.title", {
                    title: editingSession.title,
                  })}
                </ThemedText>
                <ThemedText style={styles.cancelModalBody}>
                  {t("admin.sessions.cancel.body")}
                </ThemedText>

                <View style={styles.impactCard}>
                  {impactData ? (
                    <>
                      <View style={styles.impactRow}>
                        <Ionicons
                          name="heart"
                          size={16}
                          color={colors.error}
                        />
                        <ThemedText style={styles.impactText}>
                          {t("admin.sessions.cancel.impactFavorites", {
                            count: impactData.favorites,
                          })}
                        </ThemedText>
                      </View>
                      <View style={styles.impactRow}>
                        <Ionicons
                          name="chatbubbles-outline"
                          size={16}
                          color={colors.textSecondary}
                        />
                        <ThemedText style={styles.impactText}>
                          {t("admin.sessions.cancel.impactChat", {
                            count: impactData.chat_messages,
                          })}
                        </ThemedText>
                      </View>
                      <View style={styles.impactRow}>
                        <Ionicons
                          name="help-circle-outline"
                          size={16}
                          color={colors.textSecondary}
                        />
                        <ThemedText style={styles.impactText}>
                          {t("admin.sessions.cancel.impactQa", {
                            count: impactData.qa_items,
                          })}
                        </ThemedText>
                      </View>
                    </>
                  ) : (
                    <ActivityIndicator
                      size="small"
                      color={colors.primary}
                    />
                  )}
                </View>

                <ThemedText style={styles.reversibleNote}>
                  {t("admin.sessions.cancel.reversible")}
                </ThemedText>

                <TouchableOpacity
                  style={[
                    styles.destructiveBtn,
                    cancelMutation.isPending && styles.saveButtonDisabled,
                  ]}
                  onPress={confirmCancel}
                  disabled={cancelMutation.isPending}
                  activeOpacity={0.8}
                >
                  {cancelMutation.isPending ? (
                    <ActivityIndicator color={COLOR_WHITE_ON_ACCENT} size="small" />
                  ) : (
                    <ThemedText style={styles.destructiveBtnText}>
                      {t("admin.sessions.cancel.confirm")}
                    </ThemedText>
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.outlineBtn}
                  onPress={() => setCancelModalVisible(false)}
                  activeOpacity={0.8}
                >
                  <ThemedText style={styles.outlineBtnText}>
                    {t("admin.sessions.cancel.dismiss")}
                  </ThemedText>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        ) : null}

        {/* Notify-update modal */}
        {notifyModalVisible && editingSession && pendingPatch ? (
          <Modal visible animationType="fade" transparent>
            <View style={styles.cancelModalOverlay}>
              <View style={styles.cancelModalCard}>
                <View style={styles.cancelModalIconWrap}>
                  <Ionicons
                    name="notifications-outline"
                    size={40}
                    color={colors.primary}
                  />
                </View>
                <ThemedText style={styles.cancelModalTitle}>
                  {t("admin.sessions.notifyUpdate.title", {
                    count: impactData?.favorites ?? 0,
                  })}
                </ThemedText>
                <ThemedText style={styles.cancelModalBody}>
                  {t("admin.sessions.notifyUpdate.body", {
                    what: t(
                      pendingPatch.timeChanged && pendingPatch.venueChanged
                        ? "admin.sessions.notifyUpdate.what.timeAndVenue"
                        : pendingPatch.timeChanged
                          ? "admin.sessions.notifyUpdate.what.time"
                          : "admin.sessions.notifyUpdate.what.venue",
                    ),
                  })}
                </ThemedText>

                <TouchableOpacity
                  style={styles.primaryBtn}
                  onPress={() => handleNotifyUpdateChoice(true)}
                  activeOpacity={0.8}
                >
                  <ThemedText style={styles.primaryBtnText}>
                    {t("admin.sessions.notifyUpdate.saveAndNotify")}
                  </ThemedText>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.outlineBtn}
                  onPress={() => handleNotifyUpdateChoice(false)}
                  activeOpacity={0.8}
                >
                  <ThemedText style={styles.outlineBtnText}>
                    {t("admin.sessions.notifyUpdate.saveOnly")}
                  </ThemedText>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        ) : null}

        {/* Type picker (inline modal action list) */}
        {typePickerVisible ? (
          <Modal visible animationType="fade" transparent>
            <TouchableOpacity
              style={styles.typePickerOverlay}
              activeOpacity={1}
              onPress={() => setTypePickerVisible(false)}
            >
              <View style={styles.typePickerSheet}>
                {SESSION_TYPES.map((option) => (
                  <TouchableOpacity
                    key={option}
                    style={styles.typePickerRow}
                    onPress={() => {
                      form.setValue("type", option, {
                        shouldValidate: true,
                      });
                      setTypePickerVisible(false);
                    }}
                  >
                    <ThemedText style={styles.typePickerText}>
                      {option}
                    </ThemedText>
                  </TouchableOpacity>
                ))}
              </View>
            </TouchableOpacity>
          </Modal>
        ) : null}

        {/* EntityPicker — venue */}
        <EntityPicker<AdminVenue>
          visible={venuePickerVisible}
          onClose={() => setVenuePickerVisible(false)}
          onSelect={(v) => {
            const venue = v as AdminVenue;
            setSelectedVenue(venue);
            form.setValue("venue_id", venue.id, { shouldValidate: true });
          }}
          mode="single"
          title={t("admin.sessions.picker.venueTitle")}
          searchPlaceholder={t("admin.sessions.searchPlaceholder")}
          queryKey={["picker", "venues"]}
          queryFn={(s) => getAdminVenues(s || undefined)}
          renderRow={(v) => (
            <View>
              <ThemedText style={styles.pickerRowLabel}>{v.name}</ThemedText>
              <ThemedText style={styles.pickerRowSub}>
                {v.key}
                {v.category ? ` · ${v.category}` : ""}
              </ThemedText>
            </View>
          )}
          keyExtractor={(v) => String(v.id)}
          initialValue={selectedVenue}
        />

        {/* EntityPicker — speakers (multi) */}
        <EntityPicker<AdminUser>
          visible={speakerPickerVisible}
          onClose={() => setSpeakerPickerVisible(false)}
          onSelect={(v) => {
            const arr = v as AdminUser[];
            setSelectedSpeakers(arr);
            form.setValue(
              "speaker_ids",
              arr.map((u) => u.id),
              { shouldValidate: true },
            );
          }}
          mode="multi"
          title={t("admin.sessions.picker.speakerTitle")}
          searchPlaceholder={t("admin.sessions.searchPlaceholder")}
          queryKey={["picker", "speakers"]}
          queryFn={(s) => getAdminSpeakerUsers(s || undefined)}
          renderRow={(u) => (
            <View>
              <ThemedText style={styles.pickerRowLabel}>
                {u.full_name}
              </ThemedText>
              <ThemedText style={styles.pickerRowSub}>{u.email}</ThemedText>
            </View>
          )}
          keyExtractor={(u) => String(u.id)}
          initialValue={selectedSpeakers}
        />

        {/* EntityPicker — exhibitor */}
        <EntityPicker<AdminExhibitor>
          visible={exhibitorPickerVisible}
          onClose={() => setExhibitorPickerVisible(false)}
          onSelect={(v) => {
            const ex = v as AdminExhibitor;
            setSelectedExhibitor(ex);
            form.setValue("exhibitor_id", ex.id);
          }}
          mode="single"
          title={t("admin.sessions.picker.exhibitorTitle")}
          searchPlaceholder={t("admin.sessions.searchPlaceholder")}
          queryKey={["picker", "exhibitors"]}
          queryFn={(s) => getAdminExhibitors(s || undefined)}
          renderRow={(e) => (
            <View>
              <ThemedText style={styles.pickerRowLabel}>
                {e.full_name}
              </ThemedText>
              <ThemedText style={styles.pickerRowSub}>
                {e.company ?? ""}
                {e.booth_code ? ` · ${e.booth_code}` : ""}
              </ThemedText>
            </View>
          )}
          keyExtractor={(e) => String(e.id)}
          initialValue={selectedExhibitor}
        />
      </SafeAreaView>
    </>
  );
}

// ---------- Styles ----------

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
      fontSize: 15,
      fontWeight: "400",
      color: colors.textSecondary,
      textAlign: "center",
      paddingHorizontal: 16,
    },
    // Search
    searchContainer: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.searchBackground,
      borderWidth: 1,
      borderColor: colors.searchBorder,
      borderRadius: 10,
      marginHorizontal: 16,
      marginVertical: 12,
      paddingHorizontal: 12,
      height: 42,
    },
    searchIcon: {
      marginRight: 8,
    },
    searchInput: {
      flex: 1,
      color: colors.text,
      fontSize: 15,
      fontWeight: "400",
    },
    // Segmented control
    segmentedContainer: {
      flexDirection: "row",
      marginHorizontal: 16,
      height: 36,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: "hidden",
      marginTop: 4,
    },
    segmentBtn: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "transparent",
    },
    segmentBtnActive: {
      backgroundColor: colors.primary,
    },
    segmentText: {
      fontSize: 12,
      fontWeight: "400",
      color: colors.textSecondary,
    },
    segmentTextActive: {
      color: COLOR_WHITE_ON_ACCENT,
      fontWeight: "700",
    },
    // Show cancelled
    showCancelledRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 16,
      paddingVertical: 8,
    },
    showCancelledLabel: {
      fontSize: 12,
      fontWeight: "700",
      color: colors.label,
    },
    // List
    list: {
      paddingHorizontal: 16,
      paddingTop: 4,
    },
    row: {
      backgroundColor: colors.cardBackground,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      borderRadius: 10,
      padding: 14,
      marginBottom: 8,
    },
    rowCancelled: {
      opacity: 0.75,
    },
    rowHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      marginBottom: 4,
    },
    rowTitle: {
      flex: 1,
      fontSize: 15,
      fontWeight: "700",
      color: colors.text,
    },
    rowMeta: {
      fontSize: 12,
      fontWeight: "400",
      color: colors.textSecondary,
      marginBottom: 4,
    },
    tagsRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 4,
      marginTop: 4,
    },
    tagChip: {
      backgroundColor: colors.primary + "20",
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 8,
    },
    tagChipEditable: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.primary + "20",
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 8,
      gap: 4,
    },
    tagRemoveIcon: {
      marginLeft: 2,
    },
    tagText: {
      fontSize: 12,
      fontWeight: "700",
      color: colors.primary,
    },
    // FAB
    fab: {
      position: "absolute",
      right: 24,
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: colors.primary,
      justifyContent: "center",
      alignItems: "center",
      elevation: 6,
      shadowColor: SHADOW_BLACK,
      shadowOpacity: 0.25,
      shadowRadius: 6,
      shadowOffset: { width: 0, height: 2 },
    },
    // Form modal
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.6)",
      justifyContent: "flex-end",
    },
    modalContent: {
      backgroundColor: colors.gradientStart,
      borderTopLeftRadius: 16,
      borderTopRightRadius: 16,
      maxHeight: "85%",
      paddingHorizontal: 16,
      paddingTop: 16,
    },
    modalHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 12,
    },
    modalHeaderActions: {
      flexDirection: "row",
      alignItems: "center",
      gap: 16,
    },
    modalHeaderIcon: {
      padding: 4,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: "700",
      color: colors.text,
    },
    modalScroll: {
      paddingBottom: 12,
    },
    // Form fields
    field: {
      marginBottom: 14,
    },
    fieldLabel: {
      fontSize: 12,
      fontWeight: "700",
      color: colors.label,
      marginBottom: 6,
    },
    fieldInput: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.cardBackground,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 10,
      minHeight: 44,
      color: colors.text,
      fontSize: 15,
      gap: 8,
    },
    fieldInputIcon: {
      marginRight: 4,
    },
    fieldInputText: {
      flex: 1,
      fontSize: 15,
      fontWeight: "400",
      color: colors.text,
    },
    fieldInputMulti: {
      minHeight: 80,
      alignItems: "flex-start",
      paddingVertical: 10,
    },
    fieldError: {
      fontSize: 12,
      fontWeight: "400",
      color: colors.error,
      marginTop: 4,
    },
    // Date/time buttons
    dateTimeRow: {
      flexDirection: "row",
      gap: 8,
    },
    dateTimeBtn: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.cardBackground,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 10,
      minHeight: 44,
      gap: 6,
    },
    dateTimeText: {
      fontSize: 15,
      fontWeight: "400",
      color: colors.text,
    },
    // Image upload
    imageUploadArea: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 10,
      minHeight: 120,
      justifyContent: "center",
      alignItems: "center",
      gap: 8,
    },
    imageUploadAreaEmpty: {
      borderStyle: "dashed",
    },
    imageUploadAreaCenter: {
      backgroundColor: colors.cardBackground,
    },
    imageUploadHelper: {
      fontSize: 12,
      fontWeight: "400",
      color: colors.textSecondary,
    },
    imageUploaded: {
      position: "relative",
    },
    imagePreview: {
      width: "100%",
      height: 180,
      borderRadius: 10,
    },
    imageRemoveBtn: {
      position: "absolute",
      top: 8,
      right: 8,
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: "rgba(0,0,0,0.6)",
      justifyContent: "center",
      alignItems: "center",
    },
    // Save
    saveButton: {
      backgroundColor: colors.primary,
      borderRadius: 10,
      paddingVertical: 14,
      marginBottom: 20,
      marginTop: 8,
      alignItems: "center",
      justifyContent: "center",
    },
    saveButtonDisabled: {
      opacity: 0.7,
    },
    saveButtonText: {
      fontSize: 16,
      fontWeight: "700",
      color: COLOR_WHITE_ON_ACCENT,
    },
    // Cancel / Restore action (inside form)
    cancelButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      borderWidth: 1,
      borderColor: colors.error,
      borderRadius: 10,
      paddingVertical: 12,
      marginTop: 8,
    },
    cancelButtonText: {
      fontSize: 15,
      fontWeight: "700",
      color: colors.error,
    },
    restoreButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      borderWidth: 1,
      borderColor: colors.primary,
      borderRadius: 10,
      paddingVertical: 12,
      marginTop: 8,
    },
    restoreButtonText: {
      fontSize: 15,
      fontWeight: "700",
      color: colors.primary,
    },
    // Cancel confirmation modal
    cancelModalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.6)",
      justifyContent: "center",
      alignItems: "center",
      padding: 16,
    },
    cancelModalCard: {
      width: "100%",
      maxWidth: 420,
      backgroundColor: colors.gradientStart,
      borderRadius: 16,
      padding: 20,
      borderWidth: 1,
      borderColor: colors.cardBorder,
    },
    cancelModalIconWrap: {
      alignItems: "center",
      marginBottom: 12,
    },
    cancelModalTitle: {
      fontSize: 18,
      fontWeight: "700",
      color: colors.text,
      textAlign: "center",
      marginBottom: 8,
    },
    cancelModalBody: {
      fontSize: 15,
      fontWeight: "400",
      color: colors.text,
      textAlign: "center",
      lineHeight: 20,
      marginBottom: 12,
    },
    impactCard: {
      backgroundColor: colors.cardBackground,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      borderRadius: 12,
      padding: 12,
      marginBottom: 12,
      gap: 8,
      minHeight: 72,
      justifyContent: "center",
    },
    impactRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    impactText: {
      flex: 1,
      fontSize: 15,
      fontWeight: "400",
      color: colors.text,
    },
    reversibleNote: {
      fontSize: 12,
      fontWeight: "400",
      color: colors.error,
      textAlign: "center",
      marginBottom: 12,
    },
    destructiveBtn: {
      backgroundColor: colors.error,
      borderRadius: 10,
      paddingVertical: 14,
      marginBottom: 8,
      alignItems: "center",
      justifyContent: "center",
    },
    destructiveBtnText: {
      fontSize: 16,
      fontWeight: "700",
      color: COLOR_WHITE_ON_ACCENT,
    },
    outlineBtn: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 10,
      paddingVertical: 14,
      alignItems: "center",
      justifyContent: "center",
    },
    outlineBtnText: {
      fontSize: 16,
      fontWeight: "700",
      color: colors.text,
    },
    primaryBtn: {
      backgroundColor: colors.primary,
      borderRadius: 10,
      paddingVertical: 14,
      marginBottom: 8,
      alignItems: "center",
      justifyContent: "center",
    },
    primaryBtnText: {
      fontSize: 16,
      fontWeight: "700",
      color: COLOR_WHITE_ON_ACCENT,
    },
    // Type picker
    typePickerOverlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.6)",
      justifyContent: "flex-end",
    },
    typePickerSheet: {
      backgroundColor: colors.gradientStart,
      borderTopLeftRadius: 16,
      borderTopRightRadius: 16,
      paddingVertical: 8,
    },
    typePickerRow: {
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    typePickerText: {
      fontSize: 15,
      fontWeight: "400",
      color: colors.text,
      textTransform: "capitalize",
    },
    // Picker row content
    pickerRowLabel: {
      fontSize: 15,
      fontWeight: "700",
      color: colors.text,
    },
    pickerRowSub: {
      fontSize: 12,
      fontWeight: "400",
      color: colors.textSecondary,
      marginTop: 2,
    },
  });
