import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";

import { useColors } from "@/hooks/use-colors";
import { ThemedText } from "@/components/themed-text";

export type EntityPickerMode = "single" | "multi";

export type EntityPickerProps<T> = {
  visible: boolean;
  onClose: () => void;
  onSelect: (value: T | T[]) => void;
  mode: EntityPickerMode;
  title: string;
  searchPlaceholder: string;
  queryKey: readonly unknown[];
  queryFn: (search: string) => Promise<T[]>;
  renderRow: (item: T, selected: boolean) => React.ReactNode;
  keyExtractor: (item: T) => string;
  initialValue?: T | T[] | null;
};

export function EntityPicker<T>(props: EntityPickerProps<T>) {
  const {
    visible,
    onClose,
    onSelect,
    mode,
    title,
    searchPlaceholder,
    queryKey,
    queryFn,
    renderRow,
    keyExtractor,
    initialValue,
  } = props;

  const { t } = useTranslation();
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [selected, setSelected] = useState<T[]>([]);

  // Reset selection from initialValue on each open transition
  useEffect(() => {
    if (!visible) return;
    if (mode === "multi") {
      if (Array.isArray(initialValue)) {
        setSelected(initialValue as T[]);
      } else {
        setSelected([]);
      }
    } else {
      if (initialValue && !Array.isArray(initialValue)) {
        setSelected([initialValue as T]);
      } else {
        setSelected([]);
      }
    }
    setSearch("");
    setDebouncedSearch("");
  }, [visible, mode, initialValue]);

  const handleSearchChange = useCallback((text: string) => {
    setSearch(text);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setDebouncedSearch(text);
    }, 300);
  }, []);

  const { data, isLoading } = useQuery<T[]>({
    queryKey: [...queryKey, debouncedSearch],
    queryFn: () => queryFn(debouncedSearch),
    enabled: visible,
  });

  const isSelected = useCallback(
    (item: T) => {
      const key = keyExtractor(item);
      return selected.some((s) => keyExtractor(s) === key);
    },
    [selected, keyExtractor],
  );

  const handleRowPress = useCallback(
    (item: T) => {
      if (mode === "single") {
        onSelect(item);
        onClose();
        return;
      }
      // multi
      const key = keyExtractor(item);
      setSelected((prev) => {
        if (prev.some((s) => keyExtractor(s) === key)) {
          return prev.filter((s) => keyExtractor(s) !== key);
        }
        return [...prev, item];
      });
    },
    [mode, onSelect, onClose, keyExtractor],
  );

  const handleDone = useCallback(() => {
    onSelect(selected);
    onClose();
  }, [onSelect, onClose, selected]);

  const renderItem = ({ item }: { item: T }) => {
    const sel = isSelected(item);
    return (
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => handleRowPress(item)}
        style={[
          styles.row,
          sel && mode === "single" && styles.rowSelectedSingle,
        ]}
      >
        <View style={styles.rowContent}>{renderRow(item, sel)}</View>
        {mode === "multi" ? (
          <Ionicons
            name={sel ? "checkmark-circle" : "ellipse-outline"}
            size={24}
            color={sel ? colors.primary : colors.border}
          />
        ) : null}
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
      transparent={false}
    >
      <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={onClose}
            style={styles.headerBtn}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="close" size={24} color={colors.text} />
          </TouchableOpacity>
          <ThemedText style={styles.headerTitle}>{title}</ThemedText>
          {mode === "multi" ? (
            <TouchableOpacity
              onPress={handleDone}
              style={styles.headerBtn}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <ThemedText style={styles.doneText}>
                {t("admin.sessions.picker.done")}
              </ThemedText>
            </TouchableOpacity>
          ) : (
            <View style={styles.headerBtn} />
          )}
        </View>

        <View style={styles.searchContainer}>
          <Ionicons
            name="search"
            size={18}
            color={colors.placeholder}
            style={styles.searchIcon}
          />
          <TextInput
            value={search}
            onChangeText={handleSearchChange}
            placeholder={searchPlaceholder}
            placeholderTextColor={colors.placeholder}
            style={styles.searchInput}
          />
        </View>

        {isLoading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <FlatList
            data={data ?? []}
            keyExtractor={keyExtractor}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <View style={styles.centered}>
                <ThemedText style={styles.emptyText}>
                  {debouncedSearch
                    ? t("admin.sessions.picker.emptySearch", {
                        search: debouncedSearch,
                      })
                    : t("admin.sessions.picker.empty")}
                </ThemedText>
              </View>
            }
          />
        )}
      </SafeAreaView>
    </Modal>
  );
}

const createStyles = (colors: ReturnType<typeof useColors>) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      height: 56,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 16,
      backgroundColor: colors.gradientStart,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    headerBtn: {
      minWidth: 48,
      justifyContent: "center",
    },
    headerTitle: {
      flex: 1,
      textAlign: "center",
      fontSize: 16,
      fontWeight: "700",
      color: colors.text,
    },
    doneText: {
      fontSize: 15,
      fontWeight: "700",
      color: colors.primary,
      textAlign: "right",
    },
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
    listContent: {
      padding: 16,
      paddingTop: 4,
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      padding: 14,
      backgroundColor: colors.cardBackground,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      marginBottom: 8,
    },
    rowSelectedSingle: {
      backgroundColor: colors.primary + "20",
      borderColor: colors.primary,
    },
    rowContent: {
      flex: 1,
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
  });
