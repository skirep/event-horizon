import {test,expect} from '@playwright/test';
test('3D, soundtrack, puzzle, movement, maze relays and connected transition',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/');await expect(page.locator('#graphics-error')).toBeHidden();
 await page.screenshot({path:'test-results/01-village-intro.png'});
 await page.getByRole('button',{name:'COMENÇA LA HISTÒRIA'}).click();
 await expect(page.locator('#hud')).toBeVisible();await expect(page.locator('#objective')).toContainText('campanes');
 await page.getByRole('button',{name:'Pausa i opcions'}).click();await page.getByRole('button',{name:'Navegació assistida'}).click();await page.getByRole('button',{name:'TORNA A LA HISTÒRIA'}).click();
 // All movement and actions use public controls; the test never changes game state.
 async function approach(id,label){await page.locator('[data-object="'+id+'"]').click();await expect(page.locator('[data-object="'+id+'"]')).toHaveAttribute('data-ready','true',{timeout:120000});}
 async function tap(id,label){
  const b=page.locator('[data-object="'+id+'"]'),before=await page.locator('#objective').textContent();
  await b.click();
  await expect.poll(async()=>{if(await b.count()===0||await page.locator('#objective').textContent()!==before)return 'done';return await b.getAttribute('data-ready')==='true'?'ready':'walking';},{timeout:120000}).not.toBe('walking');
  if(await b.count()>0&&await page.locator('#objective').textContent()===before)await b.click();
 }
 await tap('sun','SOL');await expect(page.locator('#objective')).toContainText('1/3');
 await tap('wave','ONA');await expect(page.locator('#objective')).toContainText('2/3');
 await tap('moon','LLUNA');await expect(page.locator('#key-status')).toContainText('◆');
 await page.screenshot({path:'test-results/02-key-awake.png'});
 await tap('portal','ESQUERDA');
 await expect(page.locator('#chapter-label')).toContainText('ACTE II',{timeout:30000});await expect(page.locator('#transition')).toBeHidden({timeout:20000});
 await page.getByRole('button',{name:'Pista i ruta'}).click();
 await page.screenshot({path:'test-results/03-maze.png'});
 for(let i=0;i<3;i++){await approach('relay'+i,'FIL '+(i+1));await page.keyboard.down('e');await expect(page.locator('[data-object="relay'+i+'"]')).toHaveCount(0,{timeout:20000});await page.keyboard.up('e');}
 await expect(page.locator('#objective')).toContainText('Recull el nucli');await tap('core','NUCLI');
 await expect(page.locator('#core-status')).toContainText('●');
 await tap('portal','ESQUERDA');await expect(page.locator('#chapter-label')).toContainText('ACTE III',{timeout:30000});await expect(page.locator('#transition')).toBeHidden({timeout:20000});
 await page.screenshot({path:'test-results/04-flight.png'});
 await page.keyboard.press('Space');
 await expect(page.locator('#gate-count')).toContainText('ANELL 2',{timeout:30000});
 await page.keyboard.down('d');await page.keyboard.down('w');await page.waitForTimeout(400);await page.keyboard.up('d');await page.keyboard.up('w');
 await expect(page.locator('#gate-count')).toContainText('ANELL 3',{timeout:30000});
 await page.keyboard.down('a');await page.waitForTimeout(600);await page.keyboard.up('a');
 await expect(page.locator('#chapter-label')).toContainText('EPÍLEG',{timeout:30000});await expect(page.locator('#transition')).toBeHidden({timeout:20000});
 await tap('clock','NUCLI');await expect(page.locator('#ending')).toBeVisible({timeout:10000});
 await page.screenshot({path:'test-results/06-ending.png'});
 expect(errors).toEqual([]);
});
test('mobile layout keeps the controls visible and accepts touch input',async({browser})=>{
 const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});const page=await context.newPage();
 await page.goto('/');await page.getByRole('button',{name:'COMENÇA LA HISTÒRIA'}).tap();await expect(page.locator('#move-pad')).toBeVisible();await expect(page.locator('#action')).toBeVisible();await page.screenshot({path:'test-results/05-mobile.png'});
 await page.getByRole('button',{name:'Pista i ruta'}).tap();await expect(page.locator('#dialogue')).toContainText('Sol, ona, lluna');await page.reload();await page.getByRole('button',{name:'PART II · CASTELL I PIRATES'}).tap();await expect(page.locator('#chapter-label')).toContainText('CASTELL',{timeout:60000});await expect(page.locator('#transition')).toBeHidden({timeout:30000});await expect(page.locator('#move-pad')).toBeVisible();await page.screenshot({path:'test-results/12-mobile-castle.png'});await context.close();
});

test('Part II: castle seals, chart, boarding, witty replies and timed sword parries',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/');await page.getByRole('button',{name:'PART II · CASTELL I PIRATES'}).click();
 await expect(page.locator('#chapter-label')).toContainText('CASTELL',{timeout:60000});await expect(page.locator('#transition')).toBeHidden({timeout:30000});
 await page.screenshot({path:'test-results/07-castle.png'});
 await page.locator('#menu').click();await page.locator('#assist').click();await page.locator('#resume').click();
 async function near(id){const b=page.locator('[data-object="'+id+'"]');if(await b.getAttribute('data-ready')!=='true'){await b.click();await expect(b).toHaveAttribute('data-ready','true',{timeout:90000});}return b;}
 for(const [i,n]of [[0,1],[1,3],[2,2]]){const b=await near('dial'+i);for(let k=0;k<n;k++){const before=await page.locator('#objective').textContent();await b.click();await expect(page.locator('#objective')).not.toHaveText(before);}}
 await page.screenshot({path:'test-results/08-castle-seals.png'});
 await (await near('chart')).click();await expect(page.locator('#objective')).toContainText('Embarca');
 await (await near('embark')).click();await expect(page.locator('#chapter-label')).toContainText('ACER',{timeout:30000});await expect(page.locator('#transition')).toBeHidden({timeout:20000});
 await page.screenshot({path:'test-results/09-pirate-deck.png'});
 for(let round=0;round<3;round++){
  await (await near('captain')).click();await expect(page.locator('#duel')).toBeVisible();
  const replies=['I, tot i així, ja t’he fet empassar les paraules.','Doncs avui provaràs de nedar millor que ells.','És que reconeixen un peix massa passat.'];
  if(round===0)await page.screenshot({path:'test-results/13-sword-duel.png'});
  await page.locator('#duel-answers button').filter({hasText:replies[round]}).click();
  await expect(page.locator('#parry')).toHaveAttribute('data-ready','true',{timeout:10000});
  // Public timing button, same action as E/touch/Quest trigger.
  await page.locator('#parry').click();await expect(page.locator('#objective')).toContainText(round===2?'Pren el timó':(round+1)+'/3');
 }
 await page.screenshot({path:'test-results/10-duel-won.png'});
 await (await near('helm')).click();await expect(page.locator('#ending')).toBeVisible({timeout:10000});await expect(page.locator('#ending h1')).toContainText('El mar no oblida');
 await page.screenshot({path:'test-results/11-sequel-ending.png'});expect(errors).toEqual([]);
});
