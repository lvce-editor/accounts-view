import { context } from 'esbuild'
import { spawn } from 'node:child_process'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..')
const output = join(root, '.tmp', 'dist')
const buildConfigurations = [
  {
    bundle: true,
    entryPoints: [join(root, 'packages', 'accounts-view', 'src', 'main.ts')],
    format: 'esm' as const,
    outfile: join(output, 'accounts-view.js'),
    platform: 'browser' as const,
  },
  {
    bundle: true,
    entryPoints: [join(root, 'packages', 'accounts-worker', 'src', 'accountsWorker.ts')],
    format: 'iife' as const,
    outfile: join(output, 'accounts-worker.js'),
    platform: 'browser' as const,
  },
]
const contexts = await Promise.all(buildConfigurations.map((configuration) => context(configuration)))
let stopping = false
let server: ReturnType<typeof spawn> | undefined

const stop = async (signal: NodeJS.Signals = 'SIGTERM'): Promise<void> => {
  if (stopping) return
  stopping = true
  await Promise.all(contexts.map((buildContext) => buildContext.dispose()))
  if (server && server.exitCode === null) server.kill(signal)
}

process.once('SIGINT', () => {
  process.exitCode = 130
  void stop('SIGINT')
})
process.once('SIGTERM', () => {
  process.exitCode = 143
  void stop('SIGTERM')
})

try {
  await Promise.all(contexts.map((buildContext) => buildContext.rebuild()))
  await Promise.all(contexts.map((buildContext) => buildContext.watch()))
  server = spawn(process.execPath, [join(root, 'packages', 'e2e', 'src', 'server.js'), '--dev'], {
    cwd: root,
    stdio: 'inherit',
  })
  server.on('error', (error) => {
    process.exitCode = 1
    console.error('Failed to start the accounts-view development server:', error)
    void stop()
  })
  const exitCode = await new Promise<number>((resolve) => {
    server?.once('close', (code, signal) => resolve(code ?? (signal ? 1 : 0)))
  })
  if (exitCode !== 0 && !stopping) process.exitCode = exitCode
  await stop()
} catch (error) {
  await stop()
  throw error
}
