export const MapColors = {
  background: "#0D1117",
  surface: "#1C1C2E",
  filterBar: "rgba(26, 26, 46, 0.8)",
  ctaButton: "#E8A838",
  text: "#FFFFFF",
  textSecondary: "#999999",
  accent: "#3366CC",
  locationDot: "#4A90D9",
} as const;

export const CategoryColors: Record<string, string> = {
  exhibitor: "#CC8833",
  stage: "#CC4466",
  amenity: "#3355CC",
  sponsor: "#66AACC",
};

export const HighlightColors: Record<string, string> = {
  exhibitor: "#E89B3D",
  stage: "#E0607A",
  amenity: "#4D70E0",
  sponsor: "#80C2E0",
};

export const CategoryIcons: Record<string, string> = {
  exhibitor: "store",
  stage: "music",
  amenity: "silverware-fork-knife",
  sponsor: "diamond-stone",
};

export const DensityColors = {
  green: "#22C55E",
  yellow: "#EAB308",
  orange: "#F97316",
  red: "#EF4444",
} as const;

export const CHIP_CONFIG = [
  { key: "amenity" as const, label: "Amenities", icon: "silverware-fork-knife", color: "#3355CC" },
  { key: "exhibitor" as const, label: "Exhibitors", icon: "store", color: "#CC8833" },
  { key: "sponsor" as const, label: "Sponsors", icon: "diamond-stone", color: "#66AACC" },
  { key: "stage" as const, label: "Stages", icon: "music", color: "#CC4466" },
] as const;
