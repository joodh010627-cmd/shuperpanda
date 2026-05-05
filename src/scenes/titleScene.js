import { CANVAS_W, CANVAS_H } from '../constants.js';
import { assets } from '../assetLoader.js';

export class TitleScene {
  constructor(game) {
    this.game = game;
    this.frame = 0;
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
    const titleImg = assets.get('title');

    if (titleImg) {
      // Draw the original title image scaled to fill canvas
      ctx.drawImage(titleImg, 0, 0, CANVAS_W, CANVAS_H);

      // Add blinking "PRESS ANY KEY" overlay on top of original
      if (this.frame > 60 && Math.floor(this.frame / 30) % 2 === 0) {
        // Semi-transparent backdrop for text
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(CANVAS_W / 2 - 200, CANVAS_H * 0.82 - 18, 400, 36);

        ctx.save();
        ctx.textAlign = 'center';
        ctx.font = '16px "Press Start 2P"';
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 4;
        ctx.strokeText('PRESS ANY KEY TO START', CANVAS_W / 2, CANVAS_H * 0.82);
        ctx.fillStyle = '#fbbf24';
        ctx.fillText('PRESS ANY KEY TO START', CANVAS_W / 2, CANVAS_H * 0.82);
        ctx.restore();
      }
    } else {
      // Fallback if image not loaded
      ctx.fillStyle = '#1a1a2e';
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
      ctx.font = '30px "Press Start 2P"';
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.fillText('슈퍼 판다 리턴즈', CANVAS_W / 2, CANVAS_H / 2);
      ctx.textAlign = 'left';
    }

    // Copyright
    ctx.font = '8px "Press Start 2P"';
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.textAlign = 'center';
    ctx.fillText('© 2026 SHUPER PANDA STUDIOS', CANVAS_W / 2, CANVAS_H - 10);
    ctx.textAlign = 'left';
  }
}
