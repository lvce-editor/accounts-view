import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './src',
  testMatch: '*.spec.ts',
  use: { baseURL: 'http://127.0.0.1:4173', headless: true },
  webServer: { command: 'node src/Server.ts', reuseExistingServer: false, url: 'http://127.0.0.1:4173' },
  workers: 1,
})
