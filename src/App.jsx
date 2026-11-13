import { useCallback, useEffect, useRef, useState } from 'react';
import { Upload, Play, Pause, Download, Sparkles, Film, Image as ImageIcon, Type, Clock3, CheckCircle2, LoaderCircle, RotateCcw } from 'lucide-react';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

const BRAND = '#1F2A6B';
const templates = [
  { id: 'spotlight', name: 'Product Spotlight', detail: 'Clean, premium reveal', accent: '#DDE6FF', duration: 8 },
  { id: 'bold', name: 'Bold Launch', detail: 'High-energy campaign', accent: '#FFE3C8', duration: 8 },
  { id: 'minimal', name: 'Minimal Studio', detail: 'Quiet, elegant motion', accent: '#E5E7EB', duration: 8 },
  { id: 'sale', name: 'Offer Drop', detail: 'Promotion-first layout', accent: '#FCE7EF', duration: 8 }
];

function drawFrame(ctx, image, data, template, t, width, height) {
  const p = Math.min(1, Math.max(0, t / 8));
  const ease = 1 - Math.pow(1 - p, 3);
  const palettes = {
    spotlight: ['#101936', '#263B78', '#DDE6FF'],
    bold: ['#21152F', '#713B64', '#FFE3C8'],
    minimal: ['#F4F5F8', '#E5E7EB', '#1F2A6B'],
    sale: ['#3B142B', '#8F315A', '#FCE7EF']
  };
  const [c1, c2, accent] = palettes[template] || palettes.spotlight;
  const light = template === 'minimal';
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, c1);
  gradient.addColorStop(1, c2);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  ctx.globalAlpha = 0.13;
  ctx.fillStyle = accent;
  ctx.beginPath();
  ctx.arc(width * (0.83 - ease * 0.08), height * 0.36, height * (0.28 + ease * 0.05), 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;

  const imageW = width * 0.43;
  const imageH = height * 0.68;
  const imageX = width * 0.52 + (1 - ease) * 80;
  const imageY = (height - imageH) / 2 + Math.sin(p * Math.PI * 2) * 8;
  if (image) {
    const scale = Math.max(imageW / image.width, imageH / image.height);
    const sw = imageW / scale;
    const sh = imageH / scale;
    const sx = (image.width - sw) / 2;
    const sy = (image.height - sh) / 2;
    ctx.save();
    ctx.shadowColor = '#00000055';
    ctx.shadowBlur = 35;
    ctx.shadowOffsetY = 18;
    const radius = 28;
    ctx.beginPath();
    ctx.roundRect(imageX, imageY, imageW, imageH, radius);
    ctx.clip();
    ctx.drawImage(image, sx, sy, sw, sh, imageX, imageY, imageW, imageH);
    ctx.restore();
  } else {
    ctx.fillStyle = accent;
    ctx.globalAlpha = 0.8;
    ctx.beginPath();
    ctx.roundRect(imageX, imageY, imageW, imageH, 28);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.fillStyle = BRAND;
    ctx.font = 'bold 28px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('YOUR PRODUCT', imageX + imageW / 2, imageY + imageH / 2);
  }

  ctx.textAlign = 'left';
  ctx.fillStyle = light ? '#172044' : '#FFFFFF';
  ctx.globalAlpha = Math.min(1, ease * 1.5);
  ctx.font = 'bold 22px Arial';
  ctx.fillText('BUYLORA  /  PRODUCT STORY', width * 0.075, height * 0.17);
  ctx.globalAlpha = 1;
  ctx.fillStyle = accent;
  ctx.font = 'bold 17px Arial';
  ctx.fillText(data.eyebrow.toUpperCase().slice(0, 34), width * 0.075, height * 0.34);
  ctx.fillStyle = light ? '#111827' : '#FFFFFF';
  ctx.font = 'bold 54px Arial';
  const words = (data.name || 'Your Product').split(' ');
  let line = '';
  let y = height * 0.46;
  for (const word of words) {
    const test = line ? line + ' ' + word : word;
    if (ctx.measureText(test).width > width * 0.39 && line) {
      ctx.fillText(line, width * 0.075 + (1 - ease) * -45, y);
      line = word;
      y += 62;
    } else line = test;
  }
  if (line) ctx.fillText(line, width * 0.075 + (1 - ease) * -45, y);
  ctx.fillStyle = light ? '#475569' : '#E2E8F0';
  ctx.font = '22px Arial';
  const desc = (data.description || 'Designed to make every day better.').slice(0, 58);
  ctx.fillText(desc, width * 0.075, height * 0.69);
  ctx.fillStyle = accent;
  ctx.font = 'bold 25px Arial';
  ctx.fillText(data.price ? data.price : 'DISCOVER MORE', width * 0.075, height * 0.82);
  ctx.globalAlpha = 0.75;
  ctx.fillStyle = light ? '#475569' : '#FFFFFF';
  ctx.font = '16px Arial';
  ctx.fillText('Smart picks. Simple buying.', width * 0.075, height * 0.92);
  ctx.textAlign = 'right';
  ctx.fillText('BUYLORA', width * 0.93, height * 0.92);
  ctx.globalAlpha = 1;
}

export default function App() {
  const canvasRef = useRef(null);
  const imageRef = useRef(null);
  const fileRef = useRef(null);
  const rafRef = useRef(null);
  const recorderRef = useRef(null);
  const chunksRef = useRef([]);
  const [imageUrl, setImageUrl] = useState('');
  const [data, setData] = useState({ name: 'Your Product', eyebrow: 'Meet your new favourite', description: 'Thoughtful design. Everyday performance.', price: 'Explore now' });
  const [template, setTemplate] = useState('spotlight');
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [exporting, setExporting] = useState(false);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');

  const render = useCallback((time) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    drawFrame(ctx, imageRef.current, data, template, time, canvas.width, canvas.height);
    setProgress(time);
  }, [data, template]);

  useEffect(() => {
    render(progress);
  }, [render]);

  useEffect(() => {
    if (!playing) return;
    let start = performance.now() - progress * 1000;
    const tick = (now) => {
      const t = ((now - start) / 1000) % 8;
      render(t);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [playing, render, progress]);

  const update = (key, value) => setData(current => ({ ...current, [key]: value }));

  const handleImage = (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Please choose an image file.');
      return;
    }
    if (file.size > 12 * 1024 * 1024) {
      setError('Image must be smaller than 12 MB.');
      return;
    }
    setError('');
    const url = URL.createObjectURL(file);
    setImageUrl(url);
    const img = new Image();
    img.onload = () => { imageRef.current = img; render(0); };
    img.src = url;
  };

  const downloadBlob = (blob, filename) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 30000);
  };

  const exportVideo = async () => {
    if (exporting) return;
    setError('');
    setExporting(true);
    setStatus('Rendering video…');
    setPlaying(false);
    try {
      const canvas = canvasRef.current;
      const stream = canvas.captureStream(30);
      const mime = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
        ? 'video/webm;codecs=vp9' : 'video/webm';
      const recorder = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 6000000 });
      recorderRef.current = recorder;
      chunksRef.current = [];
      recorder.ondataavailable = e => { if (e.data.size) chunksRef.current.push(e.data); };
      const stopped = new Promise((resolve, reject) => {
        recorder.onstop = () => resolve(new Blob(chunksRef.current, { type: 'video/webm' }));
        recorder.onerror = () => reject(new Error('Browser video recording failed.'));
      });
      recorder.start();
      const start = performance.now();
      await new Promise(resolve => {
        const frame = (now) => {
          const elapsed = (now - start) / 1000;
          render(Math.min(elapsed, 8));
          if (elapsed < 8) requestAnimationFrame(frame);
          else resolve();
        };
        requestAnimationFrame(frame);
      });
      recorder.stop();
      stream.getTracks().forEach(track => track.stop());
      const webm = await stopped;
      setStatus('Converting to MP4…');
      const ffmpeg = new FFmpeg();
      ffmpeg.on('log', ({ message }) => {
        if (message.includes('frame=')) setStatus('Finishing MP4…');
      });
      const base = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';
      await ffmpeg.load({
        coreURL: await toBlobURL(base + '/ffmpeg-core.js', 'text/javascript'),
        wasmURL: await toBlobURL(base + '/ffmpeg-core.wasm', 'application/wasm')
      });
      await ffmpeg.writeFile('input.webm', await fetchFile(webm));
      await ffmpeg.exec(['-i', 'input.webm', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', 'buylora-product-video.mp4']);
      const output = await ffmpeg.readFile('buylora-product-video.mp4');
      downloadBlob(new Blob([output.buffer], { type: 'video/mp4' }), 'buylora-product-video.mp4');
      await ffmpeg.deleteFile('input.webm');
      await ffmpeg.deleteFile('buylora-product-video.mp4');
      ffmpeg.terminate();
      setStatus('MP4 exported successfully.');
    } catch (e) {
      setError('Export failed: ' + (e?.message || 'Unknown error') + '. Try a modern browser and stable internet.');
      setStatus('');
    } finally {
      setExporting(false);
    }
  };

  const reset = () => {
    setPlaying(false);
    setProgress(0);
    setData({ name: 'Your Product', eyebrow: 'Meet your new favourite', description: 'Thoughtful design. Everyday performance.', price: 'Explore now' });
    setTemplate('spotlight');
  };

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="#"><span className="brand-mark">B</span><span>BUYLORA <small>VIDEO STUDIO</small></span></a>
        <div className="top-pill"><span className="live-dot" /> BROWSER-BASED STUDIO</div>
      </header>
      <main className="workspace">
        <section className="intro">
          <div className="eyebrow"><Sparkles size={14} /> PRODUCT CREATIVE WORKSPACE</div>
          <h1>Make your product<br /><span>impossible to ignore.</span></h1>
          <p>Turn one product photo into a polished promotional video. No editing timeline required.</p>
        </section>
        <div className="studio-grid">
          <section className="panel controls-panel">
            <div className="section-heading"><span className="step">01</span><div><h2>Product details</h2><p>Start with your product information</p></div></div>
            <div className="upload-zone" onClick={() => fileRef.current?.click()} onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); handleImage(e.dataTransfer.files?.[0]); }}>
              {imageUrl ? <img className="uploaded-thumb" src={imageUrl} alt="Uploaded product" /> : <div className="upload-icon"><Upload size={22} /></div>}
              <div><strong>{imageUrl ? 'Product image added' : 'Upload product image'}</strong><span>JPG or PNG · Up to 12 MB</span></div>
              <button className="browse-btn" type="button">Browse</button>
              <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={e => handleImage(e.target.files?.[0])} />
            </div>
            <label>Product name<input value={data.name} maxLength={36} onChange={e => update('name', e.target.value)} placeholder="e.g. Nova Wireless Earbuds" /></label>
            <label>Small headline<input value={data.eyebrow} maxLength={40} onChange={e => update('eyebrow', e.target.value)} placeholder="e.g. Sound without limits" /></label>
            <label>Short description<input value={data.description} maxLength={65} onChange={e => update('description', e.target.value)} placeholder="One clear product benefit" /></label>
            <label>Price or call to action<input value={data.price} maxLength={24} onChange={e => update('price', e.target.value)} placeholder="e.g. Starting at ₹1,499" /></label>
            <div className="section-heading template-title"><span className="step">02</span><div><h2>Choose a style</h2><p>Pick the mood of your video</p></div></div>
            <div className="template-list">
              {templates.map(item => <button key={item.id} className={'template-card ' + (template === item.id ? 'selected' : '')} onClick={() => { setTemplate(item.id); setProgress(0); }}><span className={'template-swatch ' + item.id}><i /></span><span className="template-copy"><strong>{item.name}</strong><small>{item.detail}</small></span>{template === item.id && <CheckCircle2 size={18} className="selected-check" />}</button>)}
            </div>
            <button className="reset-btn" onClick={reset}><RotateCcw size={14} /> Reset project</button>
          </section>

          <section className="preview-column">
            <div className="preview-panel">
              <div className="preview-top"><div><span className="preview-label"><Film size={14} /> VIDEO PREVIEW</span><strong>1080 × 608 <i>·</i> 16:9</strong></div><span className="duration"><Clock3 size={13} /> 8 seconds</span></div>
              <div className="canvas-wrap"><canvas ref={canvasRef} width="1080" height="608" /><div className="canvas-watermark">BUYLORA STUDIO</div></div>
              <div className="player-controls"><button className="play-btn" onClick={() => setPlaying(v => !v)} aria-label={playing ? 'Pause preview' : 'Play preview'}>{playing ? <Pause size={17} /> : <Play size={17} fill="currentColor" />}</button><div className="timeline"><div className="timeline-track"><span style={{ width: (progress / 8 * 100) + '%' }} /></div><div className="time-labels"><span>Preview</span><span>{progress.toFixed(1)}s / 8.0s</span></div></div><button className="reset-preview" onClick={() => { setPlaying(false); render(0); }}><RotateCcw size={16} /></button></div>
            </div>
            <div className="export-panel">
              <div className="export-copy"><div className="export-icon"><Download size={19} /></div><div><strong>Ready to create?</strong><span>Export an 8-second MP4 video</span></div></div>
              <button className="export-btn" onClick={exportVideo} disabled={exporting}>{exporting ? <><LoaderCircle className="spin" size={17} /> Creating…</> : <><Download size={17} /> Export MP4</>}</button>
              {status && <p className="status-message">{status}</p>}
              {error && <p className="error-message">{error}</p>}
              <p className="privacy-note"><ImageIcon size={13} /> Your product image stays in this browser session.</p>
            </div>
            <div className="tip-card"><Sparkles size={17} /><p><strong>Design tip</strong> Use a clear product photo with a simple background. Keep the headline short so the product remains the hero.</p></div>
          </section>
        </div>
      </main>
      <footer><span>BUYLORA <b>·</b> Smart picks. Simple buying.</span><span>PRODUCT VIDEO STUDIO <b>·</b> MVP 0.1</span></footer>
    </div>
  );
}