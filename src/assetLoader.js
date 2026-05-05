// Asset Loader - preloads all images used in the game
const ASSET_PATHS = {
  title: './assets/title.jpg',
  cutscene_stage1: './assets/cutscene_stage1.jpg',
  cutscene_stage2: './assets/cutscene_stage2.jpg',
  cutscene_stage2b: './assets/cutscene_stage2b.jpg',
  cutscene_ending: './assets/cutscene_ending.jpg',
  battle_bg: './assets/battle_bg.png',
  battle2_bg: './assets/battle2_bg.png',
  // New assets will be loaded in the loop below
};

const fpsSpriteNumbers = [
  21, 22, 23, 24, 25, 26, 27, 28, // Boss
  31, 32, 33, 34, 35, 36, 37,     // Mini
  41, 42                          // Panda Arm
];

for (let i = 1; i <= 20; i++) {
  ASSET_PATHS[`image_${i}`] = `./assets/image_${i}.png`;
}
fpsSpriteNumbers.forEach(i => {
  ASSET_PATHS[`image_${i}`] = `./assets/image_${i}.png`;
});

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
          // Apply background removal to the new FPS sprites
          if (key.startsWith('image_') && fpsSpriteNumbers.includes(parseInt(key.split('_')[1]))) {
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
    
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i], g = data[i+1], b = data[i+2];
      
      // Detect Magenta (r=255, g=0, b=255) with tolerance
      const isMagenta = r > 200 && g < 50 && b > 200;
      // Detect Cyan (r=0, g=255, b=255) with tolerance
      const isCyan = r < 50 && g > 200 && b > 200;
      // Detect White with tolerance
      const isWhite = r > 240 && g > 240 && b > 240;

      if (isMagenta || isCyan || isWhite) {
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
