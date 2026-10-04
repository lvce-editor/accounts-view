import { build, context } from 'esbuild'
import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { root } from './root.ts'

const dist = join(root, '.tmp', 'dist')
const options = {
  bundle: true,
  entryPoints: [join(root, 'packages/accounts-view/src/accountsWorkerMain.ts')],
  format: 'esm' as const,
  platform: 'browser' as const,
  outfile: join(dist, 'dist/accountsWorkerMain.js'),
  sourcemap: true,
  external: ['node:worker_threads', 'node:buffer', 'electron', 'ws'],
}

if (process.argv.includes('--watch')) {
  const buildContext = await context(options)
  await buildContext.watch()
} else {
  await rm(dist, { recursive: true, force: true })
  await mkdir(dist, { recursive: true })
  await build(options)
  const packageJson = JSON.parse(await readFile(join(root, 'packages/accounts-view/package.json'), 'utf8'))
  delete packageJson.scripts
  delete packageJson.devDependencies
  packageJson.version = (process.env.RG_VERSION || process.env.GIT_TAG || '0.0.0-dev').replace(/^v/, '')
  packageJson.main = 'dist/accountsWorkerMain.js'
  packageJson.files = ['dist']
  await writeFile(join(dist, 'package.json'), `${JSON.stringify(packageJson, null, 2)}\n`)
  await cp(join(root, 'README.md'), join(dist, 'README.md'))
}
