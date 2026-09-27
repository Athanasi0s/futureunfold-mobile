/**
 * Phase 13 Plan 09 — data-color palettes.
 *
 * Hex values here are DATA, not styling. Examples:
 *   - Avatar fallback color palettes (hash-based deterministic assignment)
 *   - Admin-facing color pickers (certificate branding, theme editor — the
 *     user picks one of these hexes and the choice is persisted to the
 *     backend as a config value)
 *   - Chart color cycles (bar/pie charts with >1 series)
 *
 * These are NOT theme tokens — they don't track the active preset. They are
 * constant data whose purpose is to provide variety. The theme system
 * (`constants/theme.ts`) supplies styling colors; this file supplies data.
 *
 * This file is exempt from the ESLint `no-restricted-syntax` hex-literal
 * rule (see `eslint.config.js` and `scripts/hex-audit.js` EXEMPT_FILES).
 *
 * SHADOW_BLACK is a platform-mandated shadow color (iOS / Android shadow APIs
 * both require a color; black is the OS convention with opacity applied via
 * shadowOpacity or rgba). Safe-listed in `docs/theme-safelist.md`.
 */

/** Platform shadow convention — black with opacity. Safe-listed. */
export const SHADOW_BLACK = "#000";

/**
 * Camera viewfinder / splash-loader background. Pitch-black is the platform
 * convention so chrome doesn't bleed through a live camera preview or the
 * moment before first paint. Distinct from SHADOW_BLACK semantically even
 * though the value is identical — chose a 6-digit form to make the usage
 * visible in greps.
 */
export const CAMERA_VIEWFINDER_BLACK = "#000000";

/**
 * Avatar palette. Used by hash-based deterministic color assignment for
 * user/meeting avatars that don't have an image. 8 entries chosen from
 * the curated palette for visual diversity.
 */
export const AVATAR_PALETTE = [
  "#3b82f6", // Sky
  "#8b5cf6", // Violet
  "#ec4899", // Pink
  "#f97316", // Orange
  "#14b8a6", // Teal
  "#ef4444", // Red
  "#6366f1", // Indigo
  "#10b981", // Emerald
] as const;

/**
 * Certificate admin color picker palette. Values are persisted to the
 * backend certificate_template config and rendered on generated PDFs.
 * 30 entries chosen to cover the full hue spectrum + neutrals.
 */
export const CERTIFICATE_PALETTE = [
  "#194ff0", "#2956f5", "#3b82f6", "#06b6d4", "#0ea5e9",
  "#10b981", "#22c55e", "#84cc16", "#f5c518", "#f59e0b",
  "#f97316", "#ef4444", "#e63946", "#e8457c", "#ec4899",
  "#a855f7", "#7c3aed", "#6366f1", "#4f46e5", "#8b5cf6",
  "#ffffff", "#f5f7fa", "#e2e8f0", "#94a3b8", "#64748b",
  "#4a5568", "#2a3a6a", "#1a2744", "#101522", "#0a0a0a",
] as const;

/**
 * Default certificate template values. Rendered on generated PDFs; values
 * are user-editable via the admin certificate screen and persisted to the
 * backend certificate_template config.
 */
export const CERTIFICATE_DEFAULTS = {
  primary: "#194ff0",
  secondary: "#4a5568",
  accent: "#10b981",
  border: "#c7d0e0",
  gradientStart: "#ffffff",
  gradientEnd: "#f5f7fa",
  placeholderBg: "#333",
  placeholderText: "#000000",
  /** Rendered behind disabled state items in the certificate preview. */
  disabledSurface: "#2a3a6a",
  /** Milestone accent fill + text when the tier is unlocked. */
  milestoneUnlockedFill: "#10b98140",
  milestoneUnlockedText: "#10b981",
} as const;

/**
 * Leaderboard medal colors (bronze / silver / gold tiers).
 */
export const MEDAL_COLORS = {
  gold: "#eab308",
  silver: "#94a3b8",
  bronze: "#cd7f32",
} as const;

/**
 * Point/reward badge tier colors. 8 tiers used by milestone badges.
 */
export const BADGE_TIER_COLORS = [
  "#4ecdc4",
  "#45b7d1",
  "#96ceb4",
  "#ffeaa7",
  "#dda0dd",
  "#98d8c8",
  "#f7dc6f",
  "#bb8fce",
] as const;

/**
 * Chart color cycle — used by features/points charts where the number of
 * series is dynamic and tokens can't be pre-assigned.
 */
export const CHART_PALETTE = [
  "#85c1e9",
  "#f1948a",
  "#82e0aa",
  "#f8c471",
  "#aed6f1",
  "#d7bde2",
  "#a3e4d7",
  "#fad7a0",
  "#a9cce3",
  "#d5f5e3",
  "#fadbd8",
] as const;

/**
 * Role color classification. Semantic, role-level categorization for
 * badges / markers across user profile and leaderboard screens. These are
 * data tags (which-role-is-this), not theme tokens.
 */
export const ROLE_COLORS: Record<string, string> = {
  speaker: "#2DD4BF",
  exhibitor: "#f59e0b",
  admin: "#ef4444",
  attendee: "#10b981",
};

/**
 * Fallback group color cycle. Used by user profile to colorize group cards
 * by index when the group list has no per-group color. The first entry is
 * overridden at runtime to the active theme's brand color.
 */
export const GROUP_FALLBACK_COLORS = [
  "#194ff0",
  "#8b5cf6",
  "#ef4444",
  "#f59e0b",
  "#2DD4BF",
] as const;

/**
 * Per-index palette used to tag a user's "common interests" list. 5-entry
 * cycle (bg/border/text triple per entry). Data cycle, not theme.
 */
export const COMMON_INTEREST_COLORS = [
  {
    bg: "rgba(45, 212, 191, 0.15)",
    border: "rgba(45, 212, 191, 0.4)",
    text: "#2DD4BF",
  },
  {
    bg: "rgba(99, 102, 241, 0.15)",
    border: "rgba(99, 102, 241, 0.4)",
    text: "#818cf8",
  },
  {
    bg: "rgba(34, 197, 94, 0.15)",
    border: "rgba(34, 197, 94, 0.4)",
    text: "#22c55e",
  },
  {
    bg: "rgba(251, 191, 36, 0.15)",
    border: "rgba(251, 191, 36, 0.4)",
    text: "#fbbf24",
  },
  {
    bg: "rgba(244, 114, 182, 0.15)",
    border: "rgba(244, 114, 182, 0.4)",
    text: "#f472b6",
  },
] as const;

/**
 * Match-strength label colors. Indicates how strong a user-to-user match is
 * (Excellent / Great / Good / Fair). Data tag, not theme.
 */
export const MATCH_STRENGTH_COLORS = {
  excellent: "#2DD4BF",
  great: "#22c55e",
  good: "#f59e0b",
  fair: "#64748b",
} as const;

/**
 * Point/reward tier classification colors. Used by points/rewards screens
 * for Explorer / Innovator / Master tier badges and icons.
 */
export const TIER_COLORS = {
  Explorer: "#10b981",
  Innovator: "#f59e0b",
  Master: "#8b5cf6",
} as const;

/**
 * Pie chart palette for stats dashboard — fixed cycle for group-by-topic
 * slices and leaderboard bar coloring (top-3 positions).
 */
export const STATS_PIE_COLORS = [
  "#3b82f6",
  "#10b981",
  "#8b5cf6",
  "#f59e0b",
  "#ef4444",
  "#6b7280",
] as const;

/**
 * Group-type classification color tags (topic / venue / interest). Used
 * as a categorical marker on admin stats and group lists.
 */
export const GROUP_TYPE_COLORS: Record<string, string> = {
  topic: "#3b82f6",
  venue: "#10b981",
  interest: "#f59e0b",
};

/**
 * Podium colors for bar-chart top-3 (gold / silver / bronze-like). Overlap
 * with MEDAL_COLORS semantics but with slightly different shades to work
 * as chart `frontColor` values.
 */
export const PODIUM_CHART_COLORS = {
  first: "#f59e0b",
  second: "#9ca3af",
  third: "#b45309",
} as const;

/**
 * Session-type badge colors. Classification tags for program cards — each
 * session type gets a distinct hue (workshop = green, panel = orange, etc.).
 * Keynote / networking are not included here; they use the active theme's
 * `brand` and `brandLight` so they inherit the festival's primary color.
 */
export const SESSION_TYPE_COLORS: Record<string, { bg: string; text: string }> = {
  workshop: { bg: "rgba(16, 185, 129, 0.1)", text: "#10b981" },
  panel: { bg: "rgba(249, 115, 22, 0.1)", text: "#f97316" },
  talk: { bg: "rgba(139, 92, 246, 0.1)", text: "#8b5cf6" },
  break: { bg: "rgba(107, 114, 128, 0.1)", text: "#6b7280" },
};

/**
 * Deeper-alpha session-type colors used by the session detail hero banner
 * (white text on tinted solid backgrounds). Sibling of SESSION_TYPE_COLORS
 * but tuned for overlay-on-image legibility.
 */
export const SESSION_DETAIL_TYPE_COLORS: Record<
  string,
  { bg: string; text: string }
> = {
  keynote: { bg: "rgba(255, 255, 255, 0.2)", text: "#ffffff" },
  workshop: { bg: "rgba(16, 185, 129, 0.8)", text: "#ffffff" },
  panel: { bg: "rgba(249, 115, 22, 0.8)", text: "#ffffff" },
  talk: { bg: "rgba(139, 92, 246, 0.8)", text: "#ffffff" },
  break: { bg: "rgba(107, 114, 128, 0.8)", text: "#ffffff" },
};

/**
 * Group-marker colors used on the map. 20-entry palette mirroring the
 * backend's deterministic color assignment (group_id % 20). Data, not
 * styling.
 */
export const MAP_GROUP_COLORS = [
  "#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", "#FFEAA7",
  "#DDA0DD", "#98D8C8", "#F7DC6F", "#BB8FCE", "#85C1E9",
  "#F1948A", "#82E0AA", "#F8C471", "#AED6F1", "#D7BDE2",
  "#A3E4D7", "#FAD7A0", "#A9CCE3", "#D5F5E3", "#FADBD8",
] as const;

/**
 * Crowd-density heatmap colors for the map (green/yellow/orange/red buckets).
 * These are semantic traffic-signal colors, not theme-driven; used by the
 * Mapbox CircleLayer match expression.
 */
export const CROWD_DENSITY_COLORS = {
  green: "#22C55E",
  yellow: "#EAB308",
  orange: "#F97316",
  red: "#EF4444",
} as const;

/**
 * Tab-bar badge red — the unread indicator on the curved bottom tab bar.
 * Notification-red convention, not a palette pick.
 */
export const BADGE_RED = "#ff4444";

/**
 * Admin report-status classification colors. Semantic status palette
 * (pending=amber, reviewed=blue, actioned=red) with pre-mixed rgba overlays
 * for light backgrounds. Data, not theme.
 */
export const REPORT_STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  pending: { bg: "rgba(245, 158, 11, 0.15)", text: "#f59e0b" },
  reviewed: { bg: "rgba(59, 130, 246, 0.15)", text: "#3b82f6" },
  actioned: { bg: "rgba(239, 68, 68, 0.15)", text: "#ef4444" },
};

/**
 * Lead-scoring tier colors (exhibitor lead index). Points thresholds map to
 * a semantic heat gradient: red = hot, amber = vip, teal = follow-up, slate
 * = general lead. Data tag, not theme.
 */
export const LEAD_SCORE_COLORS: Record<string, { color: string; bg: string }> = {
  hot: { color: "#ef4444", bg: "rgba(239,68,68,0.15)" },
  vip: { color: "#f59e0b", bg: "rgba(245,158,11,0.15)" },
  followup: { color: "#0d9488", bg: "rgba(13,148,136,0.15)" },
  lead: { color: "#64748b", bg: "rgba(100,116,139,0.15)" },
};

/**
 * Empty-state icon tint — the muted slate used for "no data" Ionicons in
 * admin list screens. Kept here because the colour is a data-tag (empty-state
 * affordance), not a theme decision; consistent across light/dark.
 */
export const EMPTY_STATE_ICON = "#334155";

/**
 * Placeholder text color inside dark-themed TextInputs on admin / session-qa
 * screens. Distinct from the theme's `placeholder` token because these
 * screens use a darker input background (#1a2035 etc.) and need a lighter
 * placeholder for legibility.
 */
export const INPUT_PLACEHOLDER_DARK = "#3a4a63";

/**
 * Journey timeline event-type classification colors. Each event category
 * gets a distinct hue so a rapid scroll through the day shows a color-coded
 * activity histogram. `session` is theme-aware (uses the brand color at
 * render-time); the other 5 are fixed semantic hues.
 */
export const JOURNEY_EVENT_COLORS = {
  group: "#10b981",
  scan: "#f59e0b",
  message: "#8b5cf6",
  meeting: "#ef4444",
  poll: "#06b6d4",
  fallback: "#919fca",
} as const;

/**
 * Ticket-status classification colors. iOS system-style status palette used
 * to tag ticket state (active / used / cancelled). Platform status colors
 * are semantic (system green = active, system red = cancelled) and are NOT
 * theme-driven — they are universal status markers.
 */
export const TICKET_STATUS_COLORS: Record<string, string> = {
  active: "#34C759",    // iOS system green
  used: "#8E8E93",      // iOS system grey
  cancelled: "#FF453A", // iOS system red
};

/**
 * Admin stats bar-chart palette. 8-entry fixed cycle for role / interest /
 * daily-registration charts. Data cycle, not theme.
 */
export const ADMIN_BAR_COLORS = [
  "#6366f1", // indigo
  "#f59e0b", // amber
  "#22c55e", // green
  "#ef4444", // red
  "#3b82f6", // blue
  "#ec4899", // pink
  "#14b8a6", // teal
  "#a855f7", // purple
] as const;

/**
 * Default chrome colors for the `components/curved-bottom-tabs` widget.
 * The widget is a reusable UI kit component used with a dark gradient bar;
 * these defaults are overrideable via props. Consumers typically pass the
 * active theme's primary color via `activeColor` / `gradients` props.
 */
export const CURVED_TABS_DEFAULTS = {
  /** Medium grey for unfocused tabs / labels. */
  inactive: "#cccccc",
  /** Dark graphite — bar gradient start. */
  gradientStart: "#151718",
  /** Dark navy — bar gradient end. */
  gradientEnd: "#1e1b30",
} as const;

/**
 * Fixed chrome colors for the physical-ID-card style print component
 * (`DigitalIdCard`). The card is designed to mimic a printed badge: white
 * paper stock, dark ink, grey labels. These are intentionally not themed
 * — changing them would break the "printed badge" visual metaphor and
 * contrast guarantees for the QR code.
 */
export const ID_CARD_COLORS = {
  /** Paper white — card background. */
  paper: "#ffffff",
  /** Dark ink — event name, detail values. */
  ink: "#0f172a",
  /** Grey ink — subtitles / body text. */
  subtleInk: "#64748b",
  /** Very light grey — label text, dashed divider. */
  labelInk: "#9ca3af",
  /** Hairline grey — dashed divider. */
  divider: "#e5e7eb",
} as const;
