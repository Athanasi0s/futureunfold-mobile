import { FeatureGate } from "@/components/feature-gate";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";

export default function MapScreen() {
  return (
    <FeatureGate flag="map">
      <ThemedView style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 16 }}>
        <ThemedText style={{ fontSize: 18, fontWeight: "700" }}>Map</ThemedText>
        <ThemedText style={{ marginTop: 8, textAlign: "center" }}>
          Εδώ θα μπει το outdoor map και μετά το indoor map.
        </ThemedText>
      </ThemedView>
    </FeatureGate>
  );
}
