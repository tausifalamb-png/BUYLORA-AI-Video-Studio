import { cpSync, mkdirSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';

// FFmpeg's module worker dynamically imports the ESM core. Copy the matching
// ESM runtime (including its worker and WASM) as one same-origin directory.
const source = resolve('node_modules/@ffmpeg/core/dist/esm');
const destination = resolve('public/ffmpeg');
rmSync(destination, { recursive: true, force: true });
mkdirSync(destination, { recursive: true });
cpSync(source, destination, { recursive: true });
console.log('Local FFmpeg ESM runtime assets ready.');
