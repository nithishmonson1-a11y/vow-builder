// Run: node scripts/generate-icons.mjs
// Requires: npm install sharp (already in package.json)
// Generates placeholder icons for PWA. Replace with real artwork before shipping.

import sharp from 'sharp'
import { writeFileSync } from 'fs'

const svgIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="#faf7f2"/>
  <text x="256" y="300" font-size="280" text-anchor="middle" font-family="Georgia, serif" fill="#b5924c">V</text>
</svg>`

async function generate(size) {
  const buf = await sharp(Buffer.from(svgIcon))
    .resize(size, size)
    .png()
    .toBuffer()
  writeFileSync(`public/icons/icon-${size}.png`, buf)
  console.log(`Generated icon-${size}.png`)
}

await generate(192)
await generate(512)
console.log('Icons generated in public/icons/')
