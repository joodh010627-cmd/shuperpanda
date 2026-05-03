import { CANVAS_W, CANVAS_H } from '../constants.js';
import { drawPanda, drawFrog } from '../sprites.js';

const CUTSCENES = {
  stage1: {
    panels: [
      { speaker: '슈퍼 판다', text: '앗, 벌써 퇴근 시간이네?\n슬슬 일어나야지.', bg: 'office', panda: 'idle', frog: null },
      { speaker: '슈퍼 판다', text: '과장님, 이만 퇴근해\n보겠습니다!', bg: 'office', panda: 'idle', frog: 'idle' },
      { speaker: '개구리 과장', text: '아하하~~~\n퇴근이래 퇴근!!\n너무 웃겨!!!', bg: 'office', panda: null, frog: 'idle' },
      { speaker: '개구리 과장', text: '너가 퇴근을 할 수\n있을 것 같아?!\n어림 없어!!', bg: 'boss', panda: null, frog: 'idle' },
      { speaker: '슈퍼 판다', text: '...쳇,\n후회하지 마세요!', bg: 'boss', panda: 'idle', frog: null },
    ],
    next: 'controls'
  },
  stage2: {
    panels: [
      { speaker: '슈퍼 판다', text: '휴... 겨우 이겼다.\n과장님도 참...', bg: 'hallway', panda: 'idle', frog: null },
      { speaker: '슈퍼 판다', text: '이제 진짜 퇴근이다!\n엘리베이터만 타면...', bg: 'hallway', panda: 'idle', frog: null },
      { speaker: '???', text: '어? 안녕하세요~', bg: 'elevator', panda: 'idle', frog: null },
      { speaker: '커피 더 헛', text: '아까 텀블러 뚜껑\n안 열어서 건내줬지?\n복수하러 왔다!!', bg: 'boss', panda: null, frog: null },
      { speaker: '슈퍼 판다', text: '네? 죄송해요,\n다음에는 잘 드릴게요\nㅎㅎ;;', bg: 'boss', panda: 'idle', frog: null },
    ],
    next: 'title'
  }
};

export class CutsceneScene {
  constructor(game, cutsceneId) {
    this.game = game;
    this.data = CUTSCENES[cutsceneId];
    this.panelIndex = 0;
    this.charIndex = 0;
    this.frame = 0;
    this.textSpeed = 2;
    this.waitingForInput = false;
    this.fullText = '';
    this.displayText = '';
  }

  update(input) {
    this.frame++;
    const panel = this.data.panels[this.panelIndex];
    this.fullText = panel.text;

    if (!this.waitingForInput) {
      if (this.frame % this.textSpeed === 0) {
        this.charIndex++;
        if (this.charIndex >= this.fullText.length) {
          this.waitingForInput = true;
        }
      }
      this.displayText = this.fullText.substring(0, this.charIndex);
      if (input.justPressed('Enter') || input.justPressed('Space') || input.justPressed('KeyZ')) {
        this.charIndex = this.fullText.length;
        this.displayText = this.fullText;
        this.waitingForInput = true;
      }
    } else {
      if (input.justPressed('Enter') || input.justPressed('Space') || input.justPressed('KeyZ')) {
        this.game.sound.menuSelect();
        this.panelIndex++;
        this.charIndex = 0;
        this.waitingForInput = false;
        this.displayText = '';
        if (this.panelIndex >= this.data.panels.length) {
          this.game.switchScene(this.data.next);
          return;
        }
      }
    }
  }

  render(ctx) {
    const panel = this.data.panels[this.panelIndex];

    // Background
    this._drawBackground(ctx, panel.bg);

    // Character sprites
    if (panel.panda) {
      drawPanda(ctx, 250, CANVAS_H - 160, 1, panel.panda, this.frame);
    }
    if (panel.frog) {
      drawFrog(ctx, CANVAS_W - 250, CANVAS_H - 160, -1, panel.frog, this.frame);
    }

    // Dialog box
    ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
    ctx.fillRect(40, CANVAS_H - 140, CANVAS_W - 80, 120);
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 2;
    ctx.strokeRect(40, CANVAS_H - 140, CANVAS_W - 80, 120);

    // Speaker name
    ctx.font = '12px "Press Start 2P"';
    ctx.fillStyle = '#fbbf24';
    ctx.fillText(panel.speaker, 70, CANVAS_H - 118);

    // Dialog text
    ctx.font = '13px "Press Start 2P"';
    ctx.fillStyle = '#ffffff';
    const lines = this.displayText.split('\n');
    lines.forEach((line, i) => {
      ctx.fillText(line, 70, CANVAS_H - 95 + i * 22);
    });

    // Continue prompt
    if (this.waitingForInput && Math.floor(this.frame / 20) % 2 === 0) {
      ctx.fillStyle = '#fbbf24';
      ctx.fillText('▼', CANVAS_W - 90, CANVAS_H - 35);
    }

    // Panel counter
    ctx.font = '10px "Press Start 2P"';
    ctx.fillStyle = '#666';
    ctx.textAlign = 'right';
    ctx.fillText(`${this.panelIndex + 1}/${this.data.panels.length}`, CANVAS_W - 50, 30);
    ctx.textAlign = 'left';
  }

  _drawBackground(ctx, bgType) {
    switch (bgType) {
      case 'office':
        this._drawOffice(ctx);
        break;
      case 'hallway':
        this._drawHallway(ctx);
        break;
      case 'elevator':
        this._drawElevator(ctx);
        break;
      case 'boss':
        this._drawBossIntro(ctx);
        break;
      default:
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    }
  }

  _drawOffice(ctx) {
    // Floor
    ctx.fillStyle = '#374151';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    ctx.fillStyle = '#4b5563';
    ctx.fillRect(0, CANVAS_H - 180, CANVAS_W, 180);
    // Walls
    ctx.fillStyle = '#d1d5db';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H - 180);
    // Ceiling line
    ctx.fillStyle = '#9ca3af';
    ctx.fillRect(0, 30, CANVAS_W, 3);
    // Clock
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(200, 60, 25, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.stroke();
    // Desk
    ctx.fillStyle = '#92400e';
    ctx.fillRect(50, CANVAS_H - 220, 200, 15);
    ctx.fillRect(60, CANVAS_H - 205, 10, 40);
    ctx.fillRect(230, CANVAS_H - 205, 10, 40);
    // Monitor
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(120, CANVAS_H - 280, 70, 50);
    ctx.fillStyle = '#3b82f6';
    ctx.fillRect(125, CANVAS_H - 275, 60, 40);
    // Window
    ctx.fillStyle = '#1e3a5f';
    ctx.fillRect(CANVAS_W - 200, 50, 150, 120);
    ctx.fillStyle = '#ff6f00';
    ctx.fillRect(CANVAS_W - 195, 55, 140, 110);
    ctx.fillStyle = '#9ca3af';
    ctx.fillRect(CANVAS_W - 125, 50, 4, 120);
    ctx.fillRect(CANVAS_W - 200, 105, 150, 4);
  }

  _drawHallway(ctx) {
    ctx.fillStyle = '#e5e7eb';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    ctx.fillStyle = '#6b7280';
    ctx.fillRect(0, CANVAS_H - 160, CANVAS_W, 160);
    // Doors
    for (let i = 0; i < 4; i++) {
      ctx.fillStyle = '#92400e';
      ctx.fillRect(100 + i * 220, CANVAS_H - 320, 80, 160);
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(170 + i * 220, CANVAS_H - 250, 5, 5);
    }
    // Fluorescent lights
    ctx.fillStyle = '#fef3c7';
    for (let i = 0; i < 5; i++) {
      ctx.fillRect(50 + i * 200, 20, 100, 8);
    }
  }

  _drawElevator(ctx) {
    ctx.fillStyle = '#9ca3af';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    // Elevator doors
    ctx.fillStyle = '#6b7280';
    ctx.fillRect(CANVAS_W / 2 - 120, CANVAS_H - 380, 110, 240);
    ctx.fillRect(CANVAS_W / 2 + 10, CANVAS_H - 380, 110, 240);
    ctx.fillStyle = '#4b5563';
    ctx.fillRect(CANVAS_W / 2 - 130, CANVAS_H - 400, 260, 20);
    // Floor
    ctx.fillStyle = '#4b5563';
    ctx.fillRect(0, CANVAS_H - 140, CANVAS_W, 140);
  }

  _drawBossIntro(ctx) {
    // Dark dramatic background
    const grad = ctx.createRadialGradient(CANVAS_W / 2, CANVAS_H / 2, 50, CANVAS_W / 2, CANVAS_H / 2, 400);
    grad.addColorStop(0, '#7f1d1d');
    grad.addColorStop(0.5, '#450a0a');
    grad.addColorStop(1, '#0a0a0a');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    // BOSS text
    ctx.font = '28px "Press Start 2P"';
    ctx.fillStyle = '#ef4444';
    ctx.textAlign = 'center';
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 4;
    ctx.strokeText('BOSS: 개구리 과장', CANVAS_W / 2, 60);
    ctx.fillText('BOSS: 개구리 과장', CANVAS_W / 2, 60);
    ctx.textAlign = 'left';
  }
}
