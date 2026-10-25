import fs from 'fs'
import path from 'path'

const distDir = path.resolve(import.meta.dirname, '../dist')
const indexPath = path.join(distDir, 'index.html')
const notFoundPath = path.join(distDir, '404.html')

if (fs.existsSync(indexPath)) {
  fs.copyFileSync(indexPath, notFoundPath)
  console.log('[7dc] 404.html gerado com sucesso a partir de index.html para GitHub Pages.')
}
