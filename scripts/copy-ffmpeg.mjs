import { cpSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

const source = resolve('node_modules/@ffmpeg/core/dist/umd');
const destination = resolve('public/ffmpeg');
mkdirSync(destination, { recursive: true });
for (const file of ['ffmpeg-core.js', 'ffmpeg-core.wasm']) {
  cpSync(resolve(source, file), resolve(destination, file));
}
console.log('Local FFmpeg assets ready.');
