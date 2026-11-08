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
  registerProcessor('helisert-dsp',HelisertProcessor);
