import { TenantBackgroundArt } from "@/components/tenant-background-art";
import {
  getTenantBackgroundSource,
  getTenantLogoSource,
} from "@/constants/tenant-assets";
import {
  COLOR_WHITE_ON_ACCENT,
  FUTURE_UNFOLD_ARTWORK_BACKGROUND,
  FUTURE_UNFOLD_ARTWORK_OVERLAY,
} from "@/constants/theme";
import { useColors } from "@/hooks/use-colors";
import {
  Image,
  StyleSheet,
  useWindowDimensions,
  View,
} from "react-native";
import { ThemedText } from "@/components/themed-text";

type BrandSplashProps = {
  label?: string;
};

export function BrandSplash({ label }: BrandSplashProps) {
  const { width } = useWindowDimensions();
  const colors = useColors();
  const backgroundSource = getTenantBackgroundSource();
  const logoSource = getTenantLogoSource();
  const artworkHeight = width * (1864 / 2100);
  const backgroundColor = backgroundSource
    ? FUTURE_UNFOLD_ARTWORK_BACKGROUND
    : colors.background;

  return (
    <View style={[styles.container, { backgroundColor }]}>
      {logoSource && (
        <Image source={logoSource} style={styles.logo} resizeMode="contain" />
      )}
      {backgroundSource && (
        <TenantBackgroundArt
          style={[styles.backgroundImage, { width, height: artworkHeight }]}
        />
      )}
      {backgroundSource && <View style={styles.backgroundOverlay} />}
      {label && <ThemedText style={styles.label}>{label}</ThemedText>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    overflow: "hidden",
  },
  backgroundImage: {
    position: "absolute",
    top: "32%",
    opacity: 1,
    zIndex: 0,
  },
  backgroundOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: FUTURE_UNFOLD_ARTWORK_OVERLAY,
    zIndex: 0,
  },
  logo: {
    position: "absolute",
    top: "18%",
    width: "72%",
    height: 120,
    zIndex: 1,
  },
  label: {
    position: "absolute",
    top: "18%",
    marginTop: 136,
    zIndex: 1,
    color: COLOR_WHITE_ON_ACCENT,
    fontSize: 16,
    fontWeight: "600",
    opacity: 0.85,
  },
});
