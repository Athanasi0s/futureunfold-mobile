import { Component, type ErrorInfo, type ReactNode } from "react";
import {
  Pressable,
  StyleSheet,
  View,
} from "react-native";

import { Colors } from "@/constants/theme";
import i18n from "@/lib/i18n";
import { reportError } from "@/lib/error-reporting";
import { ThemedText } from "@/components/themed-text";

type AppErrorBoundaryProps = {
  children: ReactNode;
};

type AppErrorBoundaryState = {
  hasError: boolean;
};

export class AppErrorBoundary extends Component<
  AppErrorBoundaryProps,
  AppErrorBoundaryState
> {
  state: AppErrorBoundaryState = {
    hasError: false,
  };

  static getDerivedStateFromError(): AppErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    reportError(error, { componentStack: info.componentStack });
  }

  private retry = (): void => {
    this.setState({ hasError: false });
  };

  render(): ReactNode {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <View
        accessibilityRole="alert"
        style={styles.container}
        testID="app-error-boundary"
      >
        <ThemedText style={styles.title}>{i18n.t("common.error")}</ThemedText>
        <ThemedText style={styles.message}>{i18n.t("common.unexpectedError")}</ThemedText>
        <Pressable
          accessibilityRole="button"
          onPress={this.retry}
          style={styles.retryButton}
        >
          <ThemedText style={styles.retryLabel}>{i18n.t("common.retry")}</ThemedText>
        </Pressable>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
    padding: 32,
    backgroundColor: Colors.dark.background,
  },
  title: {
    color: Colors.dark.text,
    fontSize: 24,
    fontWeight: "700",
    textAlign: "center",
  },
  message: {
    color: Colors.dark.textSecondary,
    fontSize: 16,
    lineHeight: 24,
    textAlign: "center",
  },
  retryButton: {
    borderRadius: 24,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: Colors.dark.primary,
  },
  retryLabel: {
    color: Colors.dark.white,
    fontSize: 16,
    fontWeight: "600",
  },
});
