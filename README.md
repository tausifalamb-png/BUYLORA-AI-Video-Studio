# BUYLORA Video Studio

A browser-based product video editor built with React, Vite, Canvas and FFmpeg.wasm.

## Implemented editor features
- Multi-scene starter timeline: Intro, Product Reveal, Features, Offer and Ending
- Add scenes, reorder, duplicate and delete
- Independent scene duration and text content
- Per-scene font size, text/background/accent colours, text alignment
- Image zoom and X/Y positioning controls
- Scene transition choices: fade, slide and zoom
- 24 templates across Electronics, Fashion, Beauty, Home, Sale, Launch, Premium and Comparison
- Social aspect ratios: 9:16, 1:1 and 16:9
- 720p and 1080p MP4 export
- Background music upload and volume control
- Browser microphone voice-over recording
- Auto-save, manual save and reopen using browser IndexedDB
- BUYLORA identity: #1F2A6B and “Smart picks. Simple buying.”

## Run locally
```bash
npm install
npm run dev
```

## Build and test
```bash
npm run build
npx playwright test
```

## Important limitations
- Projects are stored locally in the same browser/device; they are not cloud-synced. Clearing site data may delete them.
- One uploaded product image is currently shared across all scenes; separate media per scene is not implemented.
- Transition selection is currently a basic visual treatment, not a full professional transition engine.
- Font family selection, freeform shape layers, multi-track timeline, drag-and-drop scene reordering, independent per-scene image assets and project-file export are not implemented yet.
- AI copywriting and automatic background removal are not included.
- Browser/device performance and codec support affect export time and reliability. 1080p export is more demanding on phones.
- Voice-over needs microphone permission and a secure context (HTTPS or localhost).
- No paid AI API is required; the app does not generate AI imagery, music or speech.

## Privacy
Video rendering and project storage run in the browser. No media upload backend is configured.
