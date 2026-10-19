import * as T from './three.module.js';
export const TILE=3.2;
export const toWorld=(x,z)=>new T.Vector3((x-5)*TILE,0,(z-5)*TILE);
export const toCell=(x,z)=>[Math.round(x/TILE+5),Math.round(z/TILE+5)];
const geometries=new Map(),materials=new Map();
const geo=(k,fn)=>{if(!geometries.has(k))geometries.set(k,fn());return geometries.get(k);};
export function material(color,emission=0){const key=color+':'+emission;if(!materials.has(key))materials.set(key,new T.MeshStandardMaterial({color,roughness:.85,metalness:.05,emissive:color,emissiveIntensity:emission}));return materials.get(key);}
export function mesh(parent,g,color,x=0,y=0,z=0,e=0){const m=new T.Mesh(g,material(color,e));m.position.set(x,y,z);parent.add(m);return m;}
export function box(p,c,x,y,z,w,h,d,e=0){const m=mesh(p,geo('box',()=>new T.BoxGeometry()),c,x,y,z,e);m.scale.set(w,h,d);return m;}
export function sphere(p,c,x,y,z,r,e=0){const m=mesh(p,geo('sphere',()=>new T.SphereGeometry(1,24,16)),c,x,y,z,e);m.scale.setScalar(r);return m;}
export function cylinder(p,c,x,y,z,r1,r2,h,n=12,e=0){return mesh(p,geo('cyl:'+r1+':'+r2+':'+h+':'+n,()=>new T.CylinderGeometry(r1,r2,h,n)),c,x,y,z,e);}
export function ring(p,c,x,y,z,r,t=.04){return mesh(p,new T.TorusGeometry(r,t,8,80),c,x,y,z,1.5);}
let rng=4815;function rand(){rng=(1664525*rng+1013904223)>>>0;return rng/4294967296;}
export function label(text,color='#efdab6',w=4){const c=document.createElement('canvas');c.width=1024;c.height=180;const ctx=c.getContext('2d');ctx.clearRect(0,0,1024,180);ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='500 53px sans-serif';ctx.shadowBlur=12;ctx.shadowColor='#07151d';ctx.fillStyle=color;ctx.fillText(text,512,84);const tex=new T.CanvasTexture(c);tex.colorSpace=T.SRGBColorSpace;const s=new T.Sprite(new T.SpriteMaterial({map:tex,transparent:true,depthWrite:false}));s.scale.set(w,w*180/1024,1);return s;}
function glowTexture(){const c=document.createElement('canvas');c.width=c.height=128;const a=c.getContext('2d'),g=a.createRadialGradient(64,64,0,64,64,64);g.addColorStop(0,'#ffffff');g.addColorStop(.12,'#ffffffc0');g.addColorStop(.4,'#ffffff25');g.addColorStop(1,'#ffffff00');a.fillStyle=g;a.fillRect(0,0,128,128);return new T.CanvasTexture(c);}
let glowMap;
export function glow(p,c,x,y,z,size=2){glowMap||=glowTexture();const s=new T.Sprite(new T.SpriteMaterial({map:glowMap,color:c,blending:T.AdditiveBlending,depthWrite:false,transparent:true,opacity:.65}));s.position.set(x,y,z);s.scale.setScalar(size);p.add(s);return s;}
function interaction(w,id,node,labelText,kind='tap'){const item={id,node,kind,label:labelText,position:node.position,hit:node,charged:0};w.interactables.push(item);return item;}
function env(){return {group:new T.Group(),interactables:[],colliders:[],animated:[],spawn:new T.Vector3(0,0,12),yaw:0,background:'#8096a0',fog:.012};}
function collider(w,x,z,sx,sz){w.colliders.push({x,z,hx:sx/2,hz:sz/2});}
function tree(g,x,z,scale=1,color='#3a705a'){const t=new T.Group();t.userData.tree=true;t.position.set(x,0,z);t.scale.setScalar(scale);g.add(t);cylinder(t,'#766655',0,1.3,0,.15,.22,2.6,6);for(let i=0;i<3;i++){const o=mesh(t,geo('leaf',()=>new T.IcosahedronGeometry(1,1)),color,(i-1)*.45,2.5+rand()*.8,(i%2-.5)*.5);o.scale.set(.9,1.2,.9);}return t;}
function roof(g,x,y,z,w,d,h=1.1){const shape=new T.Shape();shape.moveTo(-w/2,0);shape.lineTo(0,h);shape.lineTo(w/2,0);shape.closePath();const r=mesh(g,new T.ExtrudeGeometry(shape,{depth:d,bevelEnabled:false}),'#9e5846',x,y,z-d/2);for(let i=0;i<Math.ceil(d/.27);i++){box(g,'#ad6c54',x,y+h+.025,z-d/2+i*.27,.13,.09,.17);}return r;}
function house(w,x,z,sx,sz,h,c){const p=new T.Group();p.position.set(x,0,z);w.group.add(p);box(p,c,0,h/2,0,sx,h,sz);roof(p,0,h,0,sx+.35,sz+.35);box(p,'#e4d5b2',0,.18,sz/2+.03,sx,.35,.08);for(let row=0;row<2;row++)for(let i=-1;i<=1;i+=2){box(p,'#4b695d',i*sx*.27,1.5+row*1.35,sz/2+.07,.68,.95,.1);box(p,'#e9c894',i*sx*.27,1.5+row*1.35,sz/2+.13,.4,.7,.02,.55);box(p,'#d7c7a2',i*sx*.27,1.0+row*1.35,sz/2+.18,.85,.08,.28);}box(p,'#4e594c',0,.85,sz/2+.07,.85,1.7,.12);collider(w,x,z,sx+.5,sz+.5);return p;}
function clockFace(g,x,y,z,r=1){const face=cylinder(g,'#f4dec2',x,y,z,r,r,.1,48);face.rotation.x=Math.PI/2;for(let j=0;j<12;j++){const a=j/12*Math.PI*2;const tick=box(g,'#475d64',x+Math.sin(a)*r*.8,y+Math.cos(a)*r*.8,z+.07,.04,.14,.035);tick.rotation.z=-a;}const hand1=box(g,'#45606a',x,y+.25*r,z+.12,.045,.5*r,.04);const hand2=box(g,'#45606a',x+.25*r,y,z+.14,.5*r,.035,.04);sphere(g,'#e8b466',x,y,z+.16,.065,.4);return [hand1,hand2];}
function portal(w,x,z,color='#9fe6d2'){
 const g=new T.Group();g.position.set(x,0,z);w.group.add(g);
 cylinder(g,'#556f71',0,.15,0,2.4,2.65,.3,48);
 const halo=ring(g,color,0,2.6,0,2.1,.065),inner=ring(g,'#efd9ad',0,2.6,0,1.94,.025);
 const surface=mesh(g,new T.CircleGeometry(1.9,64),color,0,2.6,.01,.6);surface.material=material(color,.9).clone();surface.material.transparent=true;surface.material.opacity=.08;surface.material.side=T.DoubleSide;
 for(let i=0;i<8;i++){const a=i/8*Math.PI*2;box(g,'#6c8680',Math.sin(a)*2.2,2.6+Math.cos(a)*2.2,0,.2,.3,.35);}
 const light=glow(g,color,0,2.6,0,7);light.material.opacity=.1;
 const item=interaction(w,'portal',g,'TRAVESSA L’ESQUERDA');item.halo=halo;item.surface=surface;item.inner=inner;item.glow=light;item.active=false;
 w.animated.push((t,p)=>{halo.rotation.z=t*.1;inner.rotation.z=-t*.12;halo.material.emissiveIntensity=item.active?1.5+p*2:.15;surface.material.opacity=item.active?.13+p*.1:.02;light.material.opacity=item.active?.28+p*.12:.04;});return item;
}
export function village(){
 const w=env();w.spawn.set(0,0,11);w.background='#a8bbc0';w.fog=.007;
 cylinder(w.group,'#6b8973',0,-.5,0,48,52,1,96);
 const plaza=cylinder(w.group,'#bfb69c',0,-.03,-2,14,14,.13,80);
 const paving=new T.GridHelper(30,30,'#a79f89','#a79f89');paving.position.set(0,.055,-2);paving.material.transparent=true;paving.material.opacity=.22;w.group.add(paving);
 for(let i=0;i<12;i++){const a=(i/12)*Math.PI*2;const stone=box(w.group,'#d6c7a7',Math.cos(a)*11.5,.08,Math.sin(a)*11.5-2,1.4,.13,.65);stone.rotation.y=-a;}
 for(const side of [-1,1])for(let i=0;i<4;i++){const h=3.6+rand()*1.2;house(w,side*(16+rand()*2),-16+i*9,5.2,5.5,h,['#e4d5b5','#d3c6a5','#e3cfb4','#c5d3c5'][i]);}
 // A Mediterranean church; architectural invention, intentionally not a survey.
 const church=new T.Group();church.position.set(-8,0,-24);w.group.add(church);box(church,'#ddd3b5',0,3.8,0,7.8,7.6,12);roof(church,0,7.6,0,8.3,12.5,2);
 const door=mesh(church,new T.ShapeGeometry((()=>{const s=new T.Shape();s.moveTo(-.9,0);s.lineTo(-.9,2.2);s.absarc(0,2.2,.9,Math.PI,0,true);s.lineTo(.9,0);s.closePath();return s;})()),'#495b57',0,.05,6.02);
 ring(church,'#b59f79',0,5.7,6.03,.95,.09);sphere(church,'#779b99',0,5.7,5.95,.76);
 box(church,'#d5c9a8',5.1,6.2,1.7,2.5,12.4,2.5);roof(church,5.1,12.4,1.7,3,3,1.4);
 for(const x of [4.5,5.7])box(church,'#4f625a',x,10.4,3,.5,1.7,.08);
 clockFace(church,5.1,8.1,3.01,.76);collider(w,-8,-24,8,12);collider(w,-2.9,-22.3,2.7,2.7);
 const treeCoords=[[-10,8],[10,8],[-11,-5],[11,-5],[-7,-32],[6,-27],[-25,-11],[26,12],[-24,20],[21,-30],[0,-36]];
 for(const [x,z]of treeCoords)tree(w.group,x,z,1.5);
 // Central clock and readable diegetic sequence.
 const clock=new T.Group();clock.position.set(0,0,-2);w.group.add(clock);cylinder(clock,'#849a91',0,.15,0,1.45,1.65,.3,8);box(clock,'#a9b6a0',0,1.4,0,1.3,2.5,1.1);const clockHands=clockFace(clock,0,2.7,.62,.85);const inscription=label('☀  →  ≈  →  ☾','#3a5c62',3.8);inscription.position.set(0,4.05,0);clock.add(inscription);collider(w,0,-2,2.2,2);
 const clockItem=interaction(w,'clock',clock,'RETORNA EL NUCLI');
 const orbit=ring(clock,'#e9c38a',0,2.7,.72,1.06,.02);w.clock=clockItem;w.clockHands=clockHands;
 const specs=[['sun',-5,2,'☀ SOL','#f0c27f'],['wave',5,2,'≈ ONA','#93d5ce'],['moon',0,-8,'☾ LLUNA','#b9b7eb']];
 w.bells=[];
 for(const [id,x,z,title,color]of specs){
  const g=new T.Group();g.position.set(x,0,z);w.group.add(g);cylinder(g,'#82938c',0,.15,0,.85,1.0,.3,8);box(g,'#bcc2aa',0,.95,0,.65,1.7,.65);
  const bell=cylinder(g,color,0,2,0,.35,.65,.7,24,.35);const top=ring(g,color,0,2.1,0,.95,.025);top.rotation.x=Math.PI/2;
  const orb=sphere(g,color,0,2.65,0,.15,2),light=glow(g,color,0,2.5,0,2.5),titleSprite=label(title,color,2.3);titleSprite.position.y=3.4;g.add(titleSprite);
  const item=interaction(w,id,g,'FA SONAR '+title);item.bell=bell;item.light=light;item.orb=orb;w.bells.push(item);
  w.animated.push((t,p)=>{orb.position.y=2.7+Math.sin(t*1.2+x)*.13;top.rotation.z=t*.15;light.material.opacity=.25+p*.2;});
 }
 w.portal=portal(w,0,-16);w.bounds=42;
 w.animated.push((t,p)=>{orbit.rotation.z=t*.12;});
 return w;
}
export function forest(game){
 const w=env();const sp=toWorld(1,1);w.spawn.copy(sp);w.yaw=-Math.PI/2;w.background='#173b40';w.fog=.026;
 cylinder(w.group,'#354d42',0,-.6,0,45,50,1.2,80);
 const walls=[],paths=[];for(let z=0;z<11;z++)for(let x=0;x<11;x++){const p=toWorld(x,z);if(game.maze[z][x])walls.push(p);else{paths.push(p);}}
 const im=new T.InstancedMesh(new T.BoxGeometry(TILE-.08,2.55,TILE-.08),material('#4b7468'),walls.length),dummy=new T.Object3D();
 walls.forEach((p,i)=>{dummy.position.set(p.x,1.27,p.z);dummy.updateMatrix();im.setMatrixAt(i,dummy.matrix);collider(w,p.x,p.z,TILE-.08,TILE-.08);});w.group.add(im);
 const floorInstances=new T.InstancedMesh(new T.BoxGeometry(TILE-.1,.1,TILE-.1),material('#748b75'),paths.length);paths.forEach((p,i)=>{dummy.position.set(p.x,.02,p.z);dummy.updateMatrix();floorInstances.setMatrixAt(i,dummy.matrix);});w.group.add(floorInstances);

 // Large silhouettes beyond the maze give depth without hiding navigation.
 for(let i=0;i<55;i++){const a=rand()*Math.PI*2,r=21+rand()*18;tree(w.group,Math.cos(a)*r,Math.sin(a)*r,1.7+rand()*1.8,['#356c60','#4d8171','#2b5f56'][i%3]);}
 // Static tree silhouettes are batched into four draws rather than hundreds.
 const trees=w.group.children.filter(o=>o.userData.tree),batches=new Map();w.group.updateMatrixWorld(true);
 for(const t of trees){t.traverse(o=>{if(o.isMesh){const key=o.geometry.uuid+o.material.uuid;if(!batches.has(key))batches.set(key,{geometry:o.geometry,material:o.material,matrices:[]});batches.get(key).matrices.push(o.matrixWorld.clone());}});t.visible=false;}
 for(const b of batches.values()){const instances=new T.InstancedMesh(b.geometry,b.material,b.matrices.length);b.matrices.forEach((m,i)=>instances.setMatrixAt(i,m));w.group.add(instances);}
 const motes=[],moteColors=[];
for(let i=0;i<300;i++){motes.push((rand()-.5)*65,.5+rand()*12,(rand()-.5)*65);const c=new T.Color(i%3===0?'#ffe4ad':'#90dac4');moteColors.push(c.r,c.g,c.b);}
 const mg=new T.BufferGeometry();mg.setAttribute('position',new T.Float32BufferAttribute(motes,3));mg.setAttribute('color',new T.Float32BufferAttribute(moteColors,3));const fireflies=new T.Points(mg,new T.PointsMaterial({size:.07,vertexColors:true,transparent:true,opacity:.8,blending:T.AdditiveBlending,depthWrite:false}));w.group.add(fireflies);
 w.relays=[];
 game.relayCells.forEach(([x,z],i)=>{const p=toWorld(x,z),g=new T.Group();g.position.copy(p);w.group.add(g);cylinder(g,'#8a9c7c',0,.3,0,.65,.95,.6,8);
 const crystal=mesh(g,new T.OctahedronGeometry(.42),'#e7c68a',0,1.5,0,1),halo=ring(g,'#eac58a',0,1.5,0,.75,.025);const gl=glow(g,'#f9d79f',0,1.5,0,3.2);
 const l=label('FIL '+['I','II','III'][i],'#e4d1a4',2.3);l.position.y=2.65;g.add(l);
 crystal.material=crystal.material.clone();const item=interaction(w,'relay'+i,g,'MANTÉN ACCIÓ · FIL '+(i+1),'hold');item.crystal=crystal;item.glow=gl;item.cell=[x,z];w.relays.push(item);
 w.animated.push((t,p)=>{crystal.rotation.y=t*.55;crystal.position.y=1.5+Math.sin(t*1.6+i)*.16;halo.rotation.y=t*.4;gl.material.opacity=game.relays.includes(i)?.6:.3+p*.25;crystal.material.emissiveIntensity=game.relays.includes(i)?1.8:.3+p*.5;});});
 const cp=toWorld(9,9),coreGroup=new T.Group();coreGroup.position.copy(cp);w.group.add(coreGroup);cylinder(coreGroup,'#849682',0,.15,0,1.1,1.3,.3,8);
 const coreMesh=mesh(coreGroup,new T.IcosahedronGeometry(.45,1),'#95eff0',0,1.5,0,2),coreHalo=ring(coreGroup,'#b2efdd',0,1.5,0,.8,.02),coreLight=glow(coreGroup,'#9be4ec',0,1.5,0,4);
 const cl=label('EL NUCLI','#bcebe1',2.5);cl.position.y=2.7;coreGroup.add(cl);w.core=interaction(w,'core',coreGroup,'RECULL EL NUCLI');w.core.mesh=coreMesh;w.core.glow=coreLight;
 w.portal=portal(w,cp.x,cp.z);w.portal.node.position.z-=1.1;w.portal.node.scale.setScalar(.5);w.portal.node.visible=false;
 w.animated.push((t,p)=>{coreMesh.rotation.set(t*.2,t*.4,t*.12);coreMesh.visible=game.relays.length===3&&!game.core;coreHalo.visible=coreMesh.visible;coreLight.visible=coreMesh.visible;w.portal.node.visible=game.core;w.portal.active=game.core;fireflies.rotation.y=Math.sin(t*.04)*.02;});
 w.bounds=43;return w;
}
export function space(){
 const w=env();w.background='#070d20';w.fog=.001;w.spawn.set(0,0,0);w.gate=null;w.drones=[];w.rocks=[];
 const black=sphere(w.group,'#02040a',0,15,-240,32);const halo=ring(w.group,'#efb07c',0,15,-238,33,.28);const disk=new T.Group();disk.position.set(0,15,-240);disk.rotation.x=1.24;disk.rotation.z=.2;w.group.add(disk);
 for(let i=0;i<12;i++)ring(disk,['#fbd8a0','#c1775a','#ffbc85'][i%3],0,0,0,34+i*2.3,.15+rand()*.17);
 const positions=[],colors=[];for(let i=0;i<6000;i++){let a=rand()*Math.PI*2,r=35+rand()*30;positions.push(Math.cos(a)*r,Math.sin(a)*r,(rand()-.5)*.2);const c=new T.Color().setHSL(.05+rand()*.05,.7,.35+rand()*.5);colors.push(c.r,c.g,c.b);}
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.setAttribute('color',new T.Float32BufferAttribute(colors,3));const ps=new T.Points(g,new T.PointsMaterial({size:.35,vertexColors:true,blending:T.AdditiveBlending,transparent:true,depthWrite:false}));disk.add(ps);
 const gate=new T.Group();w.group.add(gate);const outer=ring(gate,'#87e2e2',0,0,0,5.9,.18),inner=ring(gate,'#d2f8ed',0,0,0,5.4,.045);
 for(let i=0;i<12;i++){const a=i/12*Math.PI*2;const fin=box(gate,'#385878',Math.cos(a)*6.2,Math.sin(a)*6.2,0,.35,.9,.55);fin.rotation.z=a-Math.PI/2;}
 const text=label('VECTOR DE RETORN','#c4f9ee',10);text.position.y=8;gate.add(text);w.gate=gate;w.gateOuter=outer;
 for(let i=0;i<12;i++){const a=new T.Group();a.position.set((rand()-.5)*60,(rand()-.5)*35,-30-rand()*200);const rock=mesh(a,new T.IcosahedronGeometry(1,0),'#566173');rock.scale.set(1+rand()*2,.7+rand(),1+rand());w.group.add(a);w.rocks.push(a);}
 for(let i=0;i<3;i++){const d=new T.Group();box(d,'#394d70',0,0,0,1.3,.7,.9);box(d,'#708bc0',0,0,.1,3,.15,.4);sphere(d,'#fa9381',0,0,.55,.2,2);d.position.set((i-1)*5,1.6,-24-i*10);w.group.add(d);w.drones.push(d);}
 const flightStars=new Float32Array(600*3);for(let i=0;i<600;i++){flightStars[i*3]=(rand()-.5)*180;flightStars[i*3+1]=(rand()-.5)*100;flightStars[i*3+2]=-rand()*200;}
 const fg=new T.BufferGeometry();fg.setAttribute('position',new T.BufferAttribute(flightStars,3));w.speedStars=new T.Points(fg,new T.PointsMaterial({color:'#c4e7ff',size:.12}));w.group.add(w.speedStars);
 w.animated.push((t,p,dt)=>{disk.rotation.z=t*.05;outer.material.emissiveIntensity=1+p*1.6;inner.rotation.z=t*.1;ps.rotation.z=t*.08;w.rocks.forEach((r,i)=>{r.rotation.x=t*.1+i;r.rotation.z=t*.08;});for(let i=0;i<600;i++){flightStars[i*3+2]+=dt*20;if(flightStars[i*3+2]>10)flightStars[i*3+2]=-200;}fg.attributes.position.needsUpdate=true;});
 return w;
}
export function cockpit(){
 const g=new T.Group();g.position.y=.45;
 box(g,'#142b3a',0,0,-1.55,2.5,.6,1.3);box(g,'#263d4a',0,.35,-1.25,2.2,.18,.7);
 for(const s of [-1,1]){const beam=box(g,'#304955',s*1.35,1.2,-1.7,.075,2.6,.1);beam.rotation.z=s*.28;box(g,'#2e4852',s*1.1,.15,-.4,.3,.7,2.5);}
 const console=label('FALCON-X   /   NUCLI MERIDIÀ CONNECTAT','#a8eee5',1.8);console.position.set(0,.47,-1.23);console.material.depthTest=false;g.add(console);
 for(let i=-3;i<=3;i++){const p=box(g,i%2===0?'#79e6d7':'#e8bb83',i*.24,.46,-1.02,.1,.025,.12,1.5);}
 return g;
}
export function sky(scene){
 const group=new T.Group();scene.add(group);
 const skyMesh=new T.Mesh(new T.SphereGeometry(400,32,16),new T.ShaderMaterial({side:T.BackSide,depthWrite:false,uniforms:{top:{value:new T.Color('#4b7d98')},bottom:{value:new T.Color('#f2cc98')},night:{value:0},time:{value:0}},vertexShader:'varying vec3 v;void main(){v=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:'varying vec3 v;uniform vec3 top;uniform vec3 bottom;uniform float night;uniform float time;void main(){float h=normalize(v).y;vec3 day=mix(bottom,top,smoothstep(-.15,.65,h));vec3 n=mix(vec3(.12,.23,.27),vec3(.018,.035,.09),smoothstep(-.2,.6,h));float band=sin(normalize(v).x*8.+time*.03)*.02;gl_FragColor=vec4(mix(day,n,night)+band,1.);}'}));group.add(skyMesh);
 const sun=sphere(group,'#ffd9a8',100,38,-180,18,1.2),sunGlow=glow(group,'#ffe3b6',100,38,-180,130);sun.material=new T.MeshBasicMaterial({color:'#ffe4ac',toneMapped:false});
 const starPos=[];for(let i=0;i<2000;i++){let a=rand()*Math.PI*2,b=Math.acos(rand()*2-1),r=270;starPos.push(Math.sin(b)*Math.cos(a)*r,Math.cos(b)*r,Math.sin(b)*Math.sin(a)*r);}
 const sg=new T.BufferGeometry();sg.setAttribute('position',new T.Float32BufferAttribute(starPos,3));const stars=new T.Points(sg,new T.PointsMaterial({color:'#e2efff',size:.65,transparent:true,opacity:0,depthWrite:false}));group.add(stars);
 // Ocean around the village.
 const sea=new T.Mesh(new T.PlaneGeometry(700,700,80,80),new T.ShaderMaterial({transparent:true,uniforms:{time:{value:0},dark:{value:0}},vertexShader:'uniform float time;varying vec3 v;void main(){vec3 p=position;p.z+=sin(p.x*.12+time*.4)*.5+sin(p.y*.08+time*.3)*.5;v=p;gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);}',fragmentShader:'uniform float time;uniform float dark;varying vec3 v;void main(){float wave=sin(v.x*.3+v.y*.2+time)*.5+.5;vec3 col=mix(vec3(.20,.40,.46),vec3(.49,.68,.65),pow(wave,18.)*.5);gl_FragColor=vec4(mix(col,col*.3,dark),.92);}'}));sea.rotation.x=-Math.PI/2;sea.position.y=-2;group.add(sea);
 return {group,skyMesh,sun,sunGlow,stars,sea,update(t,chapter){const n=chapter==='village'?0:chapter==='home'?.7:1;skyMesh.material.uniforms.night.value=n;skyMesh.material.uniforms.time.value=t;sea.visible=chapter==='village'||chapter==='home';sea.material.uniforms.time.value=t;sea.material.uniforms.dark.value=n;sun.visible=chapter==='village';sunGlow.visible=sun.visible;stars.material.opacity=n*.9;}};
}
