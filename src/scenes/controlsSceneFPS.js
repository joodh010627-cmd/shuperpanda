import { CANVAS_W, CANVAS_H } from '../constants.js';
import { assets } from '../assetLoader.js';

export class ControlsSceneFPS {
  constructor(game) {
    this.game = game;
    this.frame = 0;
  }

  update(input) {
    this.frame++;
    if (this.frame > 40 && (input.anyKeyPressed() || input.justClicked())) {
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
    ctx.fillText('STAGE 2: COFFEE THE HUT', CANVAS_W / 2, 80);

    ctx.font = '14px "Press Start 2P"';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('최종 보스를 향한 복도의 사투', CANVAS_W / 2, 120);

    // Goal & Rule Section
    const boxY = CANVAS_H / 2 - 20;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(80, boxY - 60, CANVAS_W - 160, 200);
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 2;
    ctx.strokeRect(80, boxY - 60, CANVAS_W - 160, 200);

    ctx.font = '16px "Press Start 2P"';
    ctx.fillStyle = '#fff';
    ctx.fillText('미션: 마우스로 조준하고 클릭하여', CANVAS_W / 2, boxY);
    ctx.fillText('커피 더 헛을 무찌르세요!', CANVAS_W / 2, boxY + 35);
    
    ctx.font = '16px "Press Start 2P"';
    ctx.fillStyle = '#ff5555';
    ctx.fillText('※ 주의: 미니 커피 더 헛이 살아 있을 때', CANVAS_W / 2, boxY + 100);
    ctx.fillText('보스는 무적 상태입니다.', CANVAS_W / 2, boxY + 130);

    // Start Prompt
    if (Math.floor(this.frame / 30) % 2 === 0) {
      ctx.fillStyle = '#fbbf24';
      ctx.font = '14px "Press Start 2P"';
      ctx.fillText('Press SPACE or CLICK to Start', CANVAS_W / 2, CANVAS_H - 60);
    }
  }
}
