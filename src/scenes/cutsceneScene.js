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
    next: 'animation_stage'
  },
  stage2b: {
    image: 'cutscene_stage2b',
    dialogs: [
      { speaker: '시스템', text: 'Stage 2\n커피 더 헛의 습격!' },
    ],
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

    // Skip the cutscene on any key press
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
