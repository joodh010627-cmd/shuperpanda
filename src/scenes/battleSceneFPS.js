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
    this.boss = { id: 'boss', x: 0, z: 25, type: 'boss', hp: 300, active: true, scale: 2.0 };
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
    const activeMinis = this.enemies.filter(e => e.type === 'mini' && e.active).length;
    if (activeMinis === 0 && this.wave === 1) {
      this._spawnWave();
    }

    // Victory check
    if (!this.boss.active && activeMinis === 0 && this.wave === 2) {
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
    this.player.yaw = Math.max(-1.0, Math.min(1.0, this.player.yaw)); // Wider look angle

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

    // No projectiles in this version

    // Particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      let pt = this.particles[i];
      pt.life--;
      pt.x += pt.vx; pt.y += pt.vy; pt.vy += 0.5; // gravity
      if (pt.life <= 0) this.particles.splice(i, 1);
    }

    // Enemy AI
    this.enemies.forEach(e => {
      if (!e.active) return;
      const dx = this.player.x - e.x;
      const dz = this.player.z - e.z;
      const dist = Math.sqrt(dx*dx + dz*dz);
      
      if (e.type === 'mini') {
        if (dist < 1.5) {
          // Melee attack
          if (this.frame % 30 === 0) {
            this.player.hp -= 5;
            this.player.hitTimer = 5;
            this.shake = 5;
            this.game.sound.hit();
          }
        } else {
          // Move towards player
          e.x += (dx / dist) * 0.05;
          e.z += (dz / dist) * 0.05;
        }
      } else if (e.type === 'boss') {
        // Boss moves side to side slightly
        e.x = Math.sin(this.frame * 0.02) * 2;
        // Keep distance around 15-20
        if (dist < 15) e.z += 0.05;
        else if (dist > 20) e.z -= 0.05;
      }
    });
  }

  _spawnWave() {
    this.wave++;
    if (this.wave > 2) return;
    for (let i = 0; i < 5; i++) {
      this.enemies.push({
        id: `mini_${this.wave}_${i}`,
        x: (Math.random() - 0.5) * 8, 
        z: this.player.z + 10 + Math.random() * 5,
        type: 'mini',
        hp: 1, // One hit kill
        active: true,
        scale: 0.8
      });
    }
  }

  _checkHit() {
    // Crosshair is always center screen
    // We check which enemy is rendered closest to center
    let hitEnemy = null;
    let closestDist = Infinity;

    this.enemies.forEach(e => {
      if (!e.active) return;
      
      // Calculate relative position
      const relX = e.x - this.player.x;
      const relZ = e.z - this.player.z;
      if (relZ <= 0.1) return; // Behind player

      // Project to 2D
      const fov = 200; // Focal length
      // Rotate by yaw
      const rotX = relX * Math.cos(-this.player.yaw) - relZ * Math.sin(-this.player.yaw);
      const rotZ = relX * Math.sin(-this.player.yaw) + relZ * Math.cos(-this.player.yaw);
      
      if (rotZ <= 0.1) return;

      const screenX = CANVAS_W / 2 + (rotX / rotZ) * fov;
      const scale = (fov / rotZ) * e.scale;
      const size = 60 * scale;

      // Center is CANVAS_W/2, CANVAS_H/2
      const cx = CANVAS_W/2;
      const cy = CANVAS_H/2;
      
      // Enemy rect
      const left = screenX - size/2;
      const right = screenX + size/2;
      // y depends on height, assuming they touch the ground
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
      hitEnemy.hp -= 20;
      this._spawnParticles(0, 0, 10); // Spawning in center screen
      if (hitEnemy.hp <= 0) {
        hitEnemy.active = false;
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
        color: '#4a2f1d' // Coffee brown
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

    // Draw background (Procedural Office Corridor)
    // Pan background slightly based on yaw
    const panX = -this.player.yaw * 300;
    
    // Ceiling
    ctx.fillStyle = '#e2e8f0';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H/2);
    
    // Floor
    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(0, CANVAS_H/2, CANVAS_W, CANVAS_H/2);
    
    // Draw perspective walls to simulate corridor
    ctx.save();
    ctx.translate(panX, 0);
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 3;
    
    // Perspective lines
    const vpX = CANVAS_W/2;
    const vpY = CANVAS_H/2;
    
    for (let i = -3; i <= 3; i++) {
      ctx.beginPath();
      ctx.moveTo(vpX + i*200, vpY);
      ctx.lineTo(vpX + i*800, CANVAS_H);
      ctx.stroke();
      
      ctx.beginPath();
      ctx.moveTo(vpX + i*200, vpY);
      ctx.lineTo(vpX + i*800, 0);
      ctx.stroke();
    }
    
    // Horizon line
    ctx.beginPath();
    ctx.moveTo(-1000, vpY);
    ctx.lineTo(CANVAS_W+1000, vpY);
    ctx.stroke();

    // Floor depth lines (moves with player Z)
    const zOffset = this.player.z % 2; // Grid size of 2
    for (let d = 0; d < 15; d += 2) {
      const depth = d - zOffset;
      if (depth <= 0.1) continue;
      const scale = 200 / depth;
      const fy = CANVAS_H/2 + 15 * scale;
      if (fy > CANVAS_H/2 && fy < CANVAS_H) {
        ctx.beginPath();
        ctx.moveTo(-1000, fy);
        ctx.lineTo(CANVAS_W+1000, fy);
        ctx.stroke();
      }
    }
    ctx.restore();

    // Sort renderables (enemies) by depth (z)
    let renderables = [];
    this.enemies.filter(e => e.active).forEach(e => renderables.push({ ...e, isObj: 'enemy' }));

    renderables.forEach(r => {
      r.relX = r.x - this.player.x;
      r.relZ = r.z - this.player.z;
    });
    
    // Sort descending Z (furthest first)
    renderables.sort((a,b) => b.relZ - a.relZ);

    const fov = 200;
    
    renderables.forEach(r => {
      if (r.relZ <= 0.1) return;

      const rotX = r.relX * Math.cos(-this.player.yaw) - r.relZ * Math.sin(-this.player.yaw);
      const rotZ = r.relX * Math.sin(-this.player.yaw) + r.relZ * Math.cos(-this.player.yaw);
      
      if (rotZ <= 0.1) return;

      const screenX = CANVAS_W / 2 + (rotX / rotZ) * fov;

      if (r.isObj === 'enemy') {
        let imgKey;
        if (r.type === 'boss') {
          const frameIndex = 21 + Math.floor(this.frame / 10) % 8;
          imgKey = `image_${frameIndex}`;
        } else {
          const frameIndex = 31 + Math.floor(this.frame / 8) % 7;
          imgKey = `image_${frameIndex}`;
        }
        const img = assets.get(imgKey);
        
        if (img) {
          ctx.save();
          const scale = fov / rotZ;
          const scaleFactor = 0.015; // Native image scaling adjustment
          const drawW = img.width * scale * scaleFactor * r.scale;
          const drawH = img.height * scale * scaleFactor * r.scale;
          
          // Fix: Camera height is much lower so sprites don't drop off the bottom of the screen
          const cameraHeight = 15; 
          const floorY = CANVAS_H/2 + cameraHeight * scale; 
          const drawY = floorY - drawH;
          ctx.drawImage(img, screenX - drawW/2, drawY, drawW, drawH);
          ctx.restore();
        }
      }
    });

    // Draw Particles
    this.particles.forEach(pt => {
      ctx.fillStyle = pt.color;
      ctx.fillRect(pt.x, pt.y, 4, 4);
    });

    // Weapon (Panda Arm)
    const armKey = this.player.weaponTimer > 0 ? 'image_42' : 'image_41';
    const weaponImg = assets.get(armKey);
    if (weaponImg) {
      const wWidth = 400; // Smaller size for the tumbler
      const wHeight = weaponImg.height * (wWidth / weaponImg.width);
      // Centered at bottom
      const wx = (CANVAS_W - wWidth) / 2;
      const wy = CANVAS_H - wHeight + 10 + (this.player.weaponTimer > 0 ? 30 : 0);
      
      ctx.drawImage(weaponImg, wx, wy, wWidth, wHeight);
    }

    // Laser
    if (this.laser > 0) {
      ctx.strokeStyle = 'rgba(255, 50, 50, 0.8)';
      ctx.lineWidth = 4 + Math.random()*2;
      ctx.beginPath();
      // From right paw holding tumbler
      ctx.moveTo(CANVAS_W/2 + 80, CANVAS_H - 100);
      ctx.lineTo(CANVAS_W/2, CANVAS_H/2);
      ctx.stroke();
    }

    // Crosshair
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(CANVAS_W/2 - 10, CANVAS_H/2); ctx.lineTo(CANVAS_W/2 + 10, CANVAS_H/2);
    ctx.moveTo(CANVAS_W/2, CANVAS_H/2 - 10); ctx.lineTo(CANVAS_W/2, CANVAS_H/2 + 10);
    ctx.stroke();

    // HUD
    ctx.fillStyle = '#fff';
    ctx.font = '20px "Press Start 2P"';
    ctx.fillText(`HP: ${Math.ceil(this.player.hp)}`, 20, CANVAS_H - 20);
    const boss = this.enemies.find(e => e.type === 'boss');
    if (boss && boss.active) {
      ctx.fillStyle = '#f00';
      ctx.fillText(`BOSS: ${Math.ceil(boss.hp)}`, CANVAS_W - 220, 40);
    }

    if (this.player.hp <= 0) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0,0, CANVAS_W, CANVAS_H);
      ctx.fillStyle = '#f00';
      ctx.textAlign = 'center';
      ctx.fillText('GAME OVER', CANVAS_W/2, CANVAS_H/2);
    }

    if (this.winTimer > 0) {
      ctx.fillStyle = 'rgba(255,255,255,0.3)';
      ctx.fillRect(0,0, CANVAS_W, CANVAS_H);
      ctx.fillStyle = '#fbbf24';
      ctx.textAlign = 'center';
      ctx.fillText('STAGE 2 CLEAR!', CANVAS_W/2, CANVAS_H/2);
    }

    // Pointer Lock Instructions
    if (document.pointerLockElement !== this.game.canvas && this.winTimer === 0 && this.player.hp > 0) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, CANVAS_H/2 - 40, CANVAS_W, 80);
      ctx.fillStyle = '#fff';
      ctx.font = '14px "Press Start 2P"';
      ctx.textAlign = 'center';
      ctx.fillText('CLICK TO LOCK MOUSE & PLAY', CANVAS_W/2, CANVAS_H/2 + 5);
    }

    ctx.restore();
  }
}
