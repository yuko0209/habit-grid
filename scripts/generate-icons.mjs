/**
 * Generates the app icons from code, so there is no binary asset to hand-edit
 * and no image dependency to install. Run with `pnpm icons`.
 *
 * The motif is the app itself: a small habit grid, mostly filled in.
 */

import { deflateSync } from "node:zlib";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const BACKGROUND = [10, 10, 10];
const LEVEL_COLORS = [
  [31, 41, 55], // not done
  [20, 83, 45],
  [21, 128, 61],
  [34, 197, 94],
  [74, 222, 128],
];

// A plausible-looking stretch of habit records rather than a random pattern.
const PATTERN_4 = [
  [3, 4, 2, 4],
  [4, 2, 4, 3],
  [1, 4, 3, 4],
  [4, 3, 4, 0],
];

const PATTERN_3 = [
  [4, 3, 4],
  [2, 4, 3],
  [4, 0, 4],
];

/** 4x supersampling, box-filtered down, gives smooth rounded corners. */
const SCALE = 4;

/**
 * `padding` is the fraction of the icon left empty around the grid. Maskable
 * icons are cropped to roughly the centre 80%, so they need more of it.
 */
function drawIcon(size, pattern, padding) {
  const big = size * SCALE;
  const pixels = new Uint8Array(big * big * 4);

  const cells = pattern.length;
  const inset = big * padding;
  const available = big - inset * 2;
  const gap = available * 0.09;
  const cell = (available - gap * (cells - 1)) / cells;
  const radius = cell * 0.24;

  for (let y = 0; y < big; y += 1) {
    for (let x = 0; x < big; x += 1) {
      let color = BACKGROUND;

      const column = Math.floor((x - inset) / (cell + gap));
      const row = Math.floor((y - inset) / (cell + gap));

      if (column >= 0 && column < cells && row >= 0 && row < cells) {
        const left = inset + column * (cell + gap);
        const top = inset + row * (cell + gap);
        const localX = x - left;
        const localY = y - top;

        if (localX >= 0 && localX < cell && localY >= 0 && localY < cell) {
          // Rounded square: only the corner quadrants are distance-tested.
          const cornerX = Math.max(radius - localX, localX - (cell - radius), 0);
          const cornerY = Math.max(radius - localY, localY - (cell - radius), 0);
          if (Math.hypot(cornerX, cornerY) <= radius) {
            color = LEVEL_COLORS[pattern[row][column]];
          }
        }
      }

      const offset = (y * big + x) * 4;
      pixels[offset] = color[0];
      pixels[offset + 1] = color[1];
      pixels[offset + 2] = color[2];
      pixels[offset + 3] = 255;
    }
  }

  return downsample(pixels, big, size);
}

function downsample(pixels, big, size) {
  const out = new Uint8Array(size * size * 4);

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      let r = 0;
      let g = 0;
      let b = 0;

      for (let dy = 0; dy < SCALE; dy += 1) {
        for (let dx = 0; dx < SCALE; dx += 1) {
          const offset = ((y * SCALE + dy) * big + (x * SCALE + dx)) * 4;
          r += pixels[offset];
          g += pixels[offset + 1];
          b += pixels[offset + 2];
        }
      }

      const samples = SCALE * SCALE;
      const offset = (y * size + x) * 4;
      out[offset] = Math.round(r / samples);
      out[offset + 1] = Math.round(g / samples);
      out[offset + 2] = Math.round(b / samples);
      out[offset + 3] = 255;
    }
  }

  return out;
}

const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k += 1) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  return c >>> 0;
});

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc = CRC_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);

  const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));

  return Buffer.concat([length, body, crc]);
}

function encodePng(pixels, size) {
  const header = Buffer.alloc(13);
  header.writeUInt32BE(size, 0);
  header.writeUInt32BE(size, 4);
  header[8] = 8; // bit depth
  header[9] = 6; // colour type: RGBA
  header[10] = 0; // deflate
  header[11] = 0; // adaptive filtering
  header[12] = 0; // no interlace

  // Each scanline is prefixed with its filter type (0 = none).
  const stride = size * 4;
  const raw = Buffer.alloc((stride + 1) * size);
  for (let y = 0; y < size; y += 1) {
    raw[y * (stride + 1)] = 0;
    Buffer.from(pixels.buffer, y * stride, stride).copy(raw, y * (stride + 1) + 1);
  }

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", header),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

const ICONS = [
  { path: "public/icon-192.png", size: 192, pattern: PATTERN_4, padding: 0.12 },
  { path: "public/icon-512.png", size: 512, pattern: PATTERN_4, padding: 0.12 },
  // Android crops maskable icons to a circle-ish shape, so keep well inside.
  { path: "public/icon-maskable-512.png", size: 512, pattern: PATTERN_4, padding: 0.22 },
  { path: "app/apple-icon.png", size: 180, pattern: PATTERN_4, padding: 0.12 },
  { path: "app/icon.png", size: 32, pattern: PATTERN_3, padding: 0.12 },
];

for (const { path, size, pattern, padding } of ICONS) {
  const file = resolve(ROOT, path);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, encodePng(drawIcon(size, pattern, padding), size));
  console.log(`wrote ${path} (${size}x${size})`);
}
