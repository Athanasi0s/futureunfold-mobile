require("react-native-reanimated").setUpTests();

jest.mock(
  "@react-native-async-storage/async-storage",
  () => require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);

jest.mock("@sentry/react-native", () => {
  const scope = {
    setContext: jest.fn(),
  };

  return {
    __esModule: true,
    init: jest.fn(),
    setTag: jest.fn(),
    withScope: jest.fn((callback) => callback(scope)),
    captureException: jest.fn(),
    __mockScope: scope,
  };
});
