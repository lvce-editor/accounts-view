import { build } from 'esbuild'
import { mkdir, readFile } from 'node:fs/promises'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('../../', import.meta.url))
const testRoot = fileURLToPath(new URL('src/', import.meta.url))
const fixturePath = join(root, '.tmp', 'e2e', 'fixture.js')
await mkdir(join(root, '.tmp', 'e2e'), { recursive: true })
await build({
  bundle: true,
  entryPoints: [fileURLToPath(new URL('Fixture.ts', import.meta.url))],
  external: ['node:worker_threads', 'node:buffer', 'electron', 'ws'],
  format: 'esm',
  outfile: fixturePath,
  platform: 'browser',
})

const contentTypes: Readonly<Record<string, string>> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
}

const testPathRegex = /^\/tests\/([a-zA-Z0-9.-]+\.js)$/

/* eslint-disable @typescript-eslint/prefer-readonly-parameter-types -- Node HTTP callbacks receive mutable request and response objects. */
const server = createServer((request, response) => {
  void (async (): Promise<void> => {
    const { url } = request
    const { pathname } = new URL(url || '/', 'http://localhost')
    if (pathname === '/' || (pathname.startsWith('/tests/') && pathname.endsWith('.html'))) {
      const testName = pathname === '/' ? '' : pathname.slice('/tests/'.length, -'.html'.length)
      if (pathname !== '/' && (!testName || testName.includes('/'))) {
        response.writeHead(404).end()
        return
      }
      const html =
        pathname === '/'
          ? '<!doctype html><html><head><title>Accounts worker fixture</title></head><body><script type="module" src="/fixture.js"></script></body></html>'
          : `<!doctype html><html><head><title>${testName}</title></head><body><script type="module" src="/fixture.js"></script><script type="module" src="/tests/_test-harness.js" data-test="${testName}"></script></body></html>`
      response.writeHead(200, { 'content-type': contentTypes['.html'] })
      response.end(html)
      return
    }

    const files: Readonly<Record<string, string>> = {
      '/accountsWorkerMain.js': join(root, '.tmp', 'dist', 'dist', 'accountsWorkerMain.js'),
      '/fixture.js': fixturePath,
      '/tests/_test-harness.js': join(testRoot, '_test-harness.js'),
    }
    const testMatch = pathname.match(testPathRegex)
    const file = files[pathname] || (testMatch ? join(testRoot, testMatch[1]) : '')
    if (!file) {
      response.writeHead(404).end()
      return
    }
    try {
      response.writeHead(200, { 'content-type': contentTypes[extname(file)] || 'application/octet-stream' })
      response.end(await readFile(file))
    } catch {
      response.writeHead(404).end()
    }
  })()
})

server.listen(Number(process.env.PORT || 4173), () => {
  if (typeof process.send === 'function') {
    process.send('ready')
  }
})
const close = (): void => {
  server.close()
}
process.once('SIGINT', close)
process.once('SIGTERM', close)
