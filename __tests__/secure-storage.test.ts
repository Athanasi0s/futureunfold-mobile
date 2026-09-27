import * as SecureStore from "expo-secure-store";

import {
  clearAuthToken,
  getAuthToken,
  saveAuthToken,
} from "@/lib/secure-storage";

jest.mock("expo-secure-store", () => ({
  deleteItemAsync: jest.fn(),
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
}));

const mockDeleteItemAsync = jest.mocked(SecureStore.deleteItemAsync);
const mockGetItemAsync = jest.mocked(SecureStore.getItemAsync);
const mockSetItemAsync = jest.mocked(SecureStore.setItemAsync);

describe("secure auth token storage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("reads the auth token from the stable token key", async () => {
    mockGetItemAsync.mockResolvedValue("stored-token");

    await expect(getAuthToken()).resolves.toBe("stored-token");
    expect(mockGetItemAsync).toHaveBeenCalledWith("festapp_token");
  });

  test("saves the auth token using the stable token key", async () => {
    await saveAuthToken("new-token");

    expect(mockSetItemAsync).toHaveBeenCalledWith("festapp_token", "new-token");
  });

  test("clears the auth token from the stable token key", async () => {
    await clearAuthToken();

    expect(mockDeleteItemAsync).toHaveBeenCalledWith("festapp_token");
  });
});
