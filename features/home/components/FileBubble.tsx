import { getApiBaseUrl } from "@/api/base-url";
import { useColors } from "@/hooks/use-colors";
import { Ionicons } from "@expo/vector-icons";
import {
  Linking,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { ThemedText } from "@/components/themed-text";

type FileBubbleProps = {
  uri: string;
  extraData?: Record<string, unknown> | null;
};

function resolveUrl(uri: string): string {
  if (uri.startsWith("http://") || uri.startsWith("https://")) {
    return uri;
  }
  return `${getApiBaseUrl()}${uri}`;
}

function formatBytes(bytes: unknown): string {
  if (typeof bytes !== "number" || bytes <= 0) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function FileBubble({ uri, extraData }: FileBubbleProps) {
  const colors = useColors();
  const fullUrl = resolveUrl(uri);

  const filename = (extraData?.original_name as string | undefined) ?? "File";
  const sizeBytes = extraData?.size_bytes;
  const mimeType = (extraData?.mime_type as string | undefined) ?? "";
  const sizeLabel = formatBytes(sizeBytes);
  const isPdf = mimeType === "application/pdf" || uri.toLowerCase().endsWith(".pdf");
  const iconName = isPdf ? "document-text-outline" : "document-outline";

  const handlePress = () => {
    Linking.openURL(fullUrl).catch(() => {
      // silently fail — user may not have an app to open this file type
    });
  };

  return (
    <TouchableOpacity
      activeOpacity={0.75}
      onPress={handlePress}
      style={[
        styles.container,
        {
          backgroundColor: colors.cardBackground,
          borderColor: colors.cardBorder,
        },
      ]}
    >
      <Ionicons name={iconName} size={28} color={colors.primary} style={styles.icon} />
      <View style={styles.textCol}>
        <ThemedText
          style={[styles.filename, { color: colors.text }]}
          numberOfLines={2}
        >
          {filename}
        </ThemedText>
        {sizeLabel ? (
          <ThemedText style={[styles.size, { color: colors.textSubtle }]}>{sizeLabel}</ThemedText>
        ) : null}
      </View>
      <Ionicons
        name="chevron-forward"
        size={18}
        color={colors.textSubtle}
        style={styles.chevron}
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 10,
    maxWidth: 260,
  },
  icon: {
    flexShrink: 0,
  },
  textCol: {
    flex: 1,
  },
  filename: {
    fontSize: 13,
    fontWeight: "600",
    lineHeight: 18,
  },
  size: {
    fontSize: 11,
    marginTop: 2,
  },
  chevron: {
    flexShrink: 0,
  },
});
