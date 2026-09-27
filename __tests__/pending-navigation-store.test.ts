import { usePendingNavigationStore } from "@/features/notifications/stores/pending-navigation";

describe("pending navigation store", () => {
  beforeEach(() => {
    usePendingNavigationStore.setState({ pendingPath: null });
  });

  test("stores a pending path until the app layout consumes it", () => {
    usePendingNavigationStore.getState().setPendingPath("/session/42");

    expect(usePendingNavigationStore.getState().pendingPath).toBe(
      "/session/42",
    );
  });

  test("clears the pending path after navigation", () => {
    usePendingNavigationStore.getState().setPendingPath("/session/42");

    usePendingNavigationStore.getState().setPendingPath(null);

    expect(usePendingNavigationStore.getState().pendingPath).toBeNull();
  });
});
