import * as T from './three.module.js';
import {Score} from './music.js';
const score=new Score();
const $=s=>document.querySelector(s), canvas=$('#universe');
let renderer;
try {renderer=new T.WebGLRenderer({canvas,antialias:true,preserveDrawingBuffer:true,powerPreference:'high-performance'});}
catch(e){$('#fallback').hidden=false;throw e;}
renderer.setPixelRatio(Math.min(devicePixelRatio,1.7));renderer.setSize(innerWidth,innerHeight);
renderer.xr.enabled=true;renderer.xr.setReferenceSpaceType('local');renderer.xr.setFoveation(1);
renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.2;
const scene=new T.Scene();scene.background=new T.Color('#050610');scene.fog=new T.FogExp2('#050610',.006);
const camera=new T.PerspectiveCamera(58,innerWidth/innerHeight,.1,450);camera.position.set(0,2,8);
const rig=new T.Group();rig.add(camera);scene.add(rig);
scene.add(new T.HemisphereLight('#becfff','#171328',2));
const sun=new T.DirectionalLight('#ffdab4',3);sun.position.set(5,14,10);scene.add(sun);
const fill=new T.PointLight('#6595ff',100,100);fill.position.set(-8,6,-15);scene.add(fill);
const root=new T.Group();root.position.set(4,1,-20);scene.add(root);
let seed=8319;
function rand(){seed=(1664525*seed+1013904223)>>>0;return seed/4294967296;}
function mat(color,emission=0){return new T.MeshStandardMaterial({color,roughness:.55,metalness:.4,emissive:color,emissiveIntensity:emission});}
const cache=new Map();
function material(c,e=0){const k=c+':'+e;if(!cache.has(k))cache.set(k,mat(c,e));return cache.get(k);}
function mesh(g,c,parent,x=0,y=0,z=0,e=0){const m=new T.Mesh(g,material(c,e));m.position.set(x,y,z);parent.add(m);return m;}
function box(p,c,x,y,z,w,h,d,e=0){return mesh(new T.BoxGeometry(w,h,d),c,p,x,y,z,e);}
function sphere(p,c,x,y,z,r,e=0){return mesh(new T.SphereGeometry(r,28,20),c,p,x,y,z,e);}
function torus(p,c,r,t=.035,x=0,y=0,z=0){return mesh(new T.TorusGeometry(r,t,8,100),c,p,x,y,z,2);}
function stars(n,r,p,size=.12){const a=[],colors=[];for(let i=0;i<n;i++){const u=rand()*Math.PI*2,v=Math.acos(2*rand()-1),d=r*(.4+rand()*.6);a.push(Math.sin(v)*Math.cos(u)*d,Math.cos(v)*d,Math.sin(v)*Math.sin(u)*d);const c=new T.Color().setHSL(.52+rand()*.2,.2+rand()*.4,.55+rand()*.4);colors.push(c.r,c.g,c.b);}const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(a,3));g.setAttribute('color',new T.Float32BufferAttribute(colors,3));const points=new T.Points(g,new T.PointsMaterial({size,vertexColors:true,transparent:true,opacity:.9,sizeAttenuation:true}));p.add(points);return points;}
const sky=stars(2200,190,scene,.13),worlds=[],updates=[];
function world(){const w=new T.Group();root.add(w);worlds.push(w);return w;}
// NEBULA FORCE — portal, accretion disk and a fleet.
const neb=world(), singularity=new T.Group();neb.add(singularity);singularity.position.set(1,1,-5);
sphere(singularity,'#010104',0,0,0,3.05);
const halo=torus(singularity,'#ffd3a2',3.12,.045);
const halo2=torus(singularity,'#df783b',3.23,.035);
const diskG=new T.BufferGeometry(),dp=[],dc=[];
for(let i=0;i<10000;i++){const a=rand()*Math.PI*2,r=3.3+Math.pow(rand(),1.5)*5.3;dp.push(Math.cos(a)*r,(rand()-.5)*.11,Math.sin(a)*r);const c=new T.Color().setHSL(.035+rand()*.08,.65,.35+rand()*.5);dc.push(c.r,c.g,c.b);}
diskG.setAttribute('position',new T.Float32BufferAttribute(dp,3));diskG.setAttribute('color',new T.Float32BufferAttribute(dc,3));
const disk=new T.Points(diskG,new T.PointsMaterial({size:.065,vertexColors:true,blending:T.AdditiveBlending,transparent:true,depthWrite:false}));singularity.add(disk);disk.rotation.z=-.25;disk.rotation.x=.23;
const ships=[];
function ship(x,y,z,scale){const s=new T.Group();s.position.set(x,y,z);s.scale.setScalar(scale);neb.add(s);const hull=mesh(new T.ConeGeometry(.28,2,6),'#d5e7ee',s);hull.rotation.x=-Math.PI/2;const wing=box(s,'#586e92',0,-.05,.28,1.7,.07,.7);wing.rotation.z=.1;box(s,'#74dfff',0,.18,-.2,.22,.12,.5,2);for(const a of [-.22,.22]){const fire=mesh(new T.ConeGeometry(.12,.75,8),'#60cfff',s,a,0,1.24,3);fire.rotation.x=Math.PI/2;}ships.push(s);return s;}
ship(-4,-1,3,1.4);ship(-1,-2,5,.9);ship(6,-.3,2,.85);ship(3,3,1,.7);
const planet=sphere(neb,'#333c73',-15,5,-22,5);torus(neb,'#5d7daa',5.4,.035,-15,5,-22);
updates.push((t,dt,energy)=>{disk.rotation.y=t*.08*(1+energy*2);halo.rotation.z=t*.03;halo2.scale.setScalar(1+Math.sin(t)*.008);ships.forEach((s,i)=>{s.position.y+=Math.sin(t*1.2+i)*dt*.3;s.rotation.z=Math.sin(t*.7+i)*.15;s.children.filter(m=>m.material?.emissiveIntensity===3).forEach(m=>m.scale.y=1+energy*2+Math.sin(t*20)*.15);});planet.rotation.y=t*.05;});
// MAZEVERSE — floating labyrinth, a luminous route, trees and collectible orbs.
const maze=world(),island=new T.Group();maze.add(island);island.rotation.y=-.55;island.position.y=-2;
const base=mesh(new T.CylinderGeometry(8.4,4,2.6,6),'#1c2e37',island,0,-1.4,0);
const floor=box(island,'#294c45',0,0,0,13,.3,13);
const grid=13, seen=Array.from({length:grid},()=>Array(grid).fill(false)),cells=Array.from({length:grid},()=>Array(grid).fill(true));
function carve(x,z){seen[z][x]=true;cells[z][x]=false;const dirs=[[2,0],[-2,0],[0,2],[0,-2]].sort(()=>rand()-.5);for(const [dx,dz]of dirs){let nx=x+dx,nz=z+dz;if(nx>0&&nz>0&&nx<grid-1&&nz<grid-1&&!seen[nz][nx]){cells[z+dz/2][x+dx/2]=false;carve(nx,nz);}}}carve(1,1);
for(let z=0;z<grid;z++)for(let x=0;x<grid;x++)if(cells[z][x])box(island,'#4b7771',x-6,.65,z-6,.9,1.25,.9);
let queue=[[1,1]],prev=new Map([['1,1',null]]);while(queue.length){const [x,z]=queue.shift();for(const [dx,dz]of [[1,0],[-1,0],[0,1],[0,-1]]){const a=x+dx,b=z+dz,k=a+','+b;if(a>=0&&b>=0&&a<grid&&b<grid&&!cells[b][a]&&!prev.has(k)){prev.set(k,[x,z]);queue.push([a,b]);}}}
let cursor=[11,11],route=[];while(cursor){route.push(new T.Vector3(cursor[0]-6,.28,cursor[1]-6));cursor=prev.get(cursor.join(','));}route.reverse();
const path=new T.Line(new T.BufferGeometry().setFromPoints(route),new T.LineBasicMaterial({color:'#a8ffcf'}));island.add(path);
const traveler=sphere(island,'#baffd4',0,.6,0,.17,3),orbs=[];
for(let i=0;i<7;i++){let point=route[Math.floor((i+.5)/7*route.length)];orbs.push(sphere(island,'#ffcc78',point.x,.8,point.z,.14,2));}
for(let i=0;i<11;i++){let a=i/11*Math.PI*2;const tr=new T.Group();tr.position.set(Math.cos(a)*7.4,.1,Math.sin(a)*7.4);island.add(tr);mesh(new T.CylinderGeometry(.09,.13,1.1,6),'#625447',tr,0,.5,0);mesh(new T.ConeGeometry(.7,1.7,7),'#64b59b',tr,0,1.55,0);}
const mazeRing=torus(maze,'#65cfba',10,.025,0,-2,0);mazeRing.rotation.x=Math.PI/2;
updates.push((t,dt,e)=>{island.position.y=-2+Math.sin(t*.5)*.25;const f=(t*.8)%route.length,a=Math.floor(f),b=(a+1)%route.length;traveler.position.lerpVectors(route[a],route[b],f-a);traveler.position.y=.6+Math.sin(t*4)*.1;orbs.forEach((o,i)=>{o.position.y=.8+Math.sin(t*2+i)*.2;o.scale.setScalar(1+e*.8);});});
// CABRILS SOMIAT — deliberately fictional, Mediterranean memory rather than a geographic map.
const village=world(),town=new T.Group();village.add(town);town.position.y=-3;town.rotation.y=-.42;
mesh(new T.CylinderGeometry(10,6,2,64),'#435b52',town,0,-1.1,0);
box(town,'#b9ab8a',0,.05,0,13,.15,12);
const houses=[];
function house(x,z,w,d,h,c){const g=new T.Group();g.position.set(x,.1,z);town.add(g);box(g,c,0,h/2,0,w,h,d);const roof=mesh(new T.ConeGeometry(1,1,4),'#a4513a',g,0,h+.35,0);roof.scale.set(w*.78,.8,d*.78);roof.rotation.y=Math.PI/4;for(let j=-1;j<=1;j+=2)box(g,'#ffdf9d',j*w*.24,h*.6,d/2+.015,.28,.4,.03,1);box(g,'#5b554b',0,.4,d/2+.03,.4,.8,.04);houses.push(g);}
for(let i=0;i<16;i++){let x=(i%4-1.5)*2.9,z=(Math.floor(i/4)-1.5)*3;if(Math.abs(x)<2&&z<1)continue;house(x,z,1.6+rand()*.7,1.7,1.4+rand()*1.5,['#d3b892','#eee0b7','#caa58c','#dfcfaa'][i%4]);}
const church=new T.Group();church.position.set(-.5,0,-2.5);town.add(church);box(church,'#e4d5b4',0,1.7,0,2.1,3.3,4);box(church,'#d3bf9d',1.45,3,1.2,.95,6,.95);mesh(new T.ConeGeometry(.8,1,4),'#aa6647',church,1.45,6.4,1.2);
const churchRoof=mesh(new T.ConeGeometry(1,1,4),'#a95e41',church,0,3.7,0);churchRoof.scale.set(1.6,.8,2.8);churchRoof.rotation.y=Math.PI/4;
box(church,'#493b30',0,.8,2.03,.7,1.6,.03);box(church,'#645b50',1.45,5.1,1.69,.42,.7,.04);
for(let i=0;i<10;i++){const a=i/10*Math.PI*2;mesh(new T.CylinderGeometry(.08,.12,1.1,6),'#7b6850',town,Math.cos(a)*8,.6,Math.sin(a)*8);sphere(town,'#639f79',Math.cos(a)*8,1.6,Math.sin(a)*8,.7);}
const clock=torus(village,'#ffd497',10,.035,0,1,-4);const sparks=stars(150,13,village,.05);
updates.push((t,dt,e)=>{clock.rotation.z=t*.05;clock.rotation.y=Math.sin(t*.2)*.35;sparks.rotation.y=t*.025;town.position.y=-3+Math.sin(t*.35)*.12;});
// DEMOSCENE — articulated dancers, neon stage, equalizers and impossible geometry.
const demo=world(),stage=new T.Group();demo.add(stage);stage.position.y=-2.5;
mesh(new T.CylinderGeometry(9,9,.3,64),'#121424',stage,0,-.2,0);
const gridHelper=new T.GridHelper(18,24,'#ef5bbc','#3e2454');stage.add(gridHelper);
const dancers=[];
for(let i=0;i<7;i++){const g=new T.Group();g.position.set((i-3)*1.8,0,-Math.abs(i-3)*.5);stage.add(g);const color=['#f9a77b','#c491fa','#78d9ff','#ff85ca'][i%4];box(g,color,0,1.65,0,.6,.9,.35,.5);sphere(g,'#e6dce6',0,2.4,0,.27);box(g,'#172535',0,2.43,.24,.4,.09,.08,1);
const limbs=[];for(let j=0;j<4;j++){const joint=new T.Group();joint.position.set(j<2?(j===0?-.42:.42):(j===2?-.18:.18),j<2?1.97:1.2,0);g.add(joint);const len=j<2?.8:1.1;box(joint,color,0,-len/2,0,.17,len,.2,.4);sphere(joint,'#e9dce9',0,0,0,.12);limbs.push(joint);}dancers.push({g,limbs});}
const knot=mesh(new T.TorusKnotGeometry(2.6,.48,110,12),'#aa80ff',demo,0,4,-7,1.4);knot.material.wireframe=true;
const rings=[];for(let i=0;i<6;i++){const r=torus(demo,['#a88bff','#ff7db9','#6bdcfa'][i%3],6+i*.5,.018,0,2,-7-i*.5);rings.push(r);}
const bars=[];for(let i=0;i<32;i++){const a=i/32*Math.PI*2;bars.push(box(stage,'#b07fff',Math.cos(a)*8,.7,Math.sin(a)*8,.18,1.4,.18,1));}
updates.push((t,dt,e)=>{dancers.forEach(({g,limbs},i)=>{g.position.y=Math.max(0,Math.sin(t*3+i))*.2;g.rotation.y=Math.sin(t+i)*.2;limbs.forEach((l,j)=>{l.rotation.x=Math.sin(t*3+i+(j%2)*Math.PI)*(.5+e*.5);l.rotation.z=j<2?(j===0?-1:1)*(.35+Math.sin(t*1.5+i)*.35):0;});});knot.rotation.set(t*.16,t*.23,t*.07);rings.forEach((r,i)=>{r.rotation.x=Math.sin(t*.2+i*.2)*.2;r.rotation.y=Math.cos(t*.2+i*.2)*.3;});bars.forEach((b,i)=>{b.scale.y=.3+Math.abs(Math.sin(t*3+i*.7))*2;b.position.y=b.scale.y*.7;});});
const info=[
 {name:'NEBULA FORCE',note:'Nebula Force · Una flota davant la singularitat',accent:'#f6b887',title:'Tots els mons.<br>Un sol <em>univers.</em>'},
 {name:'MAZEVERSE',note:'MazeVerse · Segueix l’orbe: el laberint té una sortida',accent:'#8ce8bd',title:'Cada camí amaga<br>una <em>possibilitat.</em>'},
 {name:'CABRILS SOMIAT',note:'Cabrils somiat · Fantasia mediterrània, sense cartografia real',accent:'#ffcf96',title:'El teu poble.<br>Un altre <em>temps.</em>'},
 {name:'DEMOSCENE',note:'Demoscene · Geometria, ritme i personatges articulats',accent:'#bd9bff',title:'El codi també<br>sap <em>ballar.</em>'}
];
let current=0,energy=0,held=false,paused=matchMedia('(prefers-reduced-motion: reduce)').matches,exploring=false,time=0,last=0,yaw=0,pitch=0,targetYaw=0,targetPitch=0,gyro=false;
worlds.forEach((w,i)=>w.visible=i===0);
let toastTimer;
function toast(s){$('#toast').textContent=s;$('#toast').classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').classList.remove('show'),3200);}
function flash(){const el=$('#transition');el.classList.remove('flash');void el.offsetWidth;el.classList.add('flash');}
function select(i){current=(i+4)%4;worlds.forEach((w,j)=>w.visible=j===current);document.querySelectorAll('.world').forEach((b,j)=>{b.classList.toggle('active',j===current);b.setAttribute('aria-pressed',j===current);});const data=info[current];$('#title').innerHTML=data.title;$('#index').textContent='0'+(current+1);$('#object').textContent=data.name;$('#scene-note').textContent=data.note;document.documentElement.style.setProperty('--accent',data.accent);flash();score.setWorld(current);}
document.querySelectorAll('.world').forEach(b=>b.onclick=()=>select(+b.dataset.world));
$('#next').onclick=()=>select(current+1);
$('#enter').onclick=()=>{exploring=true;document.body.classList.add('expedition');$('#back').hidden=false;toast('Arrossega per mirar al voltant · 1–4 canvia de món · Esc torna');flash();};
$('#back').onclick=()=>{exploring=false;gyro=false;$('#gyro').setAttribute('aria-pressed','false');document.body.classList.remove('expedition');$('#back').hidden=true;targetYaw=targetPitch=0;};
$('#pause').textContent=paused?'REPRENDRE':'PAUSA';$('#pause').setAttribute('aria-pressed',paused);
$('#pause').onclick=()=>{paused=!paused;$('#pause').textContent=paused?'REPRENDRE':'PAUSA';$('#pause').setAttribute('aria-pressed',paused);};
$('#fullscreen').onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen();}catch{toast('Aquest navegador no permet pantalla completa.');}};
let drag=null,moved=false;
canvas.addEventListener('pointerdown',e=>{if(e.button!==0)return;drag={x:e.clientX,y:e.clientY,yaw:targetYaw,pitch:targetPitch};held=true;canvas.setPointerCapture(e.pointerId);$('#holdStatus').classList.add('on');});
canvas.addEventListener('pointermove',e=>{if(drag&&exploring&&!gyro){targetYaw=drag.yaw-(e.clientX-drag.x)*.004;targetPitch=T.MathUtils.clamp(drag.pitch-(e.clientY-drag.y)*.003,-1.1,1.1);}else if(!exploring){targetYaw=(e.clientX/innerWidth-.5)*.12;targetPitch=(e.clientY/innerHeight-.5)*.08;}});
function release(){drag=null;held=false;$('#holdStatus').classList.remove('on');}
canvas.addEventListener('pointerup',release);canvas.addEventListener('pointercancel',release);window.addEventListener('blur',release);
window.addEventListener('keydown',e=>{if(e.target instanceof HTMLInputElement)return;if(/^[1-4]$/.test(e.key))select(+e.key-1);if(e.key==='ArrowRight')select(current+1);if(e.key==='ArrowLeft')select(current-1);if(e.key==='Escape'&&exploring)$('#back').click();if(e.code==='Space'){e.preventDefault();held=true;}});window.addEventListener('keyup',e=>{if(e.code==='Space')release();});
$('#capture').onclick=()=>{renderer.render(scene,camera);canvas.toBlob(blob=>{if(!blob){toast('Captura no disponible.');return;}const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='event-horizon-'+current+'.png';a.click();setTimeout(()=>URL.revokeObjectURL(url),2000);toast('Captura desada.');});};
const gyroEuler=new T.Euler(),gyroQ=new T.Quaternion(),fixQ=new T.Quaternion().setFromAxisAngle(new T.Vector3(1,0,0),-Math.PI/2),screenQ=new T.Quaternion();
function orientation(e){if(!gyro||e.alpha==null)return;gyroEuler.set(T.MathUtils.degToRad(e.beta||0),T.MathUtils.degToRad(e.alpha||0),-T.MathUtils.degToRad(e.gamma||0),'YXZ');gyroQ.setFromEuler(gyroEuler).multiply(fixQ);screenQ.setFromAxisAngle(new T.Vector3(0,0,1),-T.MathUtils.degToRad(screen.orientation?.angle||0));gyroQ.multiply(screenQ);}
window.addEventListener('deviceorientation',orientation);window.addEventListener('nativeorientation',e=>orientation(e.detail));
$('#gyro').onclick=async()=>{if(gyro){gyro=false;$('#gyro').setAttribute('aria-pressed','false');return;}try{if(window.DeviceOrientationEvent?.requestPermission){const permission=await DeviceOrientationEvent.requestPermission();if(permission!=='granted')throw Error();}if(!window.DeviceOrientationEvent&&!window.AndroidSensors){toast('Sense giroscopi disponible: arrossega per mirar.');return;}exploring=true;document.body.classList.add('expedition');$('#back').hidden=false;gyro=true;$('#gyro').setAttribute('aria-pressed','true');window.AndroidSensors?.start();toast('Mode 360° activat · Mou el mòbil per mirar');}catch{toast('No s’ha pogut activar el giroscopi. Pots arrossegar.');}};
$('#sound').onclick=async()=>{try{const on=await score.toggle();$('#sound span').textContent=on?'ON':'OFF';$('#sound').setAttribute('aria-pressed',on);$('#sound').setAttribute('aria-label',on?'Desactivar BSO':'Activar BSO original');toast(on?'BSO original · 112 BPM · Canvis al següent compàs':'So desactivat');}catch{toast('No s’ha pogut iniciar el so.');}};
$('#download-score').onclick=async()=>{try{toast('Renderitzant la BSO original…');const blob=await score.export(current),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='Event-Horizon-BSO-'+current+'.wav';a.click();setTimeout(()=>URL.revokeObjectURL(url),4000);toast('BSO exportada en WAV estèreo.');}catch{toast('No s’ha pogut exportar la BSO.');}};
$('#vr').onclick=async()=>{try{if(!navigator.xr||!await navigator.xr.isSessionSupported('immersive-vr')){toast('Obre aquesta web al navegador de Meta Quest per entrar en VR.');return;}const session=await navigator.xr.requestSession('immersive-vr',{optionalFeatures:['local-floor']});await renderer.xr.setSession(session);exploring=true;document.body.classList.add('expedition');session.addEventListener('end',()=>{camera.position.set(0,2,8);rig.position.set(0,0,0);$('#back').click();});camera.position.set(0,0,0);root.position.set(0,0,-20);}catch(e){toast('No s’ha pogut iniciar VR: '+e.message);}};
for(let i=0;i<2;i++){const controller=renderer.xr.getController(i);controller.addEventListener('selectstart',()=>select(current+1));controller.addEventListener('squeezestart',()=>held=true);controller.addEventListener('squeezeend',()=>held=false);rig.add(controller);const line=new T.Line(new T.BufferGeometry().setFromPoints([new T.Vector3(),new T.Vector3(0,0,-3)]),new T.LineBasicMaterial({color:'#a0c9e5',transparent:true,opacity:.5}));controller.add(line);}
let hidden=false;document.addEventListener('visibilitychange',()=>{hidden=document.hidden;last=0;if(score.ctx){if(hidden)score.ctx.suspend();else if(score.on)score.ctx.resume();}});
window.addEventListener('resize',()=>{renderer.setSize(innerWidth,innerHeight);camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();});
canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();toast('Connexió gràfica interrompuda. Recarrega la pàgina.');});
renderer.setAnimationLoop(ms=>{if(hidden)return;const dt=last?Math.min((ms-last)/1000,.05):0;last=ms;if(!paused)time+=dt;energy=T.MathUtils.damp(energy,held?1:0,4,dt);const beat=score.beat, rhythm=beat===null?time*112/60:beat, pulse=Math.exp(-(rhythm%1)*7);
if(!paused)updates[current](rhythm*Math.PI*2/3,dt,energy);
const beatEl=$('#beat');beatEl.style.opacity=beat===null?.3:.4+pulse*.6;beatEl.textContent=beat===null?'BSO ORIGINAL · ACTIVA EL SO':'112 BPM · COMPÀS '+(Math.floor(beat/4)%16+1)+' · '+(Math.floor(beat)%4+1)+'/4';
if(!paused){root.scale.setScalar(1+pulse*(score.on?.012:.002));if(current===0){halo.material.emissiveIntensity=2+pulse*3;disk.material.size=.045+pulse*.045;}if(current===1)orbs.forEach(o=>o.material.emissiveIntensity=1+pulse*3);if(current===2)clock.material.emissiveIntensity=1+pulse*3;}
if(!renderer.xr.isPresenting){const center=exploring?0:innerWidth<800?1.7:4;root.position.x=T.MathUtils.damp(root.position.x,center,3,dt);root.rotation.y=T.MathUtils.damp(root.rotation.y,energy*.12,3,dt);yaw=T.MathUtils.damp(yaw,targetYaw,6,dt);pitch=T.MathUtils.damp(pitch,targetPitch,6,dt);if(gyro)camera.quaternion.slerp(gyroQ,.12);else{camera.rotation.set(pitch,yaw,0,'YXZ');camera.position.x=exploring?0:Math.sin(time*.07)*.1;}}
sky.rotation.y=time*.002;fill.intensity=100+energy*120;renderer.toneMappingExposure=1.2+energy*.5+(score.on?pulse*.08:0);renderer.render(scene,camera);
});
if('serviceWorker'in navigator&&location.protocol==='https:')navigator.serviceWorker.register('./sw.js').catch(()=>{});
