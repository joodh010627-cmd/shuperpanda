import { CANVAS_W, CANVAS_H } from '../constants.js';

export class ControlsSceneStage3 {
  constructor(game) {
    this.game = game;
    this.frame = 0;
  }

  update(input) {
    this.frame++;
    if (this.frame > 40 && (input.anyKeyPressed() || input.justClicked())) {
      this.game.sound.menuSelect();
      this.game.switchScene('battle_stage3');
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
    ctx.fillText('STAGE 3: THE FINAL FIGHT', CANVAS_W / 2, 80);

    ctx.font = '14px "Press Start 2P"';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('퇴근을 가로막는 마지막 보스 이 교수', CANVAS_W / 2, 120);

    // Goal & Rule Section - Reduced height and simplified text
    const boxY = CANVAS_H / 2 - 20;
    const boxH = 180; // Reduced height
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(80, boxY - 40, CANVAS_W - 160, boxH);
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 2;
    ctx.strokeRect(80, boxY - 40, CANVAS_W - 160, boxH);

    ctx.font = '16px "Press Start 2P"';
    ctx.fillStyle = '#fff';
    ctx.fillText('상하좌우 이동: 방향키', CANVAS_W / 2, boxY + 10);
    ctx.fillText('레이저 공격: Z키', CANVAS_W / 2, boxY + 50);
    
    ctx.fillStyle = '#ff5555';
    ctx.fillText('마무리 일격: X키', CANVAS_W / 2, boxY + 95);
    ctx.font = '12px "Press Start 2P"';
    ctx.fillText('(이 교수의 체력이 거의 없을 때 활성화)', CANVAS_W / 2, boxY + 120);

    // Start Prompt - Ensure no overlap
    if (Math.floor(this.frame / 30) % 2 === 0) {
      ctx.fillStyle = '#fbbf24';
      ctx.font = '14px "Press Start 2P"';
      ctx.fillText('Press ANY KEY to Start', CANVAS_W / 2, CANVAS_H - 60);
    }
  }
}
