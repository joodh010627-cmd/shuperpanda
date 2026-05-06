
const { createCanvas, loadImage } = require('canvas');
const path = require('path');

async function checkColor() {
    const imgPath = path.join(process.cwd(), 'public', 'assets', 'image_51.png');
    const img = await loadImage(imgPath);
    const canvas = createCanvas(img.width, img.height);
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);
    const data = ctx.getImageData(0, 0, 10, 10).data; // check top-left 10x10
    for (let i = 0; i < 40; i += 4) {
        console.log(`Pixel ${i/4}: R=${data[i]}, G=${data[i+1]}, B=${data[i+2]}`);
    }
}

checkColor();
