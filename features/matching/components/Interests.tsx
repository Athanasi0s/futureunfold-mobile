import { BlurView } from "expo-blur";
import { ScrollView, StyleSheet, View } from "react-native";
import { InterestLabel } from "./InterestLabel";

export function Interests({ interests }: { interests: string[] }) {
  return (
    <View style={styles.interestsWrapper}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        style={styles.interestScrollView}
        contentContainerStyle={styles.interestLabelContainer}
      >
        {interests.map((interest) => {
          return <InterestLabel key={interest} interest={interest} />;
        })}
      </ScrollView>
      <BlurView
        intensity={20}
        tint="dark"
        style={styles.fadeOverlay}
        pointerEvents="none"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  interestsWrapper: {
    position: "relative",
    height: 80,
    marginBottom: 4,
    overflow: "hidden",
  },
  interestScrollView: {
    height: 50,
  },
  interestLabelContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    paddingBottom: 16,
  },
  fadeOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 6,
  },
});
