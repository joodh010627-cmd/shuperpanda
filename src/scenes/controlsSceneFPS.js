import { CANVAS_W, CANVAS_H } from '../constants.js';
import { assets } from '../assetLoader.js';

export class ControlsSceneFPS {
  constructor(game) {
    this.game = game;
    this.frame = 0;
  }

  update(input) {
    this.frame++;
    if (this.frame > 40 && (input.anyKeyPressed())) {
      this.game.sound.menuSelect();
      this.game.switchScene('battle_stage2');
    }
  }

  render(ctx) {
    // Background
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    // Grid pattern
    ctx.strokeStyle = 'rgba(59, 130, 246, 0.08)';
    ctx.lineWidth = 1;
    for (let x = 0; x < CANVAS_W; x += 40) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, CANVAS_H); ctx.stroke();
    }
    for (let y = 0; y < CANVAS_H; y += 40) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(CANVAS_W, y); ctx.stroke();
    }

    // Title
    ctx.font = '24px "Press Start 2P"';
    ctx.fillStyle = '#fbbf24';
    ctx.textAlign = 'center';
    ctx.fillText('STAGE 2 조작 안내', CANVAS_W / 2, 60);
    
    ctx.font = '14px "Press Start 2P"';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('커피 더 헛의 습격을 막아내세요!', CANVAS_W / 2, 100);

    // Panda arm demo
    const armImg = assets.get('image_41');
    if (armImg) {
      const scale = 300 / armImg.width;
      ctx.drawImage(armImg, 50, 150, armImg.width * scale, armImg.height * scale);
    }

    // Controls layout
    const controls = [
      { key: 'W,A,S,D', desc: '이동 및 옆걸음', y: 180 },
      { key: 'MOUSE', desc: '시점 회전', y: 250 },
      { key: 'CLICK', desc: '레이저 발사', y: 320 },
      { key: 'ESC', desc: '마우스 커서 해제', y: 390 },
    ];

    ctx.textAlign = 'left';
    controls.forEach(c => {
      // Key box
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(340, c.y - 24, 150, 40);
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 2;
      ctx.strokeRect(340, c.y - 24, 150, 40);
      
      ctx.font = '14px "Press Start 2P"';
      ctx.fillStyle = '#60a5fa';
      ctx.textAlign = 'center';
      ctx.fillText(c.key, 340 + 75, c.y + 4);

      // Description
      ctx.fillStyle = '#e2e8f0';
      ctx.textAlign = 'left';
      ctx.fillText(c.desc, 510, c.y + 4);
    });

    // Continue
    if (Math.floor(this.frame / 25) % 2 === 0) {
      ctx.font = '18px "Press Start 2P"';
      ctx.fillStyle = '#fbbf24';
      ctx.textAlign = 'center';
      ctx.fillText('PRESS ANY KEY TO START', CANVAS_W / 2, CANVAS_H - 50);
    }

    ctx.textAlign = 'left';
  }
}
