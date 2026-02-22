/**
 * 压缩过大的菜单图标，输出 162x162 PNG（首页 88rpx 约 44px，2x 足够）
 */
const sharp = require('sharp')
const fs = require('fs')
const path = require('path')

const ICONS_DIR = path.join(__dirname, '../assets/icons')
const TARGET_SIZE = 162
const QUALITY = 80

const largeIcons = ['product.png', 'inbound.png', 'outbound.png', 'inventory.png', 'report.png', 'app-icon.png']

async function compress() {
  for (const name of largeIcons) {
    const p = path.join(ICONS_DIR, name)
    if (!fs.existsSync(p)) continue
    const out = path.join(ICONS_DIR, name)
    await sharp(p)
      .resize(TARGET_SIZE, TARGET_SIZE)
      .png({ quality: QUALITY })
      .toFile(out + '.tmp')
    fs.renameSync(out + '.tmp', out)
    const stat = fs.statSync(out)
    console.log(`${name}: ${(stat.size / 1024).toFixed(1)} KB`)
  }
}

compress().catch(console.error)
