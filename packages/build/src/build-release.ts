import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..')
const distRoot = join(root, '.tmp', 'dist')
const staticRoot = join(root, '.tmp', 'static')

const readJson = async (path: string): Promise<Record<string, unknown>> => {
  const content = await readFile(path, 'utf8')
  return JSON.parse(content)
}

const tagVersion = process.env.RG_VERSION || process.env.GIT_TAG || '0.0.0-dev'
const version = tagVersion.startsWith('v') ? tagVersion.slice(1) : tagVersion

await rm(distRoot, { recursive: true, force: true })
await mkdir(distRoot, { recursive: true })

const packageJson = await readJson(join(root, 'packages', 'accounts-view', 'package.json'))
packageJson.version = version
packageJson.files = ['accounts-view.js', 'accounts-worker.js', 'index.html', 'style.css', 'favicon.svg']
await writeFile(join(distRoot, 'package.json'), `${JSON.stringify(packageJson, null, 2)}\n`)

for (const file of packageJson.files as string[]) {
  await cp(join(staticRoot, file), join(distRoot, file))
}

const indexPath = join(distRoot, 'index.html')
const indexHtml = await readFile(indexPath, 'utf8')
await writeFile(indexPath, indexHtml.replaceAll('/accounts-view/', './'))

await cp(join(root, 'README.md'), join(distRoot, 'README.md'))
