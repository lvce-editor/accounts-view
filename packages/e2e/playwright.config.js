import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  fullyParallel: true,
  reporter: 'list',
  testDir: './src',
  use: {
    baseURL: 'http://127.0.0.1:4173',
    trace: 'retain-on-failure',
    ...devices['Desktop Chrome'],
  },
  webServer: {
    command: 'node src/server.js',
    reuseExistingServer: !process.env.CI,
    url: 'http://127.0.0.1:4173/accounts-view/',
  },
})
