// Asset Loader - preloads all images used in the game
const ASSET_PATHS = {
  title: './assets/title.jpg',
  cutscene_stage1: './assets/cutscene_stage1.jpg',
  cutscene_stage2: './assets/cutscene_stage2.jpg',
  cutscene_stage2b: './assets/cutscene_stage2b.jpg',
  cutscene_ending: './assets/cutscene_ending.jpg',
  battle_bg: './assets/battle_bg.png',
  coffee_boss: './assets/coffee_boss.png',
  mini_coffee: './assets/mini_coffee.png',
  panda_arm: './assets/panda_arm.png',
};

for (let i = 1; i <= 20; i++) {
  ASSET_PATHS[`image_${i}`] = `./assets/image_${i}.png`;
}

class AssetLoader {
  constructor() {
    this.images = {};
    this.loaded = 0;
    this.total = Object.keys(ASSET_PATHS).length;
  }

  loadAll() {
    return new Promise((resolve) => {
      if (this.total === 0) { resolve(); return; }
      const version = Date.now(); // 강제 캐시 초기화
      for (const [key, path] of Object.entries(ASSET_PATHS)) {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          if (['coffee_boss', 'mini_coffee', 'panda_arm'].includes(key)) {
            this.images[key] = this._removeBackground(img);
          } else {
            this.images[key] = img;
          }
          this.loaded++;
          if (this.loaded >= this.total) resolve();
        };
        img.onerror = () => {
          console.warn(`Failed to load asset: ${key} (${path})`);
          this.loaded++;
          if (this.loaded >= this.total) resolve();
        };
        img.src = `${path}?v=${version}`;
      }
    });
  }

  _removeBackground(img) {
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    // Remove white-ish background (thresholding)
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i], g = data[i+1], b = data[i+2];
      if (r > 240 && g > 240 && b > 240) {
        data[i+3] = 0; // Set alpha to 0
      }
    }
    ctx.putImageData(imageData, 0, 0);
    return canvas;
  }

  get(key) {
    return this.images[key] || null;
  }

  getProgress() {
    return this.total > 0 ? this.loaded / this.total : 1;
  }
}

export const assets = new AssetLoader();
