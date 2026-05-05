import { CANVAS_W, CANVAS_H } from '../constants.js';
import { drawPanda } from '../sprites.js';

export class ControlsScene {
  constructor(game) {
    this.game = game;
    this.frame = 0;
  }

  update(input) {
    this.frame++;
    if (this.frame > 40 && (input.justPressed('Enter') || input.justPressed('Space') || input.justPressed('KeyZ'))) {
      this.game.sound.menuSelect();
      this.game.switchScene('battle_stage1');
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
    ctx.fillText('조작 안내', CANVAS_W / 2, 50);

    // Panda demo (Scaled up)
    ctx.save();
    ctx.translate(160, 320);
    ctx.scale(1.5, 1.5);
    drawPanda(ctx, 0, 0, 1, 'idle', this.frame);
    ctx.restore();

    // Controls layout (spaced out for larger text)
    const controls = [
      { key: '← →', desc: '이동', y: 120 },
      { key: '←←/→→', desc: '대시 (더블 탭)', y: 170 },
      { key: '↑', desc: '점프', y: 220 },
      { key: '↓', desc: '방어 (데미지 감소)', y: 270 },
      { key: 'Z', desc: '펀치 (빠른 공격)', y: 320 },
      { key: 'X', desc: '발차기 (강공격)', y: 370 },
      { key: 'C', desc: '레이저 (게이지 꽉 찰 때)', y: 420 },
    ];

    ctx.textAlign = 'left';
    controls.forEach(c => {
      // Key box
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(340, c.y - 24, 120, 36);
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 2;
      ctx.strokeRect(340, c.y - 24, 120, 36);
      ctx.font = '16px "Press Start 2P"';
      ctx.fillStyle = '#60a5fa';
      ctx.fillText(c.key, 350, c.y + 4);

      // Description
      ctx.fillStyle = '#e2e8f0';
      ctx.font = '16px "Press Start 2P"';
      ctx.fillText(c.desc, 480, c.y + 4);
    });

    // Gauge info
    ctx.fillStyle = '#f59e0b';
    ctx.font = '14px "Press Start 2P"';
    ctx.textAlign = 'center';
    ctx.fillText('💡 피격 시 게이지가 충전됩니다', CANVAS_W / 2 + 60, 480);
    ctx.fillText('게이지가 꽉 차면 C키로 필살기!', CANVAS_W / 2 + 60, 510);

    // Continue
    if (Math.floor(this.frame / 25) % 2 === 0) {
      ctx.font = '18px "Press Start 2P"';
      ctx.fillStyle = '#fbbf24';
      ctx.textAlign = 'center';
      ctx.fillText('PRESS Z TO START BATTLE', CANVAS_W / 2, CANVAS_H - 40);
    }

    ctx.textAlign = 'left';
  }
}
