# BUYLORA AI Video Studio

A browser-based product promo video maker built with React and Vite.

## MVP features
- Product image upload (JPG, PNG, WebP; up to 12 MB)
- Editable product name, headline, description, and CTA/price
- Four animated visual templates
- Live 16:9 canvas preview
- 8-second MP4 export using browser recording and FFmpeg.wasm conversion
- BUYLORA identity: indigo #1F2A6B and “Smart picks. Simple buying.”

## Run locally
```bash
npm install
npm run dev
``

## Production build
```bash
npm run build
npm run preview
``

## Notes
- Video rendering happens in the browser; no paid AI API is required.
- First MP4 export downloads FFmpeg core assets from unpkg and therefore needs an internet connection.
- Browser memory and device performance affect export time. Test on desktop and mobile before public launch.
- This MVP exports a fixed 8-second 16:9 video. Audio, multiple scenes, saved projects, and server-side rendering are not included yet.
