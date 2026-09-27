// https://docs.expo.dev/guides/using-eslint/
// Phase 13 Plan 09 — hex-literal ratchet LOCKED at 0.
//
// Migration complete. Rule is 'error'-level: raw hex in .tsx files under
// app/**, components/**, features/** fails the lint. The only permitted
// sources of hex values are `constants/theme.ts`, `constants/theme-presets.ts`,
// `constants/theme-palette.ts`, and `constants/data-colors.ts`.
//
// CI runs both `npm run lint` and `node scripts/hex-audit.js check` on PRs.

const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const globals = require('globals');

const HEX_LITERAL_SELECTOR = "Literal[value=/^#[0-9a-fA-F]{3,8}$/]";
const HEX_LITERAL_MESSAGE =
  "Hardcoded hex colors are forbidden. Use useColors() tokens from constants/theme.ts. Documented exceptions live in docs/theme-safelist.md.";

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*'],
  },
  {
    // Phase 13 — ban hex literals outside the theme files.
    files: ['app/**/*.tsx', 'components/**/*.tsx', 'features/**/*.tsx'],
    rules: {
      'no-restricted-syntax': ['error', {
        selector: HEX_LITERAL_SELECTOR,
        message: HEX_LITERAL_MESSAGE,
      }],
    },
  },
  {
    // Existing curved tabs hook usage needs a separately tested refactor.
    files: ['components/curved-bottom-tabs/index.tsx'],
    rules: {
      'react/display-name': 'warn',
      'react-hooks/rules-of-hooks': 'warn',
    },
  },
  {
    files: ['jest.setup.js', '__tests__/**/*.{js,ts,tsx}'],
    languageOptions: {
      globals: globals.jest,
    },
  },
  {
    // The ONLY files where hex literals are legal. The palette / presets
    // hold the source-of-truth color values.
    files: [
      'constants/theme.ts',
      'constants/theme-presets.ts',
      'constants/theme-palette.ts',
      'constants/data-colors.ts',
    ],
    rules: {
      'no-restricted-syntax': 'off',
    },
  },
]);
