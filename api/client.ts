import { useAuthStore } from "@/features/authentication/stores/auth";
import { clearAuthToken, getAuthToken } from "@/lib/secure-storage";
import { requestRuntimeConfigRefresh } from "@/features/config/runtime-config-refresh";
import { getApiBaseUrl } from "@/api/base-url";
import axios, {
  type AxiosInstance,
  type InternalAxiosRequestConfig,
  type Method,
} from "axios";
import { Alert } from "react-native";

const baseConfig = {
  baseURL: getApiBaseUrl(),
  timeout: 20000,
  headers: { "Content-Type": "application/json" },
};

const addAuthorizationHeader = async (config: InternalAxiosRequestConfig) => {
  const token = await getAuthToken();
  if (token) {
    config.headers.setAuthorization(`Bearer ${token}`);
  }
  return config;
};

const basicInstance = axios.create(baseConfig);

const authInstance = axios.create(baseConfig);
authInstance.interceptors.request.use(addAuthorizationHeader);
authInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (
      error.response?.status === 401 &&
      error.response?.data?.detail?.error === "token_invalidated"
    ) {
      const { clearUser } = useAuthStore.getState();
      await clearAuthToken();
      clearUser();
      Alert.alert(
        "Session Ended",
        "Your session has ended. Please sign in again.",
      );
    }
    if (
      error.response?.status === 403 &&
      error.response?.data?.detail?.error === "account_blocked"
    ) {
      const { clearUser } = useAuthStore.getState();
      await clearAuthToken();
      clearUser();
      Alert.alert(
        "Account Suspended",
        "Your account has been suspended by the event organizers. Please contact support if you believe this is a mistake.",
      );
    }
    if (
      error.response?.status === 403 &&
      error.response?.data?.detail?.error === "feature_disabled"
    ) {
      requestRuntimeConfigRefresh();
    }
    return Promise.reject(error);
  },
);

type RequestOptions = {
  url: string;
  method: Method;
  data?: unknown;
  params?: Record<string, unknown>;
};

async function request<T>(
  instance: AxiosInstance,
  options: RequestOptions,
): Promise<T> {
  const res = await instance.request({
    url: options.url,
    method: options.method,
    data: options.data,
    params: options.params,
  });
  return res.data as T;
}

export const api = {
  basic: <T>(options: RequestOptions) => request<T>(basicInstance, options),
  auth: <T>(options: RequestOptions) => request<T>(authInstance, options),
};
