import { CANVAS_W, CANVAS_H, PROFESSOR_LEE_HP, SHOOTER_SCROLL_SPEED, PANDA_BULLET_SPEED, PANDA_BULLET_DMG, PANDA_EYE_LASER_DMG, PANDA_EYE_LASER_COOLDOWN, PAPER_SPEED, PAPER_DMG, EYE_BEAM_DMG } from '../constants.js';
import { assets } from '../assetLoader.js';

export class BattleSceneStage3 {
  constructor(game) {
    this.game = game;
    this.frame = 0;
    this.scrollX = 0;
    this.shake = 0;
    
    // Constant targets for consistent scaling
    this.PANDA_H = 130; // Reduced to 70% (was 180)
    this.BOSS_W = 144; 
    this.SIDEKICK_W = 220;


    // Player (Super Panda)
    this.player = {
      x: 150,
      y: CANVAS_H / 2,
      hp: 150,
      speed: 6,
      bulletTimer: 0,
      specialTimer: 0,
      hitTimer: 0,
      state: 'idle',
      stateTimer: 0, // Used for natural animation transitions
      eyeLaserActive: 0
    };

    // Boss (Professor Lee)
    this.boss = {
      x: CANVAS_W - 200,
      y: CANVAS_H / 2,
      hp: PROFESSOR_LEE_HP,
      state: 'idle',
      stateTimer: 0,
      attackTimer: 0,
      hitTimer: 0,
      isGroggy: false
    };

    this.bullets = []; 
    this.enemyProjectiles = []; 
    this.particles = [];
    
    this.finishingMove = {
      active: false,
      timer: 0,
      phase: 0, 
      flash: 0
    };

    this.gameClear = false;
    this.gameDefeat = false;
    this.clearTimer = 0;
    this.showYouWin = false;
    this.showGameOver = false;
  }

  update(input) {
    if (this.shake > 0) this.shake--;

    if (this.gameClear) {
      this.clearTimer++;
      if (this.clearTimer === 60) {
        this.showYouWin = true;
        this.game.sound.victory();
      }
      if (this.clearTimer > 240) {
        this.game.switchScene('cutscene_ending');
      }
      return;
    }

    if (this.gameDefeat) {
      this.clearTimer++;
      if (this.clearTimer === 30) {
        this.showGameOver = true;
      }
      if (this.clearTimer > 180) {
        this.game.switchScene('title');
      }
      return;
    }

    this.frame++;
    
    // Background scroll
    const bg = assets.get('battle3_bg');
    if (bg) {
      const bgScale = CANVAS_H / bg.height;
      const scaledWidth = Math.ceil(bg.width * bgScale);
      this.scrollX = (this.scrollX + SHOOTER_SCROLL_SPEED) % scaledWidth;
    }

    if (this.finishingMove.active) {
      this._updateFinishingMove();
      return;
    }

    this._updatePlayer(input);
    this._updateBoss();
    this._updateProjectiles();
    this._updateCollisions();
    
    // Particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      let pt = this.particles[i];
      pt.life--;
      pt.x += pt.vx; pt.y += pt.vy;
      if (pt.life <= 0) this.particles.splice(i, 1);
    }
  }

  _updatePlayer(input) {
    if (this.player.hitTimer > 0) this.player.hitTimer--;
    if (this.player.specialTimer > 0) this.player.specialTimer--;
    if (this.player.eyeLaserActive > 0) this.player.eyeLaserActive--;

    let dx = 0, dy = 0;
    if (input.isDown('ArrowLeft')) dx -= 1;
    if (input.isDown('ArrowRight')) dx += 1;
    if (input.isDown('ArrowUp')) dy -= 1;
    if (input.isDown('ArrowDown')) dy += 1;

    if (dx !== 0 || dy !== 0) {
      const length = Math.sqrt(dx * dx + dy * dy);
      this.player.x += (dx / length) * this.player.speed;
      this.player.y += (dy / length) * this.player.speed;
    }

    this.player.x = Math.max(50, Math.min(CANVAS_W - 50, this.player.x));
    this.player.y = Math.max(50, Math.min(CANVAS_H - 50, this.player.y));

    let newState = 'idle';
    if (this.player.eyeLaserActive > 0) newState = 'special';
    else if (this.player.hitTimer > 0) newState = 'hit';
    else if (dy < 0) newState = 'up';
    else if (dy > 0) newState = 'down';
    else if (dx > 0) newState = 'right';
    else if (dx < 0) newState = 'back';
    else newState = 'idle';

    if (newState !== this.player.state) {
      this.player.state = newState;
      this.player.stateTimer = 0;
    } else {
      this.player.stateTimer++;
    }

    if (this.player.bulletTimer > 0) this.player.bulletTimer--;
    if (this.player.bulletTimer === 0) {
      this.bullets.push({ x: this.player.x + 40, y: this.player.y + 10, vx: PANDA_BULLET_SPEED });
      this.player.bulletTimer = 15;
      this.game.sound.autoFire();
    }

    if (input.justPressed('KeyZ') && this.player.specialTimer === 0) {
      this.player.eyeLaserActive = 40;
      this.player.specialTimer = PANDA_EYE_LASER_COOLDOWN;
      this.game.sound.laser();
      if (Math.abs(this.player.y - this.boss.y) < 150 && !this.boss.isGroggy) {
        this._hitBoss(PANDA_EYE_LASER_DMG);
      }
    }

    if (this.boss.hp < PROFESSOR_LEE_HP * 0.1 && input.justPressed('KeyX')) {
      this.finishingMove.active = true;
      this.finishingMove.timer = 0;
      this.finishingMove.phase = 0;
    }
  }

  _updateBoss() {
    if (this.boss.state === 'die') return;
    this.boss.stateTimer++;
    if (this.boss.hitTimer > 0) this.boss.hitTimer--;

    if (this.boss.hp <= 0 && !this.boss.isGroggy) {
      this.boss.isGroggy = true;
      this.boss.state = 'groggy';
    }

    if (this.boss.isGroggy) {
      this.boss.state = 'groggy';
      return;
    }

    this.boss.y = CANVAS_H / 2 + Math.sin(this.frame * 0.03) * 150;
    this.boss.attackTimer++;
    
    if (this.boss.attackTimer % 50 === 0) {
      this.boss.state = 'attack_paper';
      this.boss.stateTimer = 0;
      this.enemyProjectiles.push({ x: this.boss.x - 50, y: this.boss.y, vx: -PAPER_SPEED, frame: 0 });
    }

    if (this.boss.attackTimer % 200 === 120) {
      this.boss.state = 'attack_beam';
      this.boss.stateTimer = 0;
      if (Math.abs(this.boss.y - this.player.y) < 80) this._hitPlayer(EYE_BEAM_DMG);
    }

    if (this.boss.stateTimer > 30 && this.boss.state.startsWith('attack')) this.boss.state = 'idle';
  }

  _updateProjectiles() {
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      this.bullets[i].x += this.bullets[i].vx;
      if (this.bullets[i].x > CANVAS_W) this.bullets.splice(i, 1);
    }
    for (let i = this.enemyProjectiles.length - 1; i >= 0; i--) {
      let p = this.enemyProjectiles[i];
      p.x += p.vx; p.frame++;
      if (p.x < -100) this.enemyProjectiles.splice(i, 1);
    }
  }

  _updateCollisions() {
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      let b = this.bullets[i];
      if (b.x > this.boss.x - 80 && b.x < this.boss.x + 80 &&
          b.y > this.boss.y - 120 && b.y < this.boss.y + 120) {
        this._hitBoss(PANDA_BULLET_DMG);
        this.bullets.splice(i, 1);
        this._spawnParticles(b.x, b.y, 5, '#ff0');
      }
    }
    for (let i = this.enemyProjectiles.length - 1; i >= 0; i--) {
      let p = this.enemyProjectiles[i];
      if (p.x > this.player.x - 80 && p.x < this.player.x + 80 &&
          p.y > this.player.y - 80 && p.y < this.player.y + 80) {
        this._hitPlayer(PAPER_DMG / 2);
        this.enemyProjectiles.splice(i, 1);
        this._spawnParticles(p.x, p.y, 5, '#fff');
      }
    }
  }

  _hitBoss(dmg) {
    if (this.boss.isGroggy) return;
    this.boss.hp -= dmg;
    this.boss.hitTimer = 10;
    this.game.sound.hit();
    if (this.boss.hp <= 0) { this.boss.hp = 0; this.boss.isGroggy = true; }
  }

  _hitPlayer(dmg) {
    if (this.player.hitTimer > 0) return;
    this.player.hp -= dmg;
    this.player.hitTimer = 40;
    this.game.sound.hit();
    if (this.player.hp <= 0) { 
      this.player.hp = 0; 
      this.gameDefeat = true;
      this.clearTimer = 0;
      this.game.sound.ko();
    }
  }

  _spawnParticles(x, y, count, color) {
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: x, y: y,
        vx: (Math.random() - 0.5) * 12,
        vy: (Math.random() - 0.5) * 12,
        life: 30, color: color
      });
    }
  }

  _updateFinishingMove() {
    this.finishingMove.timer++;
    if (this.finishingMove.phase === 0) {
      if (this.finishingMove.timer === 1) {
        this.player.x = -200;
        this.player.y = CANVAS_H / 2;
        this.game.sound.charge();
      }
      if (this.finishingMove.timer > 210) {
        this.finishingMove.phase = 1;
        this.finishingMove.timer = 0;
      }
    } else {
      const targetX = this.boss.x;
      const targetY = this.boss.y;
      const dx = targetX - this.player.x;
      const dy = targetY - this.player.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (this.frame % 3 === 0) {
        this._spawnParticles(this.player.x, this.player.y, 5, '#fbbf24');
        this._spawnParticles(this.player.x, this.player.y, 3, '#fff');
      }

      if (dist < 40) {
        this.boss.state = 'die';
        this.gameClear = true;
        this.game.sound.explosion();
        this.finishingMove.flash = 20;
        this.shake = 30; 
        this._spawnParticles(targetX, targetY, 80, '#f80');
        this._spawnParticles(targetX, targetY, 60, '#fff');
        this._spawnParticles(targetX, targetY, 40, '#fbbf24');
      } else {
        this.player.x += (dx / dist) * 7.5;
        this.player.y += (dy / dist) * 7.5;
      }
    }
  }

  render(ctx) {
    ctx.save();
    if (this.shake > 0) ctx.translate((Math.random() - 0.5) * this.shake, (Math.random() - 0.5) * this.shake);

    // Background
    const bg = assets.get('battle3_bg');
    if (bg) {
      const bgScale = CANVAS_H / bg.height;
      const scaledWidth = Math.ceil(bg.width * bgScale);
      const x = - (this.scrollX % scaledWidth);
      ctx.drawImage(bg, Math.floor(x), 0, scaledWidth + 1, CANVAS_H);
      if (x + scaledWidth < CANVAS_W) {
        ctx.drawImage(bg, Math.floor(x + scaledWidth), 0, scaledWidth + 1, CANVAS_H);
      }
    }

    this._renderPlayer(ctx);
    this._renderBoss(ctx);
    this._renderProjectiles(ctx);
    this._renderUI(ctx);

    // Finishing Move Flash (image_101) - Top Layer
    if (this.finishingMove.active && this.finishingMove.phase === 0) {
      const flashImg = assets.get('image_101');
      if (flashImg) {
        const fW = CANVAS_W;
        const fH = flashImg.height * (fW / flashImg.width);
        ctx.drawImage(flashImg, 0, (CANVAS_H - fH) / 2, fW, fH);
      }
    }

    this.particles.forEach(pt => { ctx.fillStyle = pt.color; ctx.fillRect(pt.x, pt.y, 4, 4); });

    if (this.finishingMove.flash > 0) {
      ctx.fillStyle = `rgba(255, 255, 255, ${this.finishingMove.flash / 20})`;
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
      this.finishingMove.flash--;
    }

    if (this.showYouWin) {
      ctx.save();
      ctx.font = '60px "Press Start 2P"';
      ctx.textAlign = 'center';
      ctx.strokeStyle = '#000'; ctx.lineWidth = 10;
      ctx.strokeText('YOU WIN!', CANVAS_W / 2, CANVAS_H / 2);
      ctx.fillStyle = '#fbbf24';
      ctx.fillText('YOU WIN!', CANVAS_W / 2, CANVAS_H / 2);
      ctx.restore();
    }

    if (this.showGameOver) {
      ctx.save();
      ctx.font = '60px "Press Start 2P"';
      ctx.textAlign = 'center';
      ctx.strokeStyle = '#000'; ctx.lineWidth = 10;
      ctx.strokeText('GAME OVER', CANVAS_W / 2, CANVAS_H / 2);
      ctx.fillStyle = '#ef4444';
      ctx.fillText('GAME OVER', CANVAS_W / 2, CANVAS_H / 2);
      ctx.restore();
    }

    ctx.restore();
  }

  _renderPlayer(ctx) {
    let imgKey = 'image_51';
    const t = this.player.stateTimer;
    
    switch (this.player.state) {
      case 'idle': imgKey = 'image_51'; break;
      case 'right': imgKey = (t < 8) ? 'image_51' : 'image_52'; break;
      case 'up': imgKey = (t < 8) ? 'image_51' : 'image_53'; break;
      case 'down': imgKey = (t < 8) ? 'image_54' : 'image_55'; break;
      case 'back': imgKey = (t < 8) ? 'image_51' : 'image_56'; break;
      case 'special': imgKey = 'image_57'; break;
      case 'hit': imgKey = 'image_58'; break;
    }
    
    if (this.gameClear) imgKey = 'image_59';
    if (this.gameDefeat) imgKey = 'image_58';

    const img = assets.get(imgKey);
    if (img) {
      const destW = img.width * (this.PANDA_H / img.height);
      ctx.drawImage(img, this.player.x - destW/2, this.player.y - this.PANDA_H/2, destW, this.PANDA_H);
      
      if (this.player.eyeLaserActive > 0) {
        ctx.strokeStyle = 'rgba(255, 0, 0, 0.7)'; ctx.lineWidth = 40; ctx.beginPath();
        ctx.moveTo(this.player.x + 40, this.player.y - 10); ctx.lineTo(CANVAS_W, this.player.y - 10); ctx.stroke();
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 15; ctx.beginPath();
        ctx.moveTo(this.player.x + 40, this.player.y - 10); ctx.lineTo(CANVAS_W, this.player.y - 10); ctx.stroke();
      }
      
      if (this.finishingMove.active && this.finishingMove.phase === 1) {
        const s1 = assets.get('image_81'); const s2 = assets.get('image_91');
        if (s1) {
          const s1H = s1.height * (this.BOSS_W / s1.width);
          ctx.drawImage(s1, this.player.x - 180, this.player.y - 200, this.BOSS_W, s1H);
        }
        if (s2) {
          const s2H = s2.height * (this.BOSS_W / s2.width);
          ctx.drawImage(s2, this.player.x - 180, this.player.y + 80, this.BOSS_W, s2H);
        }
      }
    }
  }

  _renderBoss(ctx) {
    let imgKey = 'image_61';
    if (this.boss.isGroggy) imgKey = 'image_65';
    if (this.boss.state === 'die') imgKey = 'image_66';
    else if (this.boss.hitTimer > 0) imgKey = 'image_64';
    else if (this.boss.state === 'attack_paper') imgKey = (Math.floor(this.boss.stateTimer / 5) % 2 === 0) ? 'image_62' : 'image_63';
    
    const img = assets.get(imgKey);
    if (img) {
      ctx.save();
      if (this.boss.hitTimer > 0) ctx.filter = 'brightness(1.5) sepia(0.5) hue-rotate(-50deg)';
      const destH = img.height * (this.BOSS_W / img.width);
      ctx.drawImage(img, this.boss.x - this.BOSS_W/2, this.boss.y - destH/2, this.BOSS_W, destH);
      ctx.restore();
      
      if (this.boss.state === 'attack_beam') {
        ctx.strokeStyle = '#f0f'; ctx.lineWidth = 15; ctx.beginPath();
        ctx.moveTo(this.boss.x - 40, this.boss.y - 50); ctx.lineTo(0, this.boss.y - 50); ctx.stroke();
      }
    }
  }

  _renderProjectiles(ctx) {
    ctx.fillStyle = '#0ff'; this.bullets.forEach(b => ctx.fillRect(b.x, b.y, 25, 6));
    this.enemyProjectiles.forEach(p => {
      const paperKey = `image_7${(Math.floor(p.frame / 5) % 4) + 1}`;
      const img = assets.get(paperKey);
      if (img) {
        const pW = 100;
        const pH = img.height * (pW / img.width);
        ctx.drawImage(img, p.x - pW/2, p.y - pH/2, pW, pH);
      }
    });
  }

  _renderUI(ctx) {
    ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(20, 20, 200, 20);
    ctx.fillStyle = '#22c55e'; ctx.fillRect(20, 20, 200 * (this.player.hp / 150), 20);
    ctx.strokeStyle = '#fff'; ctx.strokeRect(20, 20, 200, 20);
    ctx.fillStyle = '#fff'; ctx.font = '12px "Press Start 2P"'; ctx.fillText('PANDA HP', 20, 15);
    ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(CANVAS_W - 220, 20, 200, 20);
    ctx.fillStyle = '#ef4444'; ctx.fillRect(CANVAS_W - 220, 20, 200 * (this.boss.hp / PROFESSOR_LEE_HP), 20);
    ctx.strokeStyle = '#fff'; ctx.strokeRect(CANVAS_W - 220, 20, 200, 20);
    ctx.fillStyle = '#fff'; ctx.textAlign = 'right'; ctx.fillText('PROFESSOR LEE', CANVAS_W - 20, 15);
    if (this.player.specialTimer > 0) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)'; ctx.fillRect(20, 50, 100 * (this.player.specialTimer / PANDA_EYE_LASER_COOLDOWN), 5);
      ctx.fillStyle = '#fff'; ctx.textAlign = 'left'; ctx.fillText('Z', 130, 58);
    }
    if (this.boss.hp < PROFESSOR_LEE_HP * 0.1 && !this.finishingMove.active) {
      ctx.fillStyle = '#f00'; ctx.font = '20px "Press Start 2P"'; ctx.textAlign = 'center';
      if (Math.floor(this.frame / 20) % 2 === 0) ctx.fillText('PRESS X TO FINISH HIM!', CANVAS_W / 2, CANVAS_H - 50);
    }
  }
}
