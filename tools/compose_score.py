"""Original orchestral score for EL SEGON QUE FALTA.
Uses FluidSynth + TimGM6mb, no borrowed melody/audio. Produces four mastered cues.
Run with FLUID_LIB and SOUNDFONT pointing to local runtime and sf2; needs numpy/ffmpeg.
Soundfont is only a rendering tool: its samples are not distributed in the app.
"""
import os,ctypes as C,numpy as np,subprocess,wave,json
from pathlib import Path
OUT=Path(__file__).resolve().parents[1]/'assets/audio';OUT.mkdir(parents=True,exist_ok=True)
lib=C.CDLL(os.environ['FLUID_LIB'])
def setup(name,restype,args):
 f=getattr(lib,name);f.restype=restype;f.argtypes=args;return f
ptr=C.c_void_p;I=C.c_int;F=C.c_float
setup('new_fluid_settings',ptr,[]);setup('fluid_settings_setnum',I,[ptr,C.c_char_p,C.c_double]);setup('new_fluid_synth',ptr,[ptr])
setup('fluid_synth_sfload',I,[ptr,C.c_char_p,I]);setup('fluid_synth_program_change',I,[ptr,I,I]);setup('fluid_synth_noteon',I,[ptr,I,I,I]);setup('fluid_synth_noteoff',I,[ptr,I,I])
setup('fluid_synth_cc',I,[ptr,I,I,I]);setup('fluid_synth_write_float',I,[ptr,I,ptr,I,I,ptr,I,I]);setup('delete_fluid_synth',None,[ptr]);setup('delete_fluid_settings',None,[ptr])
SR=44100
# A distinct five-note falling/rising identity, then an answering phrase.
phrases=[
 [(0,74,1.5),(1.5,69,.5),(2,77,1),(3,76,.75)],
 [(0,74,1),(1,72,1),(2,69,1.5),(3.5,65,.5)],
 [(0,70,1.5),(1.5,74,.5),(2,77,1.5)],
 [(0,76,.75),(.75,72,.75),(1.5,69,1),(3,67,.75)],
 [(0,69,.5),(.5,74,1),(1.5,77,.5),(2,81,1.5)],
 [(0,79,1),(1,77,.5),(1.5,74,1.5),(3,72,1)],
 [(0,70,1),(1,69,1),(2,67,1.5)],
 [(0,73,1),(1,76,1),(2,74,1.9)]
]
# D minor / Bb / F / C / G minor / Bb / A / D minor.
chords=[(50,[62,65,69]),(46,[58,62,65]),(53,[60,65,69]),(48,[60,64,67]),(43,[58,62,67]),(46,[58,62,65]),(45,[57,61,64]),(50,[62,65,69])]
manifest=[]
for cue,bpm,bars,title in [(0,90,24,'La plaça sense segon'),(1,100,24,'Els fils del bosc'),(2,120,32,'Vector de retorn'),(3,80,16,'Un segon sencer')]:
 settings=lib.new_fluid_settings();lib.fluid_settings_setnum(settings,b'synth.sample-rate',SR);lib.fluid_settings_setnum(settings,b'synth.gain',.55)
 synth=lib.new_fluid_synth(settings);assert lib.fluid_synth_sfload(synth,os.environ['SOUNDFONT'].encode(),1)>=0
 # Piano, strings, cello, flute, horn, harp, choir, glockenspiel, pizzicato.
 programs={0:0,1:48,2:42,3:73 if cue!=1 else 71,4:60,5:46,6:52,7:9,8:45}
 for ch,program in programs.items():
  lib.fluid_synth_program_change(synth,ch,program);lib.fluid_synth_cc(synth,ch,10,[52,25,90,80,42,100,64,32,70][ch]);lib.fluid_synth_cc(synth,ch,91,60);lib.fluid_synth_cc(synth,ch,7,100)
 events=[];beat=60/bpm
 def note(ch,p,b,d,v):events.extend([(int(b*beat*SR),1,ch,p,v),(int((b+d)*beat*SR),0,ch,p,0)])
 for bar in range(bars):
  b=bar*4;root,triad=chords[bar%8];section=bar//8
  dyn=[.65,.86,1.0,.94][min(section,3)]
  if cue==3:dyn=.72
  for p in triad:note(1,p,b,3.9,int(38*dyn));note(6,p+12,b,3.8,int((20 if cue==2 else 25)*dyn))
  note(2,root-12,b,3.7,int(62*dyn))
  # Interlocking piano / harp ostinato with authored voicing.
  for j in range(8):
   p=triad[[0,1,2,1,0,2,1,2][j]]+(12 if j%3==2 else 0)
   note(0,p,b+j*.5,.9,int((42 if cue!=2 else 31)*dyn)+(j%3)*3)
   if cue in [1,2] or section>0:note(5,p+12,b+j*.5+.25,1.2,int(25*dyn))
  for offset,p,d in phrases[bar%8]:
   if cue==0 and section==0 and bar%2==1:continue
   channel=4 if cue==2 and section>=1 else 3
   note(channel,p+(0 if cue!=3 else -12),b+offset,d*.94,int((78 if cue==2 else 65)*dyn))
   if section>=2:note(1,p+12,b+offset,d*.9,int(35*dyn))
  if cue in [0,3] and bar%2==0:note(7,triad[0]+24,b+.05,2.8,40 if cue==0 else 32)
  if cue==1:
   for j in range(8):note(8,triad[j%3]-12,b+j*.5,.28,45+(j%2)*10)
   if section>=1:note(9,54,b+1,.1,30);note(9,54,b+3,.1,37)
  if cue==2:
   for j in range(8):note(8,triad[j%3],b+j*.5,.3,65 if j%2==0 else 50)
   for off in [0,2]:note(9,36,b+off,.18,95)
   for off in [1,3]:note(9,38,b+off,.16,65)
   for off in [0,.5,1,1.5,2,2.5,3,3.5]:note(9,42,b+off,.08,32 if off%1 else 45)
   if bar%4==0:note(9,49,b,2.5,55)
   if section>=2:
    for p in triad:note(4,p+12,b,1.7,55);note(4,p+12,b+2,1.7,62)
   if bar%4==3:
    for j in range(4):note(9,47+j%3,b+3+j*.25,.2,50+j*12)
 # Last cadence is deliberately resolved; the game can crossfade before it.
 end=bars*4
 for p in [50,57,62,65,69,74]:note(1,p,end-2,3.5,45)
 events.sort(key=lambda e:(e[0],e[1]));total=int((end*beat+3)*SR);audio=np.zeros((total,2),np.float32);cursor=0
 def render(n):
  global cursor
  while n>0:
   count=min(n,8192);left=np.zeros(count,np.float32);right=np.zeros(count,np.float32)
   lib.fluid_synth_write_float(synth,count,left.ctypes.data,0,1,right.ctypes.data,0,1)
   audio[cursor:cursor+count,0]=left;audio[cursor:cursor+count,1]=right;cursor+=count;n-=count
 for frame,on,ch,p,v in events:
  if frame>=total:break
  render(frame-cursor)
  (lib.fluid_synth_noteon(synth,ch,p,v) if on else lib.fluid_synth_noteoff(synth,ch,p))
 render(total-cursor);lib.delete_fluid_synth(synth);lib.delete_fluid_settings(settings)
 # Gentle entry and exit, leave internal phrasing/dynamics intact.
 fade=int(SR*.07);audio[:fade]*=np.linspace(0,1,fade)[:,None];fadeout=SR*2;audio[-fadeout:]*=np.linspace(1,0,fadeout)[:,None]
 temp=OUT/f'{cue}.wav'
 with wave.open(str(temp),'wb')as w:w.setnchannels(2);w.setsampwidth(2);w.setframerate(SR);w.writeframes((np.clip(audio,-1,1)*32767).astype('<i2').tobytes())
 path=OUT/f'cue-{cue}.mp3'
 subprocess.run(['ffmpeg','-y','-loglevel','error','-i',str(temp),'-af','loudnorm=I=-17:TP=-1.5:LRA=10','-ar','44100','-codec:a','libmp3lame','-q:a','4',str(path)],check=True)
 temp.unlink();manifest.append({'file':path.name,'bpm':bpm,'bars':bars,'title':title,'duration':round(total/SR,3)})
 print(title,round(total/SR,1),'s',path.stat().st_size,'bytes',flush=True)
(OUT/'score.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2))
