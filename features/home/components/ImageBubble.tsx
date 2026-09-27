import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useState } from "react";
import {
  Dimensions,
  Modal,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

import { COLOR_WHITE_ON_ACCENT } from "@/constants/theme";
import { getApiBaseUrl } from "@/api/base-url";
const { width: SCREEN_WIDTH } = Dimensions.get("window");

type ImageBubbleProps = {
  uri: string;
  extraData?: Record<string, unknown> | null;
};

function resolveUrl(uri: string): string {
  if (uri.startsWith("http://") || uri.startsWith("https://")) {
    return uri;
  }
  return `${getApiBaseUrl()}${uri}`;
}

export function ImageBubble({ uri, extraData }: ImageBubbleProps) {
  const [modalVisible, setModalVisible] = useState(false);
  const fullUrl = resolveUrl(uri);

  const rawWidth = extraData?.width as number | undefined;
  const rawHeight = extraData?.height as number | undefined;
  const aspectRatio =
    rawWidth && rawHeight && rawWidth > 0 && rawHeight > 0
      ? rawWidth / rawHeight
      : 4 / 3;

  return (
    <>
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => setModalVisible(true)}
        style={styles.container}
      >
        <Image
          source={{ uri: fullUrl }}
          style={[styles.image, { aspectRatio }]}
          contentFit="cover"
        />
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setModalVisible(false)}
            hitSlop={12}
          >
            <Ionicons name="close" size={28} color={COLOR_WHITE_ON_ACCENT} />
          </TouchableOpacity>

          <ScrollView
            maximumZoomScale={3}
            minimumZoomScale={1}
            contentContainerStyle={styles.scrollContent}
            centerContent
          >
            <Image
              source={{ uri: fullUrl }}
              style={styles.fullImage}
              contentFit="contain"
            />
          </ScrollView>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    overflow: "hidden",
    maxWidth: SCREEN_WIDTH * 0.65,
  },
  image: {
    width: "100%",
    maxHeight: 200,
    borderRadius: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.92)",
    justifyContent: "center",
  },
  closeButton: {
    position: "absolute",
    top: 48,
    right: 20,
    zIndex: 10,
    padding: 8,
  },
  scrollContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  fullImage: {
    width: SCREEN_WIDTH,
    height: SCREEN_WIDTH,
  },
});
