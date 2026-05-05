import { CANVAS_W, CANVAS_H } from '../constants.js';

export class VideoScene {
  constructor(game, videoId, nextScene) {
    this.game = game;
    this.nextScene = nextScene;
    this.frame = 0;
    
    // Create video element
    this.video = document.createElement('video');
    this.video.src = `./assets/${videoId}.mp4`;
    this.video.autoplay = true;
    this.video.muted = false; // Player probably wants to hear it
    this.video.playsInline = true;
    
    this.isEnded = false;
    this.video.onended = () => {
      this.isEnded = true;
    };

    // Error handling
    this.video.onerror = (e) => {
      console.error('Video error:', e);
      this.isEnded = true; // Skip on error
    };

    this.video.play().catch(err => {
      console.warn('Auto-play failed, waiting for user interaction:', err);
      // If autoplay fails, we'll try to play on next update if user interacted
    });
  }

  update(input) {
    this.frame++;
    
    // Skip on any key press
    if (input.anyKeyPressed() && this.frame > 30) {
      this.video.pause();
      this.video.remove();
      this.game.switchScene(this.nextScene);
      return;
    }

    if (this.isEnded) {
      this.video.remove();
      this.game.switchScene(this.nextScene);
    }
  }

  render(ctx) {
    // Fill background
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    // Draw video frame to canvas
    if (this.video.readyState >= this.video.HAVE_CURRENT_DATA) {
      // Scale video to fit canvas while maintaining aspect ratio
      const vW = this.video.videoWidth;
      const vH = this.video.videoHeight;
      const scale = Math.min(CANVAS_W / vW, CANVAS_H / vH);
      const dW = vW * scale;
      const dH = vH * scale;
      const dx = (CANVAS_W - dW) / 2;
      const dy = (CANVAS_H - dH) / 2;
      
      ctx.drawImage(this.video, dx, dy, dW, dH);
    }

    // Blinking "Skip" prompt
    if (Math.floor(this.frame / 30) % 2 === 0) {
      ctx.save();
      ctx.font = '12px "Press Start 2P"';
      ctx.textAlign = 'right';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.fillText('PRESS ANY KEY TO SKIP >>', CANVAS_W - 20, CANVAS_H - 20);
      ctx.restore();
    }
  }
}
