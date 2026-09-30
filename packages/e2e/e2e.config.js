import { defineConfig } from '@lvce-editor/test-with-playwright'

export default defineConfig({
  headless: true,
  serverPath: './static-server.js',
  testPath: '.',
})
