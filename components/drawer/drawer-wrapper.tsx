import { type ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { AppDrawer } from "./app-drawer";
import { useDrawerStore } from "./drawer-store";

const SWIPE_THRESHOLD = 50;
const EDGE_WIDTH = 30;

type DrawerWrapperProps = {
  children: ReactNode;
};

export function DrawerWrapper({ children }: DrawerWrapperProps) {
  const { isOpen, openDrawer, closeDrawer } = useDrawerStore();

  const panGesture = Gesture.Pan()
    .runOnJS(true)
    .activeOffsetX([-20, 20])
    .onEnd((event) => {
      // Swipe right to open (from left edge)
      if (
        !isOpen &&
        event.translationX > SWIPE_THRESHOLD &&
        event.x - event.translationX < EDGE_WIDTH
      ) {
        openDrawer();
      }
      // Swipe left to close
      if (isOpen && event.translationX < -SWIPE_THRESHOLD) {
        closeDrawer();
      }
    });

  return (
    <GestureDetector gesture={panGesture}>
      <View style={styles.container}>
        {children}
        <AppDrawer />
      </View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
