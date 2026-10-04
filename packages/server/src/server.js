process.argv.push(`--link=${new URL('../../../.tmp/dist', import.meta.url).href}`)

await import('@lvce-editor/server/bin/server.js')
