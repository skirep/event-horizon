import test from 'node:test';
import assert from 'node:assert/strict';
import {PixelDuel} from '../pixel-duel.js';
function mockCanvas(){
 let doc;const colors=new Set();let rectangles=0,images=0;
 const context=()=>({fillStyle:'',fillRect(){rectangles++;colors.add(this.fillStyle);},clearRect(){},translate(){},scale(){},save(){},restore(){},drawImage(){images++;},fillText(){},measureText:s=>({width:s.length*7})});
 const canvas=()=>({width:0,height:0,dataset:{},ownerDocument:doc,getContext(){return this.ctx||(this.ctx=context());}});
 doc={createElement:()=>canvas()};return {canvas:canvas(),stats:()=>({rectangles,images,colors:colors.size})};
}
test('pixel-art scene draws desktop, portrait and all combat poses on native 2D canvas',()=>{
 const mock=mockCanvas(),view=new PixelDuel(mock.canvas);
 const state={time:2,phase:'idle',wins:0,life:3,ready:false,vr:false,message:'La carta és a bord.',insult:'Desafia la capitana.',answers:['Resposta primera','Resposta segona','Resposta tercera']};
 for(const dims of [[1280,800,false],[390,844,false],[960,540,true]]){
  view.resize(...dims);
  for(const [phase,ready] of [['idle',false],['reply',false],['parry',false],['parry',true]])view.render({...state,phase,ready,vr:dims[2]});
 }
 view.hit('win');view.render({...state,time:2.1});view.hit('hit');view.render({...state,time:2.2});
 assert.ok(mock.stats().rectangles>10000);assert.ok(mock.stats().images>=20);assert.ok(mock.stats().colors>70);assert.equal(mock.canvas.dataset.renderer,'2d-pixel-art');
});
test('Quest reply regions map controller screen coordinates to the same dialogue actions',()=>{
 const view=new PixelDuel(mockCanvas().canvas);view.resize(960,540,true);
 const state={time:2,phase:'reply',wins:1,life:3,ready:false,vr:true,message:'',insult:'La teva espasa...',answers:['Una','Dues','Tres']};view.render(state);
 for(let i=0;i<3;i++){const b=view.regions.find(r=>r.id==='reply'+i);assert.ok(b);assert.equal(view.commandAt(b.x+5,b.y+5),'reply'+i);}
 assert.equal(view.commandAt(-10,-10),null);
 view.render({...state,phase:'idle',wins:3});assert.ok(view.regions.some(r=>r.id==='helm'));
 view.render({...state,completed:true});assert.equal(view.regions.length,0);
});
