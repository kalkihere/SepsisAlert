import { writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { deflateSync } from 'zlib';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ICONS_DIR = join(__dirname, '..', 'public', 'icons');

function crc32(buf) {
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) {
    crc ^= buf[i];
    for (let j = 0; j < 8; j++) {
      if (crc & 1) {
        crc = (crc >>> 1) ^ 0xEDB88320;
      } else {
        crc >>>= 1;
      }
    }
  }
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

function createChunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  const typeBuffer = Buffer.from(type, 'ascii');
  const crcInput = Buffer.concat([typeBuffer, data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(crcInput), 0);
  return Buffer.concat([length, typeBuffer, data, crc]);
}

function encodePNG(pixels, width, height) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8;
  ihdrData[9] = 6;
  
  const rawData = Buffer.alloc(height * (1 + width * 4));
  for (let y = 0; y < height; y++) {
    rawData[y * (1 + width * 4)] = 0;
    for (let x = 0; x < width; x++) {
      const srcIdx = (y * width + x) * 4;
      const dstIdx = y * (1 + width * 4) + 1 + x * 4;
      rawData[dstIdx] = pixels[srcIdx];
      rawData[dstIdx + 1] = pixels[srcIdx + 1];
      rawData[dstIdx + 2] = pixels[srcIdx + 2];
      rawData[dstIdx + 3] = pixels[srcIdx + 3];
    }
  }
  
  return Buffer.concat([
    signature,
    createChunk('IHDR', ihdrData),
    createChunk('IDAT', deflateSync(rawData)),
    createChunk('IEND', Buffer.alloc(0)),
  ]);
}

function createIcon(size) {
  const pixels = new Uint8Array(size * size * 4);
  const center = size / 2;
  const cornerRadius = size * 0.22;
  const left = size * 0.05, right = size * 0.95;
  const top = size * 0.05, bottom = size * 0.95;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 4;

      // Rounded rect check
      let inBg = false;
      if (x >= left + cornerRadius && x <= right - cornerRadius && y >= top && y <= bottom) {
        inBg = true;
      } else if (x >= left && x <= right && y >= top + cornerRadius && y <= bottom - cornerRadius) {
        inBg = true;
      } else {
        for (const [cx, cy] of [
          [left + cornerRadius, top + cornerRadius],
          [right - cornerRadius, top + cornerRadius],
          [left + cornerRadius, bottom - cornerRadius],
          [right - cornerRadius, bottom - cornerRadius],
        ]) {
          if ((x - cx) ** 2 + (y - cy) ** 2 <= cornerRadius ** 2) { inBg = true; break; }
        }
      }

      if (!inBg) { pixels[idx + 3] = 0; continue; }

      // ECG heartbeat line
      const lineThickness = Math.max(size * 0.04, 2);
      const waveStart = size * 0.15, waveEnd = size * 0.85;
      let isWave = false;

      if (x >= waveStart && x <= waveEnd) {
        const p = (x - waveStart) / (waveEnd - waveStart);
        let wy = center;
        if (p >= 0.25 && p < 0.32) wy = center + Math.sin(((p - 0.25) / 0.07) * Math.PI) * size * 0.06;
        else if (p >= 0.32 && p < 0.42) wy = center - Math.sin(((p - 0.32) / 0.10) * Math.PI) * size * 0.28;
        else if (p >= 0.42 && p < 0.50) wy = center + Math.sin(((p - 0.42) / 0.08) * Math.PI) * size * 0.12;
        else if (p >= 0.50 && p < 0.58) wy = center - Math.sin(((p - 0.50) / 0.08) * Math.PI) * size * 0.10;
        if (Math.abs(y - wy) <= lineThickness) isWave = true;
      }

      if (isWave) {
        pixels[idx] = 255; pixels[idx + 1] = 255; pixels[idx + 2] = 255; pixels[idx + 3] = 255;
      } else {
        pixels[idx] = 10; pixels[idx + 1] = 132; pixels[idx + 2] = 255; pixels[idx + 3] = 255;
      }
    }
  }

  return encodePNG(pixels, size, size);
}

// Generate all sizes
for (const size of [72, 96, 128, 144, 152, 192, 384, 512]) {
  const filename = `icon-${size}x${size}.png`;
  writeFileSync(join(ICONS_DIR, filename), createIcon(size));
  console.log(`✓ ${filename}`);
}

writeFileSync(join(ICONS_DIR, 'apple-touch-icon.png'), createIcon(180));
console.log('✓ apple-touch-icon.png');
console.log('All PWA icons generated!');
