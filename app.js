import * as T from './three.module.js';
import {Journey,mazePath,STAGES} from './journey.js';
import {village,forest,space,cockpit,sky,label,ring,sphere,glow,toWorld,toCell,TILE} from './worlds.js';
import {castle,pirate,loadSequelAssets,sequelEnvironment,sequelBackdrop} from './sequel-worlds.js';
import {INSULTS,optionsFor,resolveParry} from './sequel.js';
import {Soundtrack} from './music.js';
const $=s=>document.querySelector(s),canvas=$('#world'),score=new Soundtrack(),game=new Journey();
const CHAPTERS={village:['ACTE I · LA PLAÇA SENSE SEGON','La plaça sense segon','La clau obre una escletxa en el mateix instant.'],maze:['ACTE II · ELS FILS DEL BOSC','El segon, per dins','La plaça s’ha convertit en un bosc. La clau encara és amb tu.'],flight:['ACTE III · VECTOR DE RETORN','A l’altra banda','El nucli alimenta la Falcon. El camí de tornada s’ha de pilotar.'],castle:['PART II · EL CASTELL DE LES MAREES','La pedra recorda','La clau del rellotge també és la clau d’aquest castell.'],pirate:['PART II · LA LLENGUA I L’ACER','La capitana Salmorra','Una carta de marees. Un vaixell sense rumb. Tres intercanvis per guanyar-te el timó.'],home:['EPÍLEG · UN SEGON SENCER','El retorn','La mateixa plaça. Una última cosa per fer.']};
let renderer;
try{renderer=new T.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});}catch(e){$('#graphics-error').hidden=false;$('#retry').onclick=()=>location.reload();throw e;}
renderer.setPixelRatio(Math.min(devicePixelRatio,1.7));renderer.setSize(innerWidth,innerHeight);
renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;renderer.shadowMap.autoUpdate=false;
renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.13;renderer.outputColorSpace=T.SRGBColorSpace;
renderer.xr.enabled=true;renderer.xr.setReferenceSpaceType('local-floor');renderer.xr.setFoveation(1);
const scene=new T.Scene(),camera=new T.PerspectiveCamera(64,innerWidth/innerHeight,.08,500),rig=new T.Group();rig.add(camera);scene.add(rig);
const ambient=new T.HemisphereLight('#d6f0ed','#675647',2.0);scene.add(ambient);
const sunlight=new T.DirectionalLight('#ffe0b1',3.6);sunlight.position.set(30,45,18);sunlight.castShadow=true;sunlight.shadow.mapSize.set(1024,1024);Object.assign(sunlight.shadow.camera,{left:-40,right:40,top:40,bottom:-40,near:1,far:130});sunlight.shadow.bias=-.0008;scene.add(sunlight);
const fill=new T.PointLight('#a4e8e2',25,40);fill.position.set(0,4,-2);scene.add(fill);
const atmosphere=sky(scene),ship=cockpit();ship.visible=false;rig.add(ship);
const heldKey=new T.Group();heldKey.position.set(.37,1.35,-1);heldKey.scale.setScalar(.14);rig.add(heldKey);
const artifact=sphere(heldKey,'#eac78e',0,0,0,1,1.2),artifactRing=ring(heldKey,'#d7f5db',0,0,0,1.4,.06);heldKey.visible=false;
const routeLine=new T.Line(new T.BufferGeometry(),new T.LineBasicMaterial({color:'#a2f7d0',transparent:true,opacity:.85}));scene.add(routeLine);routeLine.visible=false;
const bursts=[],beams=[],raycaster=new T.Raycaster(),pointer=new T.Vector2(),tmp=new T.Vector3();
const cache=new Map();let world,activeStage='village',playing=false,paused=false,busy=false,finish=false,time=0,previous=0,yaw=0,pitch=0,targetYaw=0,targetPitch=0,gyro=false;
let movement={x:0,y:0},keys=new Set(),autoPath=[],actionHeld=false,actionTime=0,chargeStarted=null,activeTarget=null,lastShot=0,flightZ=0,snapTime=0,hintUntil=0,selectedController=null;
let assisted=false;let slowFrames=0,qualityLevel=0;let screenTimer,toastTimer,reducedMotion=matchMedia('(prefers-reduced-motion: reduce)').matches,checkpointData=null;
try{const raw=localStorage.getItem('event-horizon-journey-v2');if(raw){const j=new Journey();const data=JSON.parse(raw);if(j.restore(data)&&!j.sequelComplete){checkpointData=data;$('#continue').hidden=false;}}}catch{}
function save(){try{localStorage.setItem('event-horizon-journey-v2',JSON.stringify(game.save()));}catch{}}
function toast(s){$('#toast').textContent=s;$('#toast').classList.add('on');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').classList.remove('on'),3300);}
function getWorld(stage){const key=stage==='home'?'village':stage;if(!cache.has(key)){const w=key==='village'?village():key==='maze'?forest(game):key==='castle'?castle(game):key==='pirate'?pirate(game):space();w.group.traverse(o=>{if(o.isMesh){o.receiveShadow=true;o.castShadow=!(o.geometry.type==='CircleGeometry'||o.material.transparent);}});cache.set(key,w);scene.add(w.group);}return cache.get(key);}
function enterWorld(stage){
 activeStage=stage;world=getWorld(stage);for(const w of cache.values())w.group.visible=w===world;
 scene.environment=['castle','pirate'].includes(stage)?sequelEnvironment():null;scene.background=['castle','pirate'].includes(stage)?sequelBackdrop():null;
 scene.fog=new T.FogExp2(stage==='castle'?'#c5c7b4':stage==='pirate'?'#b3c4be':stage==='village'?'#bac8b9':stage==='maze'?'#244b49':stage==='home'?'#314654':'#080e21',world.fog);
 if(stage==='home'){rig.position.set(0,0,8);world.portal.active=false;}else rig.position.copy(world.spawn);
 camera.position.set(0,1.7,0);rig.rotation.set(0,0,0);targetYaw=yaw=world.yaw||0;targetPitch=pitch=0;
 if(stage==='flight'){ship.visible=true;flightZ=0;positionGate(game.gates);$('#flight-status').hidden=false;$('.map-wrap').hidden=true;}else{ship.visible=false;$('#flight-status').hidden=true;$('.map-wrap').hidden=false;}
 autoPath=[];actionTime=0;routeLine.visible=false;heldKey.visible=game.key&&stage!=='flight';if(game.core){artifact.material.color.set('#8eebe6');artifact.material.emissive.set('#8eebe6');}heldKey.position.set(.37,1.35,-1);
 ambient.intensity=['castle','pirate'].includes(stage)?.7:stage==='village'?.9:stage==='maze'?1.25:stage==='home'?.8:1.2;sunlight.intensity=['castle','pirate'].includes(stage)?3.2:stage==='village'?3.6:stage==='home'?1.2:stage==='maze'?1.6:.6;
 sunlight.color.set(['castle','pirate'].includes(stage)?'#ffe6bd':stage==='village'?'#ffe0b1':stage==='maze'?'#b9e6d0':'#aac6ee');
 score.ambience(stage);$('#duel').hidden=true;if(stage==='castle')world.updateDials();if(stage==='pirate')world.updateReplies();
 renderer.shadowMap.needsUpdate=true;updateProgress();updateVrHud();rebuildAssist();save();
}
function rebuildAssist(){
 const panel=$('#assist-panel');panel.hidden=!assisted||activeStage==='flight';
 if(!assisted||!world)return;
 const list=$('#assist-objects');const names=world.interactables.filter(relevant).map(i=>i.id).join(',');
 if(list.dataset.targets===names)return;list.dataset.targets=names;list.replaceChildren();
 for(const item of world.interactables.filter(relevant)){const b=document.createElement('button');b.textContent=item.id==='portal'?'Portal':item.id==='clock'?'Rellotge':item.id==='core'?'Nucli':item.id.startsWith('relay')?'Fil '+(Number(item.id.slice(-1))+1):({sun:'Sol',wave:'Ona',moon:'Lluna',dial0:'Segell · Torre',dial1:'Segell · Port',dial2:'Segell · Mar',chart:'Carta de marees',embark:'Embarca',captain:'Desafia Salmorra',helm:'Pren el timó'})[item.id]||item.label;b.dataset.object=item.id;b.onclick=()=>{activeTarget=item;interact(item);};list.append(b);}
}
$('#assist').onclick=()=>{assisted=!assisted;$('#assist').setAttribute('aria-pressed',assisted);$('#assist span').textContent=assisted?'ON':'OFF';$('#assist-objects').dataset.targets='';rebuildAssist();};
function updateProgress(){
 $('#chapter-label').textContent=CHAPTERS[activeStage][0];$('#objective').textContent=game.objective();rebuildAssist();$('#dialogue').textContent=game.message;
 $('#key-status').textContent=game.key?'◆ CLAU MERIDIANA':'◇ CLAU ADORMIDA';$('#key-status').classList.toggle('owned',game.key);
 $('#core-status').textContent=game.core?'● NUCLI CONNECTAT':'○ NUCLI ABSENT';$('#core-status').classList.toggle('owned',game.core);
 if(['castle','pirate'].includes(activeStage)){$('#key-status').textContent='◆ CLAU DEL CASTELL';$('#core-status').textContent=game.chart?'✧ CARTA DE MAREES':'◇ CARTA AMAGADA';}
 const second=['castle','pirate'].includes(game.stage);const st=second?(game.stage==='castle'?0:game.duelWins>=3?2:1):STAGES.indexOf(game.stage);for(let i=0;i<3;i++){$('#step'+i).innerHTML=(i+1)+' <b>'+(second?['ELS SEGELLS','EL DUEL','EL RUMB']:['EL RELLOTGE','ELS FILS','EL RETORN'])[i]+'</b>';$('#step'+i).classList.toggle('active',i===Math.min(st,2));$('#step'+i).classList.toggle('done',i<st);}
 $('#shield').textContent='ESCUT '+game.shield+'%';$('#gate-count').textContent='ANELL '+Math.min(3,game.gates+1)+' / 3';$('#map-label').textContent=activeStage==='castle'?'EL CASTELL · PATI D’ARMES':activeStage==='pirate'?'LA SALMORRA · COBERTA':activeStage==='maze'?'ELS FILS · LA CLAU ÉS EL TEU FAR':'LA PLAÇA · N ↑';updateVrHud();
}
async function begin(resume=false){
 if(busy||playing)return;busy=true;$('#start').disabled=true;$('#start').textContent='DESPERTANT EL TEMPS…';
 // Resume AudioContext in the same user gesture; decoding can complete afterwards.
 const music=score.start(resume&&checkpointData?STAGES.indexOf(checkpointData.stage):0).catch(()=>toast('La BSO no s’ha pogut carregar. Pots continuar i activar-la després.'));
 if(resume&&checkpointData){game.restore(checkpointData);game.say('ECO: La clau recorda el camí. Continuem des d’on ho vam deixar.');}else game.begin();
 if(['castle','pirate'].includes(game.stage))await loadSequelAssets(renderer);
 playing=true;document.body.classList.add('playing');$('#intro').hidden=true;$('#hud').hidden=false;enterWorld(game.stage);busy=false;
 processEvents();await music;
}
$('#part-two').onclick=()=>beginSequel();$('#next-part').onclick=()=>beginSequel();
async function beginSequel(){if(busy)return;score.start(4).catch(()=>toast('No s’ha pogut carregar la BSO.'));finish=false;paused=false;playing=true;$('#intro').hidden=true;$('#ending').hidden=true;$('#hud').hidden=false;document.body.classList.add('playing');game.startSequel(true);processEvents();}
$('#start').onclick=()=>begin(false);$('#continue').onclick=()=>begin(true);
async function changeWorld(stage){
 if(busy)return;busy=true;autoPath=[];releaseAction();movement={x:0,y:0};keys.clear();
 $('#transition-title').textContent=CHAPTERS[stage][1];$('#transition-caption').textContent=CHAPTERS[stage][2];$('#transition-symbol').textContent=stage==='flight'?'◈':'◇';$('#transition').hidden=false;
 if(['castle','pirate'].includes(stage)){try{await loadSequelAssets(renderer);}catch{toast('No s’han pogut carregar tots els materials. Torna a entrar per recuperar-los.');}}
 score.whoosh();const cue=STAGES.indexOf(stage);
 try{await score.prepare(cue);}catch{}
 const wait=score.ctx?Math.max(0,score.nextBar()-score.ctx.currentTime):.6;
 const cappedWait=Math.min(3,wait);const when=score.ctx?score.ctx.currentTime+cappedWait:0;score.change(cue,when);
 setTimeout(()=>{enterWorld(stage);burst(rig.position.clone().add(new T.Vector3(0,1.5,-2)),'#b7efe4',35);updateProgress();},cappedWait*1000);
 setTimeout(()=>{$('#transition').hidden=true;busy=false;},Math.max(2700,cappedWait*1000+1000));
}
function processEvents(){while(game.events.length){const e=game.events.shift();
 if(e.type==='message'){updateProgress();}
 if(e.type==='bell'){score.bell(e.id,e.correct);const item=getWorld('village').bells.find(b=>b.id===e.id);burst(item.node.position.clone().add(new T.Vector3(0,2,0)),e.correct?'#ffdb97':'#e09985',18);item.kick=time;}
 if(e.type==='key'){score.reward();getWorld('village').portal.active=true;heldKey.visible=true;toast('CLAU MERIDIANA OBTINGUDA');save();}
 if(e.type==='relay'){score.reward();const item=getWorld('maze').relays[e.index];burst(item.node.position.clone().add(new T.Vector3(0,1.5,0)),'#e7d797',30);save();}
 if(e.type==='core'){score.reward();heldKey.children[0].material.color.set('#8eebe6');heldKey.children[0].material.emissive.set('#8eebe6');toast('EL NUCLI ÉS AMB TU');save();}
 if(e.type==='dial'){world.updateDials();score.bell('sun',true);save();}
 if(e.type==='chart'){score.reward();toast('CARTA DE MAREES OBTINGUDA');save();}
 if(e.type==='duel'){syncDuel();}
 if(e.type==='parryReady'){parryAt=score.ctx?score.nextBar()+120/116:time+2;world.striking=true;syncDuel();}
 if(e.type==='duelHit'){score.clash(false);world.striking=false;syncDuel();save();}
 if(e.type==='parryWin'){score.clash(true);score.reward();burst(new T.Vector3(0,1.6,-2),'#ffe4ad',18);world.striking=false;syncDuel();save();}
 if(e.type==='stage')changeWorld(e.stage);
 if(e.type==='gate'){score.reward();toast('VECTOR '+e.index+' ESTABILITZAT');save();}
 if(e.type==='damage')score.hit();
 if(e.type==='hint'){showRoute();hintUntil=time+24;}
 if(e.type==='ending'){score.reward();end();}
 }updateProgress();}
function end(){finish=true;$('#duel').hidden=true;$('#next-part').hidden=game.sequelComplete;if(game.sequelComplete){$('#ending .kicker').textContent='HAS GUANYAT EL RUMB, A COP D’ENGINY';$('#ending h1').innerHTML='El mar no oblida.<br><em>Tu tampoc.</em>';$('#ending p').textContent='Una clau, un castell i una capitana amb massa paraules. La carta de marees continua més enllà de l’horitzó.';$('#ending small').textContent='FI DE LA SEGONA PART · BON VENT.';} save();setTimeout(()=>{$('#ending').hidden=false;$('#hud').hidden=true;$('#ending-stats').textContent=(game.sequelComplete?'CASTELL DESXIFRAT · 3 INTERCANVIS GUANYATS · ':'3 FILS RECONNECTATS · 3 VECTORS ESTABILITZATS · ')+Math.max(1,Math.round(game.elapsed/60))+' MINUTS DE VIATGE';},1600);}
function burst(pos,color,n=24){const positions=[],vel=[];for(let i=0;i<n;i++){positions.push(pos.x,pos.y,pos.z);vel.push((Math.random()-.5)*3,Math.random()*2+.3,(Math.random()-.5)*3);}const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));const m=new T.PointsMaterial({color,size:.08,transparent:true,opacity:1,blending:T.AdditiveBlending,depthWrite:false});const points=new T.Points(g,m);scene.add(points);bursts.push({points,vel,life:1.6});}
function freeAt(x,z){
 if(world?.deckBoundary&&Math.abs(x)>Math.min(4.35,5.3*Math.pow(Math.max(.015,Math.cos(z/34*Math.PI)),.42)-.5))return false;
 if(Math.abs(x)>(world?.bounds||43)||Math.abs(z)>(world?.bounds||43))return false;
 return !world.colliders.some(c=>Math.abs(x-c.x)<c.hx+.22&&Math.abs(z-c.z)<c.hz+.22);
}
function moveBy(dx,dz){const step=Math.max(1,Math.ceil(Math.hypot(dx,dz)/.18));for(let i=0;i<step;i++){if(freeAt(rig.position.x+dx/step,rig.position.z))rig.position.x+=dx/step;if(freeAt(rig.position.x,rig.position.z+dz/step))rig.position.z+=dz/step;}}
function relevant(item){if(activeStage==='castle')return game.chart?item.id==='embark':item.id.startsWith('dial')||item.id==='chart';if(activeStage==='pirate')return game.duelWins>=3?item.id==='helm':game.duelPhase==='reply'?item.id.startsWith('reply'):game.duelPhase==='idle'&&item.id==='captain';if(activeStage==='village')return game.key?item.id==='portal':['sun','wave','moon'].includes(item.id);if(activeStage==='home')return item.id==='clock';if(activeStage==='maze'){if(item.id.startsWith('relay'))return !game.relays.includes(Number(item.id.slice(-1)));if(item.id==='core')return game.relays.length===3&&!game.core;if(item.id==='portal')return game.core;}return false;}
function targetPosition(item){const p=item.node.getWorldPosition(new T.Vector3());p.y=0;return p;}
function canSee(item){
 const p=targetPosition(item),dx=p.x-rig.position.x,dz=p.z-rig.position.z,d=Math.hypot(dx,dz),steps=Math.ceil(d/.2);
 for(let i=1;i<steps;i++){const x=rig.position.x+dx*i/steps,z=rig.position.z+dz*i/steps;if(world.colliders.some(c=>!(item.id==='clock'&&c.x===0&&c.z===-2)&&Math.abs(x-c.x)<c.hx&&Math.abs(z-c.z)<c.hz))return false;}
 return true;
}
function findTarget(ray=null){
 if(!world||activeStage==='flight')return null;
 const eye=rig.position.clone();eye.y=0;
 let near=null,dist=Infinity;
 if(ray){raycaster.ray.copy(ray);}else {raycaster.setFromCamera(new T.Vector2(0,0),camera);}
 const options=world.interactables.filter(relevant);
 for(const item of options){const p=targetPosition(item),d=eye.distanceTo(p);const hits=raycaster.intersectObject(item.hit,true);if(hits.length&&d<5.8&&canSee(item))return item;if(d<=3.3&&d<dist&&canSee(item)){near=item;dist=d;}}
 return near;
}
function pointItem(x,y){
 pointer.set(x/innerWidth*2-1,-y/innerHeight*2+1);raycaster.setFromCamera(pointer,camera);
 const options=world.interactables.filter(relevant);let closest=null,d=Infinity;for(const item of options){const hits=raycaster.intersectObject(item.hit,true);if(hits.length&&hits[0].distance<d){closest=item;d=hits[0].distance;}}
 return closest;
}
function walkTo(item){
 const p=targetPosition(item);if(activeStage==='maze'){const start=toCell(rig.position.x,rig.position.z),end=toCell(p.x,p.z);const path=mazePath(game.maze,start,end);if(!path.length)return;autoPath=path.slice(1).map(c=>toWorld(...c));if(!autoPath.length)autoPath=[p];}else{ // Route around the clock; never move straight through colliders.
 const dx=p.x-rig.position.x,dz=p.z-rig.position.z;let blocked=false;for(let i=1;i<=20;i++)if(!freeAt(rig.position.x+dx*i/20,rig.position.z+dz*i/20))blocked=true;
 if(blocked){const side=rig.position.x<0?-3:3;autoPath=[new T.Vector3(side,0,rig.position.z),new T.Vector3(side,0,p.z),p];}else autoPath=[p];
 }toast('Mou-te amb el joystick per aturar l’aproximació.');}
function interact(item=activeTarget){
 if(!playing||paused||busy||finish)return;
 if(activeStage==='flight'){shoot();return;}
 if(!item){toast('Acosta’t a un objecte de llum. ? et dona una pista.');return;}
 if(rig.position.distanceTo(targetPosition(item))>3.3||!canSee(item)){walkTo(item);return;}
 if(item.kind==='hold'&&actionTime<1.35){toast('Mantén ACCIÓ per reconnectar el fil.');return;}
 autoPath=[];game.interact(item.id);actionTime=0;processEvents();
}
function shoot(){
 if(time-lastShot<.22)return;lastShot=time;score.shoot();
 raycaster.setFromCamera(new T.Vector2(0,0),camera);const origin=new T.Vector3();camera.getWorldPosition(origin);const end=origin.clone().add(raycaster.ray.direction.clone().multiplyScalar(55));
 let hit=null,distance=Infinity;
 for(const drone of world.drones){if(!drone.visible)continue;const hits=raycaster.intersectObject(drone,true);const p=drone.getWorldPosition(tmp);const delta=p.clone().sub(origin),along=delta.dot(raycaster.ray.direction),near=delta.clone().addScaledVector(raycaster.ray.direction,-along).length();if((hits.length||near<2.7&&along>0)&&along<distance){distance=along;hit=drone;}}
 if(hit){end.copy(hit.position);hit.visible=false;burst(end,'#ffc898',24);score.hit();}
 const geometry=new T.BufferGeometry().setFromPoints([origin,end]);const beam=new T.Line(geometry,new T.LineBasicMaterial({color:'#9ff7ee',transparent:true,opacity:1}));scene.add(beam);beams.push({beam,life:.13});
}
let parryAt=0;
const duelClock=()=>score.ctx?score.ctx.currentTime:time;
function syncDuel(){
 const panel=$('#duel');panel.hidden=activeStage!=='pirate'||game.duelPhase==='idle';
 $('#duel-insult').textContent=INSULTS[game.duelRound%INSULTS.length].attack;
 $('#duel-score').textContent='ENGINY '+game.duelWins+'/3 · TEMPLE '+game.duelLife+'/3';
 $('#duel-answers').hidden=game.duelPhase!=='reply';$('#parry-zone').hidden=game.duelPhase!=='parry';
 const list=$('#duel-answers');list.replaceChildren();
 if(game.duelPhase==='reply'){rig.position.set(0,0,1);targetYaw=yaw=0;targetPitch=pitch=0;autoPath=[];optionsFor(game.duelRound).forEach((text,i)=>{const b=document.createElement('button');b.textContent=(i+1)+'. '+text;b.dataset.reply=i;b.onclick=()=>{if(paused||busy)return;game.interact('reply'+i);processEvents();};list.append(b);});}
 world.updateReplies();updateVrHud();
}
function attemptParry(){if(paused||busy||game.duelPhase!=='parry')return;resolveParry(game,Math.abs(duelClock()-parryAt)<.62);processEvents();}
$('#parry').onclick=attemptParry;
function animateDuel(){
 const phase=game.duelPhase;world.playerSword.visible=phase!=='idle';
 if(phase==='parry'){
  const delta=duelClock()-parryAt,ready=Math.abs(delta)<.62;
  $('#parry').dataset.ready=String(ready);$('#parry').textContent=ready?'ARA · PARA L’ESPASA!':'ESPERA EL SENYAL DAURAT';
  $('#parry-needle').style.left=Math.max(0,Math.min(100,(delta+2)/3*100))+'%';
  world.enemySword.rotation.x=-.9+Math.max(0,Math.min(1,(delta+.7)/1.3))*2.1;
  world.enemySword.rotation.z=Math.sin(delta*3)*.3;
  world.playerSword.rotation.z=ready?-.85:.25;world.playerSword.rotation.x=ready?-.5:.15;
  if(renderer.xr.isPresenting){$('#duel').hidden=true;world.replySigns.forEach(o=>o.visible=false);const guide=world.playerSword.children[0];guide.material.emissive.set(ready?'#cda74e':'#000000');guide.material.emissiveIntensity=ready?.8:0;}
  if(delta>.85){resolveParry(game,false);processEvents();}
 }
}
function pressAction(){if(!playing||paused||busy)return;if(activeStage==='pirate'&&game.duelPhase==='parry'){attemptParry();return;}actionHeld=true;if(activeStage==='flight')shoot();else if(activeTarget&&rig.position.distanceTo(targetPosition(activeTarget))>3.3){walkTo(activeTarget);actionHeld=false;}else if(activeTarget?.kind!=='hold')interact();}
function releaseAction(){actionHeld=false;actionTime=0;chargeStarted=null;$('#charge-ring').style.strokeDashoffset=289;}
$('#action').addEventListener('pointerdown',e=>{e.preventDefault();e.currentTarget.setPointerCapture(e.pointerId);pressAction();});$('#action').addEventListener('pointerup',releaseAction);$('#action').addEventListener('pointercancel',releaseAction);
$('#hint').onclick=()=>{game.hint();processEvents();};
function showRoute(){
 if(activeStage!=='maze')return;let end;
 if(game.core)end=game.coreCell;else if(game.relays.length===3)end=game.coreCell;else end=game.relayCells.find((_,i)=>!game.relays.includes(i));
 const start=toCell(rig.position.x,rig.position.z);const path=mazePath(game.maze,start,end).map(p=>toWorld(...p).add(new T.Vector3(0,.14,0)));
 routeLine.geometry.dispose();routeLine.geometry=new T.BufferGeometry().setFromPoints(path);routeLine.visible=path.length>0;
}
function positionGate(index,retry=false){const centers=[[-3,3],[5,5],[-2,1.8]],c=centers[index%3];world.gate.position.set(c[0],c[1],retry?-85:-105-index*15);world.gate.visible=true;flightZ=0;}
function flight(dt){
 const x=(keys.has('KeyD')||keys.has('ArrowRight')?1:0)-(keys.has('KeyA')||keys.has('ArrowLeft')?1:0)+movement.x;
 const y=(keys.has('KeyW')||keys.has('ArrowUp')?1:0)-(keys.has('KeyS')||keys.has('ArrowDown')?1:0)-movement.y;
 rig.position.x=T.MathUtils.clamp(rig.position.x+x*dt*10,-14,14);rig.position.y=T.MathUtils.clamp(rig.position.y+y*dt*8,-5,9);
 const speed=11+game.gates*2;world.gate.position.z+=speed*dt;flightZ+=speed*dt;
 world.drones.forEach((d,i)=>{d.position.z+=dt*4;d.position.x=(i-1)*5+Math.sin(time*.65+i)*2;d.position.y=2+Math.sin(time*.5+i)*2;if(d.position.z>2){if(d.visible&&Math.abs(d.position.x-rig.position.x)<2.5&&Math.abs(d.position.y-(rig.position.y+1.7))<2.5){game.shield=Math.max(20,game.shield-6);score.hit();updateProgress();}d.position.z=-50-i*15;d.visible=true;}});
 if(actionHeld)shoot();
 if(world.gate.position.z>1.0){const success=Math.hypot(rig.position.x-world.gate.position.x,rig.position.y+1.7-world.gate.position.y)<5.45;game.crossGate(success);processEvents();if(game.stage==='flight')positionGate(game.gates,!success);}
}
function drawMap(){
 if(!world||activeStage==='flight')return;const ctx=$('#map').getContext('2d'),size=208;ctx.clearRect(0,0,size,size);ctx.save();ctx.beginPath();ctx.arc(104,104,102,0,Math.PI*2);ctx.clip();ctx.fillStyle='#142c36aa';ctx.fillRect(0,0,size,size);
 if(activeStage==='maze'){const scale=15.5,off=19;for(let z=0;z<11;z++)for(let x=0;x<11;x++){ctx.fillStyle=game.maze[z][x]?'#6a90804a':'#b7cba01a';ctx.fillRect(off+x*scale,off+z*scale,scale-1,scale-1);}
 const [cx,cz]=[rig.position.x/TILE+5,rig.position.z/TILE+5];drawPlayer(ctx,off+cx*scale+scale/2,off+cz*scale+scale/2);
 for(const i of world.relays){const [x,z]=i.cell;ctx.fillStyle=game.relays.includes(+i.id.slice(-1))?'#80e8c4':'#f6d28b';ctx.beginPath();ctx.arc(off+x*scale+scale/2,off+z*scale+scale/2,4,0,Math.PI*2);ctx.fill();}
 if(game.relays.length===3){ctx.fillStyle='#b6ffff';ctx.beginPath();ctx.arc(off+9*scale+scale/2,off+9*scale+scale/2,5,0,Math.PI*2);ctx.fill();}
 }else{const factor=4;ctx.strokeStyle='#d5d0aa24';ctx.beginPath();ctx.arc(104,104,58,0,Math.PI*2);ctx.stroke();
 for(const item of world.interactables.filter(relevant)){const p=targetPosition(item);ctx.fillStyle='#f0cf93';ctx.beginPath();ctx.arc(104+p.x*factor,104+p.z*factor,4,0,Math.PI*2);ctx.fill();}
 drawPlayer(ctx,104+rig.position.x*factor,104+rig.position.z*factor);}
 ctx.restore();
}
function drawPlayer(ctx,x,z){ctx.save();ctx.translate(x,z);ctx.rotate(-yaw);ctx.fillStyle='#dbfff2';ctx.beginPath();ctx.moveTo(0,-6);ctx.lineTo(-4,5);ctx.lineTo(4,5);ctx.closePath();ctx.fill();ctx.restore();}
let drag=null;
canvas.addEventListener('pointerdown',e=>{if(!playing||paused||busy||finish||e.button!==0)return;drag={x:e.clientX,y:e.clientY,yaw:targetYaw,pitch:targetPitch,moved:false,time:performance.now()};canvas.setPointerCapture(e.pointerId);});
canvas.addEventListener('pointermove',e=>{if(!drag||gyro)return;const dx=e.clientX-drag.x,dy=e.clientY-drag.y;if(Math.abs(dx)+Math.abs(dy)>7)drag.moved=true;if(activeStage!=='flight'){targetYaw=drag.yaw-dx*.004;targetPitch=T.MathUtils.clamp(drag.pitch-dy*.003,-1.05,.9);}else{targetYaw=T.MathUtils.clamp(-dx*.0005,-.15,.15);targetPitch=T.MathUtils.clamp(-dy*.0005,-.1,.1);}});
canvas.addEventListener('pointerup',e=>{if(drag&&!drag.moved&&world){const item=pointItem(e.clientX,e.clientY);if(item){activeTarget=item;interact(item);}else if(activeStage==='flight')shoot();}drag=null;});
canvas.addEventListener('pointercancel',()=>drag=null);
const pad=$('#move-pad');let padId=null;
pad.addEventListener('pointerdown',e=>{if(paused||busy)return;padId=e.pointerId;pad.setPointerCapture(e.pointerId);padMove(e);});
function padMove(e){if(e.pointerId!==padId)return;const r=pad.getBoundingClientRect(),max=r.width*.35;let x=e.clientX-r.left-r.width/2,y=e.clientY-r.top-r.height/2,d=Math.hypot(x,y);if(d>max){x*=max/d;y*=max/d;}movement={x:x/max,y:y/max};$('#stick').style.transform='translate('+x+'px,'+y+'px)';autoPath=[];}
pad.addEventListener('pointermove',padMove);function padUp(){padId=null;movement={x:0,y:0};$('#stick').style.transform='';}pad.addEventListener('pointerup',padUp);pad.addEventListener('pointercancel',padUp);
window.addEventListener('keydown',e=>{if(e.target instanceof HTMLInputElement)return;if(activeStage==='pirate'&&game.duelPhase==='reply'&&['Digit1','Digit2','Digit3'].includes(e.code)&&!paused&&!busy){game.interact('reply'+(+e.code.at(-1)-1));processEvents();return;}if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code))e.preventDefault();if(e.code==='Escape'){if(playing)togglePause();return;}if(e.code==='KeyH'&&!e.repeat){game.hint();processEvents();}if(['KeyE','Space'].includes(e.code)&&!e.repeat)pressAction();keys.add(e.code);});
window.addEventListener('keyup',e=>{keys.delete(e.code);if(['KeyE','Space'].includes(e.code))releaseAction();});
function clearInput(){keys.clear();padUp();releaseAction();drag=null;autoPath=[];}
window.addEventListener('blur',()=>{clearInput();if(playing&&!paused&&!busy&&!renderer.xr.isPresenting&&!finish)togglePause();});
function togglePause(force){if(!playing)return;paused=force??!paused;$('#pause').hidden=!paused;clearInput();if(paused)score.suspend();else score.resume();}
$('#menu').onclick=()=>{if(playing)togglePause();else toast('Comença la història per obrir les opcions.');};$('#resume').onclick=()=>togglePause(false);
function restart(){try{localStorage.removeItem('event-horizon-journey-v2');}catch{}location.reload();}
$('#restart').onclick=restart;$('#again').onclick=restart;$('#about').onclick=()=>{$('#credits').hidden=!$('#credits').hidden;};
$('#volume').oninput=e=>score.setVolume(+e.target.value);
$('#sound').onclick=async()=>{if(!score.ready){try{await score.start(STAGES.indexOf(activeStage));$('#sound').setAttribute('aria-pressed','true');toast('Banda sonora activada');return;}catch{toast('No s’ha pogut carregar la BSO.');return;}}const on=score.toggle();$('#sound').setAttribute('aria-pressed',on);toast(on?'Banda sonora activada':'Banda sonora silenciada');};
$('#fullscreen').onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen();}catch{toast('Pantalla completa no disponible en aquest navegador.');}};
const gyroEuler=new T.Euler(),gyroQuaternion=new T.Quaternion(),gyroFix=new T.Quaternion().setFromAxisAngle(new T.Vector3(1,0,0),-Math.PI/2);
function orientation(e){if(!gyro||e.alpha==null)return;gyroEuler.set(T.MathUtils.degToRad(e.beta||0),T.MathUtils.degToRad(e.alpha||0),-T.MathUtils.degToRad(e.gamma||0),'YXZ');gyroQuaternion.setFromEuler(gyroEuler).multiply(gyroFix);const angle=T.MathUtils.degToRad(screen.orientation?.angle||0);gyroQuaternion.multiply(new T.Quaternion().setFromAxisAngle(new T.Vector3(0,0,1),-angle));}
window.addEventListener('deviceorientation',orientation);window.addEventListener('nativeorientation',e=>orientation(e.detail));
$('#gyro').onclick=async()=>{if(!playing){toast('Comença la història abans d’activar el mode 360°.');return;}if(gyro){gyro=false;$('#gyro').setAttribute('aria-pressed','false');return;}try{if(window.DeviceOrientationEvent?.requestPermission&&await DeviceOrientationEvent.requestPermission()!=='granted')throw Error();if(!window.DeviceOrientationEvent&&!window.AndroidSensors){toast('No hi ha giroscopi disponible. Arrossega per mirar.');return;}window.AndroidSensors?.start();gyro=true;$('#gyro').setAttribute('aria-pressed','true');toast('Mirada 360° activada. El joystick continua movent-te.');}catch{toast('No s’ha pogut activar el giroscopi.');}};
const vrHudCanvas=document.createElement('canvas');vrHudCanvas.width=1024;vrHudCanvas.height=256;const vrTexture=new T.CanvasTexture(vrHudCanvas);vrTexture.colorSpace=T.SRGBColorSpace;
const vrHud=new T.Sprite(new T.SpriteMaterial({map:vrTexture,transparent:true,depthTest:false}));vrHud.position.set(0,1.15,-2.4);vrHud.scale.set(1.8,.45,1);vrHud.visible=false;rig.add(vrHud);
function updateVrHud(){const c=vrHudCanvas.getContext('2d');c.clearRect(0,0,1024,256);c.fillStyle='#0d2130cc';c.fillRect(0,0,1024,256);c.textAlign='center';c.fillStyle='#f3d6a3';c.font='600 24px sans-serif';c.fillText(game.objective().toUpperCase(),512,50);c.fillStyle='#e0eae1';c.font='23px sans-serif';const words=game.message.split(' ');let line='',row=0;for(const word of words){if((line+' '+word).length>66){c.fillText(line,512,100+row*32);row++;line=word;}else line+=' '+word;}if(row<4)c.fillText(line,512,100+row*32);c.fillStyle='#95cbc5';c.font='18px sans-serif';c.fillText('GATELL: ACCIÓ / TELEPORT    GRIP: CARREGA    JOYSTICK: MOU / GIRA',512,238);vrTexture.needsUpdate=true;}
const controllers=[];
for(let i=0;i<2;i++){const control=renderer.xr.getController(i);controllers.push(control);rig.add(control);const g=new T.BufferGeometry().setFromPoints([new T.Vector3(),new T.Vector3(0,0,-8)]),laser=new T.Line(g,new T.LineBasicMaterial({color:'#cdece5',transparent:true,opacity:.45}));control.add(laser);
 control.addEventListener('selectstart',()=>{selectedController=control;const pos=new T.Vector3(),q=new T.Quaternion();control.getWorldPosition(pos);control.getWorldQuaternion(q);const dir=new T.Vector3(0,0,-1).applyQuaternion(q);activeTarget=findTarget(new T.Ray(pos,dir));if(activeTarget||activeStage==='flight'||game.duelPhase==='parry'){pressAction();return;}
 if(dir.y<-.1){const distance=-pos.y/dir.y;if(distance>0&&distance<20){const end=pos.clone().addScaledVector(dir,distance);if(activeStage==='maze'){const cell=toCell(end.x,end.z),start=toCell(rig.position.x,rig.position.z);if(mazePath(game.maze,start,cell).length){const p=toWorld(...cell);rig.position.x=p.x;rig.position.z=p.z;}}else if(freeAt(end.x,end.z)){rig.position.x=end.x;rig.position.z=end.z;}score.tone(440,.15,0,.06);}}
 });
 control.addEventListener('selectend',()=>{releaseAction();selectedController=null;});control.addEventListener('squeezestart',()=>{selectedController=control;pressAction();});control.addEventListener('squeezeend',releaseAction);
}
$('#vr').onclick=async()=>{try{if(!navigator.xr||!await navigator.xr.isSessionSupported('immersive-vr')){toast('Obre aquesta web al navegador de Meta Quest per entrar en VR.');return;}const session=await navigator.xr.requestSession('immersive-vr',{optionalFeatures:['local-floor']});await renderer.xr.setSession(session);gyro=false;document.body.classList.add('vr-active');vrHud.visible=true;if(!playing)await begin(false);if(paused)togglePause(false);session.addEventListener('end',()=>{document.body.classList.remove('vr-active');vrHud.visible=false;camera.position.set(0,1.7,0);rig.rotation.set(0,0,0);clearInput();});}catch(e){toast('No s’ha pogut iniciar VR: '+e.message);}};
let hintPressed=false;function xrInput(dt){const session=renderer.xr.getSession();if(!session)return;for(const input of session.inputSources){const pad=input.gamepad;if(!pad)continue;const pressed=pad.buttons[5]?.pressed||false;if(pressed&&!hintPressed){game.hint();processEvents();}hintPressed=pressed;const axes=pad.axes;const x=axes[2]??axes[0]??0,y=axes[3]??axes[1]??0;if(input.handedness==='left'){movement={x:Math.abs(x)>.15?x:0,y:Math.abs(y)>.15?y:0};}if(input.handedness==='right'&&Math.abs(x)>.75&&time-snapTime>.45){rig.rotation.y-=Math.sign(x)*Math.PI/6;snapTime=time;}}}
document.addEventListener('visibilitychange',()=>{previous=0;clearInput();if(document.hidden&&playing&&!paused&&!busy&&!finish)togglePause(true);});
window.addEventListener('resize',()=>{renderer.setSize(innerWidth,innerHeight);camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();});
canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();save();$('#graphics-error').hidden=false;});
$('#retry').onclick=()=>location.reload();
enterWorld('village');rig.position.set(-13,11,28);camera.position.set(0,0,0);camera.lookAt(0,1,-5);
renderer.setAnimationLoop(ms=>{
 if(document.hidden)return;const rawDt=previous?(ms-previous)/1000:0,dt=Math.min(rawDt,.25);previous=ms;if(rawDt>.05&&!renderer.xr.isPresenting)slowFrames++;else slowFrames=Math.max(0,slowFrames-1);if(slowFrames>35&&qualityLevel<2){qualityLevel++;renderer.setPixelRatio(qualityLevel===1?.8:.6);renderer.setSize(innerWidth,innerHeight);slowFrames=0;}
 if(!paused&&!busy)time+=dt;if(playing&&!paused&&!busy&&!finish)game.elapsed+=dt;
 const pulse=score.pulse;atmosphere.update(time,activeStage);const realSky=['castle','pirate'].includes(activeStage);atmosphere.skyMesh.visible=!realSky;if(realSky){atmosphere.sun.visible=false;atmosphere.sunGlow.visible=false;}atmosphere.group.position.x=rig.position.x;atmosphere.group.position.z=rig.position.z;
 if(!playing){rig.position.x=-13+(reducedMotion?0:Math.sin(time*.09)*1.5);camera.lookAt(0,1,-5);}
 if(world&&!paused){for(const animate of world.animated)animate(time,pulse,busy?0:dt);}
 // Inventory stays with the traveller in all three chapters.
 if(heldKey.visible){heldKey.rotation.y=time*.35;artifactRing.rotation.x=time*.4;artifact.material.emissiveIntensity=.8+pulse*.8;}
 if(world===cache.get('village')){world.portal.active=game.key&&activeStage!=='home';world.clockHands.forEach((h,i)=>{h.rotation.z=game.completed?time*(i?-.14:-.02):i?-.7:0;});world.bells.forEach(b=>{if(b.kick!=null){const since=time-b.kick;b.bell.rotation.z=Math.sin(since*17)*Math.exp(-since*2)*.24;if(since>3)b.kick=null;}});}
 if(playing&&!paused&&!busy&&!finish){
 if(activeStage==='pirate')animateDuel();
 if(renderer.xr.isPresenting)xrInput(dt);
 else if(gyro)camera.quaternion.slerp(gyroQuaternion,.18);else{yaw=T.MathUtils.damp(yaw,targetYaw,12,dt);pitch=T.MathUtils.damp(pitch,targetPitch,12,dt);camera.rotation.set(pitch,yaw,0,'YXZ');}
 if(activeStage==='flight')flight(dt);else{
 let mx=movement.x+(keys.has('KeyD')||keys.has('ArrowRight')?1:0)-(keys.has('KeyA')||keys.has('ArrowLeft')?1:0),my=movement.y-(keys.has('KeyW')||keys.has('ArrowUp')?1:0)+(keys.has('KeyS')||keys.has('ArrowDown')?1:0);
 if(game.duelPhase!=='idle'&&activeStage==='pirate'){mx=my=0;autoPath=[];}
 if(mx||my){autoPath=[];const forward=new T.Vector3();camera.getWorldDirection(forward);forward.y=0;forward.normalize();const right=new T.Vector3(-forward.z,0,forward.x);const d=forward.multiplyScalar(-my).addScaledVector(right,mx);if(d.length()>1)d.normalize();moveBy(d.x*dt*4.2,d.z*dt*4.2);}
 else if(autoPath.length){const p=autoPath[0],d=p.clone().sub(rig.position);d.y=0;const dist=d.length();if(dist<(autoPath.length===1?1.9:.13))autoPath.shift();else{d.normalize();const before=rig.position.clone();moveBy(d.x*Math.min(dist,dt*3.8),d.z*Math.min(dist,dt*3.8));if(before.distanceTo(rig.position)<.001)autoPath=[];if(!gyro&&!renderer.xr.isPresenting)targetYaw=Math.atan2(-d.x,-d.z);}}
 scene.updateMatrixWorld(true);
 if(selectedController&&renderer.xr.isPresenting){const p=new T.Vector3(),q=new T.Quaternion();selectedController.getWorldPosition(p);selectedController.getWorldQuaternion(q);activeTarget=findTarget(new T.Ray(p,new T.Vector3(0,0,-1).applyQuaternion(q)));}else activeTarget=findTarget();
 if(actionHeld&&activeTarget?.kind==='hold'&&rig.position.distanceTo(targetPosition(activeTarget))<3.3){if(chargeStarted===null)chargeStarted=performance.now();actionTime=(performance.now()-chargeStarted)/1000;$('#charge-ring').style.strokeDashoffset=289*(1-Math.min(1,actionTime/1.35));fill.intensity=25+actionTime*60;if(actionTime>=1.35){interact(activeTarget);releaseAction();}}else{actionTime=0;chargeStarted=null;fill.intensity=25;}
 }
 const ready=(activeStage==='pirate'&&game.duelPhase==='parry'&&Math.abs(duelClock()-parryAt)<.62)||activeStage==='flight'||!!(activeTarget&&rig.position.distanceTo(targetPosition(activeTarget))<=3.3&&canSee(activeTarget));$('#action').dataset.ready=String(ready);
 if(assisted){for(const b of document.querySelectorAll('#assist-objects button')){const item=world.interactables.find(i=>i.id===b.dataset.object);const available=!!item&&rig.position.distanceTo(targetPosition(item))<=3.3&&canSee(item);b.dataset.ready=String(available);b.title=available?'Activa aquest objecte':'Camina fins a aquest objecte';}}
 $('#target-label').textContent=activeStage==='flight'?'TRAVESSA ELS ANELLS · ACCIÓ DISPARA':activeTarget?(ready?activeTarget.label:'ACOSTA’T · '+activeTarget.label):'';
 $('#action-label').textContent=game.duelPhase==='parry'?'PARA!':activeStage==='flight'?'DISPARA':activeTarget&&!ready?'ACOSTA’T':activeTarget?.kind==='hold'?'MANTÉN':'ACCIÓ';$('#aim').classList.toggle('ready',!!activeTarget);
 drawMap();$('#music-pulse').style.transform='scaleX('+(score.muted?.3:.35+pulse*.65)+')';$('#music-pulse').style.transformOrigin='left';
 if(routeLine.visible&&time>hintUntil)routeLine.visible=false;
 }
 for(let i=bursts.length-1;i>=0;i--){const b=bursts[i];if(!paused){b.life-=dt;const p=b.points.geometry.attributes.position;for(let j=0;j<p.count;j++){p.array[j*3]+=b.vel[j*3]*dt;p.array[j*3+1]+=b.vel[j*3+1]*dt;p.array[j*3+2]+=b.vel[j*3+2]*dt;}p.needsUpdate=true;b.points.material.opacity=Math.max(0,b.life/1.6);}if(b.life<=0){scene.remove(b.points);b.points.geometry.dispose();b.points.material.dispose();bursts.splice(i,1);}}
 for(let i=beams.length-1;i>=0;i--){const b=beams[i];b.life-=dt;b.beam.material.opacity=Math.max(0,b.life/.13);if(b.life<=0){scene.remove(b.beam);b.beam.geometry.dispose();b.beam.material.dispose();beams.splice(i,1);}}
 if(!busy)renderer.toneMappingExposure=activeStage==='village'?1.13:activeStage==='flight'?1.25:1.05+pulse*.035;
 renderer.render(scene,camera);
});
if('serviceWorker'in navigator&&location.protocol==='https:'&&!location.host.includes('androidplatform'))navigator.serviceWorker.register('./sw.js').catch(()=>{});
