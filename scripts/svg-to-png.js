const sharp = require('sharp')
const fs = require('fs')
const path = require('path')

const ICONS_DIR = path.join(__dirname, '../assets/icons')
const GRAY = '#64748b'
const TEAL = '#0f766e'

async function convert(svgPath, color, outputPath) {
  const svg = fs.readFileSync(svgPath, 'utf8')
  const svgWithColor = svg.replace(/fill="currentColor"/g, `fill="${color}"`).replace(/fill="#[0-9a-fA-F]+"/g, `fill="${color}"`)
  await sharp(Buffer.from(svgWithColor))
    .resize(81, 81)
    .png()
    .toFile(outputPath)
  console.log('Created:', outputPath)
}

async function main() {
  const icons = [
    { svg: 'home.svg', png: 'home' },
    { svg: 'box.svg', png: 'box' },
    { svg: 'list.svg', png: 'list' },
    { svg: 'user.svg', png: 'user' },
  ]
  for (const { svg, png } of icons) {
    const svgPath = path.join(ICONS_DIR, svg)
    if (!fs.existsSync(svgPath)) continue
    await convert(svgPath, GRAY, path.join(ICONS_DIR, `${png}.png`))
    await convert(svgPath, TEAL, path.join(ICONS_DIR, `${png}-active.png`))
  }
}

main().catch(console.error)
