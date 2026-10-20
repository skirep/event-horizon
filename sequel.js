/** Original dialogue and mechanics. No borrowed Monkey Island lines or music. */
export const GLYPHS=['◇','☀','≈','☾'];
export const INSULTS=[
 {attack:'La teva espasa té menys tall que una cullera de sopa.',reply:'I, tot i així, ja t’he fet empassar les paraules.',wrong:['Les culleres són més barates.','No m’agrada la sopa.']},
 {attack:'He enfonsat capitans que navegaven millor que tu!',reply:'Doncs avui provaràs de nedar millor que ells.',wrong:['El meu vaixell és més gran.','Jo navego els diumenges.']},
 {attack:'Quan veuen la meva bandera, fins i tot els taurons fugen.',reply:'És que reconeixen un peix massa passat.',wrong:['Jo també tinc una bandera.','Els taurons no saben llegir.']},
 {attack:'El meu nom fa tremolar tots els ports del Carib.',reply:'Normal: encara els deus totes les reparacions.',wrong:['El meu nom és més curt.','A mi em tremolen les botes.']},
 {attack:'Amb aquesta guàrdia no arribaries ni a grumet.',reply:'Millor: així no hauré de seguir les teves ordres.',wrong:['Tinc una altra guàrdia a casa.','On es compra un grumet?']}
];
export function optionsFor(round){const q=INSULTS[round%INSULTS.length],a=[q.reply,...q.wrong];const shift=round%3;return a.slice(shift).concat(a.slice(0,shift));}
export function installSequel(j){j.dials=[0,0,0];j.chart=false;j.duelRound=0;j.duelWins=0;j.duelLife=3;j.duelPhase='idle';j.sequelComplete=false;}
export function startSequel(j,recap=false){if(!recap&&!j.completed)return false;j.started=true;j.key=true;j.core=true;j.relays=[0,1,2];j.gates=3;j.completed=false;j.stage='castle';j.emit('stage',{stage:'castle'});j.say('ECO: El segon recuperat amaga una altra memòria. La clau encaixa al castell de les Marees. Troba la carta nàutica: el seu mar encara espera un capità.');return true;}
export function sequelInteract(j,id){
 if(j.stage==='castle'){
  if(/^dial[0-2]$/.test(id)&&!j.chart){const i=+id.at(-1);j.dials[i]=(j.dials[i]+1)%4;j.emit('dial',{index:i});j.say('Inscripció: «La torre es desperta amb el SOL. El port espera la LLUNA. La mar respon a l’ONA.»');return true;}
  if(id==='chart'){if(j.dials.join()!=='1,3,2'){j.say('ECO: El mecanisme continua tancat. Gira els tres segells: torre, port i mar. La inscripció diu l’ordre.');return false;}j.chart=true;j.emit('chart');j.say('ECO: La carta de marees! La clau s’ha convertit en una brúixola. La poterna del moll acaba d’obrir-se.');return true;}
  if(id==='embark'&&j.chart){j.stage='pirate';j.emit('stage',{stage:'pirate'});j.say('CAPITANA SALMORRA: Aquí, una espasa sense enginy només serveix per untar mantega. Tres bones rèpliques i tres parades. Aleshores, el timó serà teu.');return true;}
 }
 if(j.stage==='pirate'){
  if(id==='captain'&&j.duelWins<3&&j.duelPhase==='idle'){j.duelPhase='reply';j.emit('duel');j.say('SALMORRA: '+INSULTS[j.duelRound%INSULTS.length].attack);return true;}
  if(id.startsWith('reply')&&j.duelPhase==='reply')return chooseReply(j,+id.at(-1));
  if(id==='helm'&&j.duelWins>=3){j.completed=true;j.sequelComplete=true;j.emit('ending');j.say('SALMORRA: Tens llengua, canell i una carta impossible. Benvingut a bord, capità del segon que faltava.');return true;}
 }
 return false;
}
export function chooseReply(j,index){if(j.duelPhase!=='reply'||![0,1,2].includes(index))return false;const q=INSULTS[j.duelRound%INSULTS.length];if(optionsFor(j.duelRound)[index]!==q.reply){j.duelLife--;j.emit('duelHit');j.say('SALMORRA: La resposta era: «'+q.reply+'» Torna-ho a intentar.');j.duelPhase='idle';j.duelRound++;if(j.duelLife<=0){j.duelLife=3;j.say('SALMORRA: Respirarem una mica. Conserves els intercanvis guanyats. Torna quan tinguis una rèplica més esmolada.');}return false;}j.duelPhase='parry';j.say('Bona rèplica. Ara observa l’espasa: PARA quan el senyal sigui daurat. E, ACCIÓ o gallet.');j.emit('parryReady');return true;}
export function resolveParry(j,success){if(j.duelPhase!=='parry')return false;j.duelPhase='idle';j.duelRound++;if(success){j.duelWins++;j.emit('parryWin');j.say(j.duelWins>=3?'SALMORRA: Touché! El timó és teu. Porta la carta fins a la roda i marca el rumb.':'SALMORRA: Aquesta l’has guanyada. Però encara em queden paraules! '+j.duelWins+' de 3 intercanvis.');}else{j.duelLife--;j.emit('duelHit');j.say('SALMORRA: Has parat fora de temps. Espera que el senyal sigui daurat. Torna a desafiar-me.');if(j.duelLife<=0)j.duelLife=3;}return success;}
