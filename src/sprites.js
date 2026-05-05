// Image-based sprite renderer
// Sprites are extracted from sprite sheet images with chroma key (#00ff00) removal
import { assets } from './assetLoader.js';

// Panda sprite sheet layout: 3x3 grid
// Row 0: idle(0), walk(1), jump(2)
// Row 1: punch(3), kick(4), block(5)
// Row 2: hit(6), laser(7), ko(8)
const PANDA_COLS = 3;
const PANDA_ROWS = 3;

// Frog sprite sheet layout: 3x3 grid
// Row 0: idle(0), walk(1), clap(2)
// Row 1: tongue(3), stomp(4), hit(5)  
// Row 2: idle2(6), hurt_fallen(7), ko(8)
const FROG_COLS = 3;
const FROG_ROWS = 3;

const PANDA_STATE_MAP = {
  idle: 0, walk: 1, jump: 2,
  punch: 3, kick: 4, block: 5,
  hit: 6, laser: 7, ko: 8,
  dash: 1, // reuse walk for dash
};

const FROG_STATE_MAP = {
  idle: 0, walk: 1, jump: 1,  // reuse walk for jump
  clap: 2, tongue: 3, stomp: 4,
  hit: 5, ko: 8,
};

// Cache for processed (chroma-keyed) sprites
const spriteCache = {};

function getProcessedSprite(sheetKey, index, cols, rows) {
  const cacheKey = `${sheetKey}_${index}`;
  if (spriteCache[cacheKey]) return spriteCache[cacheKey];

  const sheet = assets.get(sheetKey);
  if (!sheet) return null;

  const cellW = Math.floor(sheet.width / cols);
  const cellH = Math.floor(sheet.height / rows);
  const col = index % cols;
  const row = Math.floor(index / cols);

  // Create offscreen canvas for chroma key removal
  const canvas = document.createElement('canvas');
  canvas.width = cellW;
  canvas.height = cellH;
  const ctx = canvas.getContext('2d');

  ctx.drawImage(sheet, col * cellW, row * cellH, cellW, cellH, 0, 0, cellW, cellH);

  // Chroma key removal (green screen)
  const imageData = ctx.getImageData(0, 0, cellW, cellH);
  const data = imageData.data;
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i], g = data[i + 1], b = data[i + 2];
    // Calculate how "green screen" this pixel is
    // Pure chroma green has very high G, very low R and B
    const isChromaGreen = g > 150 && (g - r) > 80 && (g - b) > 80;
    const isBrightChroma = g > 200 && r < 80 && b < 80;
    
    if (isBrightChroma) {
      data[i + 3] = 0; // Fully transparent
    } else if (isChromaGreen) {
      // Semi-transparent for edge anti-aliasing
      const greenness = Math.min(1, ((g - Math.max(r, b)) - 40) / 120);
      data[i + 3] = Math.round((1 - greenness) * data[i + 3]);
    }
  }
  ctx.putImageData(imageData, 0, 0);

  spriteCache[cacheKey] = canvas;
  return canvas;
}

// ============================================================
// SUPER PANDA SPRITE (image-based)
// ============================================================
export function drawPanda(ctx, x, y, facing, state, frame, gauge) {
  const index = PANDA_STATE_MAP[state] ?? 0;
  const sprite = getProcessedSprite('panda_sprites', index, PANDA_COLS, PANDA_ROWS);

  if (!sprite) {
    // Fallback: draw a simple rectangle if image not loaded
    ctx.fillStyle = '#2563eb';
    ctx.fillRect(x - 20, y - 50, 40, 50);
    return;
  }

  const drawW = 140; // display width
  const drawH = 140; // display height

  ctx.save();
  ctx.translate(Math.round(x), Math.round(y));

  if (facing === -1) ctx.scale(-1, 1);

  // Idle bobbing
  const f = Math.floor(frame);
  let bobY = 0;
  if (state === 'idle') bobY = Math.sin(f * 0.08) * 3;
  if (state === 'hit') ctx.translate((f % 2 === 0) ? 3 : -3, 0);

  // Draw dash speed lines
  if (state === 'dash') {
    ctx.globalAlpha = 0.4;
    for (let i = 1; i <= 3; i++) {
      ctx.drawImage(sprite, -drawW / 2 - i * 18, -drawH + bobY + 2, drawW * 0.8, drawH * 0.8);
    }
    ctx.globalAlpha = 1;
  }

  ctx.drawImage(sprite, -drawW / 2, -drawH + bobY, drawW, drawH);

  // Laser beam effect
  if (state === 'laser' && f >= 2 && f < 20) {
    const beamW = 600;
    const flicker = Math.sin(f * 2) * 2;
    ctx.fillStyle = 'rgba(239, 68, 68, 0.3)';
    ctx.fillRect(20, -75 + flicker, beamW, 18);
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(20, -70 + flicker, beamW, 10);
    ctx.fillStyle = '#fbbf24';
    ctx.fillRect(20, -67 + flicker, beamW, 4);
  }

  ctx.restore();
}

// ============================================================
// FROG MANAGER SPRITE (image-based, bigger)
// ============================================================
export function drawFrog(ctx, x, y, facing, state, frame) {
  const index = FROG_STATE_MAP[state] ?? 0;
  const sprite = getProcessedSprite('frog_sprites', index, FROG_COLS, FROG_ROWS);

  if (!sprite) {
    ctx.fillStyle = '#22c55e';
    ctx.fillRect(x - 30, y - 70, 60, 70);
    return;
  }

  const drawW = 180; // boss is bigger
  const drawH = 180;

  ctx.save();
  ctx.translate(Math.round(x), Math.round(y));

  if (facing === -1) ctx.scale(-1, 1);

  const f = Math.floor(frame);
  let bobY = 0;
  if (state === 'idle') bobY = Math.sin(f * 0.07) * 2;
  if (state === 'hit') ctx.translate((f % 2 === 0) ? 4 : -4, 0);

  ctx.drawImage(sprite, -drawW / 2, -drawH + bobY, drawW, drawH);

  // Clap shockwave effect (overlay)
  if (state === 'clap' && f >= 4 && f < 12) {
    const sw = (f - 4) * 25;
    const alpha = 1 - (f - 4) / 8;
    ctx.fillStyle = `rgba(250, 204, 21, ${alpha * 0.5})`;
    ctx.fillRect(30, -100, sw, 60);
    ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.3})`;
    ctx.fillRect(30, -85, sw, 30);
  }

  // Tongue extension effect (overlay)
  if (state === 'tongue' && f >= 2 && f < 15) {
    const tongueLen = Math.min((f - 2) * 30, 300);
    ctx.fillStyle = '#f87171';
    ctx.fillRect(40, -90, tongueLen, 8);
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(40 + tongueLen, -86, 8, 0, Math.PI * 2);
    ctx.fill();
  }

  // Stomp ground shockwave
  if (state === 'stomp' && f >= 8 && f < 15) {
    const radius = (f - 8) * 18;
    const alpha = 1 - (f - 8) / 7;
    ctx.fillStyle = `rgba(234, 179, 8, ${alpha * 0.5})`;
    ctx.fillRect(-radius, -5, radius * 2, 12);
  }

  ctx.restore();
}

// ============================================================
// HIT EFFECT
// ============================================================
export function drawHitEffect(ctx, x, y, frame) {
  const size = frame * 5;
  const alpha = 1 - frame / 8;
  if (alpha <= 0) return;
  ctx.save();
  ctx.translate(x, y);
  ctx.globalAlpha = alpha;
  for (let i = 0; i < 6; i++) {
    const angle = (i / 6) * Math.PI * 2 + frame * 0.3;
    const ex = Math.cos(angle) * size;
    const ey = Math.sin(angle) * size;
    ctx.fillStyle = '#fbbf24';
    ctx.fillRect(ex - 4, ey - 4, 8, 8);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(ex - 2, ey - 2, 4, 4);
  }
  ctx.globalAlpha = 1;
  ctx.restore();
}
