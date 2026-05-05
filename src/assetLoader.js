// Asset Loader - preloads all images used in the game
const ASSET_PATHS = {
  title: './assets/title.jpg',
  cutscene_stage1: './assets/cutscene_stage1.jpg',
  cutscene_stage2: './assets/cutscene_stage2.jpg',
  cutscene_stage2b: './assets/cutscene_stage2b.jpg',
  cutscene_ending: './assets/cutscene_ending.jpg',
  panda_sprites: './assets/panda_sprites.png',
  frog_sprites: './assets/frog_sprites.png',
  battle_bg: './assets/battle_bg.png',
};

class AssetLoader {
  constructor() {
    this.images = {};
    this.loaded = 0;
    this.total = Object.keys(ASSET_PATHS).length;
  }

  loadAll() {
    return new Promise((resolve) => {
      if (this.total === 0) { resolve(); return; }
      for (const [key, path] of Object.entries(ASSET_PATHS)) {
        const img = new Image();
        img.onload = () => {
          this.images[key] = img;
          this.loaded++;
          if (this.loaded >= this.total) resolve();
        };
        img.onerror = () => {
          console.warn(`Failed to load asset: ${key} (${path})`);
          this.loaded++;
          if (this.loaded >= this.total) resolve();
        };
        img.src = path;
      }
    });
  }

  get(key) {
    return this.images[key] || null;
  }

  getProgress() {
    return this.total > 0 ? this.loaded / this.total : 1;
  }
}

export const assets = new AssetLoader();
