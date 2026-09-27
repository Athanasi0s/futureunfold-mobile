type RuntimeConfigRefresher = () => void | Promise<void>;

let refreshRuntimeConfig: RuntimeConfigRefresher | null = null;

export function setRuntimeConfigRefresher(
  refresher: RuntimeConfigRefresher,
): void {
  refreshRuntimeConfig = refresher;
}

export function requestRuntimeConfigRefresh(): void {
  void refreshRuntimeConfig?.();
}
