import { CANVAS_W, CANVAS_H } from '../constants.js';
import { drawPanda } from '../sprites.js';

export class TitleScene {
  constructor(game) {
    this.game = game;
    this.frame = 0;
    this.buildings = [];
    for (let i = 0; i < 20; i++) {
      this.buildings.push({
        x: i * 55 - 30,
        w: 30 + Math.random() * 30,
        h: 80 + Math.random() * 120,
      });
    }
  }

  update(input) {
    this.frame++;
    if (this.frame > 60 && input.anyKeyPressed()) {
      this.game.sound.resume();
      this.game.sound.menuSelect();
      this.game.switchScene('cutscene_stage1');
    }
  }

  render(ctx) {
    const grad = ctx.createLinearGradient(0, 0, 0, CANVAS_H);
    grad.addColorStop(0, '#1a0a2e');
    grad.addColorStop(0.3, '#6b1839');
    grad.addColorStop(0.5, '#c2185b');
    grad.addColorStop(0.7, '#ff6f00');
    grad.addColorStop(1, '#1a1a2e');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    // Sun
    ctx.fillStyle = '#ff6f00';
    ctx.beginPath();
    ctx.arc(CANVAS_W / 2, CANVAS_H * 0.45, 60, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffab00';
    ctx.beginPath();
    ctx.arc(CANVAS_W / 2, CANVAS_H * 0.45, 40, 0, Math.PI * 2);
    ctx.fill();

    // Buildings
    this.buildings.forEach(b => {
      ctx.fillStyle = `hsl(0,0%,${6 + Math.random() * 4}%)`;
      ctx.fillRect(b.x, CANVAS_H - b.h - 50, b.w, b.h + 50);
      ctx.fillStyle = 'rgba(255,200,50,0.25)';
      for (let wy = CANVAS_H - b.h - 40; wy < CANVAS_H - 60; wy += 12) {
        for (let wx = b.x + 4; wx < b.x + b.w - 4; wx += 8) {
          if (Math.random() > 0.4) ctx.fillRect(wx, wy, 3, 5);
        }
      }
    });

    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, CANVAS_H - 50, CANVAS_W, 50);

    // Panda
    ctx.save();
    ctx.translate(0, Math.sin(this.frame * 0.03) * 8);
    drawPanda(ctx, CANVAS_W * 0.72, CANVAS_H * 0.42, -1, 'jump', this.frame);
    ctx.restore();

    // Title
    ctx.save();
    ctx.textAlign = 'center';
    ctx.font = '14px "Press Start 2P"';
    ctx.fillStyle = '#aaa';
    ctx.fillText('SHUPER PANDA RETURNS', CANVAS_W / 2 - 60, CANVAS_H * 0.28);
    ctx.font = 'bold 40px "Press Start 2P", sans-serif';
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 6;
    ctx.strokeText('슈퍼 판다', CANVAS_W / 2 - 60, CANVAS_H * 0.40);
    ctx.strokeText('리턴즈', CANVAS_W / 2 - 60, CANVAS_H * 0.50);
    ctx.fillStyle = '#fff';
    ctx.fillText('슈퍼 판다', CANVAS_W / 2 - 60, CANVAS_H * 0.40);
    ctx.fillText('리턴즈', CANVAS_W / 2 - 60, CANVAS_H * 0.50);

    if (this.frame > 60 && Math.floor(this.frame / 30) % 2 === 0) {
      ctx.font = '16px "Press Start 2P"';
      ctx.fillStyle = '#fbbf24';
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 3;
      ctx.strokeText('PRESS ANY KEY TO START', CANVAS_W / 2 - 60, CANVAS_H * 0.72);
      ctx.fillText('PRESS ANY KEY TO START', CANVAS_W / 2 - 60, CANVAS_H * 0.72);
    }
    ctx.restore();

    ctx.font = '8px "Press Start 2P"';
    ctx.fillStyle = '#555';
    ctx.textAlign = 'center';
    ctx.fillText('© 2026 SHUPER PANDA STUDIOS', CANVAS_W / 2, CANVAS_H - 15);
  }
}
