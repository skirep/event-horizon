import {test,expect} from '@playwright/test';
test('Part II: castle, native 2D pixel-art duel, touch controls, parries and ending',async({page,browser})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/');await page.getByRole('button',{name:'PART II · CASTELL I PIRATES'}).click();
 await expect(page.locator('#chapter-label')).toContainText('CASTELL',{timeout:60000});await expect(page.locator('#transition')).toBeHidden({timeout:30000});
 await page.screenshot({timeout:60000,path:'test-results/07-castle.png'});
 await page.locator('#menu').click();await page.locator('#assist').click();await page.locator('#resume').click();
 async function near(id){const b=page.locator('[data-object="'+id+'"]');if(await b.getAttribute('data-ready')!=='true'){await b.click();await expect(b).toHaveAttribute('data-ready','true',{timeout:90000});}return b;}
 for(const [i,n]of [[0,1],[1,3],[2,2]]){const b=await near('dial'+i);for(let k=0;k<n;k++){const before=await page.locator('#objective').textContent();await b.click();await expect(page.locator('#objective')).not.toHaveText(before);}}
 await (await near('chart')).click();await expect(page.locator('#objective')).toContainText('Embarca');
 await (await near('embark')).click();await expect(page.locator('#chapter-label')).toContainText('ACER',{timeout:30000});await expect(page.locator('#transition')).toBeHidden({timeout:20000});
 const art=page.locator('#pirate-pixels');
 await expect(art).toBeVisible();await expect(art).toHaveAttribute('data-renderer','2d-pixel-art');
 await expect(page.locator('#move-pad')).toBeHidden();
 const pixels=await art.evaluate(c=>{const a=c.getContext('2d').getImageData(0,0,c.width,c.height).data,s=new Set();for(let i=0;i<a.length;i+=16)s.add(a[i]+','+a[i+1]+','+a[i+2]);return {colors:s.size,width:c.width,height:c.height};});
 expect(pixels.colors).toBeGreaterThan(40);expect(pixels.width).toBeGreaterThan(300);
 await page.screenshot({timeout:60000,path:'test-results/09-pirate-pixel-art.png'});
 // Resume genuine, publicly earned progress on a touch browser profile.
 const profile=await page.context().storageState();
 const mobile=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,storageState:profile});
 const phone=await mobile.newPage();phone.on('pageerror',e=>errors.push(e.message));await phone.goto('/');await phone.locator('#continue').tap();
 await expect(phone.locator('#pirate-pixels')).toBeVisible({timeout:60000});
 await phone.locator('#pixel-challenge').tap();await expect(phone.locator('#duel')).toBeVisible();
 const box=await phone.locator('#duel').boundingBox();expect(box.x).toBeGreaterThanOrEqual(0);expect(box.x+box.width).toBeLessThanOrEqual(390);
 await phone.screenshot({timeout:60000,path:'test-results/14-pirate-pixel-mobile.png'});
 await phone.locator('#duel-answers button').filter({hasText:'I, tot i així, ja t’he fet empassar les paraules.'}).tap();
 await expect(phone.locator('#parry')).toHaveAttribute('data-ready','true',{timeout:12000});
 const p=await phone.locator('#parry').boundingBox();await phone.touchscreen.tap(p.x+p.width/2,p.y+p.height/2);
 await expect(phone.locator('#pixel-objective')).toContainText('1/3');await mobile.close();await page.bringToFront();
 if(await page.locator('#pause').isVisible())await page.locator('#resume').click();
 const replies=['I, tot i així, ja t’he fet empassar les paraules.','Doncs avui provaràs de nedar millor que ells.','És que reconeixen un peix massa passat.'];
 for(let round=0;round<3;round++){
  await page.locator('#pixel-challenge').click();await expect(page.locator('#duel')).toBeVisible();
  if(round===0)await page.screenshot({timeout:60000,path:'test-results/13-pixel-sword-duel.png'});
  await page.locator('#duel-answers button').filter({hasText:replies[round]}).click();
  await expect(page.locator('#parry')).toHaveAttribute('data-ready','true',{timeout:12000});
  if(round===0){const b=await page.locator('#parry').boundingBox();await page.mouse.click(b.x+b.width/2,b.y+b.height/2);}else await page.keyboard.press('e');
  await expect(page.locator('#pixel-objective')).toContainText(round===2?'Pren el timó':(round+1)+'/3');
 }
 await page.screenshot({timeout:60000,path:'test-results/10-pixel-duel-won.png'});
 await page.locator('#pixel-helm').click();await expect(page.locator('#ending')).toBeVisible({timeout:10000});await expect(page.locator('#ending h1')).toContainText('El mar no oblida');
 await page.screenshot({timeout:60000,path:'test-results/11-pixel-sequel-ending.png'});expect(errors).toEqual([]);
});
