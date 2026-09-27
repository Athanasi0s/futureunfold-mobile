import { create } from "zustand";
import type { EntityCategory, OutdoorMapProperties } from "@/api/schemas";

type CategoryKey = EntityCategory;

interface MapStore {
  filters: Record<CategoryKey, boolean>;
  toggleFilter: (category: CategoryKey) => void;
  selectedEntityId: number | null;
  selectedEntity: OutdoorMapProperties | null;
  selectEntity: (entity: OutdoorMapProperties) => void;
  clearSelection: () => void;
  routeGeometry: GeoJSON.LineString | null;
  isLoadingRoute: boolean;
  setRoute: (route: GeoJSON.LineString | null) => void;
  setLoadingRoute: (loading: boolean) => void;
  clearRoute: () => void;
  // Friend tracking
  showFriends: boolean;
  activeGroupIds: number[];
  toggleShowFriends: () => void;
  setActiveGroupIds: (ids: number[]) => void;
  // Friend callout
  selectedFriendId: number | null;
  selectFriend: (id: number) => void;
  clearFriendCallout: () => void;
  // Crowd view
  showCrowdView: boolean;
  toggleCrowdView: () => void;
}

export const useMapStore = create<MapStore>((set) => ({
  filters: {
    amenity: true,
    exhibitor: true,
    sponsor: true,
    stage: true,
  },
  toggleFilter: (category) =>
    set((state) => ({
      filters: { ...state.filters, [category]: !state.filters[category] },
    })),
  selectedEntityId: null,
  selectedEntity: null,
  selectEntity: (entity) =>
    set({ selectedEntityId: entity.id, selectedEntity: entity }),
  clearSelection: () =>
    set({ selectedEntityId: null, selectedEntity: null, routeGeometry: null, isLoadingRoute: false }),
  routeGeometry: null,
  isLoadingRoute: false,
  setRoute: (route) => set({ routeGeometry: route, isLoadingRoute: false }),
  setLoadingRoute: (loading) => set({ isLoadingRoute: loading }),
  clearRoute: () => set({ routeGeometry: null, isLoadingRoute: false }),
  // Friend tracking
  showFriends: false,
  activeGroupIds: [],
  toggleShowFriends: () =>
    set((state) => ({ showFriends: !state.showFriends })),
  setActiveGroupIds: (ids) =>
    set({ activeGroupIds: ids.slice(0, 3) }), // max 3 groups
  // Friend callout
  selectedFriendId: null,
  selectFriend: (id) => set({ selectedFriendId: id }),
  clearFriendCallout: () => set({ selectedFriendId: null }),
  // Crowd view
  showCrowdView: false,
  toggleCrowdView: () =>
    set((state) => ({ showCrowdView: !state.showCrowdView })),
}));
