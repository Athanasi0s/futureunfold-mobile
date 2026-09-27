import { zodResolver } from "@hookform/resolvers/zod";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Controller, useForm } from "react-hook-form";
import {
  Alert,
  Dimensions,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { z } from "zod";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { UIButton } from "@/components/ui/ui-button";
import { UITextInput } from "@/components/ui/ui-textinput";
import { EMPTY_STATE_ICON } from "@/constants/data-colors";
import { COLOR_WHITE_ON_ACCENT } from "@/constants/theme";
import { UIVerticalSpacer } from "@/components/ui/UIVerticalSpacer";
import { useGetShowcases } from "@/features/exhibitors/hooks/useGetShowcases";
import { useAddShowcase } from "@/features/exhibitors/hooks/useAddShowcase";
import { useDeleteShowcase } from "@/features/exhibitors/hooks/useDeleteShowcase";
import { useColors } from "@/hooks/use-colors";
import { ThemedText } from "@/components/themed-text";
import { TenantBackgroundArt } from "@/components/tenant-background-art";
import { getTenantBackgroundSource } from "@/constants/tenant-assets";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const GRID_GAP = 12;
const CARD_WIDTH = (SCREEN_WIDTH - 32 - GRID_GAP) / 2;

// ─── Schema ───────────────────────────────────────────────────────────────────

const addProductSchema = z.object({
  title: z.string().min(1, "Title is required"),
  icon_url: z.string().optional(),
  visible: z.boolean(),
});

type AddProductFormData = z.infer<typeof addProductSchema>;

// ─── Component ────────────────────────────────────────────────────────────────

export default function ShowcaseScreen() {
  const { t } = useTranslation();
  const colors = useColors();
  const styles = getStyles(colors);
  const [addProductVisible, setAddProductVisible] = useState(false);
  const { width } = useWindowDimensions();
  const hasBackgroundArt = Boolean(getTenantBackgroundSource());
  const artworkHeight = width * (1864 / 2100);

  const showcasesQuery = useGetShowcases();
  const addShowcase = useAddShowcase();
  const deleteShowcase = useDeleteShowcase();

  const products = showcasesQuery.data ?? [];

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AddProductFormData>({
    resolver: zodResolver(addProductSchema),
    defaultValues: { title: "", icon_url: "", visible: true },
  });

  const handleDeleteProduct = (id: number) => {
    deleteShowcase.mutate(id, {
      onError: () => Alert.alert(t("exhibitor.showcase.alertError"), t("exhibitor.showcase.alertDeleteFailed")),
    });
  };

  const handleAddProduct = (data: AddProductFormData) => {
    addShowcase.mutate(
      {
        title: data.title,
        icon_url: data.icon_url || undefined,
        visible: data.visible,
      },
      {
        onSuccess: () => {
          reset();
          setAddProductVisible(false);
        },
        onError: () => Alert.alert(t("exhibitor.showcase.alertError"), t("exhibitor.showcase.alertAddFailed")),
      }
    );
  };

  const handleDone = () => {
    router.replace("/(exhibitor-tabs)/admin");
  };

  // ─── Render ──────────────────────────────────────────────────────────────

  return (
    <View style={styles.container}>
      {hasBackgroundArt && (
        <TenantBackgroundArt
          variant="secondary"
          style={[styles.backgroundArt, { width, height: artworkHeight }]}
        />
      )}
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <SafeAreaView style={styles.headerSafeArea}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.replace("/(exhibitor-tabs)/admin")}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={styles.headerSideBtn}
          >
            <Ionicons name="close" size={22} color={COLOR_WHITE_ON_ACCENT} />
          </TouchableOpacity>

          <View style={styles.headerCenter}>
            <ThemedText style={styles.headerTitle}>{t("exhibitor.showcase.title")}</ThemedText>
            <ThemedText style={styles.headerSubtitle}>{t("exhibitor.showcase.kioskMgmt")}</ThemedText>
          </View>

          <TouchableOpacity
            onPress={handleDone}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={styles.headerSideBtn}
          >
            <ThemedText style={styles.doneText}>{t("exhibitor.showcase.done")}</ThemedText>
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        <ThemedText style={styles.description}>
          {t("exhibitor.showcase.kioskDesc")}
        </ThemedText>

        {/* Product Grid */}
        <View style={styles.grid}>
          {products.map((product) => (
            <View key={product.id} style={styles.productCard}>
              {/* Image */}
              <View style={styles.productImageWrap}>
                {product.icon_url ? (
                  <Image
                    source={{ uri: product.icon_url }}
                    style={[
                      styles.productImage,
                      !product.visible && styles.productImageDim,
                    ]}
                  />
                ) : (
                  <View
                    style={[
                      styles.productImagePlaceholder,
                      !product.visible && styles.productImageDim,
                    ]}
                  >
                    <Ionicons name="image-outline" size={32} color={colors.textTertiary} />
                  </View>
                )}

                {/* Delete button overlay */}
                <TouchableOpacity
                  style={styles.editBtn}
                  onPress={() => handleDeleteProduct(product.id)}
                  hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
                >
                  <Ionicons name="trash-outline" size={13} color={COLOR_WHITE_ON_ACCENT} />
                </TouchableOpacity>
              </View>

              {/* Title */}
              <ThemedText
                style={[
                  styles.productName,
                  !product.visible && styles.productNameDim,
                ]}
                numberOfLines={1}
              >
                {product.title}
              </ThemedText>

              {/* Visibility label */}
              <View style={styles.productFooter}>
                <ThemedText
                  style={[
                    styles.visibilityLabel,
                    product.visible
                      ? styles.visibilityOn
                      : styles.visibilityOff,
                  ]}
                >
                  {product.visible ? t("exhibitor.showcase.visible") : t("exhibitor.showcase.hidden")}
                </ThemedText>
              </View>
            </View>
          ))}

          {/* Add Product Card */}
          {products.length < 5 && (
            <TouchableOpacity
              style={styles.addCard}
              onPress={() => setAddProductVisible(true)}
              activeOpacity={0.7}
            >
              <View style={styles.addIcon}>
                <Ionicons name="add" size={32} color={colors.brand} />
              </View>
              <ThemedText style={styles.addText}>{t("exhibitor.showcase.addProduct")}</ThemedText>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      {/* Add Product Bottom Sheet */}
      <BottomSheet
        visible={addProductVisible}
        onClose={() => {
          reset();
          setAddProductVisible(false);
        }}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <ThemedText style={styles.sheetTitle}>{t("exhibitor.showcase.addProductSheet")}</ThemedText>
          <UIVerticalSpacer height={20} />

          <UITextInput
            control={control}
            name="title"
            label={t("exhibitor.showcase.fieldTitle")}
            placeholder={t("exhibitor.showcase.productNamePlaceholder")}
            labelColor="label"
            backroundColor="inputBackground"
            placeholderTextColor="placeholder"
            borderColor="primary"
            hasError={!!errors.title}
            errorMessage={errors.title?.message}
          />
          <UIVerticalSpacer height={16} />

          <UITextInput
            control={control}
            name="icon_url"
            label={t("exhibitor.showcase.imageUrlOptional")}
            placeholder={t("common.urlPlaceholder")}
            labelColor="label"
            backroundColor="inputBackground"
            placeholderTextColor="placeholder"
            borderColor="primary"
            hasError={!!errors.icon_url}
            errorMessage={errors.icon_url?.message}
            autoCapitalize="none"
            keyboardType="url"
          />
          <UIVerticalSpacer height={16} />

          <View style={styles.switchRow}>
            <ThemedText style={styles.switchLabel}>{t("exhibitor.showcase.visibleLabel")}</ThemedText>
            <Controller
              control={control}
              name="visible"
              render={({ field: { value, onChange } }) => (
                <Switch
                  value={value}
                  onValueChange={onChange}
                  trackColor={{ false: EMPTY_STATE_ICON, true: colors.brand }}
                  thumbColor={COLOR_WHITE_ON_ACCENT}
                  ios_backgroundColor={EMPTY_STATE_ICON}
                />
              )}
            />
          </View>
          <UIVerticalSpacer height={28} />

          <UIButton
            title={addShowcase.isPending ? t("exhibitor.showcase.adding") : t("exhibitor.showcase.addProductBtn")}
            onPress={handleSubmit(handleAddProduct)}
          />
        </KeyboardAvoidingView>
      </BottomSheet>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const getStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surfacePrimary,
  },
  backgroundArt: {
    position: "absolute",
    top: 0,
    alignSelf: "center",
    opacity: 0.16,
  },

  // Header
  headerSafeArea: {
    backgroundColor: colors.surfaceSecondary,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.08)",
  },
  headerSideBtn: {
    width: 48,
    alignItems: "flex-start",
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: COLOR_WHITE_ON_ACCENT,
  },
  headerSubtitle: {
    fontSize: 10,
    fontWeight: "700",
    color: colors.brand,
    letterSpacing: 1,
    marginTop: 2,
  },
  doneText: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.brand,
    textAlign: "right",
    width: 48,
  },

  // Scroll
  scrollView: { flex: 1 },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },

  description: {
    fontSize: 13,
    color: colors.textTertiary,
    lineHeight: 19,
    marginBottom: 20,
  },

  // Grid
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: GRID_GAP,
  },

  // Product card
  productCard: {
    width: CARD_WIDTH,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 14,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  productImageWrap: {
    width: CARD_WIDTH,
    height: CARD_WIDTH * 0.75,
    position: "relative",
  },
  productImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  productImageDim: {
    opacity: 0.4,
  },
  productImagePlaceholder: {
    width: "100%",
    height: "100%",
    backgroundColor: colors.cardBackground,
    justifyContent: "center",
    alignItems: "center",
  },
  editBtn: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "center",
    alignItems: "center",
  },
  productName: {
    fontSize: 13,
    fontWeight: "600",
    color: COLOR_WHITE_ON_ACCENT,
    paddingHorizontal: 10,
    paddingTop: 10,
    paddingBottom: 6,
  },
  productNameDim: {
    color: colors.textTertiary,
  },
  productFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 10,
    paddingBottom: 10,
  },
  visibilityLabel: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  visibilityOn: {
    color: colors.success,
  },
  visibilityOff: {
    color: colors.textTertiary,
  },

  // Bottom sheet
  sheetTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: COLOR_WHITE_ON_ACCENT,
    marginTop: 4,
  },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 4,
  },
  switchLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: COLOR_WHITE_ON_ACCENT,
  },

  // Add product card
  addCard: {
    width: CARD_WIDTH,
    height: CARD_WIDTH * 0.75 + 60, // match approximate card height
    borderRadius: 14,
    borderWidth: 2,
    borderColor: "rgba(25,79,240,0.25)",
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  addIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "rgba(25,79,240,0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  addText: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.textTertiary,
    letterSpacing: 1,
  },
});
