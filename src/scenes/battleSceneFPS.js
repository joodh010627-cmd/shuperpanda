import { CANVAS_W, CANVAS_H } from '../constants.js';
import { assets } from '../assetLoader.js';

const MAP_SIZE = 12;
const MAP = [
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 1, 0, 0, 0, 0, 0, 0, 1, 0, 1],
  [1, 0, 1, 0, 0, 0, 0, 0, 0, 1, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 1, 0, 0, 0, 0, 0, 0, 1, 0, 1],
  [1, 0, 1, 0, 0, 0, 0, 0, 0, 1, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
];

export class BattleSceneFPS {
  constructor(game) {
    this.game = game;
    this.player = {
      x: 6, y: 6,
      dir: 0,
      hp: 100,
      weaponTimer: 0,
    };
    
    this.enemies = [
      { x: 2, y: 2, type: 'mini', hp: 20, active: true },
      { x: 10, y: 2, type: 'mini', hp: 20, active: true },
      { x: 2, y: 10, type: 'mini', hp: 20, active: true },
      { x: 10, y: 10, type: 'mini', hp: 20, active: true },
      { x: 6, y: 1, type: 'boss', hp: 200, active: true },
    ];

    this.zBuffer = new Float32Array(CANVAS_W);
    this.frame = 0;
    this.shake = 0;
    this.winTimer = 0;
  }

  update(input) {
    this.frame++;
    if (this.shake > 0) this.shake--;
    
    if (this.player.hp <= 0) {
      if (this.frame % 60 === 0) this.game.switchScene('title');
      return;
    }

    // Victory check
    const boss = this.enemies.find(e => e.type === 'boss');
    if (boss && !boss.active) {
      this.winTimer++;
      if (this.winTimer > 120) this.game.switchScene('title');
      return;
    }

    // Player Movement (WASD + Mouse)
    const rotSpeed = 0.003; // Adjusted for mouse delta
    const moveSpeed = 0.08;

    // Rotation via Mouse
    const mouseDeltaX = input.getMouseDeltaX();
    this.player.dir += mouseDeltaX * rotSpeed;

    // Movement via WASD
    const moveX = Math.cos(this.player.dir) * moveSpeed;
    const moveY = Math.sin(this.player.dir) * moveSpeed;
    const strafeX = Math.cos(this.player.dir + Math.PI / 2) * moveSpeed;
    const strafeY = Math.sin(this.player.dir + Math.PI / 2) * moveSpeed;

    if (input.isDown('KeyW') || input.isDown('ArrowUp')) {
      if (MAP[Math.floor(this.player.y)][Math.floor(this.player.x + moveX)] === 0) this.player.x += moveX;
      if (MAP[Math.floor(this.player.y + moveY)][Math.floor(this.player.x)] === 0) this.player.y += moveY;
    }
    if (input.isDown('KeyS') || input.isDown('ArrowDown')) {
      if (MAP[Math.floor(this.player.y)][Math.floor(this.player.x - moveX)] === 0) this.player.x -= moveX;
      if (MAP[Math.floor(this.player.y - moveY)][Math.floor(this.player.x)] === 0) this.player.y -= moveY;
    }
    if (input.isDown('KeyA')) {
      if (MAP[Math.floor(this.player.y)][Math.floor(this.player.x - strafeX)] === 0) this.player.x -= strafeX;
      if (MAP[Math.floor(this.player.y - strafeY)][Math.floor(this.player.x)] === 0) this.player.y -= strafeY;
    }
    if (input.isDown('KeyD')) {
      if (MAP[Math.floor(this.player.y)][Math.floor(this.player.x + strafeX)] === 0) this.player.x += strafeX;
      if (MAP[Math.floor(this.player.y + strafeY)][Math.floor(this.player.x)] === 0) this.player.y += strafeY;
    }

    // Shooting (Left Click or Z)
    if (this.player.weaponTimer > 0) this.player.weaponTimer--;
    if ((input.justPressed('KeyZ') || input.justClicked()) && this.player.weaponTimer === 0) {
      // Request Pointer Lock on first click
      if (document.pointerLockElement !== this.game.canvas) {
        this.game.canvas.requestPointerLock();
      }
      this.player.weaponTimer = 10;
      this.game.sound.laser();
      this.shake = 5;
      this._checkHit();
    }

    // Enemy AI
    this.enemies.forEach(e => {
      if (!e.active) return;
      const dx = this.player.x - e.x;
      const dy = this.player.y - e.y;
      const dist = Math.sqrt(dx*dx + dy*dy);
      
      if (dist < 0.6) {
        this.player.hp -= 0.2; // Reduced damage
        this.shake = 2;
      } else if (dist < 8) {
        e.x += (dx / dist) * 0.015; // Slower enemies
        e.y += (dy / dist) * 0.015;
      }
    });
  }

  _checkHit() {
    // Check if any enemy is in the center of the screen
    this.enemies.forEach(e => {
      if (!e.active) return;
      const dx = e.x - this.player.x;
      const dy = e.y - this.player.y;
      
      // Relative angle
      let angle = Math.atan2(dy, dx) - this.player.dir;
      while (angle < -Math.PI) angle += Math.PI * 2;
      while (angle > Math.PI) angle -= Math.PI * 2;

      if (Math.abs(angle) < 0.2) {
        e.hp -= 10;
        if (e.hp <= 0) {
          e.active = false;
          this.game.sound.hit();
        }
      }
    });
  }

  render(ctx) {
    ctx.save();
    if (this.shake > 0) ctx.translate((Math.random()-0.5)*10, (Math.random()-0.5)*10);

    // Ceiling and Floor (Brighter office colors)
    ctx.fillStyle = '#e2e8f0'; // Light ceiling
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H / 2);
    ctx.fillStyle = '#94a3b8'; // Grey office carpet
    ctx.fillRect(0, CANVAS_H / 2, CANVAS_W, CANVAS_H / 2);

    // Raycasting
    for (let x = 0; x < CANVAS_W; x += 4) {
      const rayAngle = this.player.dir - 0.6 + (x / CANVAS_W) * 1.2;
      const rayDirX = Math.cos(rayAngle);
      const rayDirY = Math.sin(rayAngle);

      let dist = 0;
      let hit = false;
      while (!hit && dist < 15) {
        dist += 0.05;
        const testX = Math.floor(this.player.x + rayDirX * dist);
        const testY = Math.floor(this.player.y + rayDirY * dist);
        if (testX < 0 || testX >= MAP_SIZE || testY < 0 || testY >= MAP_SIZE || MAP[testY][testX] === 1) {
          hit = true;
        }
      }

      const correctedDist = dist * Math.cos(rayAngle - this.player.dir);
      this.zBuffer[x] = correctedDist;
      this.zBuffer[x+1] = correctedDist;
      this.zBuffer[x+2] = correctedDist;
      this.zBuffer[x+3] = correctedDist;

      const wallHeight = CANVAS_H / (correctedDist + 0.1);
      // Brighter office walls (Blueish-grey)
      const brightness = Math.max(0, 200 - dist * 10);
      ctx.fillStyle = `rgb(${brightness*0.8}, ${brightness*0.9}, ${brightness})`;
      ctx.fillRect(x, (CANVAS_H - wallHeight) / 2, 4, wallHeight);
    }

    // Sprite Rendering
    const sortedEnemies = this.enemies
      .filter(e => e.active)
      .map(e => {
        const dx = e.x - this.player.x;
        const dy = e.y - this.player.y;
        return { ...e, dist: dx*dx + dy*dy };
      })
      .sort((a, b) => b.dist - a.dist);

    sortedEnemies.forEach(e => {
      const dx = e.x - this.player.x;
      const dy = e.y - this.player.y;
      
      let angle = Math.atan2(dy, dx) - this.player.dir;
      while (angle < -Math.PI) angle += Math.PI * 2;
      while (angle > Math.PI) angle -= Math.PI * 2;

      const dist = Math.sqrt(e.dist);
      if (angle > -1 && angle < 1 && dist > 0.5) {
        const screenX = (angle + 0.6) / 1.2 * CANVAS_W;
        const spriteSize = CANVAS_H / dist;
        const img = assets.get(e.type === 'boss' ? 'coffee_boss' : 'mini_coffee');
        
        if (img && this.zBuffer[Math.floor(screenX)] > dist) {
          // Add transparency filter for sprites with solid backgrounds
          ctx.save();
          // Simple transparency trick: don't draw if pixel is pure grey (assuming background)
          ctx.drawImage(img, screenX - spriteSize / 2, (CANVAS_H - spriteSize) / 2, spriteSize, spriteSize);
          ctx.restore();
        }
      }
    });

    // Weapon
    const weaponImg = assets.get('panda_arm');
    if (weaponImg) {
      const wWidth = 400, wHeight = 400;
      const wx = CANVAS_W - wWidth + Math.sin(this.frame * 0.1) * 10;
      const wy = CANVAS_H - wHeight + 50 + (this.player.weaponTimer > 0 ? 20 : 0);
      ctx.drawImage(weaponImg, wx, wy, wWidth, wHeight);
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
    if (sortedEnemies.find(e => e.type === 'boss')) {
      ctx.fillStyle = '#f00';
      ctx.fillText(`BOSS: ${Math.ceil(sortedEnemies.find(e => e.type === 'boss').hp)}`, CANVAS_W - 220, 40);
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
