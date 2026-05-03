import { CANVAS_W, CANVAS_H, GRAVITY, GROUND_Y, FRICTION, MOVE_SPEED, DASH_SPEED, DASH_DURATION, JUMP_POWER,
  PANDA_HP, PANDA_PUNCH_DMG, PANDA_KICK_DMG, PANDA_LASER_DMG, PANDA_PUNCH_RANGE, PANDA_KICK_RANGE,
  GAUGE_PER_HIT, MAX_GAUGE, FROG_HP, FROG_CLAP_DMG, FROG_TONGUE_DMG, FROG_STOMP_DMG, FROG_CLAP_RANGE, FROG_TONGUE_RANGE,
  BLOCK_REDUCTION, HITSTUN_FRAMES, KNOCKBACK_FORCE, INVINCIBLE_FRAMES, STAGE_LEFT, STAGE_RIGHT
} from '../constants.js';
import { drawPanda, drawFrog, drawHitEffect } from '../sprites.js';

export class BattleScene {
  constructor(game) {
    this.game = game;
    this.phase = 'intro'; // intro, fight, ko, victory, defeat
    this.phaseTimer = 0;
    this.shakeX = 0; this.shakeY = 0; this.shakeDur = 0;
    this.hitEffects = [];
    this.slowmo = 0;

    this.player = {
      x: 200, y: GROUND_Y, vx: 0, vy: 0, facing: 1,
      hp: PANDA_HP, maxHp: PANDA_HP, gauge: 0,
      state: 'idle', stateTimer: 0, animFrame: 0,
      hitstun: 0, invincible: 0, isGrounded: true,
      dashCooldown: 0, canAct: true
    };

    this.boss = {
      x: 750, y: GROUND_Y, vx: 0, vy: 0, facing: -1,
      hp: FROG_HP, maxHp: FROG_HP,
      state: 'idle', stateTimer: 0, animFrame: 0,
      hitstun: 0, invincible: 0, isGrounded: true,
      aiTimer: 90, aiState: 'idle', attackCooldown: 80,
      phase: 1, hasHitThisAttack: false
    };
  }

  update(input) {
    this.phaseTimer++;
    if (this.slowmo > 0) { this.slowmo--; if (this.phaseTimer % 3 !== 0) return; }
    if (this.shakeDur > 0) {
      this.shakeX = (Math.random() - 0.5) * this.shakeDur;
      this.shakeY = (Math.random() - 0.5) * this.shakeDur;
      this.shakeDur -= 0.5;
    } else { this.shakeX = 0; this.shakeY = 0; }

    this.hitEffects = this.hitEffects.filter(e => { e.frame++; return e.frame < 8; });

    switch (this.phase) {
      case 'intro': this._updateIntro(input); break;
      case 'fight': this._updateFight(input); break;
      case 'ko': this._updateKO(input); break;
      case 'victory': this._updateVictory(input); break;
      case 'defeat': this._updateDefeat(input); break;
    }
  }

  _updateIntro(input) {
    if (this.phaseTimer > 120) { this.phase = 'fight'; this.phaseTimer = 0; }
  }

  _updateFight(input) {
    this._handlePlayerInput(input);
    this._updateFighter(this.player);
    this._updateBossAI();
    this._updateFighter(this.boss);
    this._checkCombat();
    this._faceFighters();

    if (this.boss.hp <= 0) {
      this.boss.state = 'ko'; this.boss.stateTimer = 0;
      this.phase = 'ko'; this.phaseTimer = 0;
      this.game.sound.ko();
      this.shakeDur = 15; this.slowmo = 30;
    }
    if (this.player.hp <= 0) {
      this.player.state = 'ko'; this.player.stateTimer = 0;
      this.phase = 'defeat'; this.phaseTimer = 0;
      this.game.sound.ko();
      this.shakeDur = 15;
    }
  }

  _updateKO() {
    if (this.phaseTimer > 180) { this.phase = 'victory'; this.phaseTimer = 0; this.game.sound.victory(); }
  }

  _updateVictory(input) {
    if (this.phaseTimer > 120 && input.anyKeyPressed()) {
      this.game.switchScene('cutscene_stage2');
    }
  }

  _updateDefeat(input) {
    if (this.phaseTimer > 120 && input.anyKeyPressed()) {
      this.game.switchScene('title');
    }
  }

  _handlePlayerInput(input) {
    const p = this.player;
    if (p.hitstun > 0 || p.state === 'ko') return;

    const inAttack = ['punch','kick','laser','dash'].includes(p.state);
    if (inAttack && p.stateTimer < this._getAttackDuration(p.state)) return;

    // Movement
    if (!inAttack) {
      p.vx = 0;
      if (input.isDown('ArrowLeft')) { p.vx = -MOVE_SPEED; p.state = 'walk'; }
      else if (input.isDown('ArrowRight')) { p.vx = MOVE_SPEED; p.state = 'walk'; }
      else if (p.isGrounded && p.state !== 'block') { p.state = 'idle'; }
    }

    // Block
    if (input.isDown('ArrowDown') && p.isGrounded && !inAttack) {
      p.state = 'block'; p.vx = 0;
    } else if (p.state === 'block' && !input.isDown('ArrowDown')) {
      p.state = 'idle';
    }

    // Jump
    if (input.justPressed('ArrowUp') && p.isGrounded && !inAttack) {
      p.vy = -JUMP_POWER; p.isGrounded = false; p.state = 'jump';
    }

    // Dash
    if (p.dashCooldown <= 0 && p.isGrounded) {
      if (input.doubleTapped('ArrowLeft')) { p.vx = -DASH_SPEED; p.state = 'dash'; p.stateTimer = 0; p.dashCooldown = 30; p.invincible = DASH_DURATION; }
      if (input.doubleTapped('ArrowRight')) { p.vx = DASH_SPEED; p.state = 'dash'; p.stateTimer = 0; p.dashCooldown = 30; p.invincible = DASH_DURATION; }
    }

    // Attacks
    if (p.isGrounded || true) { // allow air attacks
      if (input.justPressed('KeyZ') && !inAttack) {
        p.state = 'punch'; p.stateTimer = 0; p.vx = 0; this.game.sound.punch();
      }
      if (input.justPressed('KeyX') && !inAttack) {
        p.state = 'kick'; p.stateTimer = 0; p.vx = 0; this.game.sound.kick();
      }
      if (input.justPressed('KeyC') && p.gauge >= MAX_GAUGE && !inAttack) {
        p.state = 'laser'; p.stateTimer = 0; p.vx = 0; p.gauge = 0; this.game.sound.laser();
      }
    }
  }

  _getAttackDuration(state) {
    switch (state) {
      case 'punch': return 12;
      case 'kick': return 18;
      case 'laser': return 30;
      case 'dash': return DASH_DURATION;
      case 'clap': return 16;
      case 'tongue': return 20;
      case 'stomp': return 22;
      default: return 0;
    }
  }

  _updateFighter(f) {
    // Gravity
    if (!f.isGrounded) { f.vy += GRAVITY; }
    f.x += f.vx; f.y += f.vy;

    // Ground
    if (f.y >= GROUND_Y) { f.y = GROUND_Y; f.vy = 0; f.isGrounded = true; if (f.state === 'jump') f.state = 'idle'; }
    else { f.isGrounded = false; }

    // Stage bounds
    f.x = Math.max(STAGE_LEFT, Math.min(STAGE_RIGHT, f.x));

    // Friction
    if (f.state !== 'dash' && f.state !== 'walk') { f.vx *= FRICTION; if (Math.abs(f.vx) < 0.3) f.vx = 0; }
    if (f.state === 'dash' && f.stateTimer >= DASH_DURATION) { f.vx *= 0.3; f.state = 'idle'; }

    // Timers
    f.stateTimer++;
    f.animFrame += 0.2;
    if (f.hitstun > 0) { f.hitstun--; if (f.hitstun <= 0 && f.state === 'hit') f.state = 'idle'; }
    if (f.invincible > 0) f.invincible--;
    if (f.dashCooldown > 0) f.dashCooldown--;

    // Reset attack state
    if (['punch','kick','laser','clap','tongue','stomp'].includes(f.state)) {
      if (f.stateTimer >= this._getAttackDuration(f.state)) { f.state = 'idle'; f.stateTimer = 0; }
    }
  }

  _faceFighters() {
    if (this.player.state !== 'dash' && this.player.hitstun <= 0) {
      this.player.facing = this.boss.x > this.player.x ? 1 : -1;
    }
    if (this.boss.hitstun <= 0 && !['clap','tongue','stomp'].includes(this.boss.state)) {
      this.boss.facing = this.player.x < this.boss.x ? -1 : 1;
    }
  }

  _checkCombat() {
    const p = this.player, b = this.boss;
    const dist = Math.abs(p.x - b.x);
    const pFacingBoss = (p.facing === 1 && b.x > p.x) || (p.facing === -1 && b.x < p.x);
    const bFacingPlayer = (b.facing === 1 && p.x > b.x) || (b.facing === -1 && p.x < b.x);

    // Player attacks boss
    if (p.state === 'punch' && p.stateTimer === 4 && dist < PANDA_PUNCH_RANGE && pFacingBoss) {
      this._dealDamage(b, PANDA_PUNCH_DMG, p.facing);
    }
    if (p.state === 'kick' && p.stateTimer === 6 && dist < PANDA_KICK_RANGE && pFacingBoss) {
      this._dealDamage(b, PANDA_KICK_DMG, p.facing);
    }
    if (p.state === 'laser' && p.stateTimer >= 6 && p.stateTimer <= 24 && p.stateTimer % 4 === 0 && pFacingBoss) {
      this._dealDamage(b, Math.floor(PANDA_LASER_DMG / 5), p.facing);
    }

    // Boss attacks player
    if (b.state === 'clap' && b.stateTimer === 6 && dist < FROG_CLAP_RANGE && bFacingPlayer && !b.hasHitThisAttack) {
      this._dealDamageToPlayer(FROG_CLAP_DMG, b.facing);
      b.hasHitThisAttack = true;
    }
    if (b.state === 'tongue' && b.stateTimer >= 5 && b.stateTimer <= 12 && b.stateTimer % 3 === 0 && dist < FROG_TONGUE_RANGE && bFacingPlayer && !b.hasHitThisAttack) {
      this._dealDamageToPlayer(FROG_TONGUE_DMG, b.facing);
      b.hasHitThisAttack = true;
    }
    if (b.state === 'stomp' && b.stateTimer === 10 && dist < 130 && b.isGrounded && !b.hasHitThisAttack) {
      this._dealDamageToPlayer(FROG_STOMP_DMG, b.facing);
      b.hasHitThisAttack = true;
    }
  }

  _dealDamage(target, dmg, fromFacing) {
    if (target.invincible > 0) return;
    target.hp = Math.max(0, target.hp - dmg);
    target.hitstun = HITSTUN_FRAMES;
    target.state = 'hit'; target.stateTimer = 0;
    target.vx = fromFacing * KNOCKBACK_FORCE;
    target.invincible = INVINCIBLE_FRAMES;
    this.game.sound.hit();
    this.hitEffects.push({ x: target.x, y: target.y - 40, frame: 0 });
    this.shakeDur = 4;
  }

  _dealDamageToPlayer(dmg, fromFacing) {
    const p = this.player;
    if (p.invincible > 0) return;
    let actualDmg = dmg;
    if (p.state === 'block') { actualDmg = Math.floor(dmg * BLOCK_REDUCTION); this.game.sound.block(); }
    else { this.game.sound.hit(); }
    p.hp = Math.max(0, p.hp - actualDmg);
    p.gauge = Math.min(MAX_GAUGE, p.gauge + GAUGE_PER_HIT);
    if (p.gauge >= MAX_GAUGE) this.game.sound.gaugeMax();
    if (p.state !== 'block') {
      p.hitstun = HITSTUN_FRAMES; p.state = 'hit'; p.stateTimer = 0;
      p.vx = fromFacing * KNOCKBACK_FORCE;
    }
    p.invincible = INVINCIBLE_FRAMES;
    this.hitEffects.push({ x: p.x, y: p.y - 40, frame: 0 });
    this.shakeDur = 5;
  }

  _updateBossAI() {
    const b = this.boss, p = this.player;
    if (b.hitstun > 0 || b.state === 'ko') return;
    if (['clap','tongue','stomp'].includes(b.state)) return;

    b.aiTimer--;
    if (b.attackCooldown > 0) b.attackCooldown--;
    if (b.hp <= b.maxHp * 0.5 && b.phase === 1) b.phase = 2;
    const cooldownMod = b.phase === 2 ? 0.6 : 1;
    const dist = Math.abs(p.x - b.x);

    if (b.attackCooldown <= 0 && b.isGrounded) {
      let attack = null;
      if (dist < 110) { attack = 'clap'; b.attackCooldown = Math.floor(70 * cooldownMod); }
      else if (dist < 260) { attack = Math.random() < 0.6 ? 'tongue' : 'stomp'; b.attackCooldown = Math.floor(80 * cooldownMod); }
      else { attack = 'stomp'; b.attackCooldown = Math.floor(75 * cooldownMod); }

      if (attack) {
        b.state = attack; b.stateTimer = 0; b.vx = 0; b.hasHitThisAttack = false;
        if (attack === 'clap') this.game.sound.clap();
        if (attack === 'tongue') this.game.sound.tongue();
        if (attack === 'stomp') { b.vy = -14; b.isGrounded = false; this.game.sound.stomp();
          b.x += b.facing * (dist * 0.4); // jump towards player
        }
        return;
      }
    }

    // Movement AI
    if (b.aiTimer <= 0) {
      b.aiTimer = 30 + Math.random() * 40;
      if (dist > 200) b.aiState = 'approach';
      else if (dist < 80) b.aiState = 'retreat';
      else b.aiState = Math.random() < 0.5 ? 'approach' : 'idle';
    }

    switch (b.aiState) {
      case 'approach':
        b.vx = b.facing * MOVE_SPEED * 0.7 * (b.phase === 2 ? 1.3 : 1);
        b.state = 'walk';
        break;
      case 'retreat':
        b.vx = -b.facing * MOVE_SPEED * 0.5;
        b.state = 'walk';
        break;
      default:
        b.vx = 0; b.state = 'idle';
    }
  }

  render(ctx) {
    ctx.save();
    ctx.translate(this.shakeX, this.shakeY);
    this._drawBackground(ctx);
    drawFrog(ctx, this.boss.x, this.boss.y, this.boss.facing, this.boss.state, this.boss.animFrame);
    drawPanda(ctx, this.player.x, this.player.y, this.player.facing, this.player.state, this.player.animFrame, this.player.gauge);

    // Flash on invincible
    if (this.player.invincible > 0 && this.player.invincible % 3 === 0) {
      ctx.globalAlpha = 0.3;
      drawPanda(ctx, this.player.x, this.player.y, this.player.facing, this.player.state, this.player.animFrame, this.player.gauge);
      ctx.globalAlpha = 1;
    }

    this.hitEffects.forEach(e => drawHitEffect(ctx, e.x, e.y, e.frame));
    this._drawHUD(ctx);
    this._drawPhaseOverlay(ctx);
    ctx.restore();
  }

  _drawBackground(ctx) {
    // Office floor and walls
    ctx.fillStyle = '#d4d4d8';
    ctx.fillRect(0, 0, CANVAS_W, GROUND_Y + 4);
    ctx.fillStyle = '#78716c';
    ctx.fillRect(0, GROUND_Y + 4, CANVAS_W, CANVAS_H - GROUND_Y);
    // Baseboard
    ctx.fillStyle = '#57534e';
    ctx.fillRect(0, GROUND_Y - 2, CANVAS_W, 6);
    // Ceiling
    ctx.fillStyle = '#a8a29e';
    ctx.fillRect(0, 0, CANVAS_W, 30);
    // Lights
    ctx.fillStyle = '#fef9c3';
    for (let i = 0; i < 5; i++) ctx.fillRect(80 + i * 200, 28, 80, 6);
    // Windows
    for (let i = 0; i < 3; i++) {
      ctx.fillStyle = '#1e3a5f';
      ctx.fillRect(60 + i * 310, 60, 120, 100);
      ctx.fillStyle = '#ff8f00';
      ctx.fillRect(65 + i * 310, 65, 110, 90);
      ctx.fillStyle = '#a8a29e';
      ctx.fillRect(118 + i * 310, 60, 4, 100);
      ctx.fillRect(60 + i * 310, 108, 120, 4);
    }
    // Desk
    ctx.fillStyle = '#78350f';
    ctx.fillRect(400, GROUND_Y - 50, 160, 8);
    ctx.fillRect(420, GROUND_Y - 42, 8, 42);
    ctx.fillRect(540, GROUND_Y - 42, 8, 42);
    // Bookshelf
    ctx.fillStyle = '#44403c';
    ctx.fillRect(30, 180, 60, 200);
    ctx.fillStyle = '#92400e';
    for (let i = 0; i < 4; i++) ctx.fillRect(35, 190 + i * 45, 50, 35);
  }

  _drawHUD(ctx) {
    const p = this.player, b = this.boss;
    const barW = 300, barH = 20, barY = 20;

    // Player HP
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(20, barY, barW + 4, barH + 4);
    ctx.fillStyle = '#374151';
    ctx.fillRect(22, barY + 2, barW, barH);
    const pRatio = Math.max(0, p.hp / p.maxHp);
    ctx.fillStyle = pRatio > 0.3 ? '#22c55e' : '#ef4444';
    ctx.fillRect(22, barY + 2, barW * pRatio, barH);
    // Player name
    ctx.font = '10px "Press Start 2P"';
    ctx.fillStyle = '#fff';
    ctx.fillText('슈퍼 판다', 24, barY - 4);
    ctx.fillText(`${Math.max(0, Math.ceil(p.hp))}/${p.maxHp}`, 24, barY + 16);

    // Gauge bar
    const gY = barY + 30;
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(20, gY, barW + 4, 12);
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(22, gY + 2, barW, 8);
    const gRatio = p.gauge / MAX_GAUGE;
    ctx.fillStyle = p.gauge >= MAX_GAUGE ? '#f59e0b' : '#3b82f6';
    ctx.fillRect(22, gY + 2, barW * gRatio, 8);
    if (p.gauge >= MAX_GAUGE && Math.floor(this.phaseTimer / 10) % 2 === 0) {
      ctx.fillStyle = '#fbbf24';
      ctx.font = '8px "Press Start 2P"';
      ctx.fillText('LASER READY!', 24, gY - 2);
    }

    // Boss HP
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(CANVAS_W - barW - 24, barY, barW + 4, barH + 4);
    ctx.fillStyle = '#374151';
    ctx.fillRect(CANVAS_W - barW - 22, barY + 2, barW, barH);
    const bRatio = Math.max(0, b.hp / b.maxHp);
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(CANVAS_W - barW - 22, barY + 2, barW * bRatio, barH);
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'right';
    ctx.font = '10px "Press Start 2P"';
    ctx.fillText('개구리 과장', CANVAS_W - 24, barY - 4);
    ctx.fillText(`${Math.max(0, Math.ceil(b.hp))}/${b.maxHp}`, CANVAS_W - 24, barY + 16);
    if (b.phase === 2) {
      ctx.fillStyle = '#f59e0b';
      ctx.font = '8px "Press Start 2P"';
      ctx.fillText('⚡ ENRAGED', CANVAS_W - 24, barY + 34);
    }
    ctx.textAlign = 'left';
  }

  _drawPhaseOverlay(ctx) {
    ctx.textAlign = 'center';
    switch (this.phase) {
      case 'intro':
        if (this.phaseTimer < 40) {
          ctx.font = '14px "Press Start 2P"';
          ctx.fillStyle = '#fff';
          ctx.fillText('STAGE 1', CANVAS_W / 2, CANVAS_H / 2 - 30);
          ctx.font = '10px "Press Start 2P"';
          ctx.fillStyle = '#fbbf24';
          ctx.fillText('VS 개구리 과장', CANVAS_W / 2, CANVAS_H / 2);
        } else if (this.phaseTimer > 70 && this.phaseTimer < 110) {
          ctx.font = '36px "Press Start 2P"';
          ctx.fillStyle = '#ef4444';
          ctx.strokeStyle = '#000'; ctx.lineWidth = 4;
          ctx.strokeText('FIGHT!', CANVAS_W / 2, CANVAS_H / 2);
          ctx.fillText('FIGHT!', CANVAS_W / 2, CANVAS_H / 2);
        }
        break;
      case 'ko':
        ctx.font = '40px "Press Start 2P"';
        ctx.fillStyle = '#fbbf24';
        ctx.strokeStyle = '#000'; ctx.lineWidth = 5;
        ctx.strokeText('K.O.!', CANVAS_W / 2, CANVAS_H / 2);
        ctx.fillText('K.O.!', CANVAS_W / 2, CANVAS_H / 2);
        break;
      case 'victory':
        ctx.font = '30px "Press Start 2P"';
        ctx.fillStyle = '#22c55e';
        ctx.strokeStyle = '#000'; ctx.lineWidth = 4;
        ctx.strokeText('YOU WIN!', CANVAS_W / 2, CANVAS_H / 2 - 20);
        ctx.fillText('YOU WIN!', CANVAS_W / 2, CANVAS_H / 2 - 20);
        if (this.phaseTimer > 60 && Math.floor(this.phaseTimer / 20) % 2 === 0) {
          ctx.font = '12px "Press Start 2P"';
          ctx.fillStyle = '#fff';
          ctx.fillText('PRESS ANY KEY', CANVAS_W / 2, CANVAS_H / 2 + 20);
        }
        break;
      case 'defeat':
        ctx.font = '30px "Press Start 2P"';
        ctx.fillStyle = '#ef4444';
        ctx.strokeStyle = '#000'; ctx.lineWidth = 4;
        ctx.strokeText('GAME OVER', CANVAS_W / 2, CANVAS_H / 2 - 20);
        ctx.fillText('GAME OVER', CANVAS_W / 2, CANVAS_H / 2 - 20);
        if (this.phaseTimer > 60 && Math.floor(this.phaseTimer / 20) % 2 === 0) {
          ctx.font = '12px "Press Start 2P"';
          ctx.fillStyle = '#fff';
          ctx.fillText('PRESS ANY KEY', CANVAS_W / 2, CANVAS_H / 2 + 20);
        }
        break;
    }
    ctx.textAlign = 'left';
  }
}
