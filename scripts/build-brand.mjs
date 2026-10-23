import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const master = path.join(root, 'public/brand/logo-1024.png');
const paper = '#faf8f2';
await mkdir(path.join(root, 'public/icons'), { recursive: true });

await sharp(master)
  .resize(320, 320)
  .webp({ quality: 92 })
  .toFile(path.join(root, 'public/brand-mark.webp'));

async function tile(size, fraction, filename) {
  const markSize = Math.round(size * fraction);
  const mark = await sharp(master).resize(markSize, markSize).png().toBuffer();
  await sharp({ create: { width: size, height: size, channels: 4, background: paper } })
    .composite([{ input: mark, gravity: 'centre' }])
    .png()
    .toFile(path.join(root, 'public/icons', filename));
}

await tile(32, 0.98, 'icon-32.png');
await tile(192, 0.88, 'icon-192.png');
await tile(512, 0.88, 'icon-512.png');
await tile(180, 0.88, 'apple-touch-icon.png');
// A 280 px square fits entirely inside the 409.6 px maskable safe-area circle.
await tile(512, 280 / 512, 'maskable-512.png');
console.log('Built the web mark, favicon, app icons and maskable icon from the master.');
