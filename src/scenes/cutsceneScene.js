import { CANVAS_W, CANVAS_H } from '../constants.js';
import { assets } from '../assetLoader.js';

// Cutscenes now display the original comic panel images directly
// Each cutscene is simply the original image shown full-screen with dialog overlay
const CUTSCENES = {
  stage1: {
    image: 'cutscene_stage1',
    dialogs: [
      { speaker: '슈퍼 판다', text: '앗, 벌써 퇴근 시간이네?\n슬슬 일어나야지.' },
      { speaker: '슈퍼 판다', text: '과장님, 이만 퇴근해\n보겠습니다!' },
      { speaker: '개구리 과장', text: '아하하~~~\n퇴근이래 퇴근!!\n너무 웃겨!!!' },
      { speaker: '개구리 과장', text: '너가 퇴근을 할 수\n있을 것 같아?!\n어림 없어!!' },
      { speaker: '슈퍼 판다', text: '...쳇,\n후회하지 마세요!' },
    ],
    next: 'controls'
  },
  stage2: {
    image: 'cutscene_stage2',
    dialogs: [
      { speaker: '개구리 과장', text: '슈 인턴,\n내가 졌어...\n퇴근해도 좋아ㅠ' },
      { speaker: '슈퍼 판다', text: '감사합니다~\n맛저하세요!' },
      { speaker: '슈퍼 판다', text: '어?\n안녕하세요' },
      { speaker: '커피 더 헛', text: '아까 텀블러 뚜껑\n안 열어서 건내줬지?\n복수하러 왔다!!' },
      { speaker: '슈퍼 판다', text: '네? 죄송해요,\n다음에는 잘 드릴게요\nㅎㅎ;;' },
    ],
    next: 'title'
  }
};

export class CutsceneScene {
  constructor(game, cutsceneId) {
    this.game = game;
    this.data = CUTSCENES[cutsceneId];
    this.dialogIndex = 0;
    this.charIndex = 0;
    this.frame = 0;
    this.textSpeed = 2;
    this.waitingForInput = false;
    this.fullText = '';
    this.displayText = '';
    this.fadeIn = 0; // fade in effect
  }

  update(input) {
    this.frame++;
    if (this.fadeIn < 1) {
      this.fadeIn = Math.min(1, this.fadeIn + 0.02);
      return;
    }

    const dialog = this.data.dialogs[this.dialogIndex];
    this.fullText = dialog.text;

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
        this.dialogIndex++;
        this.charIndex = 0;
        this.waitingForInput = false;
        this.displayText = '';
        if (this.dialogIndex >= this.data.dialogs.length) {
          this.game.switchScene(this.data.next);
          return;
        }
      }
    }
  }

  render(ctx) {
    const bgImg = assets.get(this.data.image);

    if (bgImg) {
      // Draw the original comic panel image full-screen
      ctx.globalAlpha = this.fadeIn;
      ctx.drawImage(bgImg, 0, 0, CANVAS_W, CANVAS_H);
      ctx.globalAlpha = 1;
    } else {
      // Fallback
      ctx.fillStyle = '#1a1a2e';
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    }

    if (this.fadeIn < 1) return; // Don't show UI during fade

    const dialog = this.data.dialogs[this.dialogIndex];

    // Dark overlay at bottom for dialog readability
    const dialogBoxY = CANVAS_H - 150;
    const dialogBoxH = 130;

    // Dialog box with gradient background
    const grad = ctx.createLinearGradient(0, dialogBoxY - 10, 0, dialogBoxY + dialogBoxH);
    grad.addColorStop(0, 'rgba(0, 0, 0, 0)');
    grad.addColorStop(0.1, 'rgba(0, 0, 0, 0.85)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0.92)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, dialogBoxY - 10, CANVAS_W, dialogBoxH + 10);

    // Dialog box border
    ctx.strokeStyle = 'rgba(251, 191, 36, 0.6)';
    ctx.lineWidth = 2;
    ctx.strokeRect(30, dialogBoxY, CANVAS_W - 60, dialogBoxH - 15);

    // Speaker name tag
    ctx.font = '12px "Press Start 2P"';
    const nameWidth = ctx.measureText(dialog.speaker).width;
    ctx.fillStyle = 'rgba(251, 191, 36, 0.9)';
    ctx.fillRect(45, dialogBoxY - 14, nameWidth + 20, 24);
    ctx.fillStyle = '#000';
    ctx.fillText(dialog.speaker, 55, dialogBoxY + 4);

    // Dialog text
    ctx.font = '13px "Press Start 2P"';
    ctx.fillStyle = '#ffffff';
    const lines = this.displayText.split('\n');
    lines.forEach((line, i) => {
      ctx.fillText(line, 55, dialogBoxY + 35 + i * 24);
    });

    // Continue prompt
    if (this.waitingForInput && Math.floor(this.frame / 20) % 2 === 0) {
      ctx.fillStyle = '#fbbf24';
      ctx.fillText('▼', CANVAS_W - 70, dialogBoxY + dialogBoxH - 25);
    }

    // Panel counter
    ctx.font = '10px "Press Start 2P"';
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.textAlign = 'right';
    ctx.fillText(`${this.dialogIndex + 1}/${this.data.dialogs.length}`, CANVAS_W - 40, 25);
    ctx.textAlign = 'left';
  }
}
