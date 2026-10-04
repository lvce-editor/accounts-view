import { defineConfig } from '@lvce-editor/test-with-playwright'

export default defineConfig({
  headless: true,
  serverPath: './Server.ts',
  testPath: '.',
})
