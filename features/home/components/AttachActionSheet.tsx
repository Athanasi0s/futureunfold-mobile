import { SHADOW_BLACK } from "@/constants/data-colors";
import { useColors } from "@/hooks/use-colors";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { ThemedText } from "@/components/themed-text";
import {
  Animated,
  Modal,
  Pressable,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

type AttachActionSheetProps = {
  visible: boolean;
  onClose: () => void;
  onPickPhoto: () => void;
  onTakePhoto: () => void;
  onPickFile: () => void;
  onCreatePoll: () => void;
};

type ActionRowProps = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  colors: ReturnType<typeof useColors>;
};

function ActionRow({ icon, label, onPress, colors }: ActionRowProps) {
  return (
    <TouchableOpacity
      style={[
        styles.row,
        { borderBottomColor: colors.cardBorder },
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View
        style={[styles.iconContainer, { backgroundColor: colors.cardBorder }]}
      >
        <Ionicons name={icon} size={22} color={colors.primary} />
      </View>
      <ThemedText style={[styles.rowLabel, { color: colors.text }]}>{label}</ThemedText>
      <Ionicons name="chevron-forward" size={18} color={colors.textSubtle} />
    </TouchableOpacity>
  );
}

export function AttachActionSheet({
  visible,
  onClose,
  onPickPhoto,
  onTakePhoto,
  onPickFile,
  onCreatePoll,
}: AttachActionSheetProps) {
  const colors = useColors();
  const { t } = useTranslation();
  const slideAnim = useRef(new Animated.Value(300)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 280,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 300,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, slideAnim, opacityAnim]);

  if (!visible) return null;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        {/* Semi-transparent backdrop */}
        <Animated.View style={[styles.backdrop, { opacity: opacityAnim }]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        </Animated.View>

        {/* Slide-up sheet */}
        <Animated.View
          style={[
            styles.sheet,
            {
              backgroundColor: colors.gradientStart,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          {/* Handle */}
          <View style={styles.handleContainer}>
            <View style={[styles.handle, { backgroundColor: colors.cardBorder }]} />
          </View>

          {/* Actions */}
          <ActionRow
            icon="image-outline"
            label={t("chat.attachPhoto", "Photo from Gallery")}
            onPress={onPickPhoto}
            colors={colors}
          />
          <ActionRow
            icon="camera-outline"
            label={t("chat.attachCamera", "Take Photo")}
            onPress={onTakePhoto}
            colors={colors}
          />
          <ActionRow
            icon="document-outline"
            label={t("chat.attachFile", "File")}
            onPress={onPickFile}
            colors={colors}
          />
          <ActionRow
            icon="bar-chart-outline"
            label={t("chat.attachPoll", "Poll")}
            onPress={onCreatePoll}
            colors={colors}
          />

          {/* Cancel */}
          <TouchableOpacity
            style={[
              styles.cancelButton,
              {
                backgroundColor: colors.cardBackground,
                borderColor: colors.cardBorder,
              },
            ]}
            onPress={onClose}
            activeOpacity={0.7}
          >
            <ThemedText style={[styles.cancelLabel, { color: colors.textSecondary }]}>
              {t("common.cancel", "Cancel")}
            </ThemedText>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  sheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 32,
    shadowColor: SHADOW_BLACK,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 10,
  },
  handleContainer: {
    alignItems: "center",
    paddingVertical: 10,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 14,
  },
  iconContainer: {
    width: 38,
    height: 38,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  rowLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: "500",
  },
  cancelButton: {
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: 14,
    alignItems: "center",
  },
  cancelLabel: {
    fontSize: 16,
    fontWeight: "500",
  },
});
