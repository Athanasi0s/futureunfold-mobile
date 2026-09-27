import { getTenantBackgroundSource } from "@/constants/tenant-assets";
import { useEffect } from "react";
import type { ImageStyle, StyleProp } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

type TenantBackgroundArtProps = {
  style?: StyleProp<ImageStyle>;
  /** "primary" (hand + flowers) or "secondary" (flowers only). Defaults to primary. */
  variant?: "primary" | "secondary";
};

// Slow, gentle drift so the space-fiber/hand artwork feels alive without
// distracting from the content in front of it.
export function TenantBackgroundArt({ style, variant = "primary" }: TenantBackgroundArtProps) {
  const source = getTenantBackgroundSource(variant);
  const drift = useSharedValue(0);

  useEffect(() => {
    drift.value = withRepeat(
      withTiming(1, { duration: 7000, easing: Easing.inOut(Easing.sin) }),
      -1,
      true,
    );
  }, [drift]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: drift.value * -16 },
      { scale: 1 + drift.value * 0.02 },
    ],
  }));

  if (!source) return null;

  return (
    <Animated.Image
      source={source}
      resizeMode="contain"
      style={[style, animatedStyle]}
    />
  );
}
