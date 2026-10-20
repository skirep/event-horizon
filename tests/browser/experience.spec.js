import {test,expect} from '@playwright/test';
test('3D, soundtrack, puzzle, movement, maze relays and connected transition',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/');await expect(page.locator('#graphics-error')).toBeHidden();
 await page.screenshot({timeout:60000,path:'test-results/01-village-intro.png'});
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
 await page.screenshot({timeout:60000,path:'test-results/02-key-awake.png'});
 await tap('portal','ESQUERDA');
 await expect(page.locator('#chapter-label')).toContainText('ACTE II',{timeout:30000});await expect(page.locator('#transition')).toBeHidden({timeout:20000});
 await page.getByRole('button',{name:'Pista i ruta'}).click();
 await page.screenshot({timeout:60000,path:'test-results/03-maze.png'});
 for(let i=0;i<3;i++){await approach('relay'+i,'FIL '+(i+1));await page.keyboard.down('e');await expect(page.locator('[data-object="relay'+i+'"]')).toHaveCount(0,{timeout:20000});await page.keyboard.up('e');}
 await expect(page.locator('#objective')).toContainText('Recull el nucli');await tap('core','NUCLI');
 await expect(page.locator('#core-status')).toContainText('●');
 await tap('portal','ESQUERDA');await expect(page.locator('#chapter-label')).toContainText('ACTE III',{timeout:30000});await expect(page.locator('#transition')).toBeHidden({timeout:20000});
 await page.screenshot({timeout:60000,path:'test-results/04-flight.png'});
 await page.keyboard.press('Space');
 await expect(page.locator('#gate-count')).toContainText('ANELL 2',{timeout:90000});
 // Fly using the same visible guidance as a player, independently of frame rate.
 async function align(){
  for(const [axis,choices]of [['horizontal',{right:'d',left:'a'}],['vertical',{up:'w',down:'s'}]]){
   const indicator=page.locator('#flight-guidance');
   for(let n=0;n<4;n++){
    const direction=await indicator.getAttribute('data-'+axis);if(direction==='aligned')break;const key=choices[direction];expect(key).toBeTruthy();await page.keyboard.down(key);
    await expect(indicator).not.toHaveAttribute('data-'+axis,direction,{timeout:20000});await page.keyboard.up(key);
   }
  }
 }
 await align();await expect(page.locator('#gate-count')).toContainText('ANELL 3',{timeout:90000});
 await align();
 await expect(page.locator('#chapter-label')).toContainText('EPÍLEG',{timeout:90000});await expect(page.locator('#transition')).toBeHidden({timeout:20000});
 await tap('clock','NUCLI');await expect(page.locator('#ending')).toBeVisible({timeout:10000});
 await page.screenshot({timeout:60000,path:'test-results/06-ending.png'});
 expect(errors).toEqual([]);
});
test('mobile layout keeps the controls visible and accepts touch input',async({browser})=>{
 const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});const page=await context.newPage();
 await page.goto('/');await page.getByRole('button',{name:'COMENÇA LA HISTÒRIA'}).tap();await expect(page.locator('#move-pad')).toBeVisible();await expect(page.locator('#action')).toBeVisible();await page.screenshot({timeout:60000,path:'test-results/05-mobile.png'});
 await page.getByRole('button',{name:'Pista i ruta'}).tap();await expect(page.locator('#dialogue')).toContainText('Sol, ona, lluna');await page.reload();await page.getByRole('button',{name:'PART II · CASTELL I PIRATES'}).tap();await expect(page.locator('#chapter-label')).toContainText('CASTELL',{timeout:60000});await expect(page.locator('#transition')).toBeHidden({timeout:30000});await expect(page.locator('#move-pad')).toBeVisible();await page.screenshot({timeout:60000,path:'test-results/12-mobile-castle.png'});await context.close();
});

