/** Pure adventure state; renderers/controllers never advance chapters directly. */
export const BELL_ORDER=['sun','wave','moon'];
export const SYMBOLS={sun:'☀',wave:'≈',moon:'☾'};
export const STAGES=['village','maze','flight','home'];
export function createMaze(seed=4815,size=11){
 const cells=Array.from({length:size},()=>Array(size).fill(1));
 let s=seed>>>0;const random=()=>{s=(1664525*s+1013904223)>>>0;return s/4294967296;};
 function visit(x,z){cells[z][x]=0;const dirs=[[2,0],[-2,0],[0,2],[0,-2]];for(let i=3;i>0;i--){const j=Math.floor(random()*(i+1));[dirs[i],dirs[j]]=[dirs[j],dirs[i]];}
 for(const [dx,dz]of dirs){const nx=x+dx,nz=z+dz;if(nx>0&&nz>0&&nx<size-1&&nz<size-1&&cells[nz][nx]){cells[z+dz/2][x+dx/2]=0;visit(nx,nz);}}}visit(1,1);return cells;
}
export function mazePath(cells,start,end){
 const queue=[start],parents=new Map([[start.join(','),null]]);let head=0;
 while(head<queue.length){const [x,z]=queue[head++];if(x===end[0]&&z===end[1]){let c=[x,z],path=[];while(c){path.push(c);c=parents.get(c.join(','));}return path.reverse();}
 for(const [dx,dz]of [[1,0],[-1,0],[0,1],[0,-1]]){const a=x+dx,b=z+dz,k=a+','+b;if(cells[b]?.[a]===0&&!parents.has(k)){parents.set(k,[x,z]);queue.push([a,b]);}}}return [];
}
export class Journey{
 constructor(){this.stage='village';this.started=false;this.bells=[];this.key=false;this.relays=[];this.core=false;this.gates=0;this.shield=100;this.deaths=0;this.completed=false;this.elapsed=0;this.message='Un segon ha desaparegut del rellotge de Cabrils. I s’ha endut el camí de tornada.';this.events=[];this.maze=createMaze();this.relayCells=[[3,1],[7,5],[9,7]];this.coreCell=[9,9];this.checkpoint=0;}
 emit(type,data={}){this.events.push({type,...data});}
 say(text){this.message=text;this.emit('message',{text});}
 begin(){if(this.started)return;this.started=true;this.emit('begin');this.say('ECO: El rellotge parla amb símbols. Mira la inscripció: sol, ona, lluna. Fes sonar les tres campanes en aquest ordre.');}
 interact(id){
 if(!this.started)return false;
 if(this.stage==='village'){
 if(BELL_ORDER.includes(id)&&!this.key){if(id===BELL_ORDER[this.bells.length]){this.bells.push(id);this.emit('bell',{id,correct:true});if(this.bells.length===3){this.key=true;this.emit('key');this.say('ECO: Has despertat la clau meridiana. L’esquerda s’ha obert: travessa el cercle de llum de la plaça.');}else this.say('ECO: Aquesta nota encaixa. '+this.bells.length+' de 3.');return true;}
 this.bells=[];this.emit('bell',{id,correct:false});this.say('ECO: L’ordre s’ha desfet. La pedra diu: SOL → ONA → LLUNA. Torna a començar.');return false;}
 if(id==='portal'){if(!this.key){this.say('ECO: El portal encara no reconeix la clau. Primer, les campanes.');return false;}this.advance('maze');return true;}
 }
 if(this.stage==='maze'){
 if(id.startsWith('relay')){const i=Number(id.slice(-1));if(this.relays.includes(i))return false;this.relays.push(i);this.emit('relay',{index:i});this.say(this.relays.length===3?'ECO: Els tres fils s’han reconnectat. El nucli ja és visible al santuari. Recull-lo.':'ECO: La clau ha reconnectat un fil del temps. '+this.relays.length+' de 3. Segueix buscant les balises daurades.');return true;}
 if(id==='core'){if(this.relays.length!==3){this.say('ECO: El nucli està bloquejat pels tres fils del laberint. Carrega les balises mantenint ACCIÓ.');return false;}this.core=true;this.emit('core');this.say('ECO: Ja el tenim. La mateixa clau ha convertit el santuari en una porta d’embarcament. Travessa-la.');return true;}
 if(id==='portal'){if(!this.core){this.say('ECO: No marxarem sense el nucli. Encara és aquí dins.');return false;}this.advance('flight');return true;}
 }
 if(this.stage==='home'&&id==='clock'){this.completed=true;this.emit('ending');this.say('ECO: El segon ha tornat. El rellotge torna a bategar. I tu recordes un lloc que encara no existeix.');return true;}
 return false;
 }
 advance(stage){const expected={village:'maze',maze:'flight',flight:'home'}[this.stage];if(stage!==expected)return false;if(stage==='maze'&&!this.key||stage==='flight'&&!this.core||stage==='home'&&this.gates<3)return false;this.stage=stage;this.checkpoint++;this.emit('stage',{stage});if(stage==='maze')this.say('ECO: El segon perdut s’ha convertit en un bosc. Porta la clau a les tres balises. Mantén ACCIÓ per reconnectar cada fil.');if(stage==='flight')this.say('ECO: El nucli alimenta la Falcon. Pilota a través dels tres anells blaus. Els drons són soroll: dispara per fer-los callar.');if(stage==='home')this.say('ECO: Hem tornat. Però el rellotge espera l’última peça. Acosta-t’hi i retorna el nucli.');return true;}
 crossGate(success){if(this.stage!=='flight')return;if(success){this.gates++;this.emit('gate',{index:this.gates});if(this.gates===3)this.advance('home');else this.say('ECO: Coordenades estabilitzades. '+this.gates+' de 3. El següent anell és el camí cap a casa.');}else{this.shield=Math.max(20,this.shield-12);this.emit('damage');this.say('ECO: Hem passat de llarg. Recalculo el mateix anell; no hem perdut el nucli.');}}
 hint(){const text=this.stage==='village'?(this.key?'El portal és al fons de la plaça. Apropa-t’hi i prem ACCIÓ.':'Sol, ona, lluna. Les campanes són al voltant del rellotge. Toca-les o apunta-hi i prem ACCIÓ.'):this.stage==='maze'?(this.core?'Segueix la traça fins al portal del santuari.':'El mapa mostra les balises. La traça verda et guia fins al següent objectiu; mantén ACCIÓ al costat d’una balisa.'):this.stage==='flight'?'Mou la nau amb WASD, fletxes o el joystick. Centra l’anell blau i travessa’l. ACCIÓ dispara.':'Acosta’t al rellotge i prem ACCIÓ per retornar el nucli.';this.say('ECO: '+text);this.emit('hint');return text;}
 objective(){if(this.stage==='village')return this.key?'Travessa el portal de la plaça':'Fes sonar les campanes · '+this.bells.length+'/3';if(this.stage==='maze')return this.core?'Travessa el portal del santuari':this.relays.length===3?'Recull el nucli al santuari':'Reconnecta els fils del laberint · '+this.relays.length+'/3';if(this.stage==='flight')return 'Pilota pels anells de retorn · '+this.gates+'/3';return this.completed?'El segon és teu.':'Retorna el nucli al rellotge';}
 save(){return {version:2,stage:this.stage,key:this.key,core:this.core,relays:[...this.relays],gates:this.gates,elapsed:this.elapsed,completed:this.completed};}
 restore(data){if(data?.version!==2||!STAGES.includes(data.stage))return false;const i=STAGES.indexOf(data.stage);if((i>=1&&!data.key)||(i>=2&&!data.core)||(i>=3&&data.gates!==3))return false;this.stage=data.stage;this.key=!!data.key;this.core=!!data.core;this.relays=[...new Set((data.relays||[]).filter(x=>[0,1,2].includes(x)))];if(i>=2&&this.relays.length!==3)return false;this.gates=Math.max(0,Math.min(3,Number(data.gates)||0));this.elapsed=Math.max(0,Number(data.elapsed)||0);this.completed=!!data.completed&&i===3;this.bells=this.key?[...BELL_ORDER]:[];this.started=true;return true;}
}
