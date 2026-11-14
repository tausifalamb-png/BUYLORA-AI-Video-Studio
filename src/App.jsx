import { useCallback, useEffect, useRef, useState } from 'react';
import { Upload, Play, Pause, Download, Sparkles, Film, Image as ImageIcon, Type, Clock3, CheckCircle2, LoaderCircle, RotateCcw, Music2, Mic, FolderOpen, Save, Volume2, Trash2 } from 'lucide-react';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile } from '@ffmpeg/util';

const BRAND = '#1F2A6B';
const DB_NAME = 'buylora-video-studio';
const DB_STORE = 'projects';
const PROJECT_KEY = 'autosave';
const families = {
  electronics: ['#101936','#263B78','#DDE6FF'],
  fashion: ['#271B25','#87536C','#F4DCE8'],
  beauty: ['#38252D','#A66F7F','#F8DCE5'],
  home: ['#25352F','#718B76','#E1EBDD'],
  sale: ['#3B142B','#A32D5D','#FFE1EC']
};
const templates = [
  ['tech-spotlight','Tech Spotlight','Electronics','electronics'],['specs-first','Specs First','Electronics','electronics'],['gadget-launch','Gadget Launch','Electronics','electronics'],['dark-tech','Dark Tech','Electronics','electronics'],['future-minimal','Future Minimal','Electronics','electronics'],
  ['editorial-fashion','Editorial Fashion','Fashion','fashion'],['runway-drop','Runway Drop','Fashion','fashion'],['lookbook','Lookbook','Fashion','fashion'],['luxury-label','Luxury Label','Fashion','fashion'],['street-style','Street Style','Fashion','fashion'],
  ['beauty-glow','Beauty Glow','Beauty','beauty'],['skincare-clean','Skincare Clean','Beauty','beauty'],['soft-luxe','Soft Luxe','Beauty','beauty'],['ingredient-story','Ingredient Story','Beauty','beauty'],['beauty-launch','Beauty Launch','Beauty','beauty'],
  ['home-living','Home Living','Home','home'],['interior-calm','Interior Calm','Home','home'],['cozy-home','Cozy Home','Home','home'],['everyday-design','Everyday Design','Home','home'],['home-premium','Home Premium','Home','home'],
  ['flash-sale','Flash Sale','Sale','sale'],['new-arrival','New Arrival','Launch','electronics'],['premium-reveal','Premium Reveal','Premium','fashion'],['versus-compare','Compare & Choose','Comparison','electronics']
].map(([id,name,category,family])=>({id,name,category,family}));

function openDB() {
  return new Promise((resolve,reject)=>{
    const req=indexedDB.open(DB_NAME,1);
    req.onupgradeneeded=()=>req.result.createObjectStore(DB_STORE);
    req.onsuccess=()=>resolve(req.result);
    req.onerror=()=>reject(req.error);
  });
}
async function storeProject(value) {
  const db=await openDB();
  return new Promise((resolve,reject)=>{const tx=db.transaction(DB_STORE,'readwrite');tx.objectStore(DB_STORE).put(value,PROJECT_KEY);tx.oncomplete=()=>{db.close();resolve();};tx.onerror=()=>{db.close();reject(tx.error);};});
}
async function readProject() {
  const db=await openDB();
  return new Promise((resolve,reject)=>{const req=db.transaction(DB_STORE).objectStore(DB_STORE).get(PROJECT_KEY);req.onsuccess=()=>{db.close();resolve(req.result||null);};req.onerror=()=>{db.close();reject(req.error);};});
}
function blobUrl(blob){return blob?URL.createObjectURL(blob):'';}

function drawFrame(ctx, image, data, template, t, width, height) {
  const p=Math.min(1,Math.max(0,t/10)), ease=1-Math.pow(1-p,3);
  const item=templates.find(x=>x.id===template)||templates[0];
  const [c1,c2,accent]=families[item.family]||families.electronics;
  const light=['skincare-clean','interior-calm','everyday-design','specs-first'].includes(template);
  const g=ctx.createLinearGradient(0,0,width,height);g.addColorStop(0,c1);g.addColorStop(1,c2);ctx.fillStyle=g;ctx.fillRect(0,0,width,height);
  ctx.globalAlpha=.12;ctx.fillStyle=accent;ctx.beginPath();ctx.arc(width*(.82-ease*.08),height*.36,height*(.28+ease*.05),0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;
  const imageW=width*.43,imageH=height*.68,imageX=width*.52+(1-ease)*width*.07,imageY=(height-imageH)/2+Math.sin(p*Math.PI*2)*height*.012;
  if(image){const scale=Math.max(imageW/image.width,imageH/image.height),sw=imageW/scale,sh=imageH/scale,sx=(image.width-sw)/2,sy=(image.height-sh)/2;ctx.save();ctx.shadowColor='#00000055';ctx.shadowBlur=width*.03;ctx.shadowOffsetY=height*.025;ctx.beginPath();ctx.roundRect(imageX,imageY,imageW,imageH,width*.025);ctx.clip();ctx.drawImage(image,sx,sy,sw,sh,imageX,imageY,imageW,imageH);ctx.restore();}
  else{ctx.fillStyle=accent;ctx.globalAlpha=.8;ctx.beginPath();ctx.roundRect(imageX,imageY,imageW,imageH,width*.025);ctx.fill();ctx.globalAlpha=1;ctx.fillStyle=BRAND;ctx.font='bold '+Math.round(width*.026)+'px Arial';ctx.textAlign='center';ctx.fillText('YOUR PRODUCT',imageX+imageW/2,imageY+imageH/2);}
  ctx.textAlign='left';ctx.globalAlpha=Math.min(1,ease*1.5);ctx.fillStyle=light?'#172044':'#fff';ctx.font='bold '+Math.round(width*.021)+'px Arial';ctx.fillText('BUYLORA  /  '+item.category.toUpperCase(),width*.075,height*.17);ctx.globalAlpha=1;
  ctx.fillStyle=accent;ctx.font='bold '+Math.round(width*.016)+'px Arial';ctx.fillText((data.eyebrow||'Meet your new favourite').toUpperCase().slice(0,34),width*.075,height*.34);
  ctx.fillStyle=light?'#111827':'#fff';ctx.font='bold '+Math.round(width*.05)+'px Arial';
  const words=(data.name||'Your Product').split(' ');let line='',y=height*.46;
  for(const word of words){const test=line?line+' '+word:word;if(ctx.measureText(test).width>width*.39&&line){ctx.fillText(line,width*.075+(1-ease)*-width*.04,y);line=word;y+=height*.10;}else line=test;}
  if(line)ctx.fillText(line,width*.075+(1-ease)*-width*.04,y);
  ctx.fillStyle=light?'#475569':'#E2E8F0';ctx.font=Math.round(width*.02)+'px Arial';ctx.fillText((data.description||'Designed to make every day better.').slice(0,58),width*.075,height*.69);
  ctx.fillStyle=accent;ctx.font='bold '+Math.round(width*.023)+'px Arial';ctx.fillText(data.price||'DISCOVER MORE',width*.075,height*.82);
  ctx.globalAlpha=.8;ctx.fillStyle=light?'#475569':'#fff';ctx.font=Math.round(width*.014)+'px Arial';ctx.fillText('Smart picks. Simple buying.',width*.075,height*.92);ctx.textAlign='right';ctx.fillText('BUYLORA',width*.93,height*.92);ctx.globalAlpha=1;
}

export default function App(){
  const canvasRef=useRef(null),imageRef=useRef(null),fileRef=useRef(null),rafRef=useRef(null),chunksRef=useRef([]),recorderRef=useRef(null),voiceRecorderRef=useRef(null),voiceStreamRef=useRef(null),lastProgressRef=useRef(0),mediaRef=useRef({image:null,music:null,voice:null}),urlRef=useRef([]);
  const [imageUrl,setImageUrl]=useState(''),[musicUrl,setMusicUrl]=useState(''),[voiceName,setVoiceName]=useState('');
  const [data,setData]=useState({name:'Your Product',eyebrow:'Meet your new favourite',description:'Thoughtful design. Everyday performance.',price:'Explore now'});
  const [template,setTemplate]=useState('tech-spotlight'),[category,setCategory]=useState('All'),[playing,setPlaying]=useState(false),[progress,setProgress]=useState(0),[exporting,setExporting]=useState(false),[status,setStatus]=useState(''),[error,setError]=useState('');
  const [resolution,setResolution]=useState('720'),[musicVolume,setMusicVolume]=useState(65),[recording,setRecording]=useState(false),[savedAt,setSavedAt]=useState(''),[projectReady,setProjectReady]=useState(false);
  const render=useCallback((time,targetCanvas=canvasRef.current)=>{if(!targetCanvas)return;const ctx=targetCanvas.getContext('2d');drawFrame(ctx,imageRef.current,data,template,time,targetCanvas.width,targetCanvas.height);if(targetCanvas===canvasRef.current&&(time===0||time>=10||time-lastProgressRef.current>=.15)){lastProgressRef.current=time;setProgress(time);}},[data,template]);
  useEffect(()=>{render(progress);},[render]);
  useEffect(()=>{if(!playing)return;let start=performance.now()-progress*1000;const tick=now=>{const t=((now-start)/1000)%10;render(t);rafRef.current=requestAnimationFrame(tick);};rafRef.current=requestAnimationFrame(tick);return()=>cancelAnimationFrame(rafRef.current);},[playing,render]);
  const update=(key,value)=>setData(old=>({...old,[key]:value}));
  const setMedia=(key,blob)=>{mediaRef.current[key]=blob;};
  const handleImage=file=>{if(!file)return;if(!['image/jpeg','image/png','image/webp'].includes(file.type)){setError('Choose a JPG, PNG or WebP image.');return;}if(file.size>12*1024*1024){setError('Image must be smaller than 12 MB.');return;}setError('');setMedia('image',file);const url=blobUrl(file);urlRef.current.push(url);setImageUrl(url);const img=new Image();img.onload=()=>{imageRef.current=img;render(0);};img.src=url;};
  const handleMusic=file=>{if(!file)return;if(!file.type.startsWith('audio/')){setError('Choose an audio file.');return;}if(file.size>25*1024*1024){setError('Audio file must be under 25 MB.');return;}setMedia('music',file);const url=blobUrl(file);urlRef.current.push(url);setMusicUrl(url);setStatus('Music added. It will be mixed into the MP4 export.');};
  const downloadBlob=(blob,filename)=>{const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=filename;a.click();setTimeout(()=>URL.revokeObjectURL(url),30000);};
  const startVoice=async()=>{try{const stream=await navigator.mediaDevices.getUserMedia({audio:true});voiceStreamRef.current=stream;const mr=new MediaRecorder(stream);voiceRecorderRef.current=mr;const parts=[];mr.ondataavailable=e=>{if(e.data.size)parts.push(e.data);};mr.onstop=()=>{const blob=new Blob(parts,{type:mr.mimeType||'audio/webm'});setMedia('voice',blob);setVoiceName('Recorded voice-over');stream.getTracks().forEach(t=>t.stop());voiceStreamRef.current=null;setRecording(false);setStatus('Voice-over saved in this project.');};mr.start();setRecording(true);setStatus('Recording voice-over… press Stop when finished.');}catch(e){setError('Microphone unavailable or permission denied: '+e.message);}};
  const stopVoice=()=>{if(voiceRecorderRef.current&&voiceRecorderRef.current.state!=='inactive')voiceRecorderRef.current.stop();};
  useEffect(()=>{let cancelled=false;(async()=>{try{const saved=await readProject();if(cancelled||!saved)return;setData(saved.data||data);setTemplate(saved.template||'tech-spotlight');setResolution(saved.resolution||'720');setMusicVolume(saved.musicVolume??65);if(saved.image){setMedia('image',saved.image);const u=blobUrl(saved.image);urlRef.current.push(u);setImageUrl(u);const img=new Image();img.onload=()=>{imageRef.current=img;render(0);};img.src=u;}if(saved.music){setMedia('music',saved.music);const u=blobUrl(saved.music);urlRef.current.push(u);setMusicUrl(u);}if(saved.voice){setMedia('voice',saved.voice);setVoiceName('Saved voice-over');}setProjectReady(true);setStatus('Previous project restored from this browser.');}catch{setError('Could not restore the previous project on this browser.');}})();return()=>{cancelled=true;};},[]);
  useEffect(()=>{if(!projectReady)return;const timer=setTimeout(async()=>{try{await storeProject({data,template,resolution,musicVolume,...mediaRef.current,savedAt:Date.now()});setSavedAt(new Date().toLocaleTimeString());}catch{setError('Auto-save storage is full. Remove large media files and retry.');}},700);return()=>clearTimeout(timer);},[data,template,resolution,musicVolume,imageUrl,musicUrl,voiceName,projectReady]);
  useEffect(()=>()=>{urlRef.current.forEach(URL.revokeObjectURL);voiceStreamRef.current?.getTracks().forEach(t=>t.stop());},[]);
  const exportVideo=async()=>{if(exporting)return;setError('');setExporting(true);setStatus('Preparing video…');setPlaying(false);let stream=null,ffmpeg=null,recorder=null,audioCtx=null,sourceNodes=[];try{
    const canvas=canvasRef.current;if(!canvas?.captureStream||typeof MediaRecorder==='undefined')throw new Error('This browser does not support video recording. Try the latest Chrome.');
    const outW=resolution==='1080'?1920:1280,outH=resolution==='1080'?1080:720;const exportCanvas=document.createElement('canvas');exportCanvas.width=outW;exportCanvas.height=outH;render(0,exportCanvas);
    stream=exportCanvas.captureStream(30);let audioDestination=null;
    if(mediaRef.current.music||mediaRef.current.voice){audioCtx=new AudioContext();await audioCtx.resume();audioDestination=audioCtx.createMediaStreamDestination();
      const addAudio=async(blob,volume,loop)=>{if(!blob)return;const bytes=await blob.arrayBuffer();const buffer=await audioCtx.decodeAudioData(bytes);const src=audioCtx.createBufferSource();src.buffer=buffer;src.loop=loop;const gain=audioCtx.createGain();gain.gain.value=volume;src.connect(gain);gain.connect(audioDestination);src.start(0);sourceNodes.push(src);};
      await addAudio(mediaRef.current.music,musicVolume/100,true);await addAudio(mediaRef.current.voice,1,false);audioDestination.stream.getAudioTracks().forEach(track=>stream.addTrack(track));
    }
    const mime=MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')?'video/webm;codecs=vp9,opus':(MediaRecorder.isTypeSupported('video/webm;codecs=vp9')?'video/webm;codecs=vp9':'video/webm');
    recorder=new MediaRecorder(stream,{mimeType:mime,videoBitsPerSecond:resolution==='1080'?12000000:7000000});chunksRef.current=[];recorder.ondataavailable=e=>{if(e.data.size)chunksRef.current.push(e.data);};
    const stopped=new Promise((resolve,reject)=>{recorder.onstop=()=>resolve(new Blob(chunksRef.current,{type:'video/webm'}));recorder.onerror=()=>reject(new Error('Browser recording failed.'));});recorder.start();
    const start=performance.now();await new Promise(resolve=>{const frame=now=>{const elapsed=(now-start)/1000;render(Math.min(elapsed,10),exportCanvas);if(elapsed<10)requestAnimationFrame(frame);else resolve();};requestAnimationFrame(frame);});
    recorder.stop();stream.getTracks().forEach(t=>t.stop());const webm=await stopped;setStatus('Converting '+resolution+'p MP4…');ffmpeg=new FFmpeg();ffmpeg.on('log',({message})=>{if(message.includes('frame='))setStatus('Finishing MP4…');});
    const base=import.meta.env.BASE_URL+'ffmpeg',coreURL=base+'/ffmpeg-core.js',wasmURL=base+'/ffmpeg-core.wasm';const [cr,wr]=await Promise.all([fetch(coreURL),fetch(wasmURL)]);if(!cr.ok||!wr.ok)throw new Error('FFmpeg engine files could not be loaded. Refresh and retry.');
    await ffmpeg.load({coreURL,wasmURL});await ffmpeg.writeFile('input.webm',await fetchFile(webm));
    const args=['-i','input.webm','-c:v','libx264','-preset','ultrafast','-crf',resolution==='1080'?'23':'25','-pix_fmt','yuv420p','-movflags','+faststart'];
    if(audioDestination)args.push('-c:a','aac','-b:a','160k','-shortest');else args.push('-an');
    args.push('buylora-video.mp4');const code=await ffmpeg.exec(args);if(code!==0)throw new Error('MP4 conversion failed with FFmpeg code '+code);
    const output=await ffmpeg.readFile('buylora-video.mp4');if(!(output instanceof Uint8Array)||output.byteLength<1000||new TextDecoder().decode(output.slice(4,8))!=='ftyp')throw new Error('MP4 output validation failed.');
    downloadBlob(new Blob([output],{type:'video/mp4'}),'buylora-'+resolution+'p-product-video.mp4');setStatus(resolution+'p MP4 exported successfully'+(audioDestination?' with audio.':'.'));
  }catch(e){setError('Export failed: '+(e?.message||'Unknown error'));setStatus('');}finally{if(recorder&&recorder.state!=='inactive'){try{recorder.stop();}catch{}}stream?.getTracks().forEach(t=>t.stop());sourceNodes.forEach(n=>{try{n.stop();}catch{}});if(audioCtx)await audioCtx.close().catch(()=>{});ffmpeg?.terminate();setExporting(false);}};
  const reset=()=>{setPlaying(false);setProgress(0);setData({name:'Your Product',eyebrow:'Meet your new favourite',description:'Thoughtful design. Everyday performance.',price:'Explore now'});setTemplate('tech-spotlight');};
  const saveNow=async()=>{try{await storeProject({data,template,resolution,musicVolume,...mediaRef.current,savedAt:Date.now()});setSavedAt(new Date().toLocaleTimeString());setStatus('Project saved on this device.');}catch{setError('Could not save project. Browser storage may be full.');}};
  const reopen=async()=>{try{const p=await readProject();if(!p){setStatus('No saved project found on this device.');return;}setData(p.data);setTemplate(p.template);setResolution(p.resolution||'720');setMusicVolume(p.musicVolume??65);setMedia('image',p.image||null);setMedia('music',p.music||null);setMedia('voice',p.voice||null);setImageUrl(p.image?blobUrl(p.image):'');setMusicUrl(p.music?blobUrl(p.music):'');setVoiceName(p.voice?'Saved voice-over':'');if(p.image){const img=new Image();img.onload=()=>{imageRef.current=img;render(0);};img.src=blobUrl(p.image);}setStatus('Saved project reopened.');}catch{setError('Could not reopen project.');}};
  const categories=['All','Electronics','Fashion','Beauty','Home','Sale','Launch','Premium','Comparison'];
  const visibleTemplates=templates.filter(t=>category==='All'||t.category===category);
  return <div className="app-shell"><header className="topbar"><a className="brand" href="#"><span className="brand-mark">B</span><span>BUYLORA <small>VIDEO STUDIO</small></span></a><div className="top-pill"><span className="live-dot"/> ADVANCED CREATIVE STUDIO</div></header>
  <main className="workspace"><section className="intro"><div className="eyebrow"><Sparkles size={14}/> PRODUCT CREATIVE WORKSPACE</div><h1>Make your product<br/><span>impossible to ignore.</span></h1><p>Create polished product ads with templates, audio and reusable projects.</p></section>
  <div className="studio-grid"><section className="panel controls-panel"><div className="section-heading"><span className="step">01</span><div><h2>Product details</h2><p>Start with your product information</p></div></div>
  <div className="upload-zone" onClick={e=>{if(!e.target.closest('button,input'))fileRef.current?.click();}} onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault();handleImage(e.dataTransfer.files?.[0]);}}>{imageUrl?<img className="uploaded-thumb" src={imageUrl} alt="Uploaded product"/>:<div className="upload-icon"><Upload size={22}/></div>}<div><strong>{imageUrl?'Product image added':'Upload product image'}</strong><span>JPG, PNG or WebP · Up to 12 MB</span></div><button className="browse-btn" type="button" onClick={e=>{e.stopPropagation();fileRef.current?.click();}}>Browse</button><input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={e=>handleImage(e.target.files?.[0])}/></div>
  <label>Product name<input value={data.name} maxLength={36} onChange={e=>update('name',e.target.value)}/></label><label>Small headline<input value={data.eyebrow} maxLength={40} onChange={e=>update('eyebrow',e.target.value)}/></label><label>Short description<input value={data.description} maxLength={65} onChange={e=>update('description',e.target.value)}/></label><label>Price or call to action<input value={data.price} maxLength={24} onChange={e=>update('price',e.target.value)}/></label>
  <div className="section-heading template-title"><span className="step">02</span><div><h2>Template library · 24 layouts</h2><p>Electronics, fashion, beauty, home and campaigns</p></div></div><div className="category-tabs">{categories.map(c=><button key={c} className={category===c?'active':''} onClick={()=>setCategory(c)}>{c}</button>)}</div><div className="template-list">{visibleTemplates.map(item=><button key={item.id} className={'template-card '+(template===item.id?'selected':'')} onClick={()=>{setTemplate(item.id);setProgress(0);}}><span className={'template-swatch '+item.family}><i/></span><span className="template-copy"><strong>{item.name}</strong><small>{item.category}</small></span>{template===item.id&&<CheckCircle2 size={18} className="selected-check"/>}</button>)}</div>
  <div className="section-heading template-title"><span className="step">03</span><div><h2>Audio studio</h2><p>Add background music or record a voice-over</p></div></div><div className="audio-card"><label className="file-label"><Music2 size={17}/> Background music<input type="file" accept="audio/*" onChange={e=>handleMusic(e.target.files?.[0])}/></label>{musicUrl&&<><audio controls src={musicUrl}/><div className="range-row"><Volume2 size={16}/><span>Music volume</span><input type="range" min="0" max="100" value={musicVolume} onChange={e=>setMusicVolume(Number(e.target.value))}/><b>{musicVolume}%</b></div></>}<div className="voice-row"><span><Mic size={16}/> {voiceName||'Voice-over recording'}</span>{recording?<button className="secondary-btn" onClick={stopVoice}>Stop recording</button>:<button className="secondary-btn" onClick={startVoice}><Mic size={14}/> Record voice-over</button>}</div>{mediaRef.current.voice&&<button className="text-danger" onClick={()=>{setMedia('voice',null);setVoiceName('');}}>Remove voice-over</button>}</div>
  <div className="section-heading template-title"><span className="step">04</span><div><h2>Export settings</h2><p>Choose MP4 quality</p></div></div><div className="resolution-row"><button className={resolution==='720'?'active':''} onClick={()=>setResolution('720')}>720p · HD</button><button className={resolution==='1080'?'active':''} onClick={()=>setResolution('1080')}>1080p · Full HD</button></div>
  <div className="project-actions"><button className="secondary-btn" onClick={saveNow}><Save size={15}/> Save project</button><button className="secondary-btn" onClick={reopen}><FolderOpen size={15}/> Reopen saved</button></div><p className="autosave-note">{savedAt?'Last saved '+savedAt:'Auto-save is on · Stored in this browser'}</p><button className="reset-btn" onClick={reset}><RotateCcw size={14}/> Reset project</button></section>
  <section className="preview-column"><div className="preview-panel"><div className="preview-top"><div><span className="preview-label"><Film size={14}/> VIDEO PREVIEW</span><strong>1080 × 608 <i>·</i> 16:9</strong></div><span className="duration"><Clock3 size={13}/> 10 seconds</span></div><div className="canvas-wrap"><canvas ref={canvasRef} width="1080" height="608"/><div className="canvas-watermark">BUYLORA STUDIO</div></div><div className="player-controls"><button className="play-btn" onClick={()=>setPlaying(v=>!v)} aria-label={playing?'Pause preview':'Play preview'}>{playing?<Pause size={17}/>:<Play size={17} fill="currentColor"/>}</button><div className="timeline"><div className="timeline-track"><span style={{width:(progress/10*100)+'%'}}/></div><div className="time-labels"><span>Preview</span><span>{progress.toFixed(1)}s / 10.0s</span></div></div><button className="reset-preview" onClick={()=>{setPlaying(false);render(0);}}><RotateCcw size={16}/></button></div></div>
  <div className="export-panel"><div className="export-copy"><div className="export-icon"><Download size={19}/></div><div><strong>Ready to create?</strong><span>Export {resolution}p MP4 {mediaRef.current.music||mediaRef.current.voice?'with audio':'video'}</span></div></div><button className="export-btn" onClick={exportVideo} disabled={exporting}>{exporting?<><LoaderCircle className="spin" size={17}/> Creating…</>:<><Download size={17}/> Export MP4</>}</button>{status&&<p className="status-message">{status}</p>}{error&&<p className="error-message">{error}</p>}<p className="privacy-note"><ImageIcon size={13}/> Media and projects stay in this browser.</p></div>
  <div className="tip-card"><Sparkles size={17}/><p><strong>BUYLORA tip</strong> Keep the product as the hero. Use a short headline and clear benefit for a stronger ad.</p></div></section></div></main><footer><span>BUYLORA <b>·</b> Smart picks. Simple buying.</span><span>PRODUCT VIDEO STUDIO <b>·</b> V2.0</span></footer></div>;
}
