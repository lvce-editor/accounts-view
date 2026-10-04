import { cp } from 'node:fs/promises'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { root } from './root.ts'

const sharedProcessUrl = pathToFileURL(join(root, 'node_modules/@lvce-editor/shared-process/index.js')).href
const sharedProcess = await import(sharedProcessUrl)
process.env.PATH_PREFIX = '/accounts-view'
await sharedProcess.exportStatic({ root, extensionPath: '', testPath: '' })
await cp(join(root, 'dist'), join(root, '.tmp/static'), { recursive: true })
await cp(join(root, '.tmp/dist'), join(root, '.tmp/static/accounts-view'), { recursive: true })
