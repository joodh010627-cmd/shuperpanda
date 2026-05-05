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
    
    this.enemies = [
      { id: 1, x: -3, z: 15, type: 'mini', hp: 20, active: true, scale: 0.8 },
      { id: 2, x: 3, z: 16, type: 'mini', hp: 20, active: true, scale: 0.8 },
      { id: 3, x: -5, z: 20, type: 'mini', hp: 20, active: true, scale: 0.8 },
      { id: 4, x: 5, z: 22, type: 'mini', hp: 20, active: true, scale: 0.8 },
      { id: 5, x: 0, z: 18, type: 'boss', hp: 300, active: true, scale: 2.5, attackTimer: 100 },
    ];

    this.projectiles = [];
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

    // Victory check
    const boss = this.enemies.find(e => e.type === 'boss');
    if (boss && !boss.active && this.enemies.filter(e=>e.active).length === 0) {
      this.winTimer++;
      if (this.winTimer > 120) {
        document.exitPointerLock?.();
        this.game.switchScene('title');
      }
      return;
    }

    // Player Movement (WASD + Mouse)
    const rotSpeed = 0.002;
    const moveSpeed = 0.1;

    // Rotation via Mouse
    const mouseDeltaX = input.getMouseDeltaX();
    this.player.yaw += mouseDeltaX * rotSpeed;
    
    // Limit yaw so player doesn't look completely away from the corridor
    this.player.yaw = Math.max(-0.8, Math.min(0.8, this.player.yaw));

    // Movement via WASD
    let moveZ = 0;
    let moveX = 0;

    if (input.isDown('KeyW') || input.isDown('ArrowUp')) moveZ += moveSpeed;
    if (input.isDown('KeyS') || input.isDown('ArrowDown')) moveZ -= moveSpeed;
    if (input.isDown('KeyA')) moveX -= moveSpeed;
    if (input.isDown('KeyD')) moveX += moveSpeed;

    // Simple collision bounds for corridor
    this.player.x += moveX;
    this.player.z += moveZ;
    this.player.x = Math.max(-4, Math.min(4, this.player.x));
    this.player.z = Math.max(0, Math.min(25, this.player.z));

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

    // Projectiles
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      let p = this.projectiles[i];
      p.z -= 0.3;
      if (p.z <= this.player.z + 1) {
        // Hit player
        if (Math.abs(p.x - this.player.x) < 2) {
          this.player.hp -= 10;
          this.player.hitTimer = 10;
          this.shake = 10;
          this.game.sound.hit();
          this._spawnParticles(0, 0, 1); // Hit center
        }
        this.projectiles.splice(i, 1);
      }
    }

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
        if (dist < 2) {
          // Melee attack
          if (this.frame % 30 === 0) {
            this.player.hp -= 5;
            this.player.hitTimer = 5;
            this.shake = 5;
          }
        } else {
          // Move towards player
          e.x += (dx / dist) * 0.05;
          e.z += (dz / dist) * 0.05;
        }
      } else if (e.type === 'boss') {
        // Keep distance around 10
        if (dist < 8) e.z += 0.08;
        else if (dist > 12) e.z -= 0.08;

        e.x += (dx / dist) * 0.01;

        // Attack
        e.attackTimer--;
        if (e.attackTimer <= 0) {
          e.attackTimer = 80 + Math.random() * 40;
          this.projectiles.push({ x: e.x, y: -1, z: e.z });
          // Sound effect for boss throw (reuse tongue or hit)
          this.game.sound.tongue();
        }
      }
    });
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

    // Draw background (Office Corridor)
    const bg = assets.get('cutscene_stage2');
    if (bg) {
      // Pan background slightly based on yaw
      const panX = -this.player.yaw * 200;
      // Draw scaled up to allow panning
      ctx.drawImage(bg, panX - 50, -50, CANVAS_W + 100, CANVAS_H + 100);
    } else {
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    }

    // Sort renderables (enemies + projectiles) by depth (z)
    let renderables = [];
    this.enemies.filter(e => e.active).forEach(e => renderables.push({ ...e, isObj: 'enemy' }));
    this.projectiles.forEach(p => renderables.push({ ...p, isObj: 'proj' }));

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
          
          const floorY = CANVAS_H/2 + 50 * scale; 
          const drawY = floorY - drawH;
          ctx.drawImage(img, screenX - drawW/2, drawY, drawW, drawH);
          ctx.restore();
        }
      } else if (r.isObj === 'proj') {
        const scale = (fov / rotZ);
        const size = 20 * scale;
        const floorY = CANVAS_H/2 + 50 * scale;
        // Projectiles fly a bit higher
        ctx.fillStyle = '#4a2f1d';
        ctx.beginPath();
        ctx.arc(screenX, floorY - 30*scale, size/2, 0, Math.PI*2);
        ctx.fill();
        ctx.strokeStyle = '#2d1b10';
        ctx.lineWidth = 2;
        ctx.stroke();
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
      const wWidth = 700;
      const wHeight = weaponImg.height * (wWidth / weaponImg.width);
      // Centered at bottom
      const wx = (CANVAS_W - wWidth) / 2;
      const wy = CANVAS_H - wHeight + 150 + (this.player.weaponTimer > 0 ? 30 : 0);
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
