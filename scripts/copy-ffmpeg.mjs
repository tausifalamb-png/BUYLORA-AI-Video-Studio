import { cpSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

const source = resolve('node_modules/@ffmpeg/core/dist/umd');
const destination = resolve('public/ffmpeg');
mkdirSync(destination, { recursive: true });
cpSync(source, destination, { recursive: true });
console.log('Local FFmpeg runtime assets ready.');
