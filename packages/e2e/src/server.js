import { createReadStream } from 'node:fs'
import { access } from 'node:fs/promises'
import { createServer } from 'node:http'
import { extname, isAbsolute, join, normalize, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(fileURLToPath(new URL('../../../.tmp/static/', import.meta.url)))
const ACCOUNTS_VIEW_PREFIX = /^\/accounts-view\/?/
const contentTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
}

createServer(async (request, response) => {
  const pathname = new URL(request.url || '/', 'http://localhost').pathname
  const relativePath = pathname.replace(ACCOUNTS_VIEW_PREFIX, '') || 'index.html'
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
}).listen(4173, '127.0.0.1')
