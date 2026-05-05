import { CANVAS_W, CANVAS_H } from '../constants.js';
import { assets } from '../assetLoader.js';

export class ControlsSceneFPS {
  constructor(game) {
    this.game = game;
    this.frame = 0;
  }

  update(input) {
    this.frame++;
    if (this.frame > 40 && (input.anyKeyPressed())) {
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

    // Goal & Rule Section (The important part)
    const boxY = CANVAS_H / 2 - 60;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(100, boxY - 40, CANVAS_W - 200, 180);
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 2;
    ctx.strokeRect(100, boxY - 40, CANVAS_W - 200, 180);

    ctx.font = '18px "Press Start 2P"';
    ctx.fillStyle = '#fff';
    ctx.fillText('미션: 커피 더 헛을 무찌르세요!', CANVAS_W / 2, boxY);
    
    ctx.font = '15px "Press Start 2P"';
    ctx.fillStyle = '#ff5555';
    ctx.fillText('※ 주의: 미니 커피 더 헛이 있을 때', CANVAS_W / 2, boxY + 50);
    ctx.fillText('보스는 무적(IMMUNE) 상태입니다.', CANVAS_W / 2, boxY + 80);

    // Controls
    ctx.font = '16px "Press Start 2P"';
    ctx.fillStyle = '#fbbf24';
    ctx.fillText('- 조작 방법 -', CANVAS_W / 2, boxY + 150);
    ctx.fillStyle = '#fff';
    ctx.fillText('마우스로 조준하고 클릭하여 사격하세요!', CANVAS_W / 2, boxY + 185);
    
    ctx.fillStyle = '#aaa';
    ctx.font = '12px "Press Start 2P"';
    ctx.fillText('Press SPACE or CLICK to Start', CANVAS_W / 2, CANVAS_H - 60);

    // Panda arm demo - repositioned to not overlap
    const armImg = assets.get('image_41');
    if (armImg) {
    ];

    ctx.textAlign = 'left';
    controls.forEach(c => {
      // Key box
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(340, c.y - 24, 150, 40);
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 2;
      ctx.strokeRect(340, c.y - 24, 150, 40);
      
      ctx.font = '14px "Press Start 2P"';
      ctx.fillStyle = '#60a5fa';
      ctx.textAlign = 'center';
      ctx.fillText(c.key, 340 + 75, c.y + 4);

      // Description
      ctx.fillStyle = '#e2e8f0';
      ctx.textAlign = 'left';
      ctx.fillText(c.desc, 510, c.y + 4);
    });

    // Continue
    if (Math.floor(this.frame / 25) % 2 === 0) {
      ctx.font = '18px "Press Start 2P"';
      ctx.fillStyle = '#fbbf24';
      ctx.textAlign = 'center';
      ctx.fillText('PRESS ANY KEY TO START', CANVAS_W / 2, CANVAS_H - 50);
    }

    ctx.textAlign = 'left';
  }
}
