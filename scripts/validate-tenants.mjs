import { existsSync, readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const EAS_PATH = path.join(ROOT, "eas.json");
const PROFILE_SUFFIXES = ["development", "preview", "production"];
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

// Tenants that intentionally share only the supplied EAS project.
// Remove this entry if Future Unfold gets a dedicated Expo project later.
const SHARED_IDENTITY_EXCEPTIONS = {
  "future-unfold": {
    sharesWith: "panathenea",
    reason: "uses the supplied feststats/fest-app Expo project",
  },
};

const eas = JSON.parse(readFileSync(EAS_PATH, "utf8"));
const profiles = eas.build ?? {};
const tenants = [
  ...new Set(
    Object.keys(profiles)
      .filter((profile) => profile.endsWith("-development"))
      .map((profile) => profile.slice(0, -"-development".length)),
  ),
].sort();

const seen = {
  apiBaseUrl: new Map(),
  easProjectId: new Map(),
  iosBundleIdentifier: new Map(),
  androidPackage: new Map(),
  scheme: new Map(),
};

let failures = 0;

function fail(message) {
  failures += 1;
  console.error(`FAIL: ${message}`);
}

function pass(message) {
  console.log(`OK:   ${message}`);
}

function assert(condition, message) {
  if (condition) pass(message);
  else fail(message);
}

function assertUnique(group, value, tenant) {
  if (!value) {
    fail(`${tenant}: ${group} is missing`);
    return;
  }

  const existing = seen[group].get(value);
  if (existing) {
    const exception = SHARED_IDENTITY_EXCEPTIONS[tenant];
    const reverseException = SHARED_IDENTITY_EXCEPTIONS[existing];
    if (exception?.sharesWith === existing) {
      pass(`${tenant}: ${group} intentionally shared with ${existing} (${exception.reason})`);
      return;
    }
    if (reverseException?.sharesWith === tenant) {
      pass(`${tenant}: ${group} intentionally shared with ${existing} (${reverseException.reason})`);
      return;
    }
    fail(`${tenant}: ${group} duplicates ${existing}: ${value}`);
    return;
  }

  seen[group].set(value, tenant);
}

function assertAsset(tenant, label, assetPath) {
  assert(
    typeof assetPath === "string" &&
      existsSync(path.resolve(ROOT, assetPath)),
    `${tenant}: ${label} exists (${assetPath ?? "missing"})`,
  );
}

function getExpoConfig(tenant) {
  const expoBin = path.join(ROOT, "node_modules", ".bin", "expo");
  const result = spawnSync(
    expoBin,
    ["config", "--type", "public", "--json"],
    {
      cwd: ROOT,
      env: { ...process.env, TENANT: tenant },
      encoding: "utf8",
      shell: process.platform === "win32",
    },
  );

  if (result.status !== 0) {
    fail(`${tenant}: Expo config failed\n${result.stderr?.trim() ?? result.error?.message ?? "unknown error"}`);
    return null;
  }

  try {
    return JSON.parse(result.stdout);
  } catch (error) {
    fail(`${tenant}: Expo config returned invalid JSON: ${error.message}`);
    return null;
  }
}

assert(tenants.length > 0, "at least one tenant development profile exists");

for (const tenant of tenants) {
  console.log(`\nValidating tenant: ${tenant}`);

  for (const suffix of PROFILE_SUFFIXES) {
    const profileName = `${tenant}-${suffix}`;
    const profile = profiles[profileName];
    assert(Boolean(profile), `${tenant}: EAS profile ${profileName} exists`);
    if (profile) {
      assert(
        profile.env?.TENANT === tenant,
        `${tenant}: ${profileName} sets TENANT=${tenant}`,
      );
    }
  }

  const config = getExpoConfig(tenant);
  if (!config) continue;

  const extra = config.extra ?? {};
  assert(extra.tenant === tenant, `${tenant}: Expo config selects correct tenant`);
  assert(
    typeof extra.appName === "string" && extra.appName.trim().length > 0,
    `${tenant}: app name is configured`,
  );
  const expectedApiBaseUrl = `https://festapp-api-${tenant}.fly.dev`;
  assert(
    typeof extra.apiBaseUrl === "string" && extra.apiBaseUrl === expectedApiBaseUrl,
    `${tenant}: production API URL matches tenant`,
  );
  assert(
    UUID_RE.test(extra.eas?.projectId ?? ""),
    `${tenant}: EAS project ID is a UUID`,
  );

  assertAsset(tenant, "icon", config.icon);
  assertAsset(tenant, "splash icon", config.plugins?.find(
    (plugin) => Array.isArray(plugin) && plugin[0] === "expo-splash-screen",
  )?.[1]?.image);
  assertAsset(tenant, "favicon", config.web?.favicon);
  assertAsset(
    tenant,
    "Android adaptive icon",
    config.android?.adaptiveIcon?.foregroundImage,
  );
  if (config.android?.googleServicesFile) {
    assertAsset(
      tenant,
      "Android Google services file",
      config.android.googleServicesFile,
    );
  } else {
    pass(`${tenant}: Android Google services file intentionally omitted (push notifications disabled until dedicated Firebase config is supplied)`);
  }

  assertUnique("apiBaseUrl", extra.apiBaseUrl, tenant);
  assertUnique("easProjectId", extra.eas?.projectId, tenant);
  assertUnique("iosBundleIdentifier", config.ios?.bundleIdentifier, tenant);
  assertUnique("androidPackage", config.android?.package, tenant);
  assertUnique("scheme", config.scheme, tenant);
}

if (failures > 0) {
  console.error(`\nTenant validation failed with ${failures} error(s).`);
  process.exit(1);
}

console.log(`\nAll ${tenants.length} tenant configurations are valid.`);
