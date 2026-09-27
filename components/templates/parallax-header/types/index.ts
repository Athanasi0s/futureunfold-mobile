import { BlurTint } from "expo-blur";
import type { JSX } from "react";
import type {
  ImageSourcePropType,
  ImageStyle,
  ScrollViewProps,
  StyleProp,
  TextStyle,
  ViewStyle,
} from "react-native";
import { Animated } from "react-native";

type AnimatedViewProps = {
  renderHeaderNavBarComponent?: () => JSX.Element;
  renderTopNavBarComponent?: () => JSX.Element;
  renderOveralComponent?: () => JSX.Element;
  OverlayHeaderContent?: React.ReactNode;
  TopNavBarComponent?: JSX.Element;
  HeaderComponent?: JSX.Element;
  renderHeaderComponent?: () => JSX.Element;
  HeaderNavbarComponent?: JSX.Element;
  headerMaxHeight?: number;
  topBarHeight?: number;
  topBarElevation?: number;
  headerImage?: ImageSourcePropType;
  disableScale?: boolean;
  imageStyle?: StyleProp<ImageStyle>;
};

export type AnimatedScrollViewProps = AnimatedViewProps & ScrollViewProps;

export type AnimatedNavbarProps = {
  scroll: Animated.Value;
  OverflowHeaderComponent?: JSX.Element;
  TopNavbarComponent?: JSX.Element;
  imageHeight: number;
  headerHeight: number;
  headerElevation: number;
};

export type AnimatedHeaderProps = {
  imageHeight: number;
  OverlayHeaderContent?: React.ReactNode;
  translateYUp: Animated.AnimatedInterpolation<string | number> | 0;
  translateYDown: Animated.AnimatedInterpolation<string | number> | 0 | any;
  scale: Animated.AnimatedInterpolation<string | number> | 1;
  imageStyle?: StyleProp<ImageStyle>;
  HeaderComponent?: JSX.Element;
  headerImage?: ImageSourcePropType;
};

export interface AnimatedScrollViewTitleProps {
  children: React.ReactNode;
  size?: number;
  style?: StyleProp<TextStyle>;
}

export interface HeaderComponentWrapperProps extends ViewStyle {
  children: React.ReactNode;
  useGradient?: boolean;
  gradientColors?: string[];
  gradientHeight?: number;
}

export interface HeaderNavBarProps extends ViewStyle {
  children: React.ReactNode;
  headerHeight?: number;
  intensity?: number;
  tint?: BlurTint;
}
