# Theme Safe-List

Phase 13 THME-04 bans raw hex color literals in `.tsx` files under `app/`, `components/`, and `features/`. This file documents the narrow exceptions. The ESLint rule in `eslint.config.js` treats `constants/theme.ts`, `constants/theme-presets.ts`, `constants/theme-palette.ts`, and `constants/data-colors.ts` as exempt — those are the single source of truth for palette values (theme tokens) and for legitimate data-color palettes (avatars, charts, certificate picker).

Any addition to this safe-list MUST include:
- The exact hex / rgba pattern
- The file(s) where it appears
- A one-line reason explaining why the theme system cannot own this value

## Allowed patterns

| Pattern | Where | Reason |
|---------|-------|--------|
| `#fff`, `#FFFFFF` (as `color=`, CTA text) | Buttons/CTAs over `colors.primary` backgrounds, Google Wallet brand button | Foreground-on-accent readability invariant — not a palette decision. Use the `COLOR_WHITE_ON_ACCENT` named export from `constants/theme.ts` rather than a raw literal. |
| `#000` (as `color=` / `backgroundColor`, CTA text on light accent) | Map-entity "My Programme" CTA over amber `MapColors.ctaButton`, similar buttons with light-accent backgrounds | Foreground-on-light-accent contrast invariant. Import `COLOR_BLACK_ON_LIGHT_ACCENT` from `constants/theme.ts`. |
| `#000` / `#000000` (camera viewfinder / loading screen bg) | `app/scan.tsx`, `app/(exhibitor-tabs)/kiosk/index.tsx`, `app/kiosk.tsx`, `app/_layout.tsx` loader | Camera preview + splash loaders render on pitch-black to hide chrome. Platform convention. Use `CAMERA_VIEWFINDER_BLACK` from `constants/data-colors.ts`. |
| `rgba(0,0,0,0.x)` | `shadowColor`, `shadowOpacity`-carrying styles | Platform shadow convention; shadows are alpha on black, not a brand choice. Keep as rgba string inline — the lint rule's regex intentionally does not catch rgba. |
| `#000`, `#000000` (shadow contexts ONLY) | Legacy shadow declarations | OS shadow convention. If a file uses `#000` as a non-shadow color, it must be migrated to a theme token. |
| `rgba(255,255,255,0.x)` | Glass overlays (`glassBackground`, `glassBorder`, etc.) | Already tokenized inside `theme.ts`; the rgba body is the token definition, not a .tsx literal. |
| `#4285F4` (Google Wallet brand blue) | `components/wallet/GoogleWalletButton.tsx` only — **PREFER** using the official Google asset image and avoid the literal entirely | Google brand mandated; cannot be themed per Google Wallet Brand Guidelines. If the official image asset is used, this row becomes moot. |
| `#0077b5` (LinkedIn brand blue) | User profile "View on LinkedIn" CTA chrome / icon only | LinkedIn brand mandated. Import `LINKEDIN_BRAND` from `constants/theme.ts`. |
| Stripe brand purple | Payment flows only (not in Phase 13 scope) | Payment-network brand lockup — cannot be themed. |
| Platform status colors (iOS system red for error alerts via native APIs) | System-driven — no JS literal needed | OS-owned; not a lint concern. |
| `#000` (shadowColor) | Any file using native shadow APIs | Platform convention — iOS/Android shadow APIs require a color; black is the OS convention with opacity applied via `shadowOpacity` or rgba. Import `SHADOW_BLACK` from `constants/data-colors.ts`. |
| Avatar fallback palette (8 hexes) | `constants/data-colors.ts` (`AVATAR_PALETTE`) | Data, not styling. Hash-based deterministic color assignment for users/meetings without an image. |
| Certificate admin color picker (30 hexes) | `constants/data-colors.ts` (`CERTIFICATE_PALETTE`) | Data, not styling. Persisted to backend certificate_template; rendered on generated PDFs. Admin picks one hex; value is stored as string. |
| Leaderboard medal colors (gold/silver/bronze) | `constants/data-colors.ts` (`MEDAL_COLORS`) | Semantic medal convention (bronze specifically is outside the theme's hue range). |
| Badge tier / chart palette | `constants/data-colors.ts` (`BADGE_TIER_COLORS`, `CHART_PALETTE`) | Series-cycling colors — count is dynamic and tokens can't be pre-assigned. |

## Enforcement workflow

1. Developer writes code. `npm run lint` warns about any raw hex.
2. If the hex belongs in a theme token — replace the literal with `colors.<token>` from `useColors()`.
3. If the hex is a legitimate exception — add an entry to this file and, where applicable, reference a named constant exported from `constants/theme.ts` (e.g. `COLOR_WHITE_ON_ACCENT`).
4. Never use `// eslint-disable-next-line no-restricted-syntax` to bypass the rule. Reviewers treat such comments as blockers.

## Luminance-aware derivation

As of Phase 13 gap-7a (Plan 13-12), `lightenHex` / `darkenHex` in `constants/theme.ts` are
luminance-aware. Inputs above 0.6 relative luminance flip from lighten-shift
to darken-shift (and vice versa for darkenHex below 0.1). This means
CURATED_PALETTE can safely include near-white swatches like Paper White
(#fafafa) — derived tokens (borders, cardBorder, trackBackground) produce
a visible offset rather than saturating.

Presets that use a light Slot 2 background (e.g. `paper-daylight`,
`cool-linen`) rely on this behavior. If you touch the helpers, re-run the
theme-helper smoke test (scripts/test-theme.mjs) to verify the flip
threshold still holds.

## Ratchet

`festapp-mobile/scripts/hex-audit.js check` runs in CI. The baseline count in `hex-baseline.json` MUST monotonically decrease during Plan 09. When the count reaches the size of the safe-list (every remaining hex is in this doc), Plan 09's final task flips the ESLint rule from `'warn'` to `'error'`.
