describe("runtime config refresh registry", () => {
  beforeEach(() => {
    jest.resetModules();
  });

  test("does nothing when no refresher is registered", () => {
    const {
      requestRuntimeConfigRefresh,
    } = require("@/features/config/runtime-config-refresh");

    expect(() => requestRuntimeConfigRefresh()).not.toThrow();
  });

  test("delegates refresh requests to the registered refresher", () => {
    const {
      requestRuntimeConfigRefresh,
      setRuntimeConfigRefresher,
    } = require("@/features/config/runtime-config-refresh");
    const refresher = jest.fn();

    setRuntimeConfigRefresher(refresher);
    requestRuntimeConfigRefresh();

    expect(refresher).toHaveBeenCalledTimes(1);
  });
});
