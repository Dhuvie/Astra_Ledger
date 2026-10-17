const fs = require('fs');
const sharp = require('sharp');

const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64" fill="none">
  <!-- Rounded Hand-Drawn Notebook Card -->
  <rect x="3" y="3" width="58" height="58" rx="14" fill="#0F172A" stroke="#49B6E5" stroke-width="4" stroke-linejoin="round"/>
  
  <!-- Left Binder Margin & Holes -->
  <line x1="17" y1="8" x2="17" y2="56" stroke="#49B6E5" stroke-width="2" stroke-dasharray="3 3" opacity="0.5"/>
  <circle cx="10" cy="18" r="2.5" fill="#49B6E5"/>
  <circle cx="10" cy="32" r="2.5" fill="#49B6E5"/>
  <circle cx="10" cy="46" r="2.5" fill="#49B6E5"/>

  <!-- Celestial Astra 4-Point Star (Golden Doodled) -->
  <path d="M38 11 C38 22 43 28 53 28 C43 28 38 34 38 45 C38 34 33 28 23 28 C33 28 38 22 38 11 Z" fill="#FBBF24" stroke="#F59E0B" stroke-width="2.5" stroke-linejoin="round"/>
  
  <!-- Mini Accent Sparkle -->
  <path d="M49 14 L50.5 17 L53.5 18 L50.5 19 L49 22 L47.5 19 L44.5 18 L47.5 17 Z" fill="#38BDF8"/>

  <!-- Ledger Ruled Underline -->
  <path d="M24 49 C32 47.5 44 47.5 52 49" stroke="#49B6E5" stroke-width="3.5" stroke-linecap="round"/>
</svg>`;

// Write SVGs
fs.writeFileSync('src/app/icon.svg', svgContent, 'utf8');
fs.writeFileSync('public/favicon.svg', svgContent, 'utf8');
fs.writeFileSync('public/icon.svg', svgContent, 'utf8');

async function generate() {
  const buf16 = await sharp(Buffer.from(svgContent)).resize(16, 16).png().toBuffer();
  const buf32 = await sharp(Buffer.from(svgContent)).resize(32, 32).png().toBuffer();
  const buf48 = await sharp(Buffer.from(svgContent)).resize(48, 48).png().toBuffer();
  const buf64 = await sharp(Buffer.from(svgContent)).resize(64, 64).png().toBuffer();
  const buf192 = await sharp(Buffer.from(svgContent)).resize(192, 192).png().toBuffer();

  fs.writeFileSync('src/app/icon.png', buf64);
  fs.writeFileSync('public/icon.png', buf192);
  fs.writeFileSync('public/icon-32x32.png', buf32);

  // Simple ICO builder from PNG buffers (16x16, 32x32, 48x48)
  const images = [
    { width: 16, height: 16, buf: buf16 },
    { width: 32, height: 32, buf: buf32 },
    { width: 48, height: 48, buf: buf48 }
  ];

  // ICO header: 6 bytes (reserved=0, type=1 for icon, count=3)
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(images.length, 4);

  // Directory entries: 16 bytes each
  const dirSize = 16 * images.length;
  let offset = 6 + dirSize;
  const dirBuffers = [];

  for (const img of images) {
    const entry = Buffer.alloc(16);
    entry.writeUInt8(img.width >= 256 ? 0 : img.width, 0);
    entry.writeUInt8(img.height >= 256 ? 0 : img.height, 1);
    entry.writeUInt8(0, 2); // color palette count
    entry.writeUInt8(0, 3); // reserved
    entry.writeUInt16LE(1, 4); // color planes
    entry.writeUInt16LE(32, 6); // bits per pixel
    entry.writeUInt32LE(img.buf.length, 8); // image size
    entry.writeUInt32LE(offset, 12); // image offset
    dirBuffers.push(entry);
    offset += img.buf.length;
  }

  const icoBuffer = Buffer.concat([header, ...dirBuffers, ...images.map(img => img.buf)]);
  fs.writeFileSync('src/app/favicon.ico', icoBuffer);
  fs.writeFileSync('public/favicon.ico', icoBuffer);

  console.log('Favicons generated successfully! ICO bytes:', icoBuffer.length);
}

generate().catch(err => {
  console.error(err);
  process.exit(1);
});
