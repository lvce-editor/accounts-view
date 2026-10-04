import { build } from 'esbuild'
import { mkdir } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..')
const output = join(root, '.tmp', 'dist')
await mkdir(output, { recursive: true })
await Promise.all([
  build({
    bundle: true,
    entryPoints: [join(root, 'packages', 'accounts-view', 'src', 'main.ts')],
    external: ['electron', 'node:*'],
    format: 'esm',
    outfile: join(output, 'accounts-view.js'),
    platform: 'browser',
  }),
  build({
    bundle: true,
    entryPoints: [join(root, 'packages', 'accounts-worker', 'src', 'accountsWorker.ts')],
    external: ['electron', 'node:*'],
    format: 'iife',
    outfile: join(output, 'accounts-worker.js'),
    platform: 'browser',
  }),
])
