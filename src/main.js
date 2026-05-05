import { CANVAS_W, CANVAS_H } from './constants.js';
import { InputManager } from './input.js';
import { SoundManager } from './audio.js';
import { assets } from './assetLoader.js';
import { TitleScene } from './scenes/titleScene.js';
import { CutsceneScene } from './scenes/cutsceneScene.js';
import { ControlsScene } from './scenes/controlsScene.js';
import { BattleScene } from './scenes/battleScene.js';

class Game {
  constructor() {
    this.canvas = document.getElementById('game-canvas');
    this.canvas.width = CANVAS_W;
    this.canvas.height = CANVAS_H;
    this.ctx = this.canvas.getContext('2d');
    this.ctx.imageSmoothingEnabled = false;

    this.input = new InputManager();
    this.sound = new SoundManager();
    this.scene = null;
    this.loading = true;

    // Show loading screen while assets load
    this._showLoading();
    assets.loadAll().then(() => {
      this.loading = false;
      this.switchScene('title');
      this._loop();
    });
  }

  _showLoading() {
    const ctx = this.ctx;
    const draw = () => {
      if (!this.loading) return;
      ctx.fillStyle = '#0a0a0a';
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

      // Loading bar
      const barW = 300, barH = 12;
      const bx = (CANVAS_W - barW) / 2;
      const by = CANVAS_H / 2 + 20;
      ctx.fillStyle = '#222';
      ctx.fillRect(bx, by, barW, barH);
      const progress = assets.getProgress();
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(bx, by, barW * progress, barH);

      // Loading text
      ctx.font = '14px "Press Start 2P"';
      ctx.fillStyle = '#fbbf24';
      ctx.textAlign = 'center';
      ctx.fillText('LOADING...', CANVAS_W / 2, CANVAS_H / 2 - 10);
      ctx.font = '10px "Press Start 2P"';
      ctx.fillStyle = '#888';
      ctx.fillText(`${Math.floor(progress * 100)}%`, CANVAS_W / 2, by + barH + 20);
      ctx.textAlign = 'left';

      requestAnimationFrame(draw);
    };
    draw();
  }

  switchScene(name) {
    switch (name) {
      case 'title':
        this.scene = new TitleScene(this);
        break;
      case 'cutscene_stage1':
        this.scene = new CutsceneScene(this, 'stage1');
        break;
      case 'cutscene_stage2':
        this.scene = new CutsceneScene(this, 'stage2');
        break;
      case 'controls':
        this.scene = new ControlsScene(this);
        break;
      case 'battle_stage1':
        this.scene = new BattleScene(this);
        break;
      default:
        this.scene = new TitleScene(this);
    }
  }

  _loop() {
    this.scene.update(this.input);
    this.ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
    this.scene.render(this.ctx);
    this.input.endFrame();
    requestAnimationFrame(() => this._loop());
  }
}

window.addEventListener('DOMContentLoaded', () => new Game());
