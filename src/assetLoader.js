const ASSET_PATHS = {
  title: './assets/title.jpg',
  cutscene_stage1: './assets/cutscene_stage1.jpg',
  cutscene_stage2: './assets/cutscene_stage2.png',
  cutscene_stage3: './assets/cutscene_stage3.jpg',
  cutscene_ending: './assets/cutscene_ending.jpg',
  battle_bg: './assets/battle_bg.png',
  battle2_bg: './assets/battle2_bg.png',
  battle3_bg: './assets/battle3_bg.png',
};

const fpsSpriteNumbers = [
  21, 22, 23, 24, 25, 26, 27, 28, // Boss
  31, 32, 33, 34, 35, 36, 37,     // Mini
  41, 42                          // Panda Arm
];

const shooterSpriteNumbers = [
  51, 52, 53, 54, 55, 56, 57, 58, 59, // Super Panda
  61, 62, 63, 64, 65, 66,             // Professor Lee
  71, 72, 73, 74,                     // Paper
  81, 91, 101, 102                         // Finishing move

];

for (let i = 1; i <= 20; i++) {
  ASSET_PATHS[`image_${i}`] = `./assets/image_${i}.png`;
}
fpsSpriteNumbers.forEach(i => {
  ASSET_PATHS[`image_${i}`] = `./assets/image_${i}.png`;
});
shooterSpriteNumbers.forEach(i => {
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
          const num = parseInt(key.split('_')[1]);
          // Apply background removal to FPS sprites and Shooter sprites (except image_102)
          if (key.startsWith('image_') && num !== 102 && (fpsSpriteNumbers.includes(num) || shooterSpriteNumbers.includes(num))) {
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
    // Skip background removal for extremely large images to prevent memory/performance issues
    // image_66 is 5888x11336 (~66.7M pixels). We'll allow up to 75M for this final boss asset.
    if (img.width * img.height > 75000000) { 
      console.warn(`Skipping background removal for extreme image: ${img.width}x${img.height}`);
      return img;
    }



    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return img;

    ctx.drawImage(img, 0, 0);
    let imageData;
    try {
      imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    } catch (e) {
      console.error("getImageData failed:", e);
      return img;
    }
    const data = imageData.data;
    
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i], g = data[i+1], b = data[i+2];
      
      // Detect Fluorescent Green (Chroma Key)
      // Standard fluorescent green: around (118, 255, 0)
      // Widening the range to catch anti-aliased green edges
      const isFluorescentGreen = (g > 80 && g > r * 1.05 && g > b * 1.05) || (g > 180 && r < 200 && b < 200);
      
      // Detect Magenta (r=255, g=0, b=255)
      const isMagenta = r > 180 && g < 100 && b > 180;
      // Detect Cyan (r=0, g=255, b=255)
      const isCyan = r < 100 && g > 180 && b > 180;

      if (isFluorescentGreen || isMagenta || isCyan) {
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

