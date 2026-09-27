import { useAuthStore } from "@/features/authentication/stores/auth";
import type { MeOut } from "@/api/schemas";

const user = {
  id: 42,
  email: "user@example.com",
} as MeOut;

describe("auth store", () => {
  beforeEach(() => {
    useAuthStore.setState({
      user: null,
      isAuthenticated: false,
      isInitializing: true,
    });
  });

  test("authenticates when a user is set", () => {
    useAuthStore.getState().setUser(user);

    expect(useAuthStore.getState()).toMatchObject({
      user,
      isAuthenticated: true,
    });
  });

  test("updates authentication state explicitly", () => {
    useAuthStore.getState().setAuthenticated(true);

    expect(useAuthStore.getState().isAuthenticated).toBe(true);
  });

  test("clears the user and authentication state", () => {
    useAuthStore.getState().setUser(user);

    useAuthStore.getState().clearUser();

    expect(useAuthStore.getState()).toMatchObject({
      user: null,
      isAuthenticated: false,
    });
  });

  test("marks authentication initialization as complete", () => {
    useAuthStore.getState().setInitialized();

    expect(useAuthStore.getState().isInitializing).toBe(false);
  });
});
