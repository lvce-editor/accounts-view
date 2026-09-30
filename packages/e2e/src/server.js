import { createReadStream } from 'node:fs'
import { access, readFile } from 'node:fs/promises'
import { createServer } from 'node:http'
import { extname, isAbsolute, join, normalize, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(fileURLToPath(new URL('../../../.tmp/static/', import.meta.url)))
const projectRoot = join(fileURLToPath(new URL('../../../', import.meta.url)))
const development = process.argv.includes('--dev')
const ACCOUNTS_VIEW_PREFIX = /^\/accounts-view\/?/
const contentTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
}

const server = createServer(async (request, response) => {
  const pathname = new URL(request.url || '/', 'http://localhost').pathname
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

server.listen(4173, '127.0.0.1', () => {
  console.log(`Accounts view is available at http://127.0.0.1:4173/accounts-view/${development ? ' (development)' : ''}`)
})

const close = () => server.close()
process.once('SIGINT', close)
process.once('SIGTERM', close)
