import { readFileSync, mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

// 既存ブランドロゴと文字だけで専用サイトの共有画像を生成する。
const logo = readFileSync(
  new URL('../public/favicon.svg', import.meta.url),
).toString('base64')
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs><linearGradient id="background" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#58309c"/><stop offset="1" stop-color="#7140c4"/></linearGradient></defs>
  <rect width="1200" height="630" fill="url(#background)"/>
  <rect x="76" y="68" width="76" height="76" rx="10" fill="#f5f0fc"/>
  <image href="data:image/svg+xml;base64,${logo}" x="88" y="80" width="52" height="52"/>
  <g font-family="sans-serif">
    <text x="178" y="119" font-size="34" font-weight="700" fill="#ffffff">Acecore / Designs</text>
    <text x="76" y="295" font-size="82" font-weight="800" fill="#ffffff">Acecore Designs</text>
    <text x="80" y="370" font-size="36" fill="#e9dff8">Design, 3D, writing and audio production</text>
    <text x="80" y="542" font-size="28" fill="#d9c9f2">designs.acecore.net</text>
  </g>
</svg>`
mkdirSync(new URL('../public/uploads/', import.meta.url), { recursive: true })
await sharp(Buffer.from(svg))
  .png()
  .toFile(
    fileURLToPath(new URL('../public/uploads/og-default.png', import.meta.url)),
  )
