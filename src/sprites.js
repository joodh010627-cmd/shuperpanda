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

const sheetFramesCache = {};

function extractFrames(sheet) {
  if (!sheet || !sheet.width || !sheet.height) return [];

  const cacheKey = `${sheet.src || 'unknown'}_cc`;
  if (sheetFramesCache[cacheKey]) return sheetFramesCache[cacheKey];

  try {
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, sheet.width);
    canvas.height = Math.max(1, sheet.height);
    const ctx = canvas.getContext('2d');
    ctx.drawImage(sheet, 0, 0);
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imgData.data;
    const width = canvas.width;
    const height = canvas.height;

    function isGreen(x, y) {
      if (x < 0 || x >= width || y < 0 || y >= height) return true;
      const i = (y * width + x) * 4;
      const r = data[i], g = data[i+1], b = data[i+2];
      return g > 150 && (g - r) > 80 && (g - b) > 80;
    }

    const visited = new Uint8Array(width * height);
    let rects = [];

    // Find connected components
    for (let y = 0; y < height; y += 2) {
      for (let x = 0; x < width; x += 2) {
        const idx = y * width + x;
        if (!visited[idx] && !isGreen(x, y)) {
          let minX = x, maxX = x, minY = y, maxY = y;
          const stack = [x, y];
          visited[idx] = 1;

          while (stack.length > 0) {
            const cy = stack.pop();
            const cx = stack.pop();

            if (cx < minX) minX = cx;
            if (cx > maxX) maxX = cx;
            if (cy < minY) minY = cy;
            if (cy > maxY) maxY = cy;

            const neighbors = [cx-2, cy, cx+2, cy, cx, cy-2, cx, cy+2, cx-1, cy, cx+1, cy, cx, cy-1, cx, cy+1];
            for (let i = 0; i < neighbors.length; i += 2) {
              const nx = neighbors[i];
              const ny = neighbors[i+1];
              if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                const nidx = ny * width + nx;
                if (!visited[nidx] && !isGreen(nx, ny)) {
                  visited[nidx] = 1;
                  stack.push(nx, ny);
                }
              }
            }
          }

          if (maxX - minX > 20 && maxY - minY > 20) {
            rects.push({ x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1 });
          }
        }
      }
    }

    // Merge nearby rects (handle detached parts like floating stars)
    let merged = true;
    while (merged) {
      merged = false;
      for (let i = 0; i < rects.length; i++) {
        for (let j = i + 1; j < rects.length; j++) {
          const r1 = rects[i];
          const r2 = rects[j];
          const distX = Math.max(0, Math.max(r1.x - (r2.x + r2.w), r2.x - (r1.x + r1.w)));
          const distY = Math.max(0, Math.max(r1.y - (r2.y + r2.h), r2.y - (r1.y + r1.h)));
          
          if (distX <= 30 && distY <= 30) {
            const nx = Math.min(r1.x, r2.x);
            const ny = Math.min(r1.y, r2.y);
            const nw = Math.max(r1.x + r1.w, r2.x + r2.w) - nx;
            const nh = Math.max(r1.y + r1.h, r2.y + r2.h) - ny;
            rects[i] = { x: nx, y: ny, w: nw, h: nh };
            rects.splice(j, 1);
            merged = true;
            break;
          }
        }
        if (merged) break;
      }
    }

    // Sort by row (y tolerance) then column (x)
    rects.sort((a, b) => {
      if (Math.abs(a.y - b.y) < 100) return a.x - b.x;
      return a.y - b.y;
    });

    sheetFramesCache[cacheKey] = rects;
    return rects;
  } catch (e) {
    console.error('Sprite extraction error:', e);
    return [];
  }
}

function getProcessedSprite(sheetKey, index) {
  const cacheKey = `${sheetKey}_${index}`;
  if (spriteCache[cacheKey]) return spriteCache[cacheKey];

  const sheet = assets.get(sheetKey);
  if (!sheet || !sheet.width || !sheet.height) return null;

  const frames = extractFrames(sheet);
  
  let frame;
  if (frames.length > 0) {
    frame = frames[Math.min(index, frames.length - 1)];
  } else {
    frame = { x: 0, y: 0, w: Math.max(1, sheet.width/3), h: Math.max(1, sheet.height/3) };
  }

  try {
    const w = Math.max(1, frame.w);
    const h = Math.max(1, frame.h);
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');

    ctx.drawImage(sheet, frame.x, frame.y, w, h, 0, 0, w, h);

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
  const index = PANDA_STATE_MAP[state] ?? 0;
  const sprite = getProcessedSprite('panda_sprites', index);

  if (!sprite) {
    ctx.fillStyle = '#2563eb';
    ctx.fillRect(x - 20, y - 50, 40, 50);
    return;
  }

  const sheet = assets.get('panda_sprites');
  const baseCellH = (sheet && sheet.height > 0) ? sheet.height / PANDA_ROWS : 341;
  const targetDrawH = 210; // fixed display height scaling reference
  const scale = targetDrawH / baseCellH;

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
  const index = FROG_STATE_MAP[state] ?? 0;
  const sprite = getProcessedSprite('frog_sprites', index);

  if (!sprite) {
    ctx.fillStyle = '#22c55e';
    ctx.fillRect(x - 30, y - 70, 60, 70);
    return;
  }

  const sheet = assets.get('frog_sprites');
  const baseCellH = (sheet && sheet.height > 0) ? sheet.height / FROG_ROWS : 341;
  const targetDrawH = 270; // fixed display height scaling reference
  const scale = targetDrawH / baseCellH;

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
