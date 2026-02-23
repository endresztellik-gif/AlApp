import sharp from 'sharp';
import { readFileSync } from 'fs';
import { join } from 'path';

const sizes = [
  { size: 64, name: 'pwa-64x64.png' },
  { size: 192, name: 'pwa-192x192.png' },
  { size: 512, name: 'pwa-512x512.png' },
];

// Use the new main logo
const logoPath = join(process.cwd(), 'public', 'alapp-main-logo.png');
const logoBuffer = readFileSync(logoPath);

console.log('🎨 Generating PWA icons from new logo...\n');

// Generate regular icons
for (const { size, name } of sizes) {
  await sharp(logoBuffer)
    .resize(size, size, {
      fit: 'contain',
      background: { r: 255, g: 255, b: 255, alpha: 0 }
    })
    .png()
    .toFile(join(process.cwd(), 'public', name));

  console.log(`✅ Generated ${name} (${size}x${size})`);
}

// Generate maskable icon with padding (10% safe zone)
const maskableSize = 512;
await sharp(logoBuffer)
  .resize(Math.floor(maskableSize * 0.8), Math.floor(maskableSize * 0.8), {
    fit: 'contain',
    background: { r: 255, g: 255, b: 255, alpha: 0 }
  })
  .extend({
    top: Math.floor(maskableSize * 0.1),
    bottom: Math.floor(maskableSize * 0.1),
    left: Math.floor(maskableSize * 0.1),
    right: Math.floor(maskableSize * 0.1),
    background: { r: 241, g: 238, b: 229, alpha: 1 } // Beige background from logo
  })
  .png()
  .toFile(join(process.cwd(), 'public', 'maskable-icon-512x512.png'));

console.log(`✅ Generated maskable-icon-512x512.png (${maskableSize}x${maskableSize})`);

// Generate apple-touch-icon
await sharp(logoBuffer)
  .resize(180, 180, {
    fit: 'contain',
    background: { r: 255, g: 255, b: 255, alpha: 1 }
  })
  .png()
  .toFile(join(process.cwd(), 'public', 'apple-touch-icon.png'));

console.log(`✅ Generated apple-touch-icon.png (180x180)`);

// Generate favicon
await sharp(logoBuffer)
  .resize(32, 32, {
    fit: 'contain',
    background: { r: 255, g: 255, b: 255, alpha: 0 }
  })
  .png()
  .toFile(join(process.cwd(), 'public', 'favicon.ico'));

console.log(`✅ Generated favicon.ico (32x32)`);

console.log('\n🎉 All PWA icons generated successfully!');
