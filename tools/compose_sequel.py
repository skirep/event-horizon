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
manifest=[]
for cue,bpm,bars,title in [(4,92,24,'El castell de les Marees'),(5,116,32,'La llengua i l’acer')]:
 settings=lib.new_fluid_settings();lib.fluid_settings_setnum(settings,b'synth.sample-rate',SR);lib.fluid_settings_setnum(settings,b'synth.gain',.55)
 synth=lib.new_fluid_synth(settings);assert lib.fluid_synth_sfload(synth,os.environ['SOUNDFONT'].encode(),1)>=0
 # Harp, strings, cello, flute, accordion, marimba, choir, steelpan, pizzicato.
 programs={0:46,1:48,2:42 if cue==4 else 32,3:73,4:21,5:12,6:52,7:114,8:45}
 for ch,program in programs.items():
  lib.fluid_synth_program_change(synth,ch,program);lib.fluid_synth_cc(synth,ch,10,[40,24,80,75,32,100,64,48,70][ch]);lib.fluid_synth_cc(synth,ch,91,66 if cue==4 else 35);lib.fluid_synth_cc(synth,ch,7,100)
 events=[];beat=60/bpm
 def note(ch,p,b,d,v):events.extend([(int(b*beat*SR),1,ch,p,v),(int((b+d)*beat*SR),0,ch,p,0)])
 # Original eight-bar melody: the second half answers the first with a fresh cadence.
 tunes=[[(0,74,.7),(1,77,.45),(1.5,76,.45),(2.25,69,.45),(3,72,.7)],[(0,70,1),(1.5,74,.5),(2.25,72,.5),(3,65,.8)],[(.5,69,.45),(1,72,.45),(1.75,77,.7),(3,76,.8)],[(0,79,.45),(.75,76,.45),(1.5,72,.45),(2.25,67,.45),(3,64,.8)],[(0,67,.45),(.75,70,.45),(1.5,74,.8),(3,77,.8)],[(.5,77,.45),(1.25,74,.45),(2,70,.8),(3.25,65,.5)],[(0,73,.7),(1,76,.5),(1.75,79,.7),(3,73,.7)],[(0,74,1.4),(2,69,.45),(2.75,73,.45),(3.5,74,.45)]]
 chords=[(50,[62,65,69]),(46,[58,62,65]),(53,[60,65,69]),(48,[60,64,67]),(43,[58,62,67]),(46,[58,62,65]),(45,[57,61,64]),(50,[62,65,69])]
 for bar in range(bars):
  b=bar*4;root,triad=chords[bar%8];section=bar//8
  if cue==4:
   for p in triad:note(1,p,b,3.9,42);note(6,p+12,b,3.9,24)
   note(2,root-12,b,3.8,56)
   for j in range(8):note(0,triad[[0,2,1,2,0,1,2,1][j]]+12,b+j*.5,1.2,36+(j%3)*4)
   if section>0:
    for off,p,d in tunes[bar%8]:note(3,p-12,b+off,d*1.6 if off<2 else d,56)
   if bar%4==0:note(7,triad[0]+24,b,3,24)
  else:
   # Offbeat accordion, walking bass, interlocking marimba and light Caribbean percussion.
   for off,p in [(0,root-12),(1.5,root-5),(2,root-12),(3,root)]:note(2,p,b+off,.55,74)
   for off in [.5,1.5,2.5,3.5]:
    for p in triad:note(4,p,b+off,.24,44+(bar%3)*4)
   for j in range(8):note(5,triad[(j+bar)%3]+12,b+j*.5+.08,.27,47 if j%2 else 60)
   for off,p,d in tunes[bar%8]:
    note(3 if section%2==0 else 4,p,b+off,d*.9,84)
    if section>=2:note(7,p-12,b+off,d*.7,51)
   for off in [0,2]:note(9,36,b+off,.13,73)
   for off in [1,3]:note(9,37,b+off,.12,68)
   for j in range(8):note(9,70,b+j*.5,.08,30+(j%2)*15)
   for off in [.75,2.75]:note(9,63,b+off,.16,57)
   if bar%4==3:
    for j in range(4):note(9,60+j%3,b+3+j*.25,.15,52+j*6)
   if section>=1:
    for p in triad:note(8,p,b, .28,47);note(8,p,b+2,.28,51)
 end=bars*4
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
(OUT/'sequel-score.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2))
