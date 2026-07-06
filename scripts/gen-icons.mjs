// Erzeugt einfache PWA-Icons ohne externe Abhängigkeiten: ein weißes Häkchen
// (Symbol für die abhakbare Liste) auf der Akzentfarbe. Reicht als App-Icon
// fürs Home-Bildschirm; kann später durch echtes Brand-Artwork ersetzt werden.
// Aufruf: npm run gen:icons
import zlib from 'node:zlib'
import { writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const outDir = join(here, '..', 'public')
mkdirSync(outDir, { recursive: true })

const crcTable = (() => {
  const t = new Uint32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    t[n] = c >>> 0
  }
  return t
})()

function crc32(buf) {
  let c = 0xffffffff
  for (let i = 0; i < buf.length; i++) c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}

function chunk(type, data) {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length, 0)
  const typeBuf = Buffer.from(type, 'ascii')
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0)
  return Buffer.concat([len, typeBuf, data, crc])
}

// Abstand eines Punktes (px,py) zur Strecke a→b — für gleichmäßig dicke Linien.
function distToSegment(px, py, ax, ay, bx, by) {
  const dx = bx - ax
  const dy = by - ay
  const len2 = dx * dx + dy * dy
  let t = len2 ? ((px - ax) * dx + (py - ay) * dy) / len2 : 0
  t = Math.max(0, Math.min(1, t))
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy))
}

// RGBA-Pixel: Hintergrund in Akzentfarbe, darauf ein Häkchen in fg.
function checkIconPixels(size, bg, fg) {
  const px = Buffer.alloc(size * size * 4)
  // Häkchen aus zwei Strecken (normalisiert, innerhalb der maskable-Safe-Zone).
  const pts = [
    [0.26, 0.53],
    [0.44, 0.71],
    [0.74, 0.32],
  ].map(([x, y]) => [x * size, y * size])
  const half = size * 0.055 // halbe Strichbreite
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const cx = x + 0.5
      const cy = y + 0.5
      const d = Math.min(
        distToSegment(cx, cy, pts[0][0], pts[0][1], pts[1][0], pts[1][1]),
        distToSegment(cx, cy, pts[1][0], pts[1][1], pts[2][0], pts[2][1]),
      )
      const [r, g, b] = d <= half ? fg : bg
      const o = (y * size + x) * 4
      px[o] = r
      px[o + 1] = g
      px[o + 2] = b
      px[o + 3] = 255
    }
  }
  return px
}

function pngFromPixels(size, px) {
  const rowLen = size * 4 + 1
  const raw = Buffer.alloc(rowLen * size)
  for (let y = 0; y < size; y++) {
    raw[y * rowLen] = 0 // Filter: None
    px.copy(raw, y * rowLen + 1, y * size * 4, (y + 1) * size * 4)
  }
  const idat = zlib.deflateSync(raw, { level: 9 })
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0)
  ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8 // bit depth
  ihdr[9] = 6 // color type RGBA
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
  return Buffer.concat([
    sig,
    chunk('IHDR', ihdr),
    chunk('IDAT', idat),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

const accent = [22, 163, 74]
const white = [255, 255, 255]
const icons = [
  ['pwa-192x192.png', 192],
  ['pwa-512x512.png', 512],
  ['apple-touch-icon.png', 180],
]

for (const [name, size] of icons) {
  const png = pngFromPixels(size, checkIconPixels(size, accent, white))
  writeFileSync(join(outDir, name), png)
  console.log('geschrieben:', name, `(${size}x${size})`)
}
