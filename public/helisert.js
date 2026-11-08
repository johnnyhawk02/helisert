/* Helisert 5.0 — ambient buffer looper for the browser.
   Web Audio API + AudioWorklet. Microphone input needs localhost or HTTPS;
   audio files and the built-in demo pad work anywhere. */
(() => {
  'use strict';

  /* ------------------------------------------------------------------ */
  /* Styles                                                              */
  /* ------------------------------------------------------------------ */
  const css = `
  :root{color-scheme:dark;--bg:#0e1014;--bg2:#171b21;--panel:#1b2027;--panel2:#15191f;--line:#343b45;--muted:#8993a1;--dim:#697482;--text:#edf0f4;--soft:#c1c9d2;
    --mint:#8ed8b4;--mintDeep:#286f5c;--amber:#e5b875;--red:#df776d;--redDeep:#75413d;--screen:#090c10;
    --mono:"IBM Plex Mono",ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;--sans:"IBM Plex Sans",ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif}
  *{box-sizing:border-box}
  html,body{background:var(--bg)}
  body{margin:0;background:radial-gradient(ellipse at 50% -20%,#303943 0,var(--bg2) 45%,var(--bg) 100%);color:var(--text);font:13px/1.4 var(--sans);min-height:100vh;
    padding-left:max(16px,env(safe-area-inset-left,0px));padding-right:max(16px,env(safe-area-inset-right,0px));padding-block:20px}
  button,input,select{font:inherit}
  .device{max-width:980px;margin:0 auto;padding:18px;border:1px solid #414852;border-radius:15px;background:linear-gradient(145deg,#292f38,#181c22 70%);box-shadow:0 24px 70px #0009}
  header{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:10px;padding:2px 2px 15px;border-bottom:1px solid #ffffff16;margin-bottom:14px}
  .logo{font-size:18px;font-weight:700;letter-spacing:.24em}.sub{font-size:9px;letter-spacing:.19em;color:var(--muted);margin-top:2px;font-family:var(--mono)}
  .status{display:flex;align-items:center;gap:8px;color:#aab3bf;font-size:10px;letter-spacing:.08em;font-family:var(--mono)}
  .led{width:8px;height:8px;border-radius:50%;background:#626b76;flex:none}.led.on{background:#7ee0aa;box-shadow:0 0 12px #7ee0aa}.led.rec{background:var(--red);box-shadow:0 0 12px var(--red)}
  .screen{background:#0c1014;border:1px solid #37414b;border-radius:9px;padding:10px;margin-bottom:12px}
  .screenTop{display:flex;justify-content:space-between;align-items:center;gap:8px;margin-bottom:7px;color:#8f9ba8;font-size:9px;letter-spacing:.15em;text-transform:uppercase;font-family:var(--mono)}
  .screenTop strong{color:var(--mint);font-weight:600}.screenTop strong.rec{color:var(--red)}
  .wave{display:block;width:100%;height:130px;border-radius:5px;background:var(--screen);cursor:crosshair;touch-action:none}
  .screenFoot{display:flex;flex-wrap:wrap;justify-content:space-between;gap:4px 10px;margin-top:7px;color:#788492;font-size:10px;font-variant-numeric:tabular-nums;font-family:var(--mono)}
  .meter{height:3px;background:#252c34;border-radius:4px;overflow:hidden;margin-top:8px}.meter i{display:block;width:0;height:100%;background:linear-gradient(90deg,#64c59b,#e6c17b,#df776d)}
  .grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}
  .panel{background:linear-gradient(160deg,var(--panel),var(--panel2));border:1px solid var(--line);border-radius:9px;padding:12px;min-width:0}
  .panel h2{font-size:9px;font-weight:600;letter-spacing:.17em;color:#a2acb9;margin:0 0 12px;text-transform:uppercase;font-family:var(--mono)}
  .btns{display:grid;grid-template-columns:1fr 1fr;gap:7px}
  .btn{border:1px solid #48515d;border-radius:6px;padding:9px 10px;background:#2b323c;color:#e9edf2;font-size:11px;font-weight:600;cursor:pointer;transition:background .12s,border-color .12s;letter-spacing:.03em}
  .btn:hover{background:#39434f}.btn:disabled{opacity:.35;cursor:not-allowed}.btn:focus-visible,.range:focus-visible,.switch:focus-visible{outline:2px solid var(--amber);outline-offset:2px}
  .btn.primary{background:var(--mintDeep);border-color:#4b9f81}.btn.primary:hover{background:#32866d}
  .btn.active{background:var(--redDeep);border-color:#b76d63}.btn.on{background:#2f5a4d;border-color:#4b9f81}
  .btn.span{grid-column:1/-1}
  .ctrl{margin:0 0 13px}.ctrl:last-child{margin-bottom:0}
  .label{display:flex;justify-content:space-between;align-items:center;gap:8px;margin-bottom:6px;color:var(--soft);font-size:10px;letter-spacing:.06em}
  .value{font-variant-numeric:tabular-nums;color:#f1f3f6;font-weight:600;font-family:var(--mono)}
  .range{width:100%;height:18px;display:block;accent-color:var(--mint);cursor:pointer;margin:0}
  .ends{display:flex;justify-content:space-between;color:var(--dim);font-size:8px;margin-top:2px;font-family:var(--mono)}
  .toggle{display:flex;justify-content:space-between;align-items:center;gap:10px;padding:7px 0;border-bottom:1px solid #ffffff10;color:#c5ccd5;font-size:10px;letter-spacing:.06em}
  .toggle:last-of-type{border:0}
  .switch{appearance:none;-webkit-appearance:none;width:30px;height:17px;border-radius:20px;background:#48515c;position:relative;cursor:pointer;flex:none;margin:0}
  .switch:before{content:"";position:absolute;left:2px;top:2px;width:13px;height:13px;border-radius:50%;background:#e7ebef;transition:left .15s}
  .switch:checked{background:#32856c}.switch:checked:before{left:15px}
  .rateBtns{display:grid;grid-template-columns:repeat(4,1fr);gap:5px;margin-top:8px}.rateBtns .btn{padding:7px 3px;font-size:10px}
  .note{font-size:10px;color:#8a95a3;line-height:1.5;margin-top:10px}
  .keys{font-size:9px;color:var(--dim);line-height:1.7;margin-top:10px;font-family:var(--mono)}
  .keys kbd{display:inline-block;min-width:16px;padding:0 4px;border:1px solid #48515d;border-radius:3px;color:var(--soft);text-align:center;font:inherit}
  .bottom{display:flex;flex-wrap:wrap;justify-content:space-between;gap:6px 12px;padding:11px 2px 0;color:#717d8a;font-size:9px;letter-spacing:.08em;font-family:var(--mono)}
  .file{position:absolute;width:1px;height:1px;opacity:0;pointer-events:none}
  .drop .screen{border-color:var(--mint);box-shadow:0 0 0 2px #8ed8b433}
  @media(max-width:760px){.grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
  @media(max-width:500px){body{padding-block:8px}.device{padding:11px}.grid{grid-template-columns:minmax(0,1fr)}.wave{height:100px}}
  @media(prefers-reduced-motion:reduce){*{transition:none!important}}
  `;

  /* ------------------------------------------------------------------ */
  /* Markup                                                              */
  /* ------------------------------------------------------------------ */
  const root = document.createElement('main');
  root.className = 'device';
  root.innerHTML = `<style>${css}</style>
  <header>
    <div><div class="logo">HELISERT</div><div class="sub">VERSION 5.0 · AMBIENT BUFFER / LOOP PROCESSOR</div></div>
    <div class="status"><i class="led" id="led"></i><span id="status">AUDIO ENGINE IDLE</span></div>
  </header>
  <section class="screen" aria-label="Loop buffer">
    <div class="screenTop"><span id="srcName">BUFFER / DEMO PAD</span><strong id="mode">BUFFER READY</strong></div>
    <canvas class="wave" id="wave" width="1200" height="260" aria-label="Waveform. Click to set the start offset."></canvas>
    <div class="screenFoot"><span id="loopReadout">BUFFER 8.000 s · DEMO</span><span id="clock">0.000 / 8.000 s</span></div>
    <div class="meter"><i id="meter"></i></div>
  </section>
  <div class="grid">
    <section class="panel">
      <h2>Transport</h2>
      <div class="btns">
        <button class="btn primary" id="play">▶ PLAY</button>
        <button class="btn" id="stop">■ STOP</button>
        <button class="btn" id="trigger" title="Restart from the offset point">↗ TRIGGER</button>
        <button class="btn" id="capture" disabled title="Record from the microphone">● CAPTURE</button>
        <button class="btn span" id="recOut" title="Record what you hear to a file">◉ RECORD OUTPUT</button>
      </div>
      <div class="note" id="message">The demo pad is loaded. Press Play, then try Speed, Reverse and Space.</div>
      <div class="keys"><kbd>Space</kbd> play/stop · <kbd>T</kbd> trigger · <kbd>C</kbd> capture · <kbd>R</kbd> reverse · <kbd>S</kbd> skid</div>
    </section>
    <section class="panel">
      <h2>Source</h2>
      <div class="btns">
        <button class="btn span" id="mic">CONNECT MICROPHONE</button>
        <button class="btn" id="load">LOAD AUDIO FILE</button>
        <button class="btn" id="demo">DEMO PAD</button>
        <button class="btn span" id="clear">CLEAR BUFFER</button>
      </div>
      <input class="file" id="file" type="file" accept="audio/*,.wav,.mp3,.ogg,.flac,.m4a,.aac,.webm">
      <div class="ctrl" style="margin-top:13px"><div class="label"><span>CAPTURE LENGTH</span><span class="value" id="lengthV">8.00 s</span></div>
        <input class="range" id="length" type="range" min="0.1" max="30" step="0.05" value="8"><div class="ends"><span>0.1 s</span><span>30 s</span></div></div>
      <div class="ctrl"><div class="label"><span>INPUT GAIN</span><span class="value" id="inGainV">0.0 dB</span></div>
        <input class="range" id="inGain" type="range" min="-12" max="12" step="0.1" value="0"></div>
      <div class="note">You can also drop an audio file onto the waveform. Files are trimmed to 60 seconds.</div>
    </section>
    <section class="panel">
      <h2>Loop parameters</h2>
      <div class="ctrl"><div class="label"><span>SPEED</span><span class="value" id="rateV">1.00×</span></div>
        <input class="range" id="rate" type="range" min="-3" max="3" step="0.01" value="0">
        <div class="ends"><span>⅛×</span><span>1×</span><span>8×</span></div>
        <div class="rateBtns">
          <button class="btn" data-rate="0.125">⅛×</button><button class="btn" data-rate="0.25">¼×</button><button class="btn" data-rate="0.5">½×</button><button class="btn" data-rate="1">1×</button>
          <button class="btn" data-rate="2">2×</button><button class="btn" data-rate="4">4×</button><button class="btn" data-rate="8">8×</button><button class="btn" id="rev">REV</button>
        </div></div>
      <div class="ctrl"><div class="label"><span>OFFSET</span><span class="value" id="offsetV">0.0%</span></div>
        <input class="range" id="offset" type="range" min="0" max="99" step="0.1" value="0"></div>
      <div class="ctrl"><div class="label"><span>X-LENGTH / CROSSFADE</span><span class="value" id="xLengthV">50%</span></div>
        <input class="range" id="xLength" type="range" min="0" max="100" step="1" value="50"></div>
    </section>
    <section class="panel">
      <h2>Mix</h2>
      <div class="ctrl"><div class="label"><span>DRY (LIVE INPUT)</span><span class="value" id="dryV">0%</span></div>
        <input class="range" id="dry" type="range" min="0" max="100" step="1" value="0"></div>
      <div class="ctrl"><div class="label"><span>WET / LOOP LEVEL</span><span class="value" id="wetV">0.0 dB</span></div>
        <input class="range" id="wet" type="range" min="-36" max="12" step="0.1" value="0"></div>
      <div class="ctrl"><div class="label"><span>SPACE (REVERB)</span><span class="value" id="spaceV">35%</span></div>
        <input class="range" id="space" type="range" min="0" max="100" step="1" value="35"></div>
      <div class="ctrl"><div class="label"><span>TONE</span><span class="value" id="toneV">OPEN</span></div>
        <input class="range" id="tone" type="range" min="0" max="100" step="1" value="100"><div class="ends"><span>DARK</span><span>OPEN</span></div></div>
    </section>
    <section class="panel">
      <h2>Overdub</h2>
      <div class="toggle">OVERDUB <input class="switch" id="overdub" type="checkbox" aria-label="Overdub"></div>
      <div class="ctrl" style="margin-top:10px"><div class="label"><span>OVERDUB AMOUNT</span><span class="value" id="overdubV">35%</span></div>
        <input class="range" id="overdubAmt" type="range" min="0" max="100" step="1" value="35"></div>
      <div class="note">Overdub blends live input into the buffer as it plays. Higher amounts replace the old layer faster.</div>
    </section>
    <section class="panel">
      <h2>Performance</h2>
      <div class="toggle">SKID <input class="switch" id="skid" type="checkbox" aria-label="Skid"></div>
      <div class="toggle">STREAM LOCK <input class="switch" id="lock" type="checkbox" checked aria-label="Stream lock"></div>
      <div class="toggle">AUTO CROSSFADE <input class="switch" id="autoFade" type="checkbox" checked aria-label="Auto crossfade"></div>
      <div class="note">Skid glides between speeds like tape. Stream lock keeps the play position when you change speed; with it off, a speed change restarts from the offset.</div>
    </section>
  </div>
  <div class="bottom"><span>HELISERT 5.0 · WEB DSP EDITION</span><span id="engine">CLICK PLAY TO START AUDIO</span></div>`;
  document.body.appendChild(root);

  const $ = id => root.querySelector('#' + id);
  const db = v => Math.pow(10, v / 20);

  /* ------------------------------------------------------------------ */
  /* AudioWorklet DSP                                                    */
  /* ------------------------------------------------------------------ */
  const WORKLET = `
  class HelisertProcessor extends AudioWorkletProcessor{
    constructor(){super();
      this.L=null;this.R=null;this.n=0;this.pos=0;this.playing=false;this.recording=false;
      this.rate=1;this.target=1;this.skid=false;this.glide=1-Math.exp(-1/(0.35*sampleRate));
      this.offset=0;this.fade=.5;this.autoFade=true;this.overdub=false;this.odAmt=.35;this.streamLock=true;
      this.inGain=1;this.dry=0;this.wet=1;this.peak=0;this.tick=0;this.tickN=Math.round(sampleRate/30);this.waveTick=0;
      this.port.onmessage=e=>this.command(e.data)}
    command(m){switch(m.type){
      case'record':this.n=Math.max(64,Math.floor(m.seconds*sampleRate));this.L=new Float32Array(this.n);this.R=new Float32Array(this.n);
        this.pos=0;this.recording=true;this.playing=false;this.port.postMessage({type:'recording',frames:this.n});break;
      case'stopRecord':if(this.recording)this.finishCapture();break;
      case'load':this.recording=false;this.L=m.L;this.R=m.R;this.n=m.L.length;this.pos=Math.floor(this.n*this.offset);this.sendWave('captured');break;
      case'play':if(this.n){if(!this.playing||m.retrigger)this.pos=Math.min(this.n-1,Math.floor(this.n*this.offset));this.playing=true;this.recording=false}break;
      case'stop':this.playing=false;if(this.recording)this.finishCapture();break;
      case'clear':this.L=this.R=null;this.n=0;this.playing=this.recording=false;this.pos=0;this.port.postMessage({type:'cleared'});break;
      case'rate':{let changed=m.value!==this.target;this.target=m.value;this.skid=!!m.skid;if(!this.skid)this.rate=m.value;
        if(changed&&!this.streamLock&&this.playing&&this.n)this.pos=Math.min(this.n-1,Math.floor(this.n*this.offset));break}
      case'params':Object.assign(this,m.values);break;
      case'export':if(this.n)this.port.postMessage({type:'export',L:this.L.slice(),R:this.R.slice()});break;
    }}
    finishCapture(){if(!this.L||!this.recording)return;this.recording=false;
      if(this.pos>64&&this.pos<this.n){this.L=this.L.slice(0,this.pos);this.R=this.R.slice(0,this.pos);this.n=this.pos}
      // short fade at the capture edges to avoid clicks
      let e=Math.min(256,this.n>>3);for(let i=0;i<e;i++){let g=i/e;this.L[i]*=g;this.R[i]*=g;this.L[this.n-1-i]*=g;this.R[this.n-1-i]*=g}
      this.pos=Math.floor(this.n*this.offset);this.sendWave('captured')}
    sendWave(type){let W=600,mn=new Float32Array(W),mx=new Float32Array(W),n=this.n;
      for(let k=0;k<W;k++){let s=Math.floor(k*n/W),e=Math.max(s+1,Math.floor((k+1)*n/W)),lo=0,hi=0,step=Math.max(1,((e-s)/64)|0);
        for(let j=s;j<Math.min(e,n);j+=step){let v=(this.L[j]+this.R[j])*.5;if(v<lo)lo=v;if(v>hi)hi=v}mn[k]=lo;mx[k]=hi}
      this.port.postMessage({type,frames:n,seconds:n/sampleRate,mn,mx},[mn.buffer,mx.buffer])}
    interp(a,p){let n=this.n,i=Math.floor(p),f=p-i;i=((i%n)+n)%n;
      let y0=a[(i-1+n)%n],y1=a[i],y2=a[(i+1)%n],y3=a[(i+2)%n];
      return y1+.5*f*(y2-y0+f*(2*y0-5*y1+4*y2-y3+f*(3*(y1-y2)+y3-y0)))}
    process(inputs,outputs){
      let input=inputs[0]||[],out=outputs[0];if(!out||!out.length)return true;
      let il=input[0],ir=input[1]||il,ol=out[0],or=out[1]||out[0],N=ol.length,peak=0;
      for(let i=0;i<N;i++){
        let l=(il?il[i]:0)*this.inGain,r=(ir?ir[i]:0)*this.inGain,al=Math.abs(l),ar=Math.abs(r);if(al>peak)peak=al;if(ar>peak)peak=ar;
        if(this.recording&&this.L){this.L[this.pos]=l;this.R[this.pos]=r;this.pos++;if(this.pos>=this.n){this.pos=this.n;this.finishCapture()}}
        let a=0,b=0;
        if(this.playing&&this.n&&!this.recording){
          let n=this.n,p=this.pos,fadeN=this.autoFade?Math.floor(Math.min(n*.24,this.fade*n*.5)):0;
          if(fadeN>1&&this.rate>=0&&p>=n-fadeN){let t=(p-(n-fadeN))/fadeN,c=Math.cos(t*Math.PI/2),s=Math.sin(t*Math.PI/2),q=p-(n-fadeN);
            a=this.interp(this.L,p)*c+this.interp(this.L,q)*s;b=this.interp(this.R,p)*c+this.interp(this.R,q)*s}
          else if(fadeN>1&&this.rate<0&&p<fadeN){let t=(fadeN-p)/fadeN,c=Math.cos(t*Math.PI/2),s=Math.sin(t*Math.PI/2),q=n-fadeN+p;
            a=this.interp(this.L,p)*c+this.interp(this.L,q)*s;b=this.interp(this.R,p)*c+this.interp(this.R,q)*s}
          else{a=this.interp(this.L,p);b=this.interp(this.R,p)}
          if(this.overdub&&this.odAmt>0){let k=this.odAmt*.35,ix=((Math.floor(p)%n)+n)%n;
            this.L[ix]=Math.max(-1,Math.min(1,this.L[ix]*(1-k)+l*k));this.R[ix]=Math.max(-1,Math.min(1,this.R[ix]*(1-k)+r*k))}
          if(this.skid)this.rate+=(this.target-this.rate)*this.glide;else this.rate=this.target;
          this.pos+=this.rate;let span=fadeN>1?n-fadeN:n;
          if(this.rate>=0){while(this.pos>=n)this.pos-=span}else{while(this.pos<0)this.pos+=span}
        }
        ol[i]=Math.max(-1,Math.min(1,l*this.dry+a*this.wet));or[i]=Math.max(-1,Math.min(1,r*this.dry+b*this.wet));
      }
      if(peak>this.peak)this.peak=peak;this.tick+=N;
      if(this.tick>=this.tickN){this.tick=0;
        this.port.postMessage({type:'meter',peak:this.peak,pos:this.pos,n:this.n,rate:this.rate,playing:this.playing,recording:this.recording});this.peak=0;
        if(this.overdub&&this.playing&&this.n&&++this.waveTick>=15){this.waveTick=0;this.sendWave('wave')}}
      return true}
  }
  registerProcessor('helisert-dsp',HelisertProcessor);`;

  /* ------------------------------------------------------------------ */
  /* State                                                               */
  /* ------------------------------------------------------------------ */
  let ctx = null, node = null, mic = null, micSource = null, enginePromise = null;
  let outBus = null, reverb = null, spaceGain = null, toneFilter = null, recDest = null, recorder = null, recChunks = [];
  let bufferFrames = 0, bufferRate = 48000, bufferSource = 'demo', bufferName = 'DEMO PAD';
  let playing = false, recording = false, pos = 0, reverse = false, peakHold = 0;
  let waveMin = null, waveMax = null;

  const msg = t => { $('message').textContent = t; };
  const speed = () => Math.pow(2, +$('rate').value);
  const rate = () => (reverse ? -1 : 1) * speed();

  /* ------------------------------------------------------------------ */
  /* Demo pad: a seamless 8 s ambient chord                              */
  /* ------------------------------------------------------------------ */
  function makeDemo(sr) {
    const secs = 8, n = Math.round(secs * sr), L = new Float32Array(n), R = new Float32Array(n);
    const base = 1 / secs; // every frequency is a whole multiple of 1/8 Hz, so the loop is seamless
    const q = f => Math.round(f / base) * base;
    const notes = [110, 164.81, 220, 277.18, 329.63, 415.3, 493.88, 659.26];
    const voices = [];
    notes.forEach((f, k) => {
      [-1, 1].forEach(side => {
        voices.push({ f: q(f * (1 + side * 0.0018)), amp: 0.11 / (1 + k * 0.35), pan: 0.5 + side * 0.32 * ((k % 3) / 2 + 0.3),
          lfo: (1 + (k % 4)) / secs, ph: k * 1.7 + (side > 0 ? 2.1 : 0), h2: k < 3 ? 0.25 : 0.08 });
      });
    });
    for (const v of voices) {
      const w = 2 * Math.PI * v.f / sr, wl = 2 * Math.PI * v.lfo / sr, gl = Math.cos(v.pan * Math.PI / 2), gr = Math.sin(v.pan * Math.PI / 2);
      for (let i = 0; i < n; i++) {
        const env = 0.55 + 0.45 * Math.sin(wl * i + v.ph);
        const s = (Math.sin(w * i + v.ph) + v.h2 * Math.sin(2 * w * i)) * v.amp * env * env;
        L[i] += s * gl; R[i] += s * gr;
      }
    }
    let seed = 7; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647) * 2 - 1;
    let lp = 0, lp2 = 0; // a little filtered air
    for (let i = 0; i < n; i++) { lp += (rnd() - lp) * 0.02; lp2 += (rnd() - lp2) * 0.02; const sw = 0.5 + 0.5 * Math.sin(2 * Math.PI * i / n * 2);
      L[i] = Math.tanh((L[i] + lp * 0.06 * sw) * 1.1); R[i] = Math.tanh((R[i] + lp2 * 0.06 * sw) * 1.1); }
    return { L, R, sr };
  }

  function waveFrom(L, R) {
    const W = 600, n = L.length, mn = new Float32Array(W), mx = new Float32Array(W);
    for (let k = 0; k < W; k++) { const s = Math.floor(k * n / W), e = Math.floor((k + 1) * n / W); let lo = 0, hi = 0;
      for (let j = s; j < e; j += 4) { const v = (L[j] + R[j]) * 0.5; if (v < lo) lo = v; if (v > hi) hi = v; } mn[k] = lo; mx[k] = hi; }
    return { mn, mx };
  }

  /* ------------------------------------------------------------------ */
  /* Engine                                                              */
  /* ------------------------------------------------------------------ */
  function impulse(c, secs = 4.5) {
    const n = Math.floor(secs * c.sampleRate), b = c.createBuffer(2, n, c.sampleRate);
    for (let ch = 0; ch < 2; ch++) { const d = b.getChannelData(ch); let lp = 0;
      for (let i = 0; i < n; i++) { const t = i / n; lp += ((Math.random() * 2 - 1) - lp) * (0.5 - 0.42 * t); d[i] = lp * Math.pow(1 - t, 2.6) * (i < 300 ? i / 300 : 1); } }
    return b;
  }

  async function addWorklet(c) {
    const tries = [
      () => URL.createObjectURL(new Blob([WORKLET], { type: 'text/javascript' })),
      () => 'data:text/javascript;charset=utf-8,' + encodeURIComponent(WORKLET),
      () => new URL('helisert-worklet.js', document.baseURI).href,
    ];
    let last;
    for (const t of tries) { try { await c.audioWorklet.addModule(t()); return; } catch (e) { last = e; } }
    throw last || new Error('AudioWorklet unavailable');
  }

  function ensureEngine() {
    if (enginePromise) return enginePromise;
    enginePromise = (async () => {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC || !('audioWorklet' in AC.prototype)) throw new Error('This browser does not support AudioWorklet. Try a current Chrome, Edge, Firefox or Safari.');
      ctx = new AC({ latencyHint: 'interactive' });
      await addWorklet(ctx);
      node = new AudioWorkletNode(ctx, 'helisert-dsp', { numberOfInputs: 1, numberOfOutputs: 1, outputChannelCount: [2] });
      node.port.onmessage = onMessage;
      toneFilter = ctx.createBiquadFilter(); toneFilter.type = 'lowpass'; toneFilter.Q.value = 0.5;
      outBus = ctx.createGain();
      reverb = ctx.createConvolver(); reverb.buffer = impulse(ctx);
      spaceGain = ctx.createGain();
      const dryBus = ctx.createGain();
      node.connect(toneFilter);
      toneFilter.connect(dryBus); dryBus.connect(outBus);
      toneFilter.connect(reverb); reverb.connect(spaceGain); spaceGain.connect(outBus);
      outBus.connect(ctx.destination);
      if (ctx.createMediaStreamDestination) { recDest = ctx.createMediaStreamDestination(); outBus.connect(recDest); }
      // feed the worklet a silent input so it always runs
      const silent = ctx.createConstantSource ? ctx.createConstantSource() : null;
      if (silent) { silent.offset.value = 0; silent.connect(node); silent.start(); }
      sendParams(); sendRate(); applyMix();
      // hand the current buffer to the engine
      if (bufferSource === 'demo') { const d = makeDemo(ctx.sampleRate); node.port.postMessage({ type: 'load', L: d.L, R: d.R }, [d.L.buffer, d.R.buffer]); }
      else if (pendingFile) { await loadDecoded(pendingFile); pendingFile = null; }
      $('led').classList.add('on'); $('status').textContent = 'AUDIO ENGINE RUNNING';
      $('engine').textContent = 'AUDIOWORKLET DSP · ' + ctx.sampleRate + ' Hz';
      return ctx;
    })().catch(e => { enginePromise = null; $('status').textContent = 'AUDIO ERROR'; msg(e.message || String(e)); throw e; });
    return enginePromise;
  }

  async function resume() { const c = await ensureEngine(); if (c.state !== 'running') await c.resume(); return c; }

  function send(type, extra = {}) { if (node) node.port.postMessage({ type, ...extra }); }
  function currentParams() {
    return { inGain: db(+$('inGain').value), dry: (+$('dry').value) / 100, wet: db(+$('wet').value), fade: (+$('xLength').value) / 100,
      autoFade: $('autoFade').checked, overdub: $('overdub').checked, odAmt: (+$('overdubAmt').value) / 100, streamLock: $('lock').checked,
      offset: (+$('offset').value) / 100 };
  }
  const sendParams = () => send('params', { values: currentParams() });
  const sendRate = () => send('rate', { value: rate(), skid: $('skid').checked });
  function applyMix() {
    if (!ctx) return;
    const t = ctx.currentTime, sp = (+$('space').value) / 100, tone = (+$('tone').value) / 100;
    spaceGain.gain.setTargetAtTime(sp * 1.6, t, 0.05);
    toneFilter.frequency.setTargetAtTime(Math.min(ctx.sampleRate / 2 - 100, 300 * Math.pow(20000 / 300, tone)), t, 0.05);
  }

  /* ------------------------------------------------------------------ */
  /* Readouts                                                            */
  /* ------------------------------------------------------------------ */
  const fmtSpeed = s => s < 1 ? ({ 0.125: '⅛', 0.25: '¼', 0.5: '½' }[+s.toFixed(3)] ? ({ 0.125: '⅛', 0.25: '¼', 0.5: '½' }[+s.toFixed(3)] + '×') : s.toFixed(2) + '×') : s.toFixed(2) + '×';
  function refreshLabels() {
    $('rateV').textContent = (reverse ? 'REV ' : '') + fmtSpeed(speed());
    $('rev').classList.toggle('on', reverse);
    root.querySelectorAll('[data-rate]').forEach(b => b.classList.toggle('on', Math.abs(+b.dataset.rate - speed()) < 0.005));
    $('lengthV').textContent = (+$('length').value).toFixed(2) + ' s';
    $('offsetV').textContent = (+$('offset').value).toFixed(1) + '%';
    $('xLengthV').textContent = $('xLength').value + '%';
    $('inGainV').textContent = (+$('inGain').value).toFixed(1) + ' dB';
    $('dryV').textContent = $('dry').value + '%';
    $('wetV').textContent = (+$('wet').value).toFixed(1) + ' dB';
    $('spaceV').textContent = $('space').value + '%';
    const tone = +$('tone').value; $('toneV').textContent = tone >= 99 ? 'OPEN' : Math.round(300 * Math.pow(20000 / 300, tone / 100)) + ' Hz';
    $('overdubV').textContent = $('overdubAmt').value + '%';
  }
  function setMode(text, rec) { $('mode').textContent = text; $('mode').classList.toggle('rec', !!rec); }
  function setBufferInfo() {
    const secs = bufferFrames / bufferRate;
    $('srcName').textContent = 'BUFFER / ' + bufferName;
    $('loopReadout').textContent = bufferFrames ? 'BUFFER ' + secs.toFixed(3) + ' s · ' + bufferFrames.toLocaleString() + ' SAMPLES' : 'BUFFER EMPTY';
    $('clear').disabled = !bufferFrames;
    ['play', 'trigger'].forEach(id => $(id).disabled = !bufferFrames && !recording);
  }

  /* ------------------------------------------------------------------ */
  /* Waveform                                                            */
  /* ------------------------------------------------------------------ */
  const canvas = $('wave'), g = canvas.getContext('2d');
  function draw() {
    const w = canvas.width, h = canvas.height, mid = h / 2;
    g.fillStyle = '#090c10'; g.fillRect(0, 0, w, h);
    g.strokeStyle = '#1d262e'; g.lineWidth = 1;
    for (let i = 1; i < 8; i++) { const x = Math.round(i * w / 8) + 0.5; g.beginPath(); g.moveTo(x, 0); g.lineTo(x, h); g.stroke(); }
    g.strokeStyle = '#26313a'; g.beginPath(); g.moveTo(0, mid); g.lineTo(w, mid); g.stroke();
    if (recording) {
      const p = bufferFrames ? Math.min(1, pos / bufferFrames) : 0;
      g.fillStyle = '#df776d22'; g.fillRect(0, 0, p * w, h);
      g.fillStyle = '#df776d'; g.fillRect(p * w - 1, 0, 2, h);
      g.fillStyle = '#df776d'; g.font = '600 20px ui-monospace,monospace'; g.textAlign = 'center'; g.fillText('CAPTURING ' + Math.round(p * 100) + '%', w / 2, mid + 7);
      return;
    }
    if (!bufferFrames || !waveMin) {
      g.fillStyle = '#5f6b78'; g.font = '600 20px ui-monospace,monospace'; g.textAlign = 'center';
      g.fillText('EMPTY — CAPTURE, LOAD A FILE OR PICK THE DEMO PAD', w / 2, mid + 7); return;
    }
    const W = waveMin.length, off = (+$('offset').value) / 100;
    g.fillStyle = '#e5b87514'; g.fillRect(0, 0, off * w, h);
    // crossfade zones
    if ($('autoFade').checked) { const f = Math.min(0.24, (+$('xLength').value) / 200); if (f > 0) { g.fillStyle = '#8ed8b40f'; g.fillRect((1 - f) * w, 0, f * w, h); g.fillRect(0, 0, f * w, h); } }
    g.fillStyle = '#83d5b0';
    const bw = w / W;
    for (let k = 0; k < W; k++) {
      const top = mid - Math.min(1, waveMax[k] * 1.15) * mid * 0.92, bot = mid - Math.max(-1, waveMin[k] * 1.15) * mid * 0.92;
      g.fillRect(k * bw, top, Math.max(1, bw - 0.6), Math.max(1, bot - top));
    }
    g.strokeStyle = '#e5b875aa'; g.setLineDash([6, 6]); g.lineWidth = 2; g.beginPath(); g.moveTo(off * w, 0); g.lineTo(off * w, h); g.stroke(); g.setLineDash([]);
    if (playing) { const x = (pos / bufferFrames) * w; g.fillStyle = '#e5b875'; g.fillRect(x - 1, 0, 3, h); }
  }

  /* ------------------------------------------------------------------ */
  /* Worklet messages                                                    */
  /* ------------------------------------------------------------------ */
  function onMessage(e) {
    const m = e.data;
    if (m.type === 'captured' || m.type === 'wave') {
      waveMin = m.mn; waveMax = m.mx; bufferFrames = m.frames; bufferRate = ctx.sampleRate;
      if (m.type === 'captured') {
        if (recording) { recording = false; $('capture').textContent = '● CAPTURE'; $('capture').classList.remove('active'); $('led').classList.remove('rec'); $('led').classList.add('on');
          msg('Captured ' + m.seconds.toFixed(2) + ' s. Press Play, or turn on Overdub to layer over it.'); }
        setMode(playing ? 'PLAYING' : 'BUFFER READY'); setBufferInfo();
        if (wantPlayAfterLoad) { wantPlayAfterLoad = false; doPlay(false); }
      }
      draw();
    } else if (m.type === 'recording') {
      recording = true; bufferFrames = m.frames; pos = 0; setMode('CAPTURING', true);
      $('capture').textContent = '■ STOP CAPTURE'; $('capture').classList.add('active'); $('led').classList.add('rec');
      msg('Capturing the microphone. Press Stop Capture to end early.'); setBufferInfo();
    } else if (m.type === 'cleared') {
      bufferFrames = 0; waveMin = waveMax = null; playing = false; setMode('EMPTY BUFFER'); bufferName = 'EMPTY'; setBufferInfo(); syncPlay(); draw();
    } else if (m.type === 'meter') {
      pos = m.pos; peakHold = Math.max(m.peak, peakHold * 0.85);
      if (m.playing !== playing && !recording) { playing = m.playing; syncPlay(); }
      const sr = ctx.sampleRate;
      $('clock').textContent = recording ? (m.pos / sr).toFixed(3) + ' / ' + (m.n / sr).toFixed(3) + ' s · REC'
        : m.n ? (m.pos / sr).toFixed(3) + ' / ' + (m.n / sr).toFixed(3) + ' s · ' + (m.rate < 0 ? '−' : '') + Math.abs(m.rate).toFixed(2) + '×' : '0.000 s';
      draw();
    } else if (m.type === 'export') {
      // reserved
    }
  }

  function syncPlay() {
    $('play').classList.toggle('active', playing);
    $('play').textContent = playing ? '▶ PLAYING' : '▶ PLAY';
    if (!recording) setMode(playing ? 'PLAYING' : bufferFrames ? 'BUFFER READY' : 'EMPTY BUFFER');
  }

  /* ------------------------------------------------------------------ */
  /* Output meter from the analyser-free peak (input) + output level     */
  /* ------------------------------------------------------------------ */
  let outAnalyser = null, meterData = null;
  function meterLoop() {
    if (ctx && outBus && !outAnalyser) { outAnalyser = ctx.createAnalyser(); outAnalyser.fftSize = 1024; outBus.connect(outAnalyser); meterData = new Float32Array(outAnalyser.fftSize); }
    if (outAnalyser) { outAnalyser.getFloatTimeDomainData(meterData); let p = 0; for (let i = 0; i < meterData.length; i++) { const a = Math.abs(meterData[i]); if (a > p) p = a; }
      $('meter').style.width = Math.min(100, Math.max(p, peakHold) * 100) + '%'; }
    requestAnimationFrame(meterLoop);
  }

  /* ------------------------------------------------------------------ */
  /* Actions                                                             */
  /* ------------------------------------------------------------------ */
  let wantPlayAfterLoad = false, pendingFile = null;

  async function doPlay(retrigger) {
    try { await resume(); } catch { return; }
    if (!bufferFrames) { msg('The buffer is empty. Capture from the microphone, load a file or pick the demo pad.'); return; }
    sendParams(); sendRate(); send('play', { retrigger }); playing = true; syncPlay();
    if (retrigger) setMode('TRIGGERED');
  }
  function doStop() { send('stop'); playing = false; syncPlay(); }

  async function toggleMic() {
    if (mic) {
      mic.getTracks().forEach(t => t.stop()); micSource && micSource.disconnect(); mic = micSource = null;
      $('mic').textContent = 'CONNECT MICROPHONE'; $('mic').classList.remove('active'); $('capture').disabled = true;
      if (recording) send('stopRecord');
      msg('Microphone disconnected. Your buffer is kept.'); return;
    }
    try {
      await resume();
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) throw new Error('Microphone input needs HTTPS or localhost. You can still load audio files.');
      mic = await navigator.mediaDevices.getUserMedia({ audio: { channelCount: 2, echoCancellation: false, noiseSuppression: false, autoGainControl: false } });
      micSource = ctx.createMediaStreamSource(mic); micSource.connect(node);
      $('mic').textContent = 'DISCONNECT MICROPHONE'; $('mic').classList.add('active'); $('capture').disabled = false;
      msg('Microphone connected. Set Capture Length and press Capture. Use headphones if you raise Dry or use Overdub.');
    } catch (e) {
      mic = null;
      const denied = e && (e.name === 'NotAllowedError' || e.name === 'SecurityError');
      msg(denied ? 'The microphone is blocked here. Allow it in your browser, or open the standalone version. Loading an audio file works everywhere.' : (e.message || String(e)));
    }
  }

  async function doCapture() {
    if (!mic) { msg('Connect the microphone first.'); return; }
    await resume();
    if (recording) { send('stopRecord'); return; }
    playing = false; syncPlay(); bufferName = 'MIC CAPTURE'; bufferSource = 'mic'; $('srcName').textContent = 'BUFFER / MIC CAPTURE';
    sendParams(); send('record', { seconds: +$('length').value });
  }

  async function loadDecoded(arrayBuf) {
    const ab = await ctx.decodeAudioData(arrayBuf.slice(0));
    const max = Math.min(ab.length, Math.round(60 * ab.sampleRate));
    const L = ab.getChannelData(0).slice(0, max), R = (ab.numberOfChannels > 1 ? ab.getChannelData(1) : ab.getChannelData(0)).slice(0, max);
    const e = Math.min(256, max >> 3); for (let i = 0; i < e; i++) { const gg = i / e; L[i] *= gg; R[i] *= gg; L[max - 1 - i] *= gg; R[max - 1 - i] *= gg; }
    send('load', { L, R }); // transferring would detach; copying is fine for <= 60 s
    return ab.length > max;
  }

  async function loadFile(file) {
    if (!file) return;
    const wasPlaying = playing;
    msg('Loading ' + file.name + '…');
    try {
      await resume();
      const buf = await file.arrayBuffer();
      bufferName = file.name.replace(/\.[^.]+$/, '').toUpperCase().slice(0, 40); bufferSource = 'file';
      if (wasPlaying) wantPlayAfterLoad = true;
      const trimmed = await loadDecoded(buf);
      msg('Loaded ' + file.name + (trimmed ? ' (trimmed to 60 s)' : '') + (playing || wantPlayAfterLoad ? '. Now looping.' : '. Press Play.'));
    } catch (e) { msg('That file could not be decoded. Try a WAV, MP3, OGG or M4A file.'); }
  }

  async function loadDemo() {
    await resume();
    const d = makeDemo(ctx.sampleRate); bufferName = 'DEMO PAD'; bufferSource = 'demo';
    if (playing) wantPlayAfterLoad = true;
    node.port.postMessage({ type: 'load', L: d.L, R: d.R }, [d.L.buffer, d.R.buffer]);
    msg('Demo pad loaded. Press Play.');
  }

  async function toggleRecOut() {
    if (recorder) { recorder.stop(); return; }
    try { await resume(); } catch { return; }
    if (!recDest || !window.MediaRecorder) { msg('Recording the output is not supported in this browser.'); return; }
    const types = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4'];
    const type = types.find(t => MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(t)) || '';
    recChunks = [];
    try { recorder = new MediaRecorder(recDest.stream, type ? { mimeType: type, audioBitsPerSecond: 192000 } : undefined); }
    catch (e) { msg('Recording the output is not supported here.'); recorder = null; return; }
    const started = Date.now();
    recorder.ondataavailable = ev => { if (ev.data && ev.data.size) recChunks.push(ev.data); };
    recorder.onstop = async () => {
      const mime = recorder.mimeType || type || 'audio/webm'; recorder = null; clearInterval(recTimer);
      $('recOut').textContent = '◉ RECORD OUTPUT'; $('recOut').classList.remove('active');
      const blob = new Blob(recChunks, { type: mime }); const ext = mime.includes('mp4') ? 'mp4' : 'webm';
      const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
      await offerDownload(blob, 'helisert-' + stamp + '.' + ext);
    };
    recorder.start(1000);
    $('recOut').classList.add('active');
    const recTimer = setInterval(() => { const s = Math.floor((Date.now() - started) / 1000); $('recOut').textContent = '■ STOP RECORDING ' + Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); }, 250);
    msg('Recording everything you hear. Press Stop Recording to save the file.');
  }

  async function offerDownload(blob, filename) {
    let dl = null;
    try { dl = window.claude && window.claude.use ? await window.claude.use('downloads') : null; } catch { dl = null; }
    if (dl) {
      try { await dl.save({ filename, data: blob }); msg('Saved ' + filename + '.'); }
      catch (e) { msg(e && e.code === 'declined' ? 'Save cancelled.' : 'The recording could not be saved here (' + ((e && e.code) || 'error') + ').'); }
      return;
    }
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = filename; document.body.appendChild(a); a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 4000);
    msg('Saved ' + filename + ' (' + (blob.size / 1048576).toFixed(1) + ' MB).');
  }

  /* ------------------------------------------------------------------ */
  /* Wiring                                                              */
  /* ------------------------------------------------------------------ */
  ['rate', 'length', 'offset', 'xLength', 'inGain', 'dry', 'wet', 'overdubAmt', 'space', 'tone'].forEach(id => $(id).addEventListener('input', () => {
    refreshLabels();
    if (id === 'rate') sendRate();
    else if (id === 'space' || id === 'tone') applyMix();
    else sendParams();
    if (id === 'length') msg('Capture length applies to the next capture.');
    if (id === 'offset' || id === 'xLength') draw();
  }));
  ['overdub', 'lock', 'autoFade'].forEach(id => $(id).addEventListener('change', () => { sendParams(); draw();
    if (id === 'overdub' && $('overdub').checked && !mic) msg('Overdub records live input. Connect the microphone to layer sound into the buffer.'); }));
  $('skid').addEventListener('change', sendRate);
  root.querySelectorAll('[data-rate]').forEach(b => b.addEventListener('click', () => { $('rate').value = String(Math.log2(+b.dataset.rate)); refreshLabels(); sendRate(); }));
  $('rev').addEventListener('click', () => { reverse = !reverse; refreshLabels(); sendRate(); });

  $('play').addEventListener('click', () => playing ? doStop() : doPlay(false));
  $('stop').addEventListener('click', () => { if (recording) send('stopRecord'); doStop(); });
  $('trigger').addEventListener('click', () => doPlay(true));
  $('capture').addEventListener('click', doCapture);
  $('mic').addEventListener('click', toggleMic);
  $('load').addEventListener('click', () => $('file').click());
  $('file').addEventListener('change', () => { loadFile($('file').files[0]); $('file').value = ''; });
  $('demo').addEventListener('click', loadDemo);
  $('clear').addEventListener('click', async () => { if (!ctx) { bufferFrames = 0; waveMin = waveMax = null; bufferName = 'EMPTY'; bufferSource = 'none'; setMode('EMPTY BUFFER'); setBufferInfo(); draw(); return; }
    send('clear'); msg('Buffer cleared.'); bufferSource = 'none'; });
  $('recOut').addEventListener('click', toggleRecOut);

  // click / drag on the waveform sets the offset
  let dragging = false;
  const setOffsetFromEvent = ev => { const r = canvas.getBoundingClientRect(); const v = Math.max(0, Math.min(99, (ev.clientX - r.left) / r.width * 100));
    $('offset').value = v.toFixed(1); refreshLabels(); sendParams(); draw(); };
  canvas.addEventListener('pointerdown', ev => { if (!bufferFrames) return; dragging = true; canvas.setPointerCapture(ev.pointerId); setOffsetFromEvent(ev); });
  canvas.addEventListener('pointermove', ev => { if (dragging) setOffsetFromEvent(ev); });
  canvas.addEventListener('pointerup', () => { if (dragging) { dragging = false; if (playing) doPlay(true); } });

  // drag and drop a file
  ['dragenter', 'dragover'].forEach(t => root.addEventListener(t, ev => { if (ev.dataTransfer && [...ev.dataTransfer.types].includes('Files')) { ev.preventDefault(); root.classList.add('drop'); } }));
  ['dragleave', 'drop'].forEach(t => root.addEventListener(t, ev => { if (t === 'dragleave' && root.contains(ev.relatedTarget)) return; root.classList.remove('drop'); }));
  root.addEventListener('drop', ev => { ev.preventDefault(); const f = ev.dataTransfer.files && ev.dataTransfer.files[0]; if (f) loadFile(f); });

  // keyboard
  document.addEventListener('keydown', ev => {
    if (ev.metaKey || ev.ctrlKey || ev.altKey) return;
    const tag = ev.target && ev.target.tagName;
    if (ev.code === 'Space') { if (tag === 'BUTTON') return; ev.preventDefault(); playing ? doStop() : doPlay(false); }
    else if (ev.key === 't' || ev.key === 'T') doPlay(true);
    else if (ev.key === 'c' || ev.key === 'C') { if (mic) doCapture(); }
    else if (ev.key === 'r' || ev.key === 'R') $('rev').click();
    else if (ev.key === 's' || ev.key === 'S') { $('skid').checked = !$('skid').checked; sendRate(); }
  });

  // initial state: show the demo pad before audio starts
  const preview = makeDemo(48000); const pw = waveFrom(preview.L, preview.R);
  waveMin = pw.mn; waveMax = pw.mx; bufferFrames = preview.L.length; bufferRate = 48000;
  if (!window.MediaRecorder) $('recOut').disabled = true;
  refreshLabels(); setBufferInfo(); draw(); meterLoop();
  window.addEventListener('beforeunload', () => { if (mic) mic.getTracks().forEach(t => t.stop()); });
  // expose a tiny hook for automated tests
  window.__helisert = { get ctx() { return ctx; }, get playing() { return playing; }, get frames() { return bufferFrames; }, get pos() { return pos; }, WORKLET };
})();
