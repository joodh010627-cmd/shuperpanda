
import fs from 'fs';
import path from 'path';

function getPngSize(filePath) {
    const buf = fs.readFileSync(filePath);
    const width = buf.readInt32BE(16);
    const height = buf.readInt32BE(20);
    return { width, height, size: buf.length };
}

const dir = 'public/assets';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.png'));
files.forEach(f => {
    try {
        const info = getPngSize(path.join(dir, f));
        if (info.size > 1000000) { // > 1MB
            console.log(`${f}: ${info.width}x${info.height}, ${Math.round(info.size/1024/1024)}MB`);
        }
    } catch (e) {}
});
