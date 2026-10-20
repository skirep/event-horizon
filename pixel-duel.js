/** Original modern pixel-art theatre. Native 2D sprites, never a pixelated 3D render. */
const P={ink:'#15172c',night:'#272740',purple:'#55405f',wine:'#743957',sea:'#2b6474',foam:'#8eacaa',gold:'#eebd78',light:'#ffe7b1',wood:'#80504a',woodDark:'#472e3d'};
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function rect(c,x,y,w,h,color){c.fillStyle=color;c.fillRect(Math.round(x),Math.round(y),Math.ceil(w),Math.ceil(h));}
function line(c,x1,y1,x2,y2,color,width=1){let x=Math.round(x1),y=Math.round(y1);const ex=Math.round(x2),ey=Math.round(y2),dx=Math.abs(ex-x),dy=-Math.abs(ey-y),sx=x<ex?1:-1,sy=y<ey?1:-1;let e=dx+dy;for(let n=0;n<1000;n++){rect(c,x-width/2,y-width/2,width,width,color);if(x===ex&&y===ey)break;const t=2*e;if(t>=dy){e+=dy;x+=sx;}if(t<=dx){e+=dx;y+=sy;}}}
function ellipse(c,x,y,rx,ry,color){for(let yy=-Math.ceil(ry);yy<=ry;yy++){const k=Math.sqrt(Math.max(0,1-yy*yy/(ry*ry)));rect(c,x-rx*k,y+yy,rx*k*2,1,color);}}
function wrap(c,text,x,y,maxWidth,lineHeight=15,maxLines=3){const words=text.split(' ');let row='',rows=[];for(const w of words){if(c.measureText(row+' '+w).width>maxWidth){rows.push(row);row=w;}else row+=(row?' ':'')+w;}if(row)rows.push(row);rows.slice(0,maxLines).forEach((s,i)=>c.fillText(s,x,y+i*lineHeight));return Math.min(rows.length,maxLines)*lineHeight;}
function arm(c,a,b,coat,shine){line(c,...a,...b,P.ink,12);line(c,...a,...b,coat,8);line(c,a[0]-2,a[1],b[0]-2,b[1]-1,shine,2);}
function sprite(doc,who,pose,frame){
 const cv=doc.createElement('canvas');cv.width=160;cv.height=144;const c=cv.getContext('2d');c.imageSmoothingEnabled=false;c.translate(48,132);
 const captain=who==='captain',bob=pose==='idle'||pose==='talk'?(frame%4===0?-1:0):0;
 const coat=captain?'#843b54':'#d5caa4',shade=captain?'#4d2b48':'#7b8b87',shine=captain?'#bd6471':'#fff0c7',skin=captain?'#d49a7a':'#d9a17a',skinLight='#f2c398',hair=captain?'#342d3d':'#a9503e';
 c.translate(pose==='hurt'?-3:0,bob);
 // Legs and leather boots: separate silhouettes and lit seams.
 rect(c,-12,-29,10,24,P.ink);rect(c,4,-29,10,24,P.ink);
 rect(c,-10,-28,7,20,'#303f52');rect(c,6,-28,6,20,'#34495a');
 rect(c,-9,-24,2,15,'#617581');rect(c,8,-23,2,13,'#617581');
 rect(c,-15,-10,15,9,P.ink);rect(c,3,-10,17,9,P.ink);
 rect(c,-13,-8,12,5,'#3e3141');rect(c,5,-8,13,5,'#3e3141');
 rect(c,-13,-8,9,1,'#9c7560');rect(c,5,-8,10,1,'#9c7560');
 // Back arm, fitted coat, tails, undershirt.
 arm(c,[-13,-64],[-20,-39],coat,shine);rect(c,-23,-41,8,8,skin);rect(c,-22,-40,3,3,skinLight);
 rect(c,-17,-73,34,48,P.ink);rect(c,-18,-49,14,27,P.ink);rect(c,5,-49,14,27,P.ink);
 rect(c,-14,-71,27,40,coat);rect(c,-15,-49,11,23,shade);rect(c,6,-48,10,23,coat);
 rect(c,-13,-68,4,29,shine);rect(c,8,-65,4,30,shade);
 rect(c,-5,-70,12,29,captain?'#d7b78d':'#3f7c82');rect(c,-2,-67,5,22,captain?'#f0d7aa':'#6eb6ac');
 for(let y=-61;y<-35;y+=7)rect(c,8,y,2,2,P.gold);
 rect(c,-16,-38,33,7,'#352a3a');rect(c,-3,-39,9,8,P.gold);rect(c,-1,-37,5,4,'#5f3946');
 rect(c,-16,-26,12,3,coat);rect(c,7,-25,10,2,shine);
 // Neck, scarf, face and individual hair clusters.
 rect(c,-4,-81,12,11,skin);rect(c,-9,-75,22,5,captain?'#e6b979':'#578f9a');
 if(!captain){rect(c,-8,-71,6,17,'#497488');rect(c,-10,-61,8,3,'#76c1bd');}
 rect(c,-12,-99,28,23,P.ink);rect(c,-10,-98,24,20,skin);
 rect(c,-9,-95,17,15,skinLight);rect(c,9,-91,6,10,skin);
 rect(c,-12,-96,6,14,hair);rect(c,-10,-100,25,6,hair);rect(c,-8,-99,8,4,captain?'#65505a':'#cf7952');
 rect(c,13,-88,4,4,skinLight);rect(c,12,-84,2,3,'#ad6a66');
 rect(c,-2,-91,5,2,P.ink);rect(c,8,-91,4,2,P.ink);
 if(frame!==6){rect(c,0,-89,2,2,'#fff1d1');rect(c,9,-89,2,2,'#fff1d1');}
 rect(c,captain?-2:8,-89,captain?5:2,captain?5:2,P.ink);
 rect(c,4,-85,3,2,'#b8756b');
 rect(c,3,-80,7,pose==='talk'&&frame%2?3:1,P.ink);rect(c,4,-77,6,1,captain?'#67404c':'#c18772');
 if(captain){
  // Tricorn, feather, epaulettes and sash.
  rect(c,-22,-106,45,6,P.ink);rect(c,-17,-109,36,5,P.ink);rect(c,-9,-115,23,8,P.ink);
  rect(c,-17,-106,34,2,'#756155');rect(c,-7,-112,19,3,'#3d3b4d');
  line(c,-19,-109,-9,-103,P.gold,2);line(c,18,-109,10,-103,P.gold,2);
  rect(c,0,-110,7,5,P.gold);rect(c,2,-109,3,2,'#fff0bd');
  line(c,-13,-111,-21,-121,'#a8d5c2',3);line(c,-18,-116,-23,-119,'#f1e1b4',2);
  rect(c,-19,-71,10,4,P.gold);rect(c,10,-71,11,4,P.gold);
  for(let x=-18;x<-9;x+=3)rect(c,x,-67,1,4,'#ae7658');
  line(c,-10,-66,10,-44,'#ad7277',3);
 }else{
  rect(c,-12,-101,27,5,'#f0e1b9');rect(c,-11,-100,24,1,'#fff3d3');
  rect(c,-17,-100,7,4,'#d4b491');rect(c,-21,-97,8,3,'#b89c83');
  rect(c,-10,-104,24,3,hair);rect(c,-6,-107,14,4,hair);
  rect(c,-6,-105,5,2,'#e19b64');
 }
 let hand=[22,-43],tip=[67,-75],elbow=[21,-59];
 if(pose==='talk'){hand=[24,-48];tip=[69,-68];}
 if(pose==='windup'){hand=[5,-69];elbow=[18,-70];tip=[-23,-111];}
 if(pose==='parry'){hand=[24,-58];elbow=[17,-66];tip=[43,-105];}
 if(pose==='lunge'){hand=[36,-45];elbow=[23,-55];tip=[94,-49];}
 if(pose==='hurt'){hand=[17,-35];tip=[63,-18];}
 if(pose==='win'){hand=[16,-76];elbow=[21,-66];tip=[25,-122];}
 if(pose==='idle'){hand[1]+=frame%4===0?-1:0;tip[1]+=frame%4===0?-1:0;}
 arm(c,[13,-65],elbow,coat,shine);arm(c,elbow,hand,coat,shine);
 rect(c,hand[0]-4,hand[1]-3,8,7,skin);rect(c,hand[0]-3,hand[1]-2,4,2,skinLight);
 // Every blade and guard is drawn on the sprite's pixel grid.
 line(c,hand[0],hand[1],tip[0],tip[1],P.ink,5);
 line(c,hand[0]+3,hand[1]-2,tip[0],tip[1],'#9cb9c6',3);
 line(c,hand[0]+4,hand[1]-3,tip[0],tip[1],'#e8f5e9',1);
 const vx=tip[0]-hand[0],vy=tip[1]-hand[1],len=Math.hypot(vx,vy),nx=-vy/len,ny=vx/len;
 line(c,hand[0]-nx*8,hand[1]-ny*8,hand[0]+nx*8,hand[1]+ny*8,P.ink,5);
 line(c,hand[0]-nx*7,hand[1]-ny*7,hand[0]+nx*7,hand[1]+ny*7,P.gold,3);
 rect(c,hand[0]-2,hand[1]-1,4,3,'#fff0bd');
 return cv;
}
export class PixelDuel{
 constructor(canvas,{reducedMotion=false}={}){this.canvas=canvas;canvas.dataset.renderer='2d-pixel-art';this.c=canvas.getContext('2d');this.doc=canvas.ownerDocument;this.reduced=reducedMotion;this.frames=new Map();this.regions=[];this.time=0;this.impact=-100;this.impactKind='win';this.state=null;this.resize(1280,800);}
 resize(width,height,vr=false){let h=vr?540:width/height<1?Math.round(360*height/width):360,w=vr?960:width/height<1?360:Math.round(360*width/height);w=clamp(w,360,1000);h=clamp(h,360,850);if(this.canvas.width!==w||this.canvas.height!==h){this.canvas.width=w;this.canvas.height=h;}this.c.imageSmoothingEnabled=false;}
 hit(kind){this.impact=this.time;this.impactKind=kind;}
 frame(who,pose,f){const k=who+pose+f;if(!this.frames.has(k))this.frames.set(k,sprite(this.doc,who,pose,f));return this.frames.get(k);}
 commandAt(x,y){return this.regions.find(r=>x>=r.x&&x<=r.x+r.w&&y>=r.y&&y<=r.y+r.h)?.id||null;}
 render(state){
  this.state=state;this.time=state.time;const c=this.c,w=this.canvas.width,h=this.canvas.height,t=this.reduced?0:state.time,portrait=w<h,ground=Math.round(h*(portrait?.55:.64)),horizon=Math.round(ground*.61),scale=clamp(w/420,1.15,2),frame=Math.floor(t*8)%8;
  this.regions=[];c.imageSmoothingEnabled=false;c.clearRect(0,0,w,h);
  // Dithered sunset, distant island and three independent cloud / sea layers.
  const bands=['#29273f','#40334f','#5b3e5c','#845064','#b96667','#d88974','#edb286','#f4ca91'];
  for(let y=0;y<horizon;y+=4){const b=Math.min(7,Math.floor(y/horizon*8));rect(c,0,y,w,4,bands[b]);if(y%12===0&&b>0)for(let x=(y%8)*2;x<w;x+=12)rect(c,x,y,2,1,bands[b-1]);}
  const sunX=w*.73,sunY=horizon*.58;ellipse(c,sunX,sunY,28,28,'#e8aa80');ellipse(c,sunX,sunY,22,22,'#ffdfab');
  for(let layer=0;layer<3;layer++)for(let i=0;i<7;i++){let x=((i*157+layer*69-t*(layer+1)*.7)%(w+160)+w+160)%(w+160)-80,y=32+layer*21+(i%3)*9;const col=['#503c59','#755063','#a96970'][layer];rect(c,x,y,58,5,col);rect(c,x+8,y-3,22,4,col);rect(c,x+24,y+5,49,3,col);}
  const islandX=Math.round(w*.16);rect(c,islandX-55,horizon-5,120,9,'#555067');rect(c,islandX-36,horizon-11,80,7,'#555067');rect(c,islandX-15,horizon-29,30,22,'#555067');rect(c,islandX-23,horizon-39,10,31,'#555067');rect(c,islandX+12,horizon-35,10,28,'#555067');for(let x=-23;x<23;x+=7)rect(c,islandX+x,horizon-42+(x%3)*2,4,5,'#555067');rect(c,islandX-2,horizon-22,4,10,'#edb285');
  rect(c,0,horizon,w,ground-horizon+12,P.sea);
  for(let row=0;row<16;row++){const y=horizon+row*5,col=['#407c86','#4c9092','#347384','#6ba7a0'][row%4];for(let x=-70;x<w+80;x+=58){const drift=Math.sin(t*.8+row)*6+(t*(row%2?2:-1))%58;rect(c,x+drift+row*13,y,19+row%4*6,1,col);if(row%3===0)rect(c,x+drift+row*13+23,y+2,7,1,'#a3c2ae');}}
  for(let y=horizon+8;y<ground-6;y+=4){const rw=10+(y-horizon)*.32;rect(c,sunX-rw/2+Math.sin(y+t)*3,y,rw,1,y%8?'#e5bc91':'#a6b7a4');}
  // Rigging and stitched canvas. These layers move independently of the actors.
  for(const side of [-1,1]){
   const x=side===-1?Math.round(w*.075):Math.round(w*.93);
   rect(c,x-5,0,10,ground+2,'#302a3e');rect(c,x-3,0,3,ground+2,'#79504d');rect(c,x+1,0,1,ground,'#b78165');
   line(c,x,4,x+side*60,ground-5,'#201e33',2);line(c,x,14,x-side*65,ground-8,'#9d7970',1);
   for(let n=0;n<8;n++){const yy=25+n*17;line(c,x-side*yy*.22,yy,x+side*yy*.5,yy+2,'#89716a',1);}
   const sailX=x+(side===-1?4:-84),sailW=80,baseY=18,billow=Math.round(Math.sin(t*.9+side)*2);
   for(let yy=0;yy<87;yy+=3){const inset=Math.round(Math.sin(yy/87*Math.PI)*9);rect(c,sailX+inset+billow,baseY+yy,sailW-inset*2,3,yy%12===0?'#b29d90':'#cfbca1');rect(c,sailX+inset+billow,baseY+yy,2,3,'#e6d3ad');}
   for(let xx=16;xx<70;xx+=16)line(c,sailX+xx+billow,baseY+3,sailX+xx+billow,baseY+80,'#b09b8d',1);
  }
  // Side-on deck, carved rails and foreground framing.
  const deckTop=ground-12;
  rect(c,0,deckTop,w,h-deckTop,'#5d3b44');rect(c,0,deckTop,w,4,'#d5996a');
  for(let y=deckTop+6;y<h;y+=13){rect(c,0,y,w,10,y%26?'#92604e':'#a06b53');rect(c,0,y,w,1,'#d18c61');rect(c,0,y+9,w,2,'#573a42');for(let x=(y%3)*39;x<w;x+=91){rect(c,x,y,2,10,'#49313d');rect(c,x+6,y+3,15,1,'#bd805b');rect(c,x+48,y+6,21,1,'#754c47');rect(c,x+3,y+7,1,1,'#392b39');}}
  rect(c,0,ground-46,w,5,'#372b3b');rect(c,0,ground-46,w,1,'#c08c68');rect(c,0,ground-22,w,3,'#3f2e3e');
  for(let x=12;x<w;x+=45){rect(c,x,ground-43,4,31,'#422f3d');rect(c,x,ground-42,1,28,'#a8775e');}
  for(const x of [Math.round(w*.13),Math.round(w*.86)]){rect(c,x-12,ground-24,24,25,P.ink);rect(c,x-10,ground-25,20,25,'#815449');rect(c,x-7,ground-25,2,25,'#b18159');rect(c,x+7,ground-25,2,25,'#513844');rect(c,x-12,ground-20,24,3,'#3b3947');rect(c,x-12,ground-7,24,3,'#3b3947');rect(c,x-11,ground-25,22,2,'#d09a67');}
  // Combat silhouette changes are real sprite poses with wind-up / lunge / block.
  const elapsed=state.time-this.impact,flash=elapsed>=0&&elapsed<.42;
  let heroPose=state.wins>=3?'win':'idle',enemyPose=state.phase==='reply'?'talk':'idle',hx=w*.31,ex=w*.69;
  if(state.phase==='parry'){heroPose=state.ready?'parry':'idle';enemyPose=state.ready?'lunge':'windup';if(state.ready){hx+=10;ex-=20;}}
  if(flash){heroPose=this.impactKind==='win'?'lunge':'hurt';enemyPose=this.impactKind==='win'?'hurt':'lunge';hx+=this.impactKind==='win'?18:-8;ex-=this.impactKind==='win'?-6:17;}
  if(portrait){hx=w*.255;ex=w*.745;}
  if(!this.reduced&&flash){c.save();c.translate(Math.round(Math.sin(elapsed*80)*(1-elapsed/.42)*2),0);}
  for(const [who,x,face,pose]of [['hero',hx,1,heroPose],['captain',ex,-1,enemyPose]]){
   ellipse(c,x,ground+1,22*scale,3,'#392c3d');const f=this.frame(who,pose,frame);c.save();c.translate(Math.round(x),ground);c.scale(face*scale,scale);c.drawImage(f,-48,-132);c.restore();
  }
  if(!this.reduced&&flash)c.restore();
  if(state.ready){const sx=(hx+ex)/2,sy=ground-69*scale;for(let i=0;i<8;i++){const a=i*Math.PI/4,r=7+(Math.floor(t*8)%3)*2;line(c,sx+Math.cos(a)*r,sy+Math.sin(a)*r,sx+Math.cos(a)*(r+5),sy+Math.sin(a)*(r+5),i%2?P.gold:P.light,2);}rect(c,sx-2,sy-2,4,4,'#fff2c7');}
  if(flash){const sx=w*.5,sy=ground-56*scale;for(let i=0;i<18;i++){const a=i*2.399,r=elapsed*(35+i*4),x=sx+Math.cos(a)*r,y=sy+Math.sin(a)*r+elapsed*elapsed*26;rect(c,x,y,i%3?2:3,i%3?2:3,i%2?P.gold:'#edf7d5');}if(elapsed<.16){line(c,sx-18,sy+15,sx+18,sy-15,P.light,3);line(c,sx-13,sy-13,sx+13,sy+13,P.gold,2);}}
  if(state.phase==='idle'&&state.wins<3)this.regions.push({id:'captain',x:ex-35*scale,y:ground-120*scale,w:70*scale,h:122*scale});
  c.textAlign='center';c.font='bold 9px monospace';c.fillStyle=P.light;c.fillText('EL VIATGER',Math.round(hx),ground+17);c.fillStyle='#e7a6a0';c.fillText('CAPITANA SALMORRA',Math.round(ex),ground+17);
  if(state.phase==='parry'){c.font='bold 10px monospace';c.fillStyle=state.ready?P.light:'#e3b6a0';c.fillText(state.ready?'PARA ARA!':'EN GUARDIA...',w/2,Math.max(85,ground-125*scale));}
  if(state.vr)this.drawControls(state);
 }
 drawControls(s){
  const c=this.c,w=this.canvas.width,h=this.canvas.height,x=36,y=Math.round(h*.70),pw=w-72;
  rect(c,x-4,y-4,pw+8,h-y-12,P.gold);rect(c,x,y,pw,h-y-20,'#171d30');
  c.fillStyle=P.light;c.font='bold 14px monospace';c.textAlign='left';c.fillText('LA LLENGUA I L’ACER · '+s.wins+'/3 INTERCANVIS',x+16,25);
  const button=(id,text,bx,by,bw,bh,gold=false)=>{rect(c,bx,by,bw,bh,gold?P.gold:'#354252');rect(c,bx,by,bw,1,gold?P.light:'#879b9d');c.fillStyle=gold?P.ink:P.light;c.font='14px monospace';c.textAlign='left';wrap(c,text,bx+12,by+20,bw-24,17,2);this.regions.push({id,x:bx,y:by,w:bw,h:bh});};
  c.fillStyle=P.light;c.font='14px monospace';c.textAlign='left';
  if(s.completed){wrap(c,'FI · EL MAR NO OBLIDA. TU TAMPOC.',x+16,y+33,pw-32,22,2);wrap(c,s.message,x+16,y+76,pw-32,20,3);}
  else if(s.phase==='reply'){wrap(c,s.insult,x+16,y+20,pw-32,17,2);s.answers.forEach((a,i)=>button('reply'+i,(i+1)+'. '+a,x+12,y+49+i*32,pw-24,29));}
  else if(s.phase==='parry'){wrap(c,'Observa la fulla. Prem el gallet quan el senyal sigui daurat.',x+16,y+25,pw-32,20,2);button('parry',s.ready?'ARA · PARA L’ESPASA!':'ESPERA EL SENYAL DAURAT',x+16,y+67,pw-32,52,s.ready);}
  else{wrap(c,s.message,x+16,y+24,pw-32,18,3);button(s.wins>=3?'helm':'captain',s.wins>=3?'PREN EL TIMÓ →':'DESAFIA SALMORRA ⚔',x+16,y+87,pw-32,40);}
 }
}
