import { defineConfig } from 'eslint/config'
import * as config from '@lvce-editor/eslint-config'

export default defineConfig([
  { ignores: ['dist/**'] },
  ...config.default,
  ...config.recommendedActions,
  ...config.recommendedRegex,
  ...config.recommendedTsconfig,
  ...config.recommendedVirtualDom,
  {
    files: ['packages/e2e/**/*.ts'],
    // These tests use Playwright directly to exercise a standalone worker, without the LVCE test API.
    rules: {
      'e2e/no-imports': 'off',
      'e2e/no-direct-click': 'off',
    },
  },
])
