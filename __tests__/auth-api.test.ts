import {
  getMe,
  login,
  patchMe,
  register,
} from "@/api/features/auth";
import { api } from "@/api/client";

jest.mock("@/api/client", () => ({
  api: {
    basic: jest.fn(),
    auth: jest.fn(),
  },
}));

const mockBasic = jest.mocked(api.basic);
const mockAuth = jest.mocked(api.auth);

describe("auth API", () => {
  const originalForceFailure =
    process.env.EXPO_PUBLIC_E2E_FORCE_LOGIN_API_FAILURE;

  beforeEach(() => {
    jest.clearAllMocks();
    delete process.env.EXPO_PUBLIC_E2E_FORCE_LOGIN_API_FAILURE;
  });

  afterAll(() => {
    process.env.EXPO_PUBLIC_E2E_FORCE_LOGIN_API_FAILURE = originalForceFailure;
  });

  test("posts login credentials to the backend", async () => {
    mockBasic.mockResolvedValue({ access_token: "token", token_type: "bearer" });

    await expect(login("user@example.com", "password")).resolves.toEqual({
      access_token: "token",
      token_type: "bearer",
    });

    expect(mockBasic).toHaveBeenCalledWith({
      url: "/auth/login",
      method: "POST",
      data: { email: "user@example.com", password: "password" },
    });
  });

  test("can force a dev-only login connection failure for E2E", async () => {
    process.env.EXPO_PUBLIC_E2E_FORCE_LOGIN_API_FAILURE = "1";

    await expect(login("user@example.com", "password")).rejects.toEqual({
      code: "ERR_NETWORK",
      message: "Network Error",
      request: {},
    });

    expect(mockBasic).not.toHaveBeenCalled();
  });

  test("does not force login failures unless the E2E flag is explicitly enabled", async () => {
    process.env.EXPO_PUBLIC_E2E_FORCE_LOGIN_API_FAILURE = "true";
    mockBasic.mockResolvedValue({ access_token: "token", token_type: "bearer" });

    await expect(login("user@example.com", "password")).resolves.toEqual({
      access_token: "token",
      token_type: "bearer",
    });

    expect(mockBasic).toHaveBeenCalledTimes(1);
  });

  test("posts registration details to the backend", async () => {
    mockBasic.mockResolvedValue({ id: 42, email: "user@example.com" });
    const body = {
      email: "user@example.com",
      password: "password",
      full_name: "User Example",
    };

    await expect(register(body as Parameters<typeof register>[0])).resolves.toEqual({
      id: 42,
      email: "user@example.com",
    });

    expect(mockBasic).toHaveBeenCalledWith({
      url: "/auth/register",
      method: "POST",
      data: body,
    });
  });

  test("fetches the current user with the authenticated client", async () => {
    mockAuth.mockResolvedValue({ id: 42, email: "user@example.com" });

    await expect(getMe()).resolves.toEqual({
      id: 42,
      email: "user@example.com",
    });

    expect(mockAuth).toHaveBeenCalledWith({
      url: "/me",
      method: "GET",
    });
  });

  test("patches the current user with the authenticated client", async () => {
    mockAuth.mockResolvedValue({
      id: 42,
      email: "user@example.com",
      full_name: "Updated User",
    });
    const patch = { full_name: "Updated User" };

    await expect(patchMe(patch as Parameters<typeof patchMe>[0])).resolves.toEqual({
      id: 42,
      email: "user@example.com",
      full_name: "Updated User",
    });

    expect(mockAuth).toHaveBeenCalledWith({
      url: "/me",
      method: "PATCH",
      data: patch,
    });
  });
});
