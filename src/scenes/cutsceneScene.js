import { CANVAS_W, CANVAS_H } from '../constants.js';
import { assets } from '../assetLoader.js';

const CUTSCENES = {
  stage1: {
    image: 'cutscene_stage1',
    next: 'controls'
  },
  stage2: {
    image: 'cutscene_stage2',
    next: 'animation_stage'
  },
  stage3: {
    image: 'cutscene_stage3',
    next: 'controls_stage3'
  },
  ending: {
    image: 'cutscene_ending',
    next: 'title'
  }
};

export class CutsceneScene {
  constructor(game, cutsceneId) {
    this.game = game;
    this.data = CUTSCENES[cutsceneId];
    this.frame = 0;
    this.fadeIn = 0;
  }

  update(input) {
    this.frame++;
    if (this.fadeIn < 1) {
      this.fadeIn = Math.min(1, this.fadeIn + 0.02);
      return;
    }

    if (input.anyKeyPressed()) {
      this.game.sound.menuSelect();
      this.game.switchScene(this.data.next);
    }
  }

  render(ctx) {
    const bgImg = assets.get(this.data.image);

    if (bgImg) {
      ctx.globalAlpha = this.fadeIn;
      ctx.drawImage(bgImg, 0, 0, CANVAS_W, CANVAS_H);
      ctx.globalAlpha = 1;
    } else {
      ctx.fillStyle = '#1a1a2e';
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    }

    if (this.fadeIn < 1) return;

    // Blinking prompt to continue
    if (Math.floor(this.frame / 30) % 2 === 0) {
      ctx.save();
      ctx.font = '16px "Press Start 2P"';
      ctx.textAlign = 'right';
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 4;
      ctx.strokeText('PRESS ANY KEY >>', CANVAS_W - 30, CANVAS_H - 30);
      ctx.fillStyle = '#fbbf24';
      ctx.fillText('PRESS ANY KEY >>', CANVAS_W - 30, CANVAS_H - 30);
      ctx.restore();
    }
  }
}
