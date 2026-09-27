// festapp-mobile/scripts/test-theme.mjs
//
// Self-contained smoke test for theme helpers. Mirrors the implementation in
// constants/theme.ts so we don't need a TS loader. If the implementation
// changes, update both — the constants in this file (LUMINANCE_LIGHTEN_FLIP,
// LUMINANCE_DARKEN_FLIP) and the helper bodies must stay in sync.
//
// Brightness assertions use per-channel RGB integer comparisons. Lexical
// hex string comparison (e.g. `"#cdcdcd" < "#ffffff"`) is meaningless and
// was caught by the gap-7a checker review.

const LUMINANCE_LIGHTEN_FLIP = 0.6;
const LUMINANCE_DARKEN_FLIP = 0.1;

function parseChannel(hex, start) {
  return parseInt(hex.slice(start, start + 2), 16);
}
function parseRgb(hex) {
  return {
    r: parseChannel(hex, 1),
    g: parseChannel(hex, 3),
    b: parseChannel(hex, 5),
  };
}
function relativeLuminance(hex) {
  const { r, g, b } = parseRgb(hex);
  const channel = (c) => {
    const n = c / 255;
    return n <= 0.03928 ? n / 12.92 : Math.pow((n + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}
function shiftLighter(hex, amount) {
  const { r, g, b } = parseRgb(hex);
  const out = (n) => Math.min(255, n + amount).toString(16).padStart(2, "0");
  return `#${out(r)}${out(g)}${out(b)}`;
}
function shiftDarker(hex, amount) {
  const { r, g, b } = parseRgb(hex);
  const out = (n) => Math.max(0, n - amount).toString(16).padStart(2, "0");
  return `#${out(r)}${out(g)}${out(b)}`;
}
function lightenHex(hex, amount) {
  return relativeLuminance(hex) > LUMINANCE_LIGHTEN_FLIP
    ? shiftDarker(hex, amount)
    : shiftLighter(hex, amount);
}
function darkenHex(hex, amount) {
  return relativeLuminance(hex) < LUMINANCE_DARKEN_FLIP
    ? shiftLighter(hex, amount)
    : shiftDarker(hex, amount);
}

// ----------------- assertion helpers -----------------

let failures = 0;
function assert(cond, msg) {
  if (!cond) {
    console.error("FAIL:", msg);
    failures += 1;
  } else {
    console.log("OK:  ", msg);
  }
}

/** Assert that `result` is "lighter than" `source` per-channel:
 *  every channel >= corresponding source channel, AND at least one channel
 *  strictly increased. (No lexical hex string comparison.) */
function assertLighterThan(result, source, msg) {
  const r = parseRgb(result);
  const s = parseRgb(source);
  const noneDecreased = r.r >= s.r && r.g >= s.g && r.b >= s.b;
  const someIncreased = r.r > s.r || r.g > s.g || r.b > s.b;
  assert(
    noneDecreased && someIncreased,
    `${msg} — expected ${result} per-channel >= ${source} with at least one strictly greater (got R:${r.r}/${s.r} G:${r.g}/${s.g} B:${r.b}/${s.b})`,
  );
}
/** Mirror of assertLighterThan — every channel <= source, at least one strictly less. */
function assertDarkerThan(result, source, msg) {
  const r = parseRgb(result);
  const s = parseRgb(source);
  const noneIncreased = r.r <= s.r && r.g <= s.g && r.b <= s.b;
  const someDecreased = r.r < s.r || r.g < s.g || r.b < s.b;
  assert(
    noneIncreased && someDecreased,
    `${msg} — expected ${result} per-channel <= ${source} with at least one strictly less (got R:${r.r}/${s.r} G:${r.g}/${s.g} B:${r.b}/${s.b})`,
  );
}

// ----------------- assertions -----------------

// Test 8 first — luminance bounds
assert(relativeLuminance("#000000") < 0.001, "black luminance ~ 0");
assert(relativeLuminance("#ffffff") > 0.999, "white luminance ~ 1");

// Test 1 — dark input lightens (per-channel)
assertLighterThan(lightenHex("#0f172a", 50), "#0f172a", "dark input lightens");

// Test 2 — pure white flips to darken; PIN EXACT OUTPUT (255-50=205=0xcd)
assert(
  lightenHex("#ffffff", 50) === "#cdcdcd",
  "lightenHex('#ffffff', 50) flips to darken with deterministic shift to '#cdcdcd'",
);

// Test 3 — paper-white flips to darken; PIN EXACT OUTPUT (0xfa-50=0xc8)
assert(
  lightenHex("#fafafa", 50) === "#c8c8c8",
  "lightenHex('#fafafa', 50) flips to darken with deterministic shift to '#c8c8c8'",
);

// Test 4 — indigo stays lighten direction
assertLighterThan(lightenHex("#4f46e5", 50), "#4f46e5", "indigo input stays lighten");

// Test 5 — sub-threshold gray '#bbbbbb' (luminance ~0.50, below 0.6) stays lighten
assert(
  lightenHex("#bbbbbb", 30) === "#d9d9d9",
  "lightenHex('#bbbbbb', 30) stays lighten with deterministic shift to '#d9d9d9' (below flip threshold)",
);

// Test 6 — pure white stays darken via darkenHex; PIN EXACT (0xff - 30 = 0xe1)
assert(
  darkenHex("#ffffff", 30) === "#e1e1e1",
  "darkenHex('#ffffff', 30) stays darken with deterministic shift to '#e1e1e1'",
);

// Test 7 — pure black flips to lighten via darkenHex; PIN EXACT (0x00 + 30 = 0x1e)
assert(
  darkenHex("#000000", 30) === "#1e1e1e",
  "darkenHex('#000000', 30) flips to lighten with deterministic shift to '#1e1e1e'",
);

if (failures > 0) {
  console.error(`\n${failures} assertion(s) FAILED`);
  process.exit(1);
} else {
  console.log("\nAll theme helper tests passed");
  process.exit(0);
}
