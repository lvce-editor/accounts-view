import { createReadStream } from 'node:fs'
import { access, readFile } from 'node:fs/promises'
import { createServer } from 'node:http'
import { extname, isAbsolute, join, normalize, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(fileURLToPath(new URL('../../.tmp/static/', import.meta.url)))
const projectRoot = join(fileURLToPath(new URL('../../', import.meta.url)))
const testMode = Boolean(process.send)
const development = process.argv.includes('--dev')
const TEST_EXTENSION = /\.(html|js)$/
const ACCOUNTS_VIEW_PREFIX = /^\/accounts-view\/?/
const contentTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
}

const server = createServer(async (request, response) => {
  const pathname = new URL(request.url || '/', 'http://localhost').pathname
  if (testMode && pathname.startsWith('/tests/')) {
    const name = pathname.slice('/tests/'.length)
    const tests = ['accounts-view-initial-render', 'accounts-view-add-account', 'accounts-view-empty-state']
    const testName = name.replace(TEST_EXTENSION, '')
    if (!tests.includes(testName)) {
      response.writeHead(404).end()
      return
    }
    if (name.endsWith('.html')) {
      const query = testName === 'accounts-view-empty-state' ? '?empty=1' : ''
      response.writeHead(200, { 'content-type': contentTypes['.html'] })
      response.end(`<!doctype html><iframe src="/accounts-view/${query}" style="width:100%;height:800px"></iframe>
        <script type="module" src="/test-harness.js" data-test="${testName}"></script>`)
    } else if (name.endsWith('.js')) {
      response.writeHead(200, { 'content-type': contentTypes['.js'] })
      response.end(await readFile(new URL(`./src/${name}`, import.meta.url)))
    } else {
      response.writeHead(404).end()
    }
    return
  }
  if (testMode && pathname === '/test-harness.js') {
    response.writeHead(200, { 'content-type': contentTypes['.js'] })
    response.end(await readFile(new URL('./test-harness.js', import.meta.url)))
    return
  }
  const relativePath = pathname.replace(ACCOUNTS_VIEW_PREFIX, '') || 'index.html'
  if (development) {
    const developmentPaths = {
      'accounts-view.js': join(projectRoot, '.tmp', 'dist', 'accounts-view.js'),
      'accounts-worker.js': join(projectRoot, '.tmp', 'dist', 'accounts-worker.js'),
      'favicon.svg': join(projectRoot, 'packages', 'accounts-view', 'favicon.svg'),
      'index.html': join(projectRoot, 'packages', 'accounts-view', 'index.html'),
      'style.css': join(projectRoot, 'packages', 'accounts-view', 'style.css'),
    }
    const developmentPath = developmentPaths[relativePath]
    if (!developmentPath) {
      response.writeHead(404).end()
      return
    }
    try {
      await access(developmentPath)
      if (relativePath === 'index.html') {
        const html = await readFile(developmentPath, 'utf8')
        response.writeHead(200, { 'content-type': contentTypes[extname(developmentPath)] })
        response.end(html.replaceAll('%%PATH_PREFIX%%', '/accounts-view'))
      } else {
        response.writeHead(200, { 'content-type': contentTypes[extname(developmentPath)] || 'application/octet-stream' })
        createReadStream(developmentPath)
          .on('error', (error) => {
            console.error('Failed to stream accounts-view development asset:', error)
            response.destroy(error)
          })
          .pipe(response)
      }
    } catch (error) {
      console.error('Failed to serve accounts-view development asset:', error)
      if (!response.headersSent) response.writeHead(500).end('Failed to read development asset')
    }
    return
  }
  const path = normalize(join(root, relativePath))
  const pathFromRoot = relative(root, path)
  if (pathFromRoot.startsWith('..') || isAbsolute(pathFromRoot)) {
    response.writeHead(404).end()
    return
  }
  try {
    await access(path)
    response.writeHead(200, { 'content-type': contentTypes[extname(path)] || 'application/octet-stream' })
    createReadStream(path).pipe(response)
  } catch {
    response.writeHead(404).end()
  }
})

server.on('error', (error) => {
  console.error('Failed to start accounts-view server:', error)
  process.exitCode = 1
})

server.listen(Number(process.env.PORT || 4173), '127.0.0.1', () => {
  process.send?.('ready')
  console.log(`Accounts view is available at http://127.0.0.1:${server.address().port}/accounts-view/${development ? ' (development)' : ''}`)
})

const close = () => server.close()
process.once('SIGINT', close)
process.once('SIGTERM', close)
