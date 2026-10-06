import { cp, mkdir, readFile, rm } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
if (!process.argv[2]) throw new Error('Pass the path to a disposable LVCE checkout')
const application = resolve(process.argv[2])
const manifest = JSON.parse(await readFile(join(application, 'package.json'), 'utf8'))
if (manifest.name !== 'lvce-editor') throw new Error('Expected an LVCE application checkout')

const source = join(here, 'viewlet.accounts-view-open.js')
const target = join(application, 'packages/extension-host-worker-tests/src/viewlet.accounts-view-open.js')
if (process.argv.includes('--clean')) {
  await rm(target, { force: true })
} else {
  await mkdir(dirname(target), { recursive: true })
  await cp(source, target)
}
