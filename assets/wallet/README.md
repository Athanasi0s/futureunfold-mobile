# Google Wallet brand assets

This directory must contain the official **"Add to Google Wallet"** button
PNG asset before running the Wallet flow on a real device.

## Required file

`add-to-google-wallet.png` — official PNG from Google's brand center.
Used by `components/wallet/GoogleWalletButton.tsx` via
`require("@/assets/wallet/add-to-google-wallet.png")`.

## How to obtain (human-action — Phase 13 Plan 06)

1. Visit https://developers.google.com/wallet/generic/resources/brand-guidelines
   (alternate URL: https://developers.google.com/wallet/retail/passes/resources/brand-guidelines).
2. Download the **dark background** variant, **English** locale, full-color
   "Add to Google Wallet" button (PNG, condensed).
3. Save it as exactly:
   `festapp-mobile/assets/wallet/add-to-google-wallet.png`
4. Commit it inside the `festapp-mobile` repo (asset is a Google brand-licensed
   image; safe to commit but do NOT redraw or substitute a custom button).

## Why a placeholder PNG was NOT generated

Per Phase 13 D-05 / D-21 and the Wallet brand guidelines, only the official
asset is allowed to ship — Google's brand-review process rejects re-drawn
buttons. The Plan 13-06 executor surfaces this gap as a flagged item in the
SUMMARY rather than committing a placeholder image that would later need to
be force-replaced.

## After dropping the file

- The `GoogleWalletButton` component will render correctly on Android.
- iOS continues to render `null` (no placeholder, per D-04).
- No code changes required — the require() path matches the filename.
