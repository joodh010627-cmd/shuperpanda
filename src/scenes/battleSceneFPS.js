import { CANVAS_W, CANVAS_H } from '../constants.js';
import { assets } from '../assetLoader.js';

export class BattleSceneFPS {
  constructor(game) {
    this.game = game;
    this.player = {
      x: 0, z: 0,
      yaw: 0, pitch: 0,
      hp: 100,
      weaponTimer: 0,
      hitTimer: 0
    };
    
    this.wave = 0;
    this.waveTimer = 0; // 5 seconds wait timer
    this.boss = { 
      id: 'boss', x: 0, z: 25, type: 'boss', hp: 300, active: true, scale: 2.0,
      state: 'idle', stateTimer: 0
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
    if (this.shake > 0) this.shake--;
    if (this.player.hitTimer > 0) this.player.hitTimer--;
    if (this.laser > 0) this.laser--;
    
    if (this.player.hp <= 0) {
      if (this.frame % 60 === 0) {
        document.exitPointerLock?.();
        this.game.switchScene('title');
      }
      return;
    }

    // Spawn logic
    const activeMinis = this.enemies.filter(e => e.type === 'mini' && e.active && e.state !== 'die').length;
    if (activeMinis === 0) {
      if (this.waveTimer === 0) {
        this.waveTimer = 300; // Wait 5 seconds (300 frames)
      } else {
        this.waveTimer--;
        if (this.waveTimer <= 0) {
          this._spawnWave();
        }
      }
    }

    // Victory check (only when Boss is dead)
    if (!this.boss.active) {
      this.winTimer++;
      if (this.winTimer > 120) {
        document.exitPointerLock?.();
        this.game.switchScene('title');
      }
      return;
    }

    // Player Movement (WASD + Mouse)
    const rotSpeed = 0.002;
    const moveSpeed = 0.15;

    // Rotation via Mouse
    const mouseDeltaX = input.getMouseDeltaX();
    this.player.yaw += mouseDeltaX * rotSpeed;
    this.player.yaw = Math.max(-1.0, Math.min(1.0, this.player.yaw)); 

    // Movement via WASD (relative to yaw)
    let forward = 0;
    let right = 0;

    if (input.isDown('KeyW') || input.isDown('ArrowUp')) forward += moveSpeed;
    if (input.isDown('KeyS') || input.isDown('ArrowDown')) forward -= moveSpeed;
    if (input.isDown('KeyA')) right -= moveSpeed;
    if (input.isDown('KeyD')) right += moveSpeed;

    const dx = right * Math.cos(-this.player.yaw) + forward * Math.sin(-this.player.yaw);
    const dz = -right * Math.sin(-this.player.yaw) + forward * Math.cos(-this.player.yaw);

    this.player.x += dx;
    this.player.z += dz;
    this.player.x = Math.max(-6, Math.min(6, this.player.x));
    this.player.z = Math.max(0, Math.min(40, this.player.z));

    // Shooting (Left Click or Z)
    if (this.player.weaponTimer > 0) this.player.weaponTimer--;
    if ((input.justPressed('KeyZ') || input.justClicked()) && this.player.weaponTimer === 0) {
      if (document.pointerLockElement !== this.game.canvas) {
        this.game.canvas.requestPointerLock();
      }
      this.player.weaponTimer = 15;
      this.laser = 5;
      this.game.sound.laser();
      this.shake = 3;
      this._checkHit();
    }

    // Particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      let pt = this.particles[i];
      pt.life--;
      pt.x += pt.vx; pt.y += pt.vy; pt.vy += 0.5; // gravity
      if (pt.life <= 0) this.particles.splice(i, 1);
    }

    // Enemy AI & Animation State Management
    this.enemies.forEach(e => {
      if (!e.active) return;
      e.stateTimer = (e.stateTimer || 0) + 1;

      // Handle hit state duration
      if (e.state === 'hit' && e.stateTimer > 6) {
        e.state = 'idle';
      }

      const dx = this.player.x - e.x;
      const dz = this.player.z - e.z;
      const dist = Math.sqrt(dx*dx + dz*dz);
      
      if (e.type === 'mini') {
        if (e.state === 'die') {
          if (e.stateTimer > 90) e.active = false; // Stay, blink, then go
          return;
        }

        if (dist < 1.5) {
          e.state = 'attack';
          if (this.frame % 30 === 0) {
            this.player.hp -= 5;
            this.player.hitTimer = 5;
            this.shake = 5;
            this.game.sound.hit();
          }
        } else {
          // Move towards player
          e.state = 'move';
          e.x += (dx / dist) * 0.05;
          e.z += (dz / dist) * 0.05;
        }
      } else if (e.type === 'boss') {
        if (e.state === 'die') {
          if (e.stateTimer > 120) e.active = false;
          return;
        }

        // Spawn state duration
        if (e.state === 'spawn' && e.stateTimer > 60) {
          e.state = 'idle';
        }

        if (e.state !== 'hit' && e.state !== 'spawn') {
          // Boss moves side to side slightly
          e.x = Math.sin(this.frame * 0.02) * 2;
          e.state = 'move';
          // Keep distance around 15-20
          if (dist < 15) e.z += 0.05;
          else if (dist > 20) e.z -= 0.05;
          else e.state = 'idle';
        }
      }
    });
  }

  _spawnWave() {
    this.wave++;
    this.waveTimer = 0;
    this.boss.state = 'spawn';
    this.boss.stateTimer = 0;

    for (let i = 0; i < 5; i++) {
      this.enemies.push({
        id: `mini_${this.wave}_${i}`,
        x: (Math.random() - 0.5) * 8, 
        z: this.player.z + 15 + Math.random() * 10,
        type: 'mini',
        hp: 2, // Now two hits to die
        active: true,
        scale: 0.8,
        state: 'idle',
        stateTimer: 0
      });
    }
  }

  _checkHit() {
    let hitEnemy = null;
    let closestDist = Infinity;

    this.enemies.forEach(e => {
      if (!e.active || e.state === 'die') return;
      
      const relX = e.x - this.player.x;
      const relZ = e.z - this.player.z;
      if (relZ <= 0.1) return;

      const fov = 200;
      const rotX = relX * Math.cos(-this.player.yaw) - relZ * Math.sin(-this.player.yaw);
      const rotZ = relX * Math.sin(-this.player.yaw) + relZ * Math.cos(-this.player.yaw);
      
      if (rotZ <= 0.1) return;

      const screenX = CANVAS_W / 2 + (rotX / rotZ) * fov;
      const scale = (fov / rotZ) * e.scale;
      const size = 60 * scale;

      const cx = CANVAS_W/2;
      const cy = CANVAS_H/2;
      
      const left = screenX - size/2;
      const right = screenX + size/2;
      const top = (CANVAS_H/2 + 20) - size;
      const bottom = (CANVAS_H/2 + 20);

      if (cx > left && cx < right && cy > top && cy < bottom) {
        if (rotZ < closestDist) {
          closestDist = rotZ;
          hitEnemy = e;
        }
      }
    });

    if (hitEnemy) {
      hitEnemy.hp -= (hitEnemy.type === 'boss' ? 20 : 1); 
      hitEnemy.state = 'hit';
      hitEnemy.stateTimer = 0;
      this._spawnParticles(0, 0, 10);
      if (hitEnemy.hp <= 0) {
        hitEnemy.state = 'die';
        hitEnemy.stateTimer = 0;
        this.game.sound.hit();
      }
    }
  }

  _spawnParticles(sx, sy, count) {
    for (let i=0; i<count; i++) {
      this.particles.push({
        x: CANVAS_W/2 + sx,
        y: CANVAS_H/2 + sy,
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
    if (this.player.hitTimer > 0) {
      ctx.fillStyle = 'rgba(100, 20, 20, 0.3)';
      ctx.fillRect(0,0,CANVAS_W,CANVAS_H);
    }

    // Draw background (Procedural Office Corridor - Wide Feel)
    const panX = -this.player.yaw * 300;
    ctx.fillStyle = '#e2e8f0'; // Ceiling
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H/2);
    ctx.fillStyle = '#64748b'; // Floor
    ctx.fillRect(0, CANVAS_H/2, CANVAS_W, CANVAS_H/2);
    
    ctx.save();
    ctx.translate(panX, 0);
    ctx.fillStyle = '#ffffff'; // Lights
    for (let i = -5; i <= 5; i++) ctx.fillRect(CANVAS_W/2 + i*200 - 50, 40, 100, 20);
    ctx.fillStyle = '#475569'; // Baseboards
    ctx.fillRect(-1000, CANVAS_H/2, CANVAS_W+2000, 10);
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 3;
    const vpX = CANVAS_W/2;
    const vpY = CANVAS_H/2;
    for (let i = -4; i <= 4; i++) {
      ctx.beginPath();
      ctx.moveTo(vpX + i*400, vpY); ctx.lineTo(vpX + i*1600, 0); ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(vpX + i*400, vpY); ctx.lineTo(vpX + i*1600, CANVAS_H); ctx.stroke();
      if (Math.abs(i) > 0) {
        ctx.fillStyle = '#cbd5e1';
        ctx.beginPath();
        const dir = Math.sign(i);
        ctx.moveTo(vpX + i*400 - 30*dir, vpY + 10);
        ctx.lineTo(vpX + i*400 - 30*dir, vpY - 40);
        ctx.lineTo(vpX + i*400 - 80*dir, vpY - 60);
        ctx.lineTo(vpX + i*400 - 80*dir, vpY + 20);
        ctx.fill();
      }
    }
    ctx.strokeStyle = '#475569';
    ctx.beginPath(); ctx.moveTo(-1000, vpY); ctx.lineTo(CANVAS_W+1000, vpY); ctx.stroke();
    const zOffset = this.player.z % 2; 
    for (let d = 0; d < 20; d += 2) {
      const depth = d - zOffset;
      if (depth <= 0.1) continue;
      const scale = 200 / depth;
      const fy = CANVAS_H/2 + 15 * scale;
      if (fy > CANVAS_H/2 && fy < CANVAS_H) {
        ctx.beginPath(); ctx.moveTo(-1000, fy); ctx.lineTo(CANVAS_W+1000, fy); ctx.stroke();
      }
    }
    ctx.restore();

    // Sort renderables
    let renderables = this.enemies.filter(e => e.active);
    renderables.forEach(r => {
      r.relX = r.x - this.player.x;
      r.relZ = r.z - this.player.z;
    });
    renderables.sort((a,b) => b.relZ - a.relZ);

    const fov = 200;
    renderables.forEach(r => {
      const rotX = r.relX * Math.cos(-this.player.yaw) - r.relZ * Math.sin(-this.player.yaw);
      const rotZ = r.relX * Math.sin(-this.player.yaw) + r.relZ * Math.cos(-this.player.yaw);
      if (rotZ <= 0.1) return;

      const screenX = CANVAS_W / 2 + (rotX / rotZ) * fov;
      const scale = fov / rotZ;
      const scaleFactor = 0.015;
      
      let imgKey = 'image_21';
      if (r.type === 'boss') {
        switch(r.state) {
          case 'idle': imgKey = 'image_21'; break;
          case 'move': imgKey = (Math.floor(this.frame / 15) % 2 === 0) ? 'image_22' : 'image_23'; break;
          case 'spawn': imgKey = 'image_24'; break;
          case 'hit': imgKey = (Math.floor(this.frame / 3) % 2 === 0) ? 'image_25' : 'image_26'; break;
          case 'die': imgKey = (r.stateTimer < 60) ? 'image_27' : 'image_28'; break;
        }
      } else {
        switch(r.state) {
          case 'idle': imgKey = 'image_31'; break;
          case 'move': imgKey = (Math.floor(this.frame / 10) % 2 === 0) ? 'image_32' : 'image_33'; break;
          case 'attack': imgKey = 'image_34'; break;
          case 'hit': imgKey = (Math.floor(this.frame / 5) % 2 === 0) ? 'image_35' : 'image_36'; break;
          case 'die': imgKey = 'image_37'; break;
        }
      }
      
      const img = assets.get(imgKey);
      if (img) {
        ctx.save();
        // Blinking for dying mini
        if (r.type === 'mini' && r.state === 'die') {
          if (r.stateTimer > 30 && Math.floor(r.stateTimer / 5) % 2 === 0) ctx.globalAlpha = 0;
        }
        const drawW = img.width * scale * scaleFactor * r.scale;
        const drawH = img.height * scale * scaleFactor * r.scale;
        const floorY = CANVAS_H/2 + 15 * scale; 
        ctx.drawImage(img, screenX - drawW/2, floorY - drawH, drawW, drawH);
        ctx.restore();
      }
    });

    // Particles, Weapon, Laser, Crosshair, HUD...
    this.particles.forEach(pt => { ctx.fillStyle = pt.color; ctx.fillRect(pt.x, pt.y, 4, 4); });
    const armKey = this.player.weaponTimer > 0 ? 'image_42' : 'image_41';
    const weaponImg = assets.get(armKey);
    if (weaponImg) {
      const wWidth = 400; const wHeight = weaponImg.height * (wWidth / weaponImg.width);
      ctx.drawImage(weaponImg, (CANVAS_W - wWidth) / 2, CANVAS_H - wHeight + 10 + (this.player.weaponTimer > 0 ? 30 : 0), wWidth, wHeight);
    }
    if (this.laser > 0) {
      ctx.strokeStyle = 'rgba(255, 50, 50, 0.8)'; ctx.lineWidth = 4 + Math.random()*2; ctx.beginPath();
      ctx.moveTo(CANVAS_W/2 + 80, CANVAS_H - 100); ctx.lineTo(CANVAS_W/2, CANVAS_H/2); ctx.stroke();
    }
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.beginPath();
    ctx.moveTo(CANVAS_W/2 - 10, CANVAS_H/2); ctx.lineTo(CANVAS_W/2 + 10, CANVAS_H/2);
    ctx.moveTo(CANVAS_W/2, CANVAS_H/2 - 10); ctx.lineTo(CANVAS_W/2, CANVAS_H/2 + 10); ctx.stroke();
    ctx.fillStyle = '#fff'; ctx.font = '20px "Press Start 2P"';
    ctx.fillText(`HP: ${Math.ceil(this.player.hp)}`, 20, CANVAS_H - 20);
    if (this.boss.active) { ctx.fillStyle = '#f00'; ctx.fillText(`BOSS: ${Math.ceil(this.boss.hp)}`, CANVAS_W - 220, 40); }
    if (this.player.hp <= 0) { ctx.fillStyle = 'rgba(0,0,0,0.7)'; ctx.fillRect(0,0, CANVAS_W, CANVAS_H); ctx.fillStyle = '#f00'; ctx.textAlign = 'center'; ctx.fillText('GAME OVER', CANVAS_W/2, CANVAS_H/2); }
    if (this.winTimer > 0) { ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.fillRect(0,0, CANVAS_W, CANVAS_H); ctx.fillStyle = '#fbbf24'; ctx.textAlign = 'center'; ctx.fillText('STAGE 2 CLEAR!', CANVAS_W/2, CANVAS_H/2); }
    if (document.pointerLockElement !== this.game.canvas && this.winTimer === 0 && this.player.hp > 0) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(0, CANVAS_H/2 - 40, CANVAS_W, 80); ctx.fillStyle = '#fff'; ctx.font = '14px "Press Start 2P"'; ctx.textAlign = 'center'; ctx.fillText('CLICK TO LOCK MOUSE & PLAY', CANVAS_W/2, CANVAS_H/2 + 5);
    }
    ctx.restore();
  }
}
