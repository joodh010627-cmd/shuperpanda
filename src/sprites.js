// Pixel art sprite renderer using Canvas primitives
// Each character is drawn on a pixel grid (1 "dot" = P pixels)
const P = 3; // pixel scale

function px(ctx, x, y, w, h, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x * P, y * P, w * P, h * P);
}

// ============================================================
// SUPER PANDA SPRITE
// ============================================================
export function drawPanda(ctx, x, y, facing, state, frame, gauge) {
  ctx.save();
  ctx.translate(Math.round(x), Math.round(y));
  if (facing === -1) ctx.scale(-1, 1);

  const f = Math.floor(frame);
  const bob = (state === 'idle') ? Math.sin(f * 0.15) * 1.5 : 0;

  switch (state) {
    case 'idle': _pandaIdle(ctx, bob); break;
    case 'walk': _pandaWalk(ctx, f); break;
    case 'jump': _pandaJump(ctx); break;
    case 'punch': _pandaPunch(ctx, f); break;
    case 'kick': _pandaKick(ctx, f); break;
    case 'block': _pandaBlock(ctx); break;
    case 'dash': _pandaDash(ctx); break;
    case 'hit': _pandaHit(ctx, f); break;
    case 'ko': _pandaKO(ctx); break;
    case 'laser': _pandaLaser(ctx, f); break;
    default: _pandaIdle(ctx, 0);
  }
  ctx.restore();
}

function _pandaBase(ctx, offY = 0) {
  const o = Math.round(offY);
  // Ears
  px(ctx, -7, -30 + o, 3, 3, '#1a1a2e');
  px(ctx, 4, -30 + o, 3, 3, '#1a1a2e');
  px(ctx, -6, -29 + o, 1, 1, '#555');
  px(ctx, 5, -29 + o, 1, 1, '#555');
  // Hair
  px(ctx, -5, -28 + o, 10, 3, '#1a1a2e');
  px(ctx, -6, -26 + o, 12, 2, '#1a1a2e');
  // Hair ribbon
  px(ctx, 4, -28 + o, 2, 2, '#ef4444');
  // Face (white)
  px(ctx, -5, -24 + o, 10, 7, '#ffffff');
  // Eye patches
  px(ctx, -4, -23 + o, 3, 3, '#1a1a2e');
  px(ctx, 1, -23 + o, 3, 3, '#1a1a2e');
  // Eyes (white pupils)
  px(ctx, -3, -22 + o, 1, 1, '#ffffff');
  px(ctx, 2, -22 + o, 1, 1, '#ffffff');
  // Blush
  px(ctx, -5, -20 + o, 2, 1, '#fca5a5');
  px(ctx, 3, -20 + o, 2, 1, '#fca5a5');
  // Nose
  px(ctx, -1, -20 + o, 2, 1, '#333');
  // Mouth
  px(ctx, -1, -19 + o, 2, 1, '#e11d48');
  // Neck
  px(ctx, -2, -17 + o, 4, 1, '#fde68a');
}

function _pandaBody(ctx, offY = 0) {
  const o = Math.round(offY);
  // Cape (behind)
  px(ctx, 5, -16 + o, 4, 14, '#dc2626');
  px(ctx, 6, -14 + o, 4, 16, '#b91c1c');
  // Body - blue top
  px(ctx, -5, -16 + o, 10, 7, '#2563eb');
  px(ctx, -4, -15 + o, 2, 2, '#1d4ed8'); // shadow
  // S logo
  px(ctx, -2, -14 + o, 4, 3, '#fbbf24');
  px(ctx, -1, -14 + o, 2, 1, '#f59e0b');
  // Belt
  px(ctx, -5, -9 + o, 10, 1, '#fbbf24');
  // Red skirt
  px(ctx, -6, -8 + o, 12, 4, '#dc2626');
  px(ctx, -7, -6 + o, 14, 2, '#dc2626');
}

function _pandaLegs(ctx, offY = 0, spread = 0) {
  const o = Math.round(offY);
  const s = Math.round(spread);
  // Legs
  px(ctx, -3 - s, -4 + o, 3, 5, '#fde68a');
  px(ctx, 1 + s, -4 + o, 3, 5, '#fde68a');
  // Boots
  px(ctx, -4 - s, 1 + o, 4, 3, '#dc2626');
  px(ctx, 1 + s, 1 + o, 4, 3, '#dc2626');
}

function _pandaIdle(ctx, bob) {
  _pandaBase(ctx, bob);
  _pandaBody(ctx, bob);
  _pandaLegs(ctx, bob);
  // Arms
  px(ctx, -7, -15 + Math.round(bob), 2, 6, '#fde68a');
  px(ctx, 5, -15 + Math.round(bob), 2, 6, '#fde68a');
}

function _pandaWalk(ctx, f) {
  const legOff = Math.sin(f * 0.5) * 2;
  _pandaBase(ctx, 0);
  _pandaBody(ctx, 0);
  // Walking legs
  px(ctx, -3, -4, 3, 5, '#fde68a');
  px(ctx, 1, -4, 3, 5, '#fde68a');
  px(ctx, -4 + Math.round(legOff), 1, 4, 3, '#dc2626');
  px(ctx, 1 - Math.round(legOff), 1, 4, 3, '#dc2626');
  // Arms swing
  px(ctx, -7, -15 + Math.round(legOff), 2, 6, '#fde68a');
  px(ctx, 5, -15 - Math.round(legOff), 2, 6, '#fde68a');
}

function _pandaJump(ctx) {
  _pandaBase(ctx, -2);
  _pandaBody(ctx, -2);
  // Legs tucked
  px(ctx, -3, -4, 3, 4, '#fde68a');
  px(ctx, 1, -4, 3, 4, '#fde68a');
  px(ctx, -4, 0, 4, 2, '#dc2626');
  px(ctx, 1, 0, 4, 2, '#dc2626');
  // Arms up
  px(ctx, -8, -20, 2, 6, '#fde68a');
  px(ctx, 6, -20, 2, 6, '#fde68a');
}

function _pandaPunch(ctx, f) {
  _pandaBase(ctx, 0);
  _pandaBody(ctx, 0);
  _pandaLegs(ctx, 0, 1);
  // Left arm back
  px(ctx, -7, -14, 2, 5, '#fde68a');
  // Right arm extended (PUNCH!)
  if (f < 3) {
    px(ctx, 5, -14, 8, 3, '#fde68a');
    // Fist
    px(ctx, 12, -14, 3, 3, '#fde68a');
    px(ctx, 13, -14, 2, 3, '#ffffff');
  } else {
    px(ctx, 5, -14, 2, 5, '#fde68a');
  }
}

function _pandaKick(ctx, f) {
  _pandaBase(ctx, 0);
  _pandaBody(ctx, 0);
  // Standing leg
  px(ctx, -3, -4, 3, 5, '#fde68a');
  px(ctx, -4, 1, 4, 3, '#dc2626');
  // Kicking leg
  if (f < 4) {
    px(ctx, 2, -6, 10, 3, '#fde68a');
    px(ctx, 10, -6, 4, 3, '#dc2626');
  } else {
    px(ctx, 1, -4, 3, 5, '#fde68a');
    px(ctx, 1, 1, 4, 3, '#dc2626');
  }
  // Arms
  px(ctx, -7, -14, 2, 5, '#fde68a');
  px(ctx, 5, -14, 2, 5, '#fde68a');
}

function _pandaBlock(ctx) {
  _pandaBase(ctx, 0);
  _pandaBody(ctx, 0);
  _pandaLegs(ctx, 0, 2);
  // Arms crossed in front
  px(ctx, -3, -16, 8, 3, '#fde68a');
  px(ctx, -2, -14, 6, 2, '#fde68a');
  // Shield glow
  px(ctx, -4, -18, 10, 8, 'rgba(59, 130, 246, 0.25)');
}

function _pandaDash(ctx) {
  _pandaBase(ctx, 0);
  _pandaBody(ctx, 0);
  _pandaLegs(ctx, 0);
  // Speed lines
  for (let i = 0; i < 3; i++) {
    px(ctx, -12 - i * 3, -20 + i * 6, 4, 1, 'rgba(255,255,255,0.5)');
  }
  // Arms back
  px(ctx, -8, -12, 2, 5, '#fde68a');
  px(ctx, -10, -10, 2, 5, '#fde68a');
}

function _pandaHit(ctx, f) {
  const shake = (f % 2 === 0) ? 2 : -2;
  ctx.translate(shake, 0);
  _pandaBase(ctx, 2);
  _pandaBody(ctx, 2);
  _pandaLegs(ctx, 2);
  // Arms flinch
  px(ctx, -8, -12, 2, 4, '#fde68a');
  px(ctx, 6, -12, 2, 4, '#fde68a');
  // Pain expression override
  px(ctx, -3, -22, 1, 1, '#fde68a'); // close eyes
  px(ctx, 2, -22, 1, 1, '#fde68a');
  px(ctx, -1, -19, 3, 2, '#1a1a2e'); // open mouth
}

function _pandaKO(ctx) {
  // Lying on the ground
  ctx.translate(0, 24);
  // Body flat
  px(ctx, -12, -8, 24, 6, '#2563eb');
  px(ctx, -14, -6, 28, 3, '#dc2626');
  // Head
  px(ctx, -16, -12, 8, 8, '#ffffff');
  px(ctx, -15, -11, 2, 2, '#1a1a2e');
  px(ctx, -12, -11, 2, 2, '#1a1a2e');
  // Legs
  px(ctx, 10, -6, 6, 3, '#fde68a');
  px(ctx, 15, -6, 4, 3, '#dc2626');
  // X eyes
  px(ctx, -14, -10, 1, 1, '#ef4444');
  px(ctx, -11, -10, 1, 1, '#ef4444');
  // Dizzy stars
  const t = performance.now() * 0.005;
  for (let i = 0; i < 3; i++) {
    const sx = Math.cos(t + i * 2.1) * 15;
    const sy = -18 + Math.sin(t + i * 2.1) * 4;
    px(ctx, Math.round(sx), Math.round(sy), 2, 2, '#fbbf24');
  }
}

function _pandaLaser(ctx, f) {
  _pandaBase(ctx, 0);
  // Glowing eyes
  px(ctx, -4, -23, 3, 3, '#ef4444');
  px(ctx, 1, -23, 3, 3, '#ef4444');
  px(ctx, -3, -22, 1, 1, '#fbbf24');
  px(ctx, 2, -22, 1, 1, '#fbbf24');
  _pandaBody(ctx, 0);
  _pandaLegs(ctx, 0, 1);
  px(ctx, -7, -16, 2, 6, '#fde68a');
  px(ctx, 5, -16, 2, 6, '#fde68a');

  // LASER BEAM
  if (f >= 2 && f < 20) {
    const beamW = 300;
    const flicker = Math.sin(f * 2) * 1;
    // Outer glow
    ctx.fillStyle = 'rgba(239, 68, 68, 0.3)';
    ctx.fillRect(4 * P, (-23 + flicker) * P, beamW, 5 * P);
    // Inner beam
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(4 * P, (-22 + flicker) * P, beamW, 3 * P);
    // Core
    ctx.fillStyle = '#fbbf24';
    ctx.fillRect(4 * P, (-21 + flicker) * P, beamW, 1 * P);
  }
}

// ============================================================
// FROG MANAGER SPRITE (bigger boss)
// ============================================================
export function drawFrog(ctx, x, y, facing, state, frame) {
  ctx.save();
  ctx.translate(Math.round(x), Math.round(y));
  if (facing === -1) ctx.scale(-1, 1);

  const f = Math.floor(frame);

  switch (state) {
    case 'idle': _frogIdle(ctx, f); break;
    case 'walk': _frogWalk(ctx, f); break;
    case 'jump': _frogJump(ctx); break;
    case 'clap': _frogClap(ctx, f); break;
    case 'tongue': _frogTongue(ctx, f); break;
    case 'stomp': _frogStomp(ctx, f); break;
    case 'hit': _frogHit(ctx, f); break;
    case 'ko': _frogKO(ctx); break;
    default: _frogIdle(ctx, 0);
  }
  ctx.restore();
}

function _frogBase(ctx, offY = 0) {
  const o = Math.round(offY);
  // Head
  px(ctx, -8, -36 + o, 16, 10, '#22c55e');
  px(ctx, -9, -32 + o, 18, 6, '#22c55e');
  // Darker green patches
  px(ctx, -7, -34 + o, 4, 3, '#16a34a');
  px(ctx, 3, -34 + o, 4, 3, '#16a34a');
  // Eyes (bulging)
  px(ctx, -7, -38 + o, 5, 4, '#ffffff');
  px(ctx, 3, -38 + o, 5, 4, '#ffffff');
  px(ctx, -5, -37 + o, 2, 2, '#1a1a2e');
  px(ctx, 5, -37 + o, 2, 2, '#1a1a2e');
  // Mouth
  px(ctx, -7, -27 + o, 14, 2, '#166534');
  px(ctx, -6, -27 + o, 12, 1, '#15803d');
}

function _frogBody(ctx, offY = 0) {
  const o = Math.round(offY);
  // Suit jacket (black)
  px(ctx, -9, -26 + o, 18, 14, '#1a1a2e');
  px(ctx, -10, -24 + o, 20, 10, '#1a1a2e');
  // Shirt (white inside)
  px(ctx, -3, -25 + o, 6, 8, '#e5e7eb');
  // Tie
  px(ctx, -1, -25 + o, 2, 7, '#991b1b');
  // Belt
  px(ctx, -9, -12 + o, 18, 1, '#374151');
  // Pants
  px(ctx, -8, -11 + o, 16, 6, '#1f2937');
}

function _frogLegs(ctx, offY = 0, spread = 0) {
  const o = Math.round(offY);
  const s = Math.round(spread);
  // Legs (green)
  px(ctx, -6 - s, -5 + o, 5, 6, '#22c55e');
  px(ctx, 2 + s, -5 + o, 5, 6, '#22c55e');
  // Shoes
  px(ctx, -7 - s, 1 + o, 6, 3, '#1a1a2e');
  px(ctx, 2 + s, 1 + o, 6, 3, '#1a1a2e');
}

function _frogArms(ctx, offY = 0) {
  const o = Math.round(offY);
  px(ctx, -12, -24 + o, 3, 10, '#22c55e');
  px(ctx, -12, -15 + o, 4, 3, '#22c55e');
  px(ctx, 9, -24 + o, 3, 10, '#22c55e');
  px(ctx, 9, -15 + o, 4, 3, '#22c55e');
}

function _frogIdle(ctx, f) {
  const bob = Math.sin(f * 0.12) * 1;
  _frogBase(ctx, bob);
  _frogBody(ctx, bob);
  _frogLegs(ctx, 0);
  _frogArms(ctx, bob);
}

function _frogWalk(ctx, f) {
  const legOff = Math.sin(f * 0.4) * 2;
  _frogBase(ctx, 0);
  _frogBody(ctx, 0);
  px(ctx, -6 + Math.round(legOff), -5, 5, 6, '#22c55e');
  px(ctx, 2 - Math.round(legOff), -5, 5, 6, '#22c55e');
  px(ctx, -7 + Math.round(legOff), 1, 6, 3, '#1a1a2e');
  px(ctx, 2 - Math.round(legOff), 1, 6, 3, '#1a1a2e');
  _frogArms(ctx, 0);
}

function _frogJump(ctx) {
  _frogBase(ctx, -4);
  _frogBody(ctx, -4);
  // Legs tucked
  px(ctx, -6, -7, 5, 4, '#22c55e');
  px(ctx, 2, -7, 5, 4, '#22c55e');
  px(ctx, -5, -3, 4, 2, '#1a1a2e');
  px(ctx, 2, -3, 4, 2, '#1a1a2e');
  // Arms raised
  px(ctx, -13, -30, 3, 10, '#22c55e');
  px(ctx, 10, -30, 3, 10, '#22c55e');
}

function _frogClap(ctx, f) {
  _frogBase(ctx, 0);
  _frogBody(ctx, 0);
  _frogLegs(ctx, 0, 2);

  if (f < 4) {
    // Arms wide
    px(ctx, -16, -24, 4, 8, '#22c55e');
    px(ctx, 12, -24, 4, 8, '#22c55e');
  } else {
    // Arms clapping
    px(ctx, -4, -22, 3, 6, '#22c55e');
    px(ctx, 1, -22, 3, 6, '#22c55e');
    // Shockwave
    if (f < 12) {
      const sw = (f - 4) * 15;
      const alpha = 1 - (f - 4) / 8;
      ctx.fillStyle = `rgba(250, 204, 21, ${alpha * 0.6})`;
      ctx.fillRect(4 * P, -28 * P, sw, 16 * P);
      ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.4})`;
      ctx.fillRect(4 * P, -24 * P, sw, 8 * P);
    }
  }
}

function _frogTongue(ctx, f) {
  _frogBase(ctx, 0);
  _frogBody(ctx, 0);
  _frogLegs(ctx, 0);
  _frogArms(ctx, 0);

  // Tongue extending
  if (f >= 2 && f < 15) {
    const tongueLen = Math.min((f - 2) * 25, 250);
    // Mouth open
    px(ctx, -6, -27, 12, 4, '#166534');
    // Tongue
    ctx.fillStyle = '#f87171';
    ctx.fillRect(5 * P, -26 * P, tongueLen, 2 * P);
    // Tongue tip
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(5 * P + tongueLen - 8, -27 * P, 8, 4 * P);
  }
}

function _frogStomp(ctx, f) {
  if (f < 5) {
    // Rising
    _frogJump(ctx);
  } else if (f < 8) {
    // Coming down
    _frogBase(ctx, 4);
    _frogBody(ctx, 4);
    // Legs spread for stomp
    px(ctx, -8, -3, 6, 5, '#22c55e');
    px(ctx, 3, -3, 6, 5, '#22c55e');
    px(ctx, -9, 2, 7, 3, '#1a1a2e');
    px(ctx, 3, 2, 7, 3, '#1a1a2e');
    px(ctx, -13, -26, 3, 8, '#22c55e');
    px(ctx, 10, -26, 3, 8, '#22c55e');
  } else {
    // Impact
    _frogBase(ctx, 2);
    _frogBody(ctx, 2);
    _frogLegs(ctx, 2);
    _frogArms(ctx, 2);
    // Ground shockwave
    if (f < 15) {
      const radius = (f - 8) * 12;
      const alpha = 1 - (f - 8) / 7;
      ctx.fillStyle = `rgba(234, 179, 8, ${alpha * 0.5})`;
      ctx.fillRect(-radius, 2 * P, radius * 2, 4 * P);
    }
  }
}

function _frogHit(ctx, f) {
  const shake = (f % 2 === 0) ? 3 : -3;
  ctx.translate(shake, 0);
  _frogBase(ctx, 2);
  // Pain face
  px(ctx, -5, -37, 2, 1, '#22c55e'); // eyes shut
  px(ctx, 5, -37, 2, 1, '#22c55e');
  px(ctx, -5, -27, 10, 3, '#166534'); // mouth open
  _frogBody(ctx, 2);
  _frogLegs(ctx, 2);
  // Arms flinch
  px(ctx, -11, -20, 3, 6, '#22c55e');
  px(ctx, 9, -20, 3, 6, '#22c55e');
}

function _frogKO(ctx) {
  // Lying on the ground
  ctx.translate(0, 24);
  // Body flat
  px(ctx, -14, -10, 28, 8, '#1a1a2e');
  px(ctx, -10, -8, 20, 4, '#e5e7eb');
  // Head
  px(ctx, -20, -14, 10, 10, '#22c55e');
  px(ctx, -18, -16, 4, 3, '#ffffff');
  px(ctx, -13, -16, 4, 3, '#ffffff');
  // X eyes
  px(ctx, -17, -15, 1, 1, '#ef4444');
  px(ctx, -12, -15, 1, 1, '#ef4444');
  // Legs
  px(ctx, 12, -8, 6, 4, '#22c55e');
  px(ctx, 16, -6, 5, 3, '#1a1a2e');
  // Dizzy stars
  const t = performance.now() * 0.004;
  for (let i = 0; i < 3; i++) {
    const sx = -15 + Math.cos(t + i * 2.1) * 18;
    const sy = -22 + Math.sin(t + i * 2.1) * 4;
    px(ctx, Math.round(sx), Math.round(sy), 2, 2, '#fbbf24');
  }
}

// ============================================================
// HIT EFFECT
// ============================================================
export function drawHitEffect(ctx, x, y, frame) {
  const size = frame * 4;
  const alpha = 1 - frame / 8;
  if (alpha <= 0) return;
  ctx.save();
  ctx.translate(x, y);
  ctx.globalAlpha = alpha;
  // Starburst
  for (let i = 0; i < 6; i++) {
    const angle = (i / 6) * Math.PI * 2 + frame * 0.3;
    const ex = Math.cos(angle) * size;
    const ey = Math.sin(angle) * size;
    ctx.fillStyle = '#fbbf24';
    ctx.fillRect(ex - 3, ey - 3, 6, 6);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(ex - 1, ey - 1, 2, 2);
  }
  ctx.globalAlpha = 1;
  ctx.restore();
}
