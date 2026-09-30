import { cp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..')
const staticRoot = join(root, '.tmp', 'static')
const distRoot = join(root, '.tmp', 'dist')
const prefix = '/accounts-view'
const testPrefix = `${prefix}/tests`
const testNames = ['accounts-view-initial-render', 'accounts-view-add-account', 'accounts-view-empty-state']

await rm(staticRoot, { recursive: true, force: true })
await mkdir(staticRoot, { recursive: true })
await cp(join(distRoot, 'accounts-view.js'), join(staticRoot, 'accounts-view.js'))
await cp(join(distRoot, 'accounts-worker.js'), join(staticRoot, 'accounts-worker.js'))
await cp(join(root, 'packages', 'accounts-view', 'index.html'), join(staticRoot, 'index.html'))
await cp(join(root, 'packages', 'accounts-view', 'style.css'), join(staticRoot, 'style.css'))
await cp(join(root, 'packages', 'accounts-view', 'favicon.svg'), join(staticRoot, 'favicon.svg'))
const htmlPath = join(staticRoot, 'index.html')
const html = await readFile(htmlPath, 'utf8')
await writeFile(htmlPath, html.replaceAll('%%PATH_PREFIX%%', prefix))

const testRoot = join(staticRoot, 'tests')
await mkdir(testRoot, { recursive: true })
await cp(join(root, 'packages', 'e2e', 'test-harness.js'), join(testRoot, 'test-harness.js'))
for (const fileName of await readdir(join(root, 'packages', 'e2e', 'src'))) {
  if (fileName.endsWith('.js')) {
    await cp(join(root, 'packages', 'e2e', 'src', fileName), join(testRoot, fileName))
  }
}
const testLinks = testNames.map((testName) => `    <li><a href="${testPrefix}/${testName}.html">${testName}</a></li>`).join('\n')
await writeFile(
  join(testRoot, 'index.html'),
  `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Accounts view tests</title>
  </head>
  <body>
    <h1>Accounts view tests</h1>
    <ul>
${testLinks}
    </ul>
  </body>
</html>
`,
)
for (const testName of testNames) {
  const emptyQuery = testName === 'accounts-view-empty-state' ? '?empty=1' : ''
  const testHtml = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>${testName}</title>
  </head>
  <body>
    <iframe src="${prefix}/${emptyQuery}" style="width:100%;height:800px"></iframe>
    <script type="module" src="${testPrefix}/test-harness.js" data-test="${testName}"></script>
  </body>
</html>
`
  await writeFile(join(testRoot, `${testName}.html`), testHtml)
}
