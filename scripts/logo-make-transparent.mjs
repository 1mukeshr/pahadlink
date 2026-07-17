/**
 * Make near-black logo background transparent and crop to content.
 * Usage: node scripts/logo-make-transparent.mjs
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { PNG } from 'pngjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')
const darkPath = path.join(root, 'src/assets/images/logo-dark.png')
const outSrc = path.join(root, 'src/assets/images/logo.png')
const outPublic = path.join(root, 'public/logo.png')

const src = PNG.sync.read(fs.readFileSync(darkPath))
const { width: W, height: H, data } = src

for (let i = 0; i < data.length; i += 4) {
  const r = data[i]
  const g = data[i + 1]
  const b = data[i + 2]
  const a = data[i + 3]
  if (a === 0) continue
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  if (max < 45 && max - min < 18) {
    data[i + 3] = 0
    continue
  }
  if (max < 70 && max - min < 22) {
    const t = (max - 45) / 25
    data[i + 3] = Math.min(a, Math.round(t * 255))
  }
}

let minX = W
let minY = H
let maxX = 0
let maxY = 0
for (let y = 0; y < H; y++) {
  for (let x = 0; x < W; x++) {
    const i = (W * y + x) * 4
    if (data[i + 3] > 12) {
      if (x < minX) minX = x
      if (x > maxX) maxX = x
      if (y < minY) minY = y
      if (y > maxY) maxY = y
    }
  }
}

const pad = 8
minX = Math.max(0, minX - pad)
minY = Math.max(0, minY - pad)
maxX = Math.min(W - 1, maxX + pad)
maxY = Math.min(H - 1, maxY + pad)
const cw = maxX - minX + 1
const ch = maxY - minY + 1

const out = new PNG({ width: cw, height: ch })
for (let y = 0; y < ch; y++) {
  for (let x = 0; x < cw; x++) {
    const si = ((minY + y) * W + (minX + x)) * 4
    const di = (y * cw + x) * 4
    out.data[di] = data[si]
    out.data[di + 1] = data[si + 1]
    out.data[di + 2] = data[si + 2]
    out.data[di + 3] = data[si + 3]
  }
}

const buf = PNG.sync.write(out)
fs.writeFileSync(outSrc, buf)
fs.writeFileSync(outPublic, buf)
console.log(`Wrote transparent logo ${cw}x${ch} (${buf.length} bytes)`)
