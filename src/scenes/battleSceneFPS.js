import { CANVAS_W, CANVAS_H } from '../constants.js';
import { assets } from '../assetLoader.js';

export class BattleSceneFPS {
  constructor(game) {
    this.game = game;
    this.player = {
      hp: 100,
      weaponTimer: 0,
      hitTimer: 0,
      mouseX: CANVAS_W / 2,
      mouseY: CANVAS_H / 2
    };
    
    this.wave = 0;
    this.waveTimer = 0; 
    this.spawnTimer = 0; // Independent timer for spawning logic
    this.isSpawning = false; // Flag to ensure spawning isn't interrupted

    this.boss = { 
      id: 'boss', x: CANVAS_W / 2, y: CANVAS_H / 2 - 20, type: 'boss', hp: 500, active: true, scale: 0.225,
      state: 'idle', stateTimer: 0, spawnTriggered: false
    };
    this.enemies = [this.boss];
    this._spawnWave();

    this.particles = [];
    this.laser = 0;
    this.frame = 0;
    this.shake = 0;
    this.winTimer = 0;
  }

  update(input) {
    this.frame++;
    this.player.mouseX = input.mouseX;
    this.player.mouseY = input.mouseY;

    if (this.shake > 0) this.shake--;
    if (this.player.hitTimer > 0) this.player.hitTimer--;
    if (this.laser > 0) this.laser--;
    
    if (this.player.hp <= 0) {
      if (this.frame % 60 === 0) {
        this.game.switchScene('title');
      }
      return;
    }

    const activeMinis = this.enemies.filter(e => e.type === 'mini' && e.active && e.state !== 'die');
    const isWaveCleared = (activeMinis.length === 0);

    // Wave Countdown logic - Only runs if no minis and not currently spawning
    if (isWaveCleared && this.boss.hp > 0 && this.boss.state !== 'die' && !this.isSpawning) {
      if (this.waveTimer === 0) {
        this.waveTimer = 180; // 3 seconds wait
      } else {
        this.waveTimer--;
        if (this.waveTimer <= 0) {
          this._startWaveSpawn();
        }
      }
    }

    // Independent Spawning Logic - CANNOT be interrupted by hits
    if (this.isSpawning) {
      this.spawnTimer++;
      // Set boss to spawn state visually if possible
      if (this.boss.state !== 'die' && this.boss.state !== 'hit') {
        this.boss.state = 'spawn';
      }
      
      if (this.spawnTimer === 12) {
        this._doSpawnMinis();
      }
      
      if (this.spawnTimer >= 60) {
        this.isSpawning = false;
        this.spawnTimer = 0;
        if (this.boss.state === 'spawn') this.boss.state = 'idle';
      }
    }

    // Victory check
    if (!this.boss.active) {
      this.winTimer++;
      if (this.winTimer > 120) {
        this.game.switchScene('cutscene_stage3');
      }
      return;
    }

    // Shooting
    if (this.player.weaponTimer > 0) this.player.weaponTimer--;
    if ((input.justPressed('KeyZ') || input.justClicked()) && this.player.weaponTimer === 0) {
      this.player.weaponTimer = 15;
      this.laser = 5;
      this.game.sound.laser();
      this.shake = 3;
      this._checkHit(input.mouseX, input.mouseY, isWaveCleared);
    }

    // Particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      let pt = this.particles[i];
      pt.life--;
      pt.x += pt.vx; pt.y += pt.vy; pt.vy += 0.5; // gravity
      if (pt.life <= 0) this.particles.splice(i, 1);
    }

    // Enemy AI & Animation State
    this.enemies.forEach(e => {
      if (!e.active) return;
      e.stateTimer = (e.stateTimer || 0) + 1;

      if (e.state === 'hit' && e.stateTimer > 6) {
        e.state = (e.type === 'mini' && e.scale >= 0.3) ? 'attack' : 'idle';
      }

      if (e.type === 'mini') {
        if (e.state === 'die') {
          if (e.stateTimer > 90) e.active = false; 
          return;
        }

        if (e.state !== 'hit' && e.state !== 'attack') {
          e.state = 'move';
          e.x += e.vx;
          e.y += e.vy;
          e.scale += e.vScale;
          
          if (e.scale >= 0.3) {
            e.scale = 0.3;
            e.state = 'attack';
            e.stateTimer = 0;
          }
        } else if (e.state === 'attack') {
          if (this.frame % 60 === 0) {
            this.player.hp -= 5;
            this.player.hitTimer = 5;
            this.shake = 5;
            this.game.sound.hit();
          }
        }
      } else if (e.type === 'boss') {
        if (e.state === 'die') {
          if (e.stateTimer > 120) e.active = false;
          return;
        }
        // Boss state logic for hits
        if (e.state !== 'hit' && e.state !== 'spawn') {
          e.state = 'idle';
        }
      }
    });
  }

  _startWaveSpawn() {
    this.wave++;
    this.waveTimer = 0;
    this.isSpawning = true;
    this.spawnTimer = 0;
    // Set visual state, but logic is now in update()
    if (this.boss.state !== 'die') this.boss.state = 'spawn';
  }

  _spawnWave() {
    this._startWaveSpawn();
  }

  _doSpawnMinis() {
    const baseBoss = assets.get('image_21');
    const feetY = this.boss.y + (baseBoss.height * this.boss.scale) / 2 + (80 * this.boss.scale);
    // Compromise height: 30% up from feet towards center
    const spawnY = feetY - (feetY - this.boss.y) * 0.3;
    const bossX = this.boss.x;

    for (let i = 0; i < 5; i++) {
      // Wider spread as they reach the player
      const targetX = CANVAS_W/2 + (Math.random() - 0.5) * 800;
      // Uniform floor height at arrival
      const targetY = 480; 
      
      // 120% speed (Reduced framesToReach: from 180-300 down to 140-200)
      const framesToReach = 140 + Math.random() * 60;
      
      this.enemies.push({
        id: `mini_${this.wave}_${i}`,
        x: bossX, 
        y: spawnY, 
        vx: (targetX - bossX) / framesToReach,
        vy: (targetY - spawnY) / framesToReach,
        scale: 0.02,
        vScale: (0.3 - 0.02) / framesToReach,
        type: 'mini',
        hp: 1, 
        active: true,
        state: 'move',
        stateTimer: 0
      });
    }
  }




  _checkHit(mx, my, isWaveCleared) {
    let hitEnemy = null;
    const renderables = this.enemies.filter(e => e.active && e.state !== 'die');
    renderables.sort((a,b) => b.scale - a.scale);

    for (let e of renderables) {
      if (e.type === 'boss' && (!isWaveCleared || e.state === 'die')) continue;

      const baseImg = assets.get(e.type === 'boss' ? 'image_21' : 'image_31');
      if (!baseImg) continue;

      const drawW = baseImg.width * e.scale;
      const drawH = baseImg.height * e.scale;
      const baselineY = e.y + (baseImg.height * e.scale) / 2;
      const left = e.x - drawW/2;
      const right = e.x + drawW/2;
      const top = baselineY - drawH;
      const bottom = baselineY;

      if (mx >= left && mx <= right && my >= top && my <= bottom) {
        hitEnemy = e;
        break; 
      }
    }

    if (hitEnemy) {
      hitEnemy.hp -= (hitEnemy.type === 'boss' ? 20 : 1); 
      hitEnemy.state = 'hit';
      hitEnemy.stateTimer = 0;
      hitEnemy.hitFlip = (hitEnemy.hitFlip || 0) + 1; 
      this._spawnParticles(mx, my, 10);
      if (hitEnemy.hp <= 0) {
        hitEnemy.state = 'die';
        hitEnemy.stateTimer = 0;
        this.game.sound.hit();
      }
    }
  }

  _spawnParticles(x, y, count) {
    for (let i=0; i<count; i++) {
      this.particles.push({
        x: x, y: y,
        vx: (Math.random()-0.5)*10,
        vy: (Math.random()-1)*10,
        life: 20 + Math.random()*10,
        color: '#4a2f1d' 
      });
    }
  }

  render(ctx) {
    ctx.save();
    if (this.shake > 0) ctx.translate((Math.random()-0.5)*10, (Math.random()-0.5)*10);
    
    const bg = assets.get('battle2_bg');
    if (bg) {
      ctx.drawImage(bg, 0, 0, CANVAS_W, CANVAS_H);
    } else {
      ctx.fillStyle = '#64748b'; ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    }

    if (this.player.hitTimer > 0) {
      ctx.fillStyle = 'rgba(100, 20, 20, 0.3)'; ctx.fillRect(0,0,CANVAS_W,CANVAS_H);
    }

    let renderables = this.enemies.filter(e => e.active);
    renderables.sort((a,b) => {
      if (a.type === 'boss') return -1;
      if (b.type === 'boss') return 1;
      return a.scale - b.scale;
    });

    renderables.forEach(r => {
      let imgKey = (r.type === 'boss' ? 'image_21' : 'image_31');
      if (r.type === 'boss') {
        switch(r.state) {
          case 'idle': imgKey = 'image_21'; break;
          case 'move': imgKey = (Math.floor(this.frame / 15) % 2 === 0) ? 'image_22' : 'image_23'; break;
          case 'spawn': imgKey = 'image_24'; break;
          case 'hit': imgKey = (r.hitFlip % 2 === 0) ? 'image_25' : 'image_26'; break;
          case 'die': imgKey = (r.stateTimer < 60) ? 'image_27' : 'image_28'; break;
        }
      } else {
        switch(r.state) {
          case 'idle': imgKey = 'image_31'; break;
          case 'move': imgKey = (Math.floor(this.frame / 10) % 2 === 0) ? 'image_32' : 'image_33'; break;
          case 'attack': imgKey = 'image_34'; break;
          case 'hit': imgKey = (r.hitFlip % 2 === 0) ? 'image_35' : 'image_36'; break;
          case 'die': imgKey = (r.hitFlip % 2 === 0) ? 'image_35' : 'image_36'; break;
        }
      }
      
      const img = assets.get(imgKey);
      if (img) {
        ctx.save();
        if (r.type === 'mini' && r.state === 'die') {
          if (r.stateTimer > 30 && Math.floor(r.stateTimer / 5) % 2 === 0) ctx.globalAlpha = 0;
        }
        const baseImg = assets.get(r.type === 'boss' ? 'image_21' : 'image_31');
        let bossFloorOffset = (r.type === 'boss') ? 80 * r.scale : 0;
        let xOffset = 0;
        if (r.type === 'boss' && r.state === 'die') {
          xOffset = 50 * r.scale; bossFloorOffset = 100 * r.scale;
        }
        const baselineY = r.y + (baseImg.height * r.scale) / 2 + bossFloorOffset;
        const drawW = img.width * r.scale;
        const drawH = img.height * r.scale; 
        ctx.drawImage(img, r.x + xOffset - drawW/2, baselineY - drawH, drawW, drawH);
        ctx.restore();
      }
    });

    this.particles.forEach(pt => { ctx.fillStyle = pt.color; ctx.fillRect(pt.x, pt.y, 4, 4); });
    
    const armKey = this.player.weaponTimer > 0 ? 'image_42' : 'image_41';
    const weaponImg = assets.get(armKey);
    if (weaponImg) {
      const wWidth = 400; const wHeight = weaponImg.height * (wWidth / weaponImg.width);
      ctx.drawImage(weaponImg, (CANVAS_W - wWidth) / 2, CANVAS_H - wHeight + 10 + (this.player.weaponTimer > 0 ? 30 : 0), wWidth, wHeight);
    }

    if (this.laser > 0) {
      ctx.strokeStyle = 'rgba(255, 50, 50, 0.8)'; ctx.lineWidth = 4 + Math.random()*2; ctx.beginPath();
      ctx.moveTo(CANVAS_W/2 + 80, CANVAS_H - 100); ctx.lineTo(this.player.mouseX, this.player.mouseY); ctx.stroke();
    }

    const cx = this.player.mouseX; const cy = this.player.mouseY;
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.beginPath();
    ctx.moveTo(cx - 15, cy); ctx.lineTo(cx + 15, cy); ctx.moveTo(cx, cy - 15); ctx.lineTo(cx, cy + 15); ctx.stroke();

    ctx.textAlign = 'left'; ctx.fillStyle = '#fff'; ctx.font = '20px "Press Start 2P"';
    ctx.fillText(`HP: ${Math.ceil(this.player.hp)}`, 20, CANVAS_H - 20);
    const activeMinis = this.enemies.filter(e => e.type === 'mini' && e.active && e.state !== 'die');
    if (this.boss.active) { 
      ctx.textAlign = 'right'; ctx.fillStyle = activeMinis.length === 0 ? '#0f0' : '#f00'; 
      ctx.fillText(activeMinis.length === 0 ? `BOSS VULNERABLE: ${Math.ceil(this.boss.hp)}` : `BOSS IMMUNE`, CANVAS_W - 20, 40); 
    }
    
    ctx.textAlign = 'center';
    if (this.player.hp <= 0) { ctx.fillStyle = 'rgba(0,0,0,0.7)'; ctx.fillRect(0,0, CANVAS_W, CANVAS_H); ctx.fillStyle = '#f00'; ctx.fillText('GAME OVER', CANVAS_W/2, CANVAS_H/2); }
    if (this.winTimer > 0) {
      if (this.winTimer === 1) this.game.sound.victory();
      ctx.save(); ctx.font = '60px "Press Start 2P"'; ctx.textAlign = 'center'; ctx.strokeStyle = '#000'; ctx.lineWidth = 10;
      ctx.strokeText('YOU WIN!', CANVAS_W / 2, CANVAS_H / 2); ctx.fillStyle = '#fbbf24'; ctx.fillText('YOU WIN!', CANVAS_W / 2, CANVAS_H / 2); ctx.restore();
    }
    ctx.restore();
  }
}
