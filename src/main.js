import { CANVAS_W, CANVAS_H } from './constants.js';
import { InputManager } from './input.js';
import { SoundManager } from './audio.js';
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
    this.switchScene('title');
    this._loop();
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
