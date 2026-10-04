/* eslint-disable @typescript-eslint/prefer-readonly-parameter-types -- HTTP callbacks receive platform request and response objects. */
import { build } from 'esbuild'
import { readFile } from 'node:fs/promises'
import { createServer } from 'node:http'
import { fileURLToPath } from 'node:url'

const root = new URL('../../../', import.meta.url)
await build({
  bundle: true,
  entryPoints: [fileURLToPath(new URL('Fixture.ts', import.meta.url))],
  external: ['node:worker_threads', 'node:buffer', 'electron', 'ws'],
  format: 'esm',
  outfile: fileURLToPath(new URL('.tmp/e2e/fixture.js', root)),
  platform: 'browser',
})

const files: Readonly<Record<string, URL>> = {
  '/accountsWorkerMain.js': new URL('.tmp/dist/dist/accountsWorkerMain.js', root),
  '/fixture.js': new URL('.tmp/e2e/fixture.js', root),
}
const server = createServer((request, response) => {
  void (async (): Promise<void> => {
    const path = new URL(request.url || '/', 'http://localhost').pathname
    if (path === '/') {
      response.writeHead(200, { 'content-type': 'text/html' })
      response.end(
        '<!doctype html><html><head><title>Accounts worker fixture</title></head><body><script type="module" src="/fixture.js"></script></body></html>',
      )
      return
    }
    const file = files[path]
    if (!file) {
      response.writeHead(404).end()
      return
    }
    try {
      response.writeHead(200, { 'content-type': 'text/javascript' })
      response.end(await readFile(file))
    } catch {
      response.destroy()
    }
  })()
})
server.listen(4173, '127.0.0.1')
process.once('SIGTERM', () => server.close())
process.once('SIGINT', () => server.close())
