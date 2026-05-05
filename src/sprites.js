// Image-based sprite renderer
// Sprites are extracted from sprite sheet images with chroma key (#00ff00) removal
import { assets } from './assetLoader.js';

const PANDA_STATE_MAP = {
  idle: 11, walk: 12, jump: 13,
  block: 17, punch: 15, kick: 16,
  hit: 18, laser: 19, ko: 20,
  dash: 14,
};

const FROG_STATE_MAP = {
  idle: 1, walk: 2, jump: 3,
  stomp: 6, tongue: 5, clap: 4,
  hit: 7, ko: 10,
};

// Cache for processed (chroma-keyed) sprites
const spriteCache = {};

function getProcessedSprite(imageNum) {
  const cacheKey = `image_${imageNum}`;
  if (spriteCache[cacheKey]) return spriteCache[cacheKey];

  const img = assets.get(cacheKey);
  if (!img || !img.width || !img.height) return null;

  try {
    const w = img.width;
    const h = img.height;
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');

    ctx.drawImage(img, 0, 0);

    const imageData = ctx.getImageData(0, 0, w, h);
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i], g = data[i + 1], b = data[i + 2];
      const isChromaGreen = g > 150 && (g - r) > 80 && (g - b) > 80;
      const isBrightChroma = g > 200 && r < 80 && b < 80;
      
      if (isBrightChroma) {
        data[i + 3] = 0;
      } else if (isChromaGreen) {
        const greenness = Math.min(1, ((g - Math.max(r, b)) - 40) / 120);
        data[i + 3] = Math.round((1 - greenness) * data[i + 3]);
      }
    }
    ctx.putImageData(imageData, 0, 0);

    spriteCache[cacheKey] = canvas;
    return canvas;
  } catch (e) {
    console.error('Sprite processing error:', e);
    return null;
  }
}

// ============================================================
// SUPER PANDA SPRITE (image-based)
// ============================================================
export function drawPanda(ctx, x, y, facing, state, frame, gauge) {
  const imageNum = PANDA_STATE_MAP[state] ?? 11;
  const sprite = getProcessedSprite(imageNum);

  if (!sprite) {
    ctx.fillStyle = '#2563eb';
    ctx.fillRect(x - 20, y - 50, 40, 50);
    return;
  }

  const idleSprite = getProcessedSprite(PANDA_STATE_MAP.idle);
  const baseH = (idleSprite && idleSprite.height > 0) ? idleSprite.height : sprite.height;
  
  const targetDrawH = 210;
  const scale = targetDrawH / baseH;

  const drawW = sprite.width * scale;
  const drawH = sprite.height * scale;

  ctx.save();
  ctx.translate(Math.round(x), Math.round(y));

  if (facing === -1) ctx.scale(-1, 1);

  const f = Math.floor(frame);
  let bobY = 0;
  if (state === 'idle') bobY = Math.sin(f * 0.08) * 3;
  if (state === 'hit') ctx.translate((f % 2 === 0) ? 3 : -3, 0);

  if (state === 'dash') {
    ctx.globalAlpha = 0.4;
    for (let i = 1; i <= 3; i++) {
      ctx.drawImage(sprite, -drawW / 2 - i * 18, -drawH + bobY + 2, drawW * 0.8, drawH * 0.8);
    }
    ctx.globalAlpha = 1;
  }

  ctx.drawImage(sprite, -drawW / 2, -drawH + bobY, drawW, drawH);

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
  const imageNum = FROG_STATE_MAP[state] ?? 1;
  const sprite = getProcessedSprite(imageNum);

  if (!sprite) {
    ctx.fillStyle = '#22c55e';
    ctx.fillRect(x - 30, y - 70, 60, 70);
    return;
  }

  const idleSprite = getProcessedSprite(FROG_STATE_MAP.idle);
  const baseH = (idleSprite && idleSprite.height > 0) ? idleSprite.height : sprite.height;
  
  const targetDrawH = 270;
  const scale = targetDrawH / baseH;

  const drawW = sprite.width * scale;
  const drawH = sprite.height * scale;

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
