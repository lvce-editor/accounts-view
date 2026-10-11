import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { readFile, readdir } from 'node:fs/promises'
import { join } from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('../../../', import.meta.url))
const dist = join(root, '.tmp/dist')
const workerPath = join(dist, 'dist/accountsWorkerMain.js')
const staticAccountsViewPath = join(root, '.tmp/static/accounts-view')
const staticWorkerPath = join(staticAccountsViewPath, 'dist/accountsWorkerMain.js')
const sourceMapReference = /sourceMappingURL=/

const assertNoSourceMaps = async (directory) => {
  const entries = await readdir(directory, { withFileTypes: true })
  for (const entry of entries) {
    const path = join(directory, entry.name)
    if (entry.isDirectory()) {
      await assertNoSourceMaps(path)
    } else {
      assert.equal(entry.name.endsWith('.map'), false, `${path} must not be packaged`)
      if (entry.name.endsWith('.js')) {
        assert.equal(sourceMapReference.test(await readFile(path, 'utf8')), false, `${path} must not reference a source map`)
      }
    }
  }
}

test('production output and package omit source maps while development output retains them', async () => {
  await assertNoSourceMaps(dist)
  await assertNoSourceMaps(staticAccountsViewPath)
  const staticWorker = await readFile(staticWorkerPath, 'utf8')
  assert.equal(sourceMapReference.test(staticWorker), false)

  const packedFiles = JSON.parse(
    execFileSync(process.execPath, [process.env.npm_execpath, 'pack', '--dry-run', '--json'], { cwd: dist, encoding: 'utf8' }),
  )[0].files
  assert.equal(
    packedFiles.some(({ path }) => path.endsWith('.map')),
    false,
  )
  assert.equal(
    packedFiles.some(({ path }) => path === 'dist/accountsWorkerMain.js'),
    true,
  )

  execFileSync(process.execPath, ['packages/build/src/build.ts', '--development'], { cwd: root, stdio: 'pipe' })
  assert.ok((await readFile(workerPath, 'utf8')).includes('sourceMappingURL=accountsWorkerMain.js.map'))
  await readFile(join(dist, 'dist/accountsWorkerMain.js.map'))

  execFileSync(process.execPath, ['packages/build/src/build.ts'], { cwd: root, stdio: 'pipe' })
  await assertNoSourceMaps(dist)
})
