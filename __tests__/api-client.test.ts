import type {
  AxiosResponse,
  InternalAxiosRequestConfig,
} from "axios";
import axios from "axios";
import { Alert } from "react-native";

import { api } from "@/api/client";
import { useAuthStore } from "@/features/authentication/stores/auth";
import { requestRuntimeConfigRefresh } from "@/features/config/runtime-config-refresh";
import { clearAuthToken, getAuthToken } from "@/lib/secure-storage";

jest.mock("axios", () => ({
  __esModule: true,
  default: {
    create: jest.fn(() => ({
      request: jest.fn(),
      interceptors: {
        request: { use: jest.fn() },
        response: { use: jest.fn() },
      },
    })),
  },
}));

type MockAxiosInstance = {
  request: jest.Mock;
  interceptors: {
    request: { use: jest.Mock };
    response: { use: jest.Mock };
  };
};

const mockAxiosCreate = jest.mocked(axios.create);
const basicInstance = mockAxiosCreate.mock.results[0].value as MockAxiosInstance;
const authInstance = mockAxiosCreate.mock.results[1].value as MockAxiosInstance;
const mockBasicRequest = basicInstance.request;
const mockAuthRequest = authInstance.request;
const mockRequestUse = authInstance.interceptors.request.use;
const mockResponseUse = authInstance.interceptors.response.use;

jest.mock("@/lib/secure-storage", () => ({
  clearAuthToken: jest.fn(),
  getAuthToken: jest.fn(),
}));

jest.mock("@/features/authentication/stores/auth", () => ({
  useAuthStore: {
    getState: jest.fn(),
  },
}));

jest.mock("@/features/config/runtime-config-refresh", () => ({
  requestRuntimeConfigRefresh: jest.fn(),
}));

const mockClearAuthToken = jest.mocked(clearAuthToken);
const mockGetAuthToken = jest.mocked(getAuthToken);
const mockGetAuthState = jest.mocked(useAuthStore.getState);
const mockRequestRuntimeConfigRefresh = jest.mocked(requestRuntimeConfigRefresh);
const mockAlert = jest.spyOn(Alert, "alert").mockImplementation(() => {});

const requestInterceptor = mockRequestUse.mock.calls[0][0] as (
  config: InternalAxiosRequestConfig,
) => Promise<InternalAxiosRequestConfig>;
const responseSuccessInterceptor = mockResponseUse.mock.calls[0][0] as (
  response: AxiosResponse,
) => AxiosResponse;
const responseErrorInterceptor = mockResponseUse.mock.calls[0][1] as (
  error: unknown,
) => Promise<never>;

describe("API client", () => {
  const clearUser = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetAuthState.mockReturnValue({ clearUser } as unknown as ReturnType<
      typeof useAuthStore.getState
    >);
  });

  test("returns response data from basic requests", async () => {
    mockBasicRequest.mockResolvedValue({ data: { status: "ok" } });

    await expect(
      api.basic({ url: "/health", method: "GET" }),
    ).resolves.toEqual({ status: "ok" });
  });

  test("returns response data from authenticated requests", async () => {
    mockAuthRequest.mockResolvedValue({ data: { id: 42 } });

    await expect(
      api.auth({ url: "/me", method: "GET" }),
    ).resolves.toEqual({ id: 42 });
  });

  test("forwards request body and query params to the selected client", async () => {
    mockBasicRequest.mockResolvedValue({ data: { created: true } });

    await expect(
      api.basic({
        url: "/groups",
        method: "POST",
        data: { name: "Core Team" },
        params: { include_members: true },
      }),
    ).resolves.toEqual({ created: true });

    expect(mockBasicRequest).toHaveBeenCalledWith({
      url: "/groups",
      method: "POST",
      data: { name: "Core Team" },
      params: { include_members: true },
    });
  });

  test("adds the stored token to authenticated requests", async () => {
    mockGetAuthToken.mockResolvedValue("auth-token");
    const config = {
      headers: {
        setAuthorization: jest.fn(),
      },
    } as unknown as InternalAxiosRequestConfig;

    await expect(requestInterceptor(config)).resolves.toBe(config);
    expect(config.headers.setAuthorization).toHaveBeenCalledWith(
      "Bearer auth-token",
    );
  });

  test("leaves the authorization header unchanged without a stored token", async () => {
    mockGetAuthToken.mockResolvedValue(null);
    const config = {
      headers: {
        setAuthorization: jest.fn(),
      },
    } as unknown as InternalAxiosRequestConfig;

    await expect(requestInterceptor(config)).resolves.toBe(config);
    expect(config.headers.setAuthorization).not.toHaveBeenCalled();
  });

  test("passes successful authenticated responses through unchanged", () => {
    const response = { data: { id: 42 } } as AxiosResponse;

    expect(responseSuccessInterceptor(response)).toBe(response);
  });

  test("clears an invalidated session and informs the user", async () => {
    const error = {
      response: {
        status: 401,
        data: { detail: { error: "token_invalidated" } },
      },
    };

    await expect(responseErrorInterceptor(error)).rejects.toBe(error);

    expect(mockClearAuthToken).toHaveBeenCalledTimes(1);
    expect(clearUser).toHaveBeenCalledTimes(1);
    expect(mockAlert).toHaveBeenCalledWith(
      "Session Ended",
      "Your session has ended. Please sign in again.",
    );
  });

  test("clears a blocked account session and informs the user", async () => {
    const error = {
      response: {
        status: 403,
        data: { detail: { error: "account_blocked" } },
      },
    };

    await expect(responseErrorInterceptor(error)).rejects.toBe(error);

    expect(mockClearAuthToken).toHaveBeenCalledTimes(1);
    expect(clearUser).toHaveBeenCalledTimes(1);
    expect(mockAlert).toHaveBeenCalledWith(
      "Account Suspended",
      expect.stringContaining("suspended by the event organizers"),
    );
  });

  test("refreshes configuration when a feature is disabled", async () => {
    const error = {
      response: {
        status: 403,
        data: { detail: { error: "feature_disabled" } },
      },
    };

    await expect(responseErrorInterceptor(error)).rejects.toBe(error);

    expect(mockRequestRuntimeConfigRefresh).toHaveBeenCalledTimes(1);
    expect(mockClearAuthToken).not.toHaveBeenCalled();
    expect(clearUser).not.toHaveBeenCalled();
  });

  test("rejects unrelated API errors without clearing the session", async () => {
    const error = {
      response: {
        status: 500,
        data: { detail: "Internal server error" },
      },
    };

    await expect(responseErrorInterceptor(error)).rejects.toBe(error);

    expect(mockClearAuthToken).not.toHaveBeenCalled();
    expect(clearUser).not.toHaveBeenCalled();
    expect(mockRequestRuntimeConfigRefresh).not.toHaveBeenCalled();
    expect(mockAlert).not.toHaveBeenCalled();
  });
});
