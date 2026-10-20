const CUES=[
 {file:'cue-0.mp3',bpm:90,bars:24,title:'La plaça sense segon'},
 {file:'cue-1.mp3',bpm:100,bars:24,title:'Els fils del bosc'},
 {file:'cue-2.mp3',bpm:120,bars:32,title:'Vector de retorn'},
 {file:'cue-3.mp3',bpm:80,bars:16,title:'Un segon sencer'},
 {file:'cue-4.mp3',bpm:92,bars:24,title:'El castell de les Marees'},
 {file:'cue-5.mp3',bpm:116,bars:32,title:'La llengua i l’acer'}
];
/** Sample-rendered original soundtrack. AudioContext is the sole beat clock. */
export class Soundtrack{
 constructor(){this.ctx=null;this.master=null;this.buffers=new Map();this.loading=new Map();this.cue=0;this.epoch=0;this.pending=null;this.playing=null;this.volume=.75;this.muted=false;this.ready=false;}
 async prepare(index=0){
  if(!this.ctx){this.ctx=new (window.AudioContext||window.webkitAudioContext)();this.master=this.ctx.createGain();this.master.gain.value=this.volume;const compressor=this.ctx.createDynamicsCompressor();compressor.threshold.value=-8;compressor.ratio.value=3;this.master.connect(compressor);compressor.connect(this.ctx.destination);await this.ctx.resume();}
  if(this.buffers.has(index))return this.buffers.get(index);
  if(!this.loading.has(index)){const promise=fetch('./assets/audio/'+CUES[index].file).then(r=>{if(!r.ok)throw Error('BSO '+r.status);return r.arrayBuffer();}).then(b=>this.ctx.decodeAudioData(b)).then(buffer=>{this.buffers.set(index,buffer);return buffer;}).catch(e=>{this.loading.delete(index);throw e;});this.loading.set(index,promise);}
  return this.loading.get(index);
 }
 async start(index=0){await this.prepare(index);await this.ctx.resume();this.change(index,this.ctx.currentTime+.08,true);this.ready=true;for(let i=0;i<CUES.length;i++)if(i!==index)this.prepare(i).catch(()=>{});}
 nextBar(){if(!this.ctx||!this.playing)return 0;const {index,epoch}=this.active();const bar=240/CUES[index].bpm;return epoch+(Math.floor((this.ctx.currentTime-epoch)/bar)+1)*bar;}
 active(){if(this.pending&&this.ctx.currentTime>=this.pending.epoch){this.cue=this.pending.index;this.epoch=this.pending.epoch;this.pending=null;}return this.pending&&this.ctx.currentTime<this.pending.epoch?{index:this.cue,epoch:this.epoch}:{index:this.cue,epoch:this.epoch};}
 change(index,when,immediate=false){
  if(!this.ctx||!this.buffers.has(index))return false;
  const now=this.ctx.currentTime;when=Math.max(now+.04,when||now+.04);
  const source=this.ctx.createBufferSource(),gain=this.ctx.createGain();source.buffer=this.buffers.get(index);source.loop=true;source.loopEnd=CUES[index].bars*240/CUES[index].bpm;source.connect(gain);gain.connect(this.master);
  gain.gain.setValueAtTime(immediate?.9:0,when);if(!immediate)gain.gain.linearRampToValueAtTime(.9,when+1.4);
  if(this.playing){this.playing.gain.gain.cancelScheduledValues(when);this.playing.gain.gain.setValueAtTime(.9,when);this.playing.gain.gain.linearRampToValueAtTime(0,when+1.3);this.playing.source.stop(when+1.5);}
  source.start(when);this.playing={source,gain,index};if(immediate){this.cue=index;this.epoch=when;}else this.pending={index,epoch:when};return true;
 }
 get beat(){if(!this.ctx||!this.playing)return null;const {index,epoch}=this.active();return Math.max(0,(this.ctx.currentTime-epoch)*CUES[index].bpm/60);}
 get pulse(){const b=this.beat;return b===null?0:Math.exp(-(b%1)*8);}
 setVolume(v){this.volume=v;if(this.master)this.master.gain.setTargetAtTime(this.muted?0:v,this.ctx.currentTime,.1);}
 toggle(){this.muted=!this.muted;this.setVolume(this.volume);return !this.muted;}
 async suspend(){if(this.ctx?.state==='running')await this.ctx.suspend();}
 async resume(){if(this.ctx?.state==='suspended')await this.ctx.resume();}
 tone(frequency,duration=.8,delay=0,volume=.13){
  if(!this.ctx||this.ctx.state!=='running')return;
  const t=this.ctx.currentTime+delay,osc=this.ctx.createOscillator(),env=this.ctx.createGain();osc.type='sine';osc.frequency.value=frequency;env.gain.setValueAtTime(.0001,t);env.gain.exponentialRampToValueAtTime(volume,t+.01);env.gain.exponentialRampToValueAtTime(.0001,t+duration);osc.connect(env);env.connect(this.master);osc.start(t);osc.stop(t+duration+.02);
  const overtone=this.ctx.createOscillator(),g=this.ctx.createGain();overtone.frequency.value=frequency*2.76;g.gain.setValueAtTime(volume*.18,t);g.gain.exponentialRampToValueAtTime(.0001,t+duration*.6);overtone.connect(g);g.connect(this.master);overtone.start(t);overtone.stop(t+duration);
 }
 ambience(stage){
  if(!this.ctx)return;const ctx=this.ctx;
  if(!this.wind){const b=ctx.createBuffer(1,ctx.sampleRate*4,ctx.sampleRate),d=b.getChannelData(0);let v=0;for(let i=0;i<d.length;i++){v=(v+Math.random()*.04-.02)*.985;d[i]=v;}const source=ctx.createBufferSource(),filter=ctx.createBiquadFilter(),gain=ctx.createGain();source.buffer=b;source.loop=true;filter.type='lowpass';filter.frequency.value=650;source.connect(filter);filter.connect(gain);gain.connect(this.master);gain.gain.value=0;source.start();this.wind={gain,filter};}
  this.wind.gain.gain.setTargetAtTime(stage==='pirate'?.28:stage==='castle'?.12:0,ctx.currentTime,1.3);this.wind.filter.frequency.setTargetAtTime(stage==='pirate'?900:450,ctx.currentTime,1.3);
 }
 clash(success=true){
  if(!this.ctx)return;const ctx=this.ctx,t=ctx.currentTime,b=ctx.createBuffer(1,Math.floor(ctx.sampleRate*.18),ctx.sampleRate),d=b.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=(Math.random()*2-1)*Math.exp(-i/(ctx.sampleRate*.025));const src=ctx.createBufferSource(),filter=ctx.createBiquadFilter(),g=ctx.createGain();src.buffer=b;filter.type='highpass';filter.frequency.value=1400;g.gain.value=.25;src.connect(filter);filter.connect(g);g.connect(this.master);src.start(t);this.tone(success?1760:1174,.3,0,.09);this.tone(success?2637:1568,.21,.01,.055);
 }
 bell(id,correct){this.tone({sun:293.665,wave:349.228,moon:440}[id]||293.665,1.8,0,correct?.24:.13);}
 reward(){[293.665,349.228,440,587.33].forEach((f,i)=>this.tone(f,1.2,i*.11,.14));}
 shoot(){this.tone(150,.12,0,.09);this.tone(600,.08,.01,.05);}
 hit(){this.tone(87.3,.25,0,.18);}
 whoosh(){if(!this.ctx)return;const ctx=this.ctx,t=ctx.currentTime,n=ctx.sampleRate*2,b=ctx.createBuffer(1,n,ctx.sampleRate),d=b.getChannelData(0);for(let i=0;i<n;i++)d[i]=(Math.random()*2-1)*Math.sin(i/n*Math.PI);const src=ctx.createBufferSource(),filter=ctx.createBiquadFilter(),g=ctx.createGain();src.buffer=b;filter.type='bandpass';filter.frequency.setValueAtTime(180,t);filter.frequency.exponentialRampToValueAtTime(2200,t+1.4);filter.Q.value=.6;g.gain.value=.18;src.connect(filter);filter.connect(g);g.connect(this.master);src.start(t);}
}
