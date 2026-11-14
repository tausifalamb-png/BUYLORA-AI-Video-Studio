# BUYLORA AI Video Studio

A browser-based product advertisement video maker built with React, Vite, Canvas and FFmpeg.wasm.

## Current features
- Product image upload (JPG, PNG, WebP; up to 12 MB)
- Editable product name, headline, description and CTA/price
- 24 selectable layouts across Electronics, Fashion, Beauty, Home, Sale, Launch, Premium and Comparison
- Live animated 16:9 preview
- 720p HD and 1080p Full HD MP4 export
- Background music upload with volume control
- Voice-over recording through the browser microphone (permission required)
- Music and voice-over mixed into MP4 export
- Automatic local project saving and manual Save / Reopen controls
- Project media stored in browser IndexedDB on the same device/browser
- BUYLORA identity: indigo #1F2A6B and “Smart picks. Simple buying.”

## Run locally
```bash
npm install
npm run dev
```

## Production build
```bash
npm run build
npm run preview
```

## Important limitations
- Projects are saved locally in the browser, not synced to a cloud account. Clearing browser site data can remove saved projects.
- Uploaded music and voice-over remain on the device/browser; they are not uploaded to a server.
- Voice-over recording requires microphone permission and a secure context (HTTPS or localhost).
- Export performance depends on device memory, CPU, browser codec support and available storage. 1080p export is more demanding than 720p, especially on phones.
- The video renderer currently creates a single 10-second animated product scene. The template library changes its visual treatment; it is not yet a multi-scene timeline editor.
- No paid AI API is required. The studio does not generate AI images, music or synthetic speech.

## Privacy
Media processing and export happen in the browser. No media upload backend is configured.
