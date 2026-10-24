import { readFileSync, mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

// 既存ブランドロゴと文字だけで専用サイトの共有画像を生成する。
const logo = readFileSync(
  new URL('../public/logo.svg', import.meta.url),
).toString('base64')
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs><radialGradient id="background" cx="0" cy="0" r="1" gradientTransform="matrix(1.375 0 0 2 -0.1 0)"><stop stop-color="#f4d275"/><stop offset="22.4%" stop-color="#efa28d"/><stop offset="44%" stop-color="#d780ba"/><stop offset="56%" stop-color="#a373ce"/><stop offset="80%" stop-color="#225cd7"/><stop offset="100%" stop-color="#0656d9"/></radialGradient><radialGradient id="name" cx="0" cy="0" r="1" gradientTransform="matrix(1.1 0 0 1.6 -0.1 0)"><stop stop-color="#986000"/><stop offset="35%" stop-color="#b33e71"/><stop offset="65%" stop-color="#8146ae"/><stop offset="100%" stop-color="#0656d9"/></radialGradient></defs>
  <rect width="1200" height="630" fill="url(#background)"/><rect x="12" y="12" width="1176" height="606" fill="#ffffff"/>
  <rect x="76" y="68" width="76" height="76" rx="10" fill="#f7f2fa"/>
  <image href="data:image/svg+xml;base64,${logo}" x="88" y="80" width="52" height="52"/>
  <g font-family="sans-serif">
    <text x="178" y="119" font-size="34" font-weight="700" fill="#20252b">Ace<tspan fill="#0656d9">c</tspan>ore / <tspan fill="url(#name)">D</tspan>esigns</text>
    <text x="76" y="295" font-size="82" font-weight="800" fill="#20252b">Ace<tspan fill="#0656d9">c</tspan>ore <tspan fill="url(#name)">D</tspan>esigns</text>
    <text x="80" y="370" font-size="36" fill="#20252b">Design, 3D, writing and audio production</text>
    <text x="80" y="542" font-size="28" fill="#8146ae">designs.acecore.net</text>
  </g>
</svg>`
mkdirSync(new URL('../public/uploads/', import.meta.url), { recursive: true })
await sharp(Buffer.from(svg))
  .png()
  .toFile(
    fileURLToPath(new URL('../public/uploads/og-default.png', import.meta.url)),
  )
