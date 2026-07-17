/**
 * Build favicon.ico from existing favicon-16/32/48.png
 * Usage: node scripts/make-favicon-ico.mjs
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const publicDir = path.join(root, 'public')
const sizes = [16, 32, 48]
const pngs = sizes.map((s) => fs.readFileSync(path.join(publicDir, `favicon-${s}.png`)))

let offset = 6 + 16 * sizes.length
const headers = []
for (let i = 0; i < sizes.length; i++) {
  const s = sizes[i]
  const data = pngs[i]
  const h = Buffer.alloc(16)
  h.writeUInt8(s >= 256 ? 0 : s, 0)
  h.writeUInt8(s >= 256 ? 0 : s, 1)
  h.writeUInt8(0, 2)
  h.writeUInt8(0, 3)
  h.writeUInt16LE(1, 4)
  h.writeUInt16LE(32, 6)
  h.writeUInt32LE(data.length, 8)
  h.writeUInt32LE(offset, 12)
  headers.push(h)
  offset += data.length
}

const head = Buffer.alloc(6)
head.writeUInt16LE(0, 0)
head.writeUInt16LE(1, 2)
head.writeUInt16LE(sizes.length, 4)

const ico = Buffer.concat([head, ...headers, ...pngs])
fs.writeFileSync(path.join(publicDir, 'favicon.ico'), ico)
console.log(`Wrote favicon.ico (${ico.length} bytes)`)
