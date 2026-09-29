import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..')
const staticRoot = join(root, '.tmp', 'static')
const distRoot = join(root, '.tmp', 'dist')
const prefix = '/accounts-view'

await rm(staticRoot, { recursive: true, force: true })
await mkdir(staticRoot, { recursive: true })
await cp(join(distRoot, 'accounts-view.js'), join(staticRoot, 'accounts-view.js'))
await cp(join(distRoot, 'accounts-worker.js'), join(staticRoot, 'accounts-worker.js'))
await cp(join(root, 'packages', 'accounts-view', 'index.html'), join(staticRoot, 'index.html'))
await cp(join(root, 'packages', 'accounts-view', 'style.css'), join(staticRoot, 'style.css'))
const htmlPath = join(staticRoot, 'index.html')
const html = await readFile(htmlPath, 'utf8')
await writeFile(htmlPath, html.replaceAll('%%PATH_PREFIX%%', prefix))
