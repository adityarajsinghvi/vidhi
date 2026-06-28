import sharp from "sharp";
import { mkdirSync } from "fs";

// Matches the in-app accent-mark avatar: marigold rounded square + "व" in
// dark ink. Includes a safe-zone margin so the same source works as a
// maskable icon (Android can crop to a circle without clipping the glyph).
function svgIcon(size, withMargin) {
  const margin = withMargin ? size * 0.1 : 0;
  const boxSize = size - margin * 2;
  const radius = boxSize * 0.22;
  const fontSize = boxSize * 0.5;

  return `
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" fill="#fbf9f6" />
  <rect x="${margin}" y="${margin}" width="${boxSize}" height="${boxSize}" rx="${radius}" fill="#e0a335" />
  <text
    x="${size / 2}"
    y="${size / 2}"
    font-family="Georgia, serif"
    font-size="${fontSize}"
    fill="#1a1408"
    text-anchor="middle"
    dominant-baseline="central"
  >व</text>
</svg>`;
}

mkdirSync("public", { recursive: true });

const targets = [
  { file: "public/icon-192.png", size: 192, margin: false },
  { file: "public/icon-512.png", size: 512, margin: false },
  { file: "public/icon-maskable-512.png", size: 512, margin: true },
  { file: "public/apple-touch-icon.png", size: 180, margin: false },
];

for (const { file, size, margin } of targets) {
  await sharp(Buffer.from(svgIcon(size, margin))).png().toFile(file);
  console.log("wrote", file);
}
