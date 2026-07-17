import { copyFileSync, existsSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

const indexHtml = resolve('dist/index.html')
const notFoundHtml = resolve('dist/404.html')
const noJekyll = resolve('dist/.nojekyll')
const runtimeConfig = resolve('dist/runtime-config.json')

if (!existsSync(indexHtml)) {
  console.error('dist/index.html missing - run vite build first')
  process.exit(1)
}

copyFileSync(indexHtml, notFoundHtml)
writeFileSync(noJekyll, '')

// Prefer VITE_API_URL (GitHub Actions secret) when building for Pages
const apiUrl = (process.env.VITE_API_URL || '').replace(/\/$/, '')
if (apiUrl) {
  writeFileSync(runtimeConfig, `${JSON.stringify({ apiUrl }, null, 2)}\n`)
  console.log(`Wrote dist/runtime-config.json apiUrl=${apiUrl}`)
}

console.log('Created dist/404.html and dist/.nojekyll for GitHub Pages')
