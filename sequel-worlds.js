import * as T from './three.module.js';
import {RGBELoader} from './RGBELoader.js';
import {label,glow} from './worlds.js';
import {GLYPHS,optionsFor} from './sequel.js';
const loader=new T.TextureLoader(),tex={},pending=[];
let environment,backdrop,assetPromise;
export function loadSequelAssets(renderer){
 if(assetPromise)return assetPromise;
 for(const name of ['stone','wood'])for(const kind of ['color','normal','rough']){
  const key=name+'-'+kind;
  pending.push(loader.loadAsync('./assets/textures/'+key+'.webp').then(t=>{t.wrapS=t.wrapT=T.RepeatWrapping;t.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());if(kind==='color')t.colorSpace=T.SRGBColorSpace;tex[key]=t;}));
 }
 pending.push(new RGBELoader().loadAsync('./assets/textures/coast.hdr').then(t=>{const p=new T.PMREMGenerator(renderer);environment=p.fromEquirectangular(t).texture;t.mapping=T.EquirectangularReflectionMapping;backdrop=t;p.dispose();}));
 assetPromise=Promise.all(pending).then(()=>environment).catch(e=>{assetPromise=null;throw e;});return assetPromise;
}
export function sequelEnvironment(){return environment;}
export function sequelBackdrop(){return backdrop;}
const brass=new T.MeshStandardMaterial({color:'#ad8b48',metalness:.85,roughness:.28});
const iron=new T.MeshStandardMaterial({color:'#282d2e',metalness:.8,roughness:.52});
const mortar=new T.MeshStandardMaterial({color:'#837c67',roughness:1});
const cloth=new T.MeshStandardMaterial({color:'#dbcfad',roughness:1,side:T.DoubleSide});
function pbr(name,color='#ffffff'){return new T.MeshStandardMaterial({color,map:tex[name+'-color']||null,normalMap:tex[name+'-normal']||null,roughnessMap:tex[name+'-rough']||null,normalScale:new T.Vector2(.9,.9),roughness:.92,envMapIntensity:.7});}
function mesh(p,g,m,x=0,y=0,z=0){const o=new T.Mesh(g,m);o.position.set(x,y,z);p.add(o);return o;}
function block(p,m,x,y,z,a,b,c){const g=new T.BoxGeometry(a,b,c),uv=g.attributes.uv,pos=g.attributes.position,n=g.attributes.normal;for(let i=0;i<uv.count;i++){uv.setXY(i,(Math.abs(n.getX(i))>.5?pos.getZ(i):pos.getX(i))/3,(Math.abs(n.getY(i))>.5?pos.getZ(i):pos.getY(i))/3);}return mesh(p,g,m,x,y,z);}
function cyl(p,m,x,y,z,r,h,n=24){return mesh(p,new T.CylinderGeometry(r,r,h,n),m,x,y,z);}
function rope(p,a,b,r=.025,m=mortar){const v=new T.Vector3(...b).sub(new T.Vector3(...a));const o=mesh(p,new T.CylinderGeometry(r,r,v.length(),6),m,...new T.Vector3(...a).addScaledVector(v,.5).toArray());o.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),v.normalize());return o;}
function item(w,id,x,z,text,build){const g=new T.Group();g.userData.dynamic=true;g.position.set(x,0,z);w.group.add(g);build?.(g);const i={id,node:g,position:g.position,hit:g,kind:'tap',label:text};w.interactables.push(i);return i;}
function world(){return {group:new T.Group(),interactables:[],colliders:[],animated:[],spawn:new T.Vector3(0,0,9),yaw:0,fog:.003,bounds:15};}
function sign(p,text,x,y,z,w=4){const s=label(text,'#f1dbb2',w);s.position.set(x,y,z);p.add(s);return s;}
function arch(p,m,x,y,z,width=3,height=5,depth=1.5){const r=width/2,stem=height-r;block(p,m,x-r-.55,y+stem/2,z,1.1,stem,depth);block(p,m,x+r+.55,y+stem/2,z,1.1,stem,depth);for(let i=0;i<13;i++){const a=(i+.5)*Math.PI/13;const o=block(p,m,x+Math.cos(a)*(r+.5),y+stem+Math.sin(a)*(r+.5),z,.95,.9,depth);o.rotation.z=a-Math.PI/2;}}
function brazier(w,x,z){const g=new T.Group();g.userData.dynamic=true;g.position.set(x,0,z);w.group.add(g);cyl(g,iron,0,.8,0,.12,1.6);const bowl=mesh(g,new T.SphereGeometry(.4,16,8,0,Math.PI*2,0,Math.PI/2),iron,0,1.55,0);bowl.rotation.x=Math.PI;const fire=mesh(g,new T.ConeGeometry(.22,.8,8),new T.MeshBasicMaterial({color:'#ffb64b'}),0,1.8,0);const halo=glow(g,'#ffac51',0,1.9,0,2.2);const light=new T.PointLight('#ffab51',12,8,2);light.position.y=2;g.add(light);w.animated.push((t)=>{fire.scale.set(.8+Math.sin(t*17+x)*.1,1+Math.sin(t*13)*.2,.8);halo.material.opacity=.3+Math.sin(t*9+x)*.05;light.intensity=10+Math.sin(t*11+x)*2;});}
function landscape(w){const g=new T.PlaneGeometry(260,260,65,65);g.rotateX(-Math.PI/2);const p=g.attributes.position;for(let i=0;i<p.count;i++){const x=p.getX(i),z=p.getZ(i),d=Math.hypot(x,z);p.setY(i,Math.max(0,d-20)*.08+Math.sin(x*.1)*Math.cos(z*.13)*Math.max(0,d-20)*.12-2);}g.computeVertexNormals();mesh(w.group,g,new T.MeshStandardMaterial({color:'#5f6550',roughness:1}));for(let i=0;i<32;i++){const a=i*2.4,d=50+(i%5)*9;const rock=mesh(w.group,new T.DodecahedronGeometry(1,1),new T.MeshStandardMaterial({color:i%2?'#6a705e':'#74796b',roughness:1}),Math.cos(a)*d,3,Math.sin(a)*d);rock.scale.set(8+i%5,9+i%9,7);rock.rotation.set(i,i*.3,0);}}
export function castle(game){
 const w=world(),g=w.group;w.spawn.set(0,0,10);w.bounds=15.5;const stone=pbr('stone','#d9d6c8'),wood=pbr('wood','#bcb4a0');landscape(w);
 block(g,stone,0,-.3,0,34,.6,34);
 // Courtyard walls, projecting towers, real voussoir arches and machicolations.
 for(const s of [-1,1]){block(g,stone,s*17,4,0,2,8,36);w.colliders.push({x:s*17,z:0,hx:1,hz:18});block(g,stone,0,4,s*17,32,8,2);w.colliders.push({x:0,z:s*17,hx:16,hz:1});
  for(let q=-15;q<=15;q+=2.4){block(g,stone,s*17,8.5,q,2.4,1.3,1.3);block(g,stone,q,8.5,s*17,1.3,1.3,2.4);}
  for(const z of [-17,17]){cyl(g,stone,s*17,6,z,4,12,40);cyl(g,stone,s*17,12,z,4.4,.7,40);for(let i=0;i<12;i++){const a=i*Math.PI/6;const b=block(g,stone,s*17+Math.sin(a)*4.15,12.8,z+Math.cos(a)*4.15,1.1,1.3,1.2);b.rotation.y=a;}for(let h=3;h<11;h+=3)block(g,iron,s*17, h,z+4.03,.22,1.25,.08);}
 }
 // Great hall above the north curtain; doorway and deep window reveals.
 block(g,stone,0,8,-21,22,16,9);block(g,stone,0,16.2,-21,23,.6,10);
 for(let x=-10;x<=10;x+=2)block(g,stone,x,17,-17,1,1.5,1.5);
 arch(g,stone,0,0,-15.7,4,6,2);block(g,wood,0,2.5,-16,3.9,5,.25);for(let x=-1.6;x<2;x+=.4)block(g,iron,x,2.5,-15.8,.035,4.8,.05);
 for(const x of [-7,0,7]){arch(g,stone,x,9,-16.3,1.7,4,.9);block(g,iron,x,10.7,-16.35,1.6,3.5,.15);for(let j=-.5;j<1;j+=.5)block(g,brass,x+j,10.7,-16.2,.035,3.5,.1);}
 for(const x of [-11,11]){const pole=rope(g,[x,9,-15],[x,12,-15],.045,iron);const banner=block(g,new T.MeshStandardMaterial({color:'#572f32',roughness:1,side:T.DoubleSide}),x,10,-14.9,1.7,3,.035);sign(g,'☾',x,10.3,-14.7,1);banner.userData.dynamic=true;w.animated.push(t=>{banner.rotation.y=Math.sin(t*1.6+x)*.08;});}
 // Damp paving: independent stone UV coordinates and low grazing reflections.
 const paving=stone.clone();paving.color.set('#adaf9d');paving.roughness=.53;block(g,paving,0,.015,0,30,.04,30);
 // Central route is clear: all puzzle stations can be reached without invisible blockers.
 sign(g,'CASTELL DE LES MAREES',0,7.2,-14.4,9);
 sign(g,'TORRE ☀   ·   PORT ☾   ·   MAR ≈',0,5.9,-14.3,9);
 w.dialSymbols=[];
 for(let i=0;i<3;i++){
  const x=(i-1)*5;
  item(w,'dial'+i,x,-5,['SEGELL DE LA TORRE','SEGELL DEL PORT','SEGELL DE LA MAR'][i],p=>{
   block(p,stone,0,.6,0,1.8,1.2,1.2);const dial=cyl(p,brass,0,1.6,0,.68,.2,48);dial.rotation.x=Math.PI/2;
   const glyph=sign(p,GLYPHS[game.dials[i]],0,1.65,.2,1.2);w.dialSymbols.push(glyph);sign(p,['TORRE','PORT','MAR'][i],0,2.65,0,2.5);
  });
 }
 item(w,'chart',0,-11,'OBRE LA CARTA DE MAREES',p=>{block(p,wood,0,.7,0,2,1.4,1.2);const page=block(p,new T.MeshStandardMaterial({color:'#d6c492',roughness:.9}),0,1.45,.1,1.6,.08,1);page.rotation.x=.12;for(let r of [.2,.4,.6]){const o=mesh(p,new T.TorusGeometry(r,.008,4,40),iron,0,1.51,.1);o.rotation.x=-Math.PI/2;}sign(p,'LA CARTA DE MAREES',0,2.45,0,4);});
 item(w,'embark',10,5,'EMBARCA CAP AL MAR DE LA MEMÒRIA',p=>{arch(p,stone,0,0,0,2.3,4.5,1.6);block(p,wood,0,1.8,-.4,2.2,3.6,.25);const lamp=glow(p,'#9fe9dc',0,2,.3,4);w.animated.push((t,b)=>lamp.material.opacity=game.chart?.35+b*.15:.02);sign(p,'AL MOLL →',0,5.1,0,3);});
 for(const x of [-8,8])for(const z of [-12,4])brazier(w,x,z);
 // Wind-carried motes at physical courtyard scale.
 const ps=[];for(let i=0;i<100;i++)ps.push(Math.sin(i*47)*14,1+(i%17)*.4,Math.cos(i*23)*14);const pg=new T.BufferGeometry();pg.setAttribute('position',new T.Float32BufferAttribute(ps,3));const dust=new T.Points(pg,new T.PointsMaterial({color:'#e9d7ac',size:.025,transparent:true,opacity:.45,depthWrite:false}));dust.userData.dynamic=true;g.add(dust);w.animated.push(t=>dust.position.x=Math.sin(t*.15)*.4);
 w.updateDials=()=>{w.dialSymbols.forEach((s,i)=>{const n=label(GLYPHS[game.dials[i]],'#f1dbb2',1.2);s.material.map.dispose();s.material.dispose();s.material=n.material;});};
 batchMasonry(w);return w;
}
function sword(p,x=0,y=0,z=0){const g=new T.Group();g.position.set(x,y,z);p.add(g);const blade=block(g,new T.MeshStandardMaterial({color:'#cbd1d0',metalness:1,roughness:.19}),0,.8,0,.075,1.45,.025);blade.rotation.z=-.03;block(g,brass,0,.05,0,.5,.07,.08);cyl(g,iron,0,-.12,0,.05,.3,12);const guard=mesh(g,new T.TorusGeometry(.17,.022,8,24,Math.PI),brass,.1,-.03,0);guard.rotation.z=-Math.PI/2;return g;}
function captain(w){const p=new T.Group();p.userData.dynamic=true;p.position.set(0,0,-3.6);w.group.add(p);const coat=new T.MeshStandardMaterial({color:'#632f32',roughness:.85}),skin=new T.MeshStandardMaterial({color:'#b98d6e',roughness:.8}),boot=new T.MeshStandardMaterial({color:'#292824',roughness:.6});
 for(const x of [-.18,.18]){block(p,boot,x,.3,0,.23,.6,.3);block(p,boot,x,.12,.1,.25,.24,.5);}const torso=mesh(p,new T.CylinderGeometry(.29,.4,.85,12),coat,0,.98,0);block(p,iron,0,.7,.07,.75,.1,.5);block(p,brass,0,.7,.34,.16,.13,.025);mesh(p,new T.SphereGeometry(.24,24,16),skin,0,1.65,0);mesh(p,new T.SphereGeometry(.25,16,12),boot,0,1.72,-.055);const face=mesh(p,new T.SphereGeometry(.21,16,12),skin,0,1.65,.09);face.scale.z=.8;
 for(const x of [-.075,.075])mesh(p,new T.SphereGeometry(.023,8,8),iron,x,1.7,.27);block(p,iron,-.075,1.7,.28,.09,.065,.02);rope(p,[-.2,1.8,.12],[.2,1.6,.16],.012,iron);
 const hat=mesh(p,new T.ConeGeometry(.48,.3,3),boot,0,1.99,0);hat.rotation.y=Math.PI/2;hat.scale.z=.7;block(p,brass,0,1.94,.24,.12,.08,.025);
 rope(p,[-.32,1.32,0],[-.5,.92,.15],.11,coat);rope(p,[.32,1.32,0],[.55,1.05,.3],.11,coat);const arm=new T.Group();arm.position.set(.55,1.05,.3);p.add(arm);mesh(arm,new T.SphereGeometry(.1,12,10),skin);const blade=sword(arm);blade.rotation.x=.9;blade.rotation.z=-.7;w.enemySword=arm;w.captain=p;
 w.animated.push(t=>{p.rotation.y=Math.sin(t*.6)*.025;p.position.y=Math.sin(t*2)*.025;if(!w.striking)arm.rotation.x=Math.sin(t*1.7)*.1;});return p;
}
export function pirate(game){
 const w=world(),g=w.group;w.spawn.set(0,0,3);w.bounds=15;const wood=pbr('wood','#c0a078'),dark=pbr('wood','#5e4837');
 // Curved hull built from transverse sections, with copper rubbing strakes.
 const vertices=[],uv=[],indices=[],sections=32,ribs=16;
 for(let j=0;j<=sections;j++){const z=-17+j*34/sections,width=5.3*Math.pow(Math.max(.015,Math.sin(j/sections*Math.PI)),.42);for(let i=0;i<=ribs;i++){const a=i/ribs*Math.PI;vertices.push(Math.cos(a)*width,-Math.sin(a)*4-.15,z);uv.push(i/ribs*4,j/sections*9);}}
 for(let j=0;j<sections;j++)for(let i=0;i<ribs;i++){const a=j*(ribs+1)+i;indices.push(a,a+1,a+ribs+1,a+1,a+ribs+2,a+ribs+1);}const hull=new T.BufferGeometry();hull.setAttribute('position',new T.Float32BufferAttribute(vertices,3));hull.setAttribute('uv',new T.Float32BufferAttribute(uv,2));hull.setIndex(indices);hull.computeVertexNormals();dark.side=T.DoubleSide;mesh(g,hull,dark);
 const outline=new T.Shape();for(let j=0;j<=32;j++){const z=-17+j*34/32,x=5.3*Math.pow(Math.max(.015,Math.sin(j/32*Math.PI)),.42);j?outline.lineTo(x,-z):outline.moveTo(x,-z);}for(let j=32;j>=0;j--){const z=-17+j*34/32,x=5.3*Math.pow(Math.max(.015,Math.sin(j/32*Math.PI)),.42);outline.lineTo(-x,-z);}outline.closePath();const deck=new T.ShapeGeometry(outline);deck.rotateX(-Math.PI/2);const duv=deck.attributes.uv,dp=deck.attributes.position;for(let i=0;i<duv.count;i++)duv.setXY(i,dp.getX(i)/3,dp.getZ(i)/3);mesh(g,deck,wood,0,-.01,0);for(let z=-14;z<=14;z+=.55)block(g,dark,0,.001,z,9.3,.012,.018);
 for(const s of [-1,1]){
  for(let z=-13;z<=13;z+=1.3){cyl(g,dark,s*4.6,.55,z,.055,1.1,8);}block(g,dark,s*4.6,1.08,0,.12,.13,28);block(g,dark,s*4.6,.55,0,.09,.07,28);
  w.colliders.push({x:s*4.8,z:0,hx:.25,hz:15});
  for(const z of [-9,-5,3,7]){const cannon=cyl(g,iron,s*3.85,.65,z,.2,1.3,20);cannon.rotation.z=s*Math.PI/2;block(g,dark,s*3.7,.3,z,1.1,.4,.8);for(const dz of [-.4,.4]){const wheel=cyl(g,iron,s*3.7,.25,z+dz,.25,.09,16);wheel.rotation.x=Math.PI/2;}}
 }
 w.deckBoundary=true;w.colliders.push({x:0,z:-14.7,hx:5,hz:.4},{x:0,z:14.7,hx:5,hz:.4});
 // Stern cabin, accessible wheel in front; no unexplained floor height changes.
 block(g,dark,0,1.6,13.5,8,3.2,2);for(const x of [-2.5,0,2.5]){block(g,brass,x,1.9,12.43,1.8,1.5,.12);block(g,new T.MeshStandardMaterial({color:'#b4c2ac',metalness:.35,roughness:.2}),x,1.9,12.34,1.6,1.3,.03);for(const dx of [-.5,0,.5])block(g,brass,x+dx,1.9,12.3,.025,1.3,.04);}w.colliders.push({x:0,z:13.5,hx:4,hz:1});
 // Masts, yards, shrouds, rigging and stitched wind-filled canvas.
 w.sails=[];
 for(const [z,h]of [[-10,16],[5,18]]){
  cyl(g,dark,0,h/2,z,.18,h,16);w.colliders.push({x:0,z,hx:.3,hz:.3});
  const yard=rope(g,[-7,h-2,z],[7,h-2,z],.1,dark);
  const sg=new T.PlaneGeometry(13,7,20,12),pos=sg.attributes.position;
  for(let i=0;i<pos.count;i++){const x=pos.getX(i),y=pos.getY(i);pos.setZ(i,Math.cos(x/13*Math.PI)*Math.cos(y/7*Math.PI)*1.4);}sg.computeVertexNormals();const sail=mesh(g,sg,cloth,0,h-5.7,z);sail.userData.dynamic=true;w.sails.push(sail);
  for(let x=-6;x<=6;x+=1.3)rope(g,[x,h-2.3,z+.05],[x,h-9,z+.05],.012,mortar);
  for(const s of [-1,1]){rope(g,[0,h-1,z],[s*4.5,.9,z-4],.035);rope(g,[0,h-1,z],[s*4.5,.9,z+4],.035);for(let k=0;k<8;k++)rope(g,[s*.3,h-2-k*1.4,z],[s*(.6+k*.5),h-2-k*1.4,z+2.5],.017);}
  cyl(g,dark,0,h-1,z,.9,.12,20);const flag=block(g,new T.MeshStandardMaterial({color:'#25262b',side:T.DoubleSide}),1,h+.3,z,2,1.2,.02);sign(g,'☠',1,h+.3,z+.03,1);
 }
 rope(g,[0,.2,-16],[0,5,-24],.13,dark);rope(g,[0,15,-10],[0,5,-24],.035);
 for(const x of [-3,3])for(const z of [-12,10]){const barrel=cyl(g,wood,x,.55,z,.45,1.1,16);for(const y of [.1,.9])cyl(g,iron,x,y,z,.46,.06,16);}
 const seaGeo=new T.PlaneGeometry(500,500,100,100);seaGeo.rotateX(-Math.PI/2);const water=new T.MeshStandardMaterial({color:'#2c6970',metalness:.55,roughness:.2,envMapIntensity:1.3});const sea=mesh(g,seaGeo,water,0,-3,0),sp=seaGeo.attributes.position;
 const foam=[];for(let i=0;i<160;i++)foam.push(Math.sin(i*11)*200,-2.5,Math.cos(i*9)*200);const fg=new T.BufferGeometry();fg.setAttribute('position',new T.Float32BufferAttribute(foam,3));const wake=new T.Points(fg,new T.PointsMaterial({color:'#c9e0d8',size:.18,transparent:true,opacity:.5}));sea.userData.dynamic=true;wake.userData.dynamic=true;g.add(wake);
 w.animated.push((t,p,dt)=>{if(dt){for(let i=0;i<sp.count;i++){const x=sp.getX(i),z=sp.getZ(i);sp.setY(i,Math.sin(x*.09+t*.65)*.5+Math.cos(z*.11+t*.5)*.35);}sp.needsUpdate=true;seaGeo.computeVertexNormals();}for(let i=0;i<w.sails.length;i++)w.sails[i].rotation.y=Math.sin(t*.5+i)*.025;wake.position.z=(t*2)%15;});
 const cap=captain(w);w.interactables.push({id:'captain',node:cap,hit:cap,kind:'tap',label:'DESAFIA LA CAPITANA SALMORRA'});
 w.replySigns=[];
 for(let i=0;i<3;i++){
  const choice=item(w,'reply'+i,(i-1)*2.1,-1,'RÈPLICA '+(i+1),p=>{const s=sign(p,String(i+1),0,1.25,0,.6);w.replySigns.push(s);});choice.node.visible=false;
 }
 item(w,'helm',0,10,'PREN EL TIMÓ · MARCA EL RUMB',p=>{block(p,dark,0,.7,0,.3,1.4,.4);const wheel=mesh(p,new T.TorusGeometry(.7,.06,8,48),wood,0,1.5,0);for(let i=0;i<8;i++){const a=i*Math.PI/4;rope(p,[0,1.5,0],[Math.cos(a)*.95,1.5+Math.sin(a)*.95,0],.035,wood);}cyl(p,brass,0,1.5,0,.12,.15,16).rotation.x=Math.PI/2;sign(p,'EL RUMB ÉS TEU',0,2.8,0,3);});
 w.playerSword=sword(g,.55,1.05,-.5);w.playerSword.userData.dynamic=true;w.playerSword.visible=false;
 w.updateReplies=()=>{for(let i=0;i<3;i++){const obj=w.interactables.find(o=>o.id==='reply'+i);obj.node.visible=game.duelPhase==='reply';const text=optionsFor(game.duelRound)[i];const n=label((i+1)+'. '+text,'#f1dbb2',7);w.replySigns[i].material.map.dispose();w.replySigns[i].material.dispose();w.replySigns[i].material=n.material;w.replySigns[i].scale.copy(n.scale);obj.node.position.set(0,.35-i*.42,-1);}};
 batchMasonry(w);return w;
}

// Merge static architecture by material: stone detail does not cost a draw call per block.
function batchMasonry(w){
 const buckets=new Map();w.group.updateMatrixWorld(true);
 w.group.traverse(o=>{if(!o.isMesh||!o.geometry.attributes.normal||!o.geometry.attributes.uv||Array.isArray(o.material))return;for(let p=o;p&&p!==w.group;p=p.parent)if(p.userData.dynamic)return;const k=o.material.uuid;if(!buckets.has(k))buckets.set(k,[]);buckets.get(k).push(o);});
 for(const objects of buckets.values()){
  if(objects.length<2)continue;const pos=[],norm=[],uv=[],idx=[];let offset=0;
  for(const o of objects){const g=o.geometry,p=g.attributes.position,n=g.attributes.normal,u=g.attributes.uv,normalMatrix=new T.Matrix3().getNormalMatrix(o.matrixWorld),v=new T.Vector3();
   for(let i=0;i<p.count;i++){v.fromBufferAttribute(p,i).applyMatrix4(o.matrixWorld);pos.push(v.x,v.y,v.z);v.fromBufferAttribute(n,i).applyMatrix3(normalMatrix).normalize();norm.push(v.x,v.y,v.z);uv.push(u.getX(i),u.getY(i));}
   if(g.index)for(const i of g.index.array)idx.push(i+offset);else for(let i=0;i<p.count;i++)idx.push(i+offset);offset+=p.count;
  }
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setAttribute('normal',new T.Float32BufferAttribute(norm,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(idx);g.computeBoundingSphere();
  mesh(w.group,g,objects[0].material);for(const o of objects){o.removeFromParent();o.geometry.dispose();}
 }
}
