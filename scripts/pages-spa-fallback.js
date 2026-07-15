import { copyFileSync, existsSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

const indexHtml = resolve('dist/index.html')
const notFoundHtml = resolve('dist/404.html')
const noJekyll = resolve('dist/.nojekyll')

if (!existsSync(indexHtml)) {
  console.error('dist/index.html missing — run vite build first')
  process.exit(1)
}

copyFileSync(indexHtml, notFoundHtml)
writeFileSync(noJekyll, '')
console.log('Created dist/404.html and dist/.nojekyll for GitHub Pages')
