import {test,expect} from '@playwright/test';
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
  if(round===0){const b=await page.locator('#parry').boundingBox();expect(b).not.toBeNull();await page.mouse.click(b.x+b.width/2,b.y+b.height/2);}else await page.keyboard.press('e');await expect(page.locator('#objective')).toContainText(round===2?'Pren el timó':(round+1)+'/3');
 }
 await page.screenshot({path:'test-results/10-duel-won.png'});
 await (await near('helm')).click();await expect(page.locator('#ending')).toBeVisible({timeout:10000});await expect(page.locator('#ending h1')).toContainText('El mar no oblida');
 await page.screenshot({path:'test-results/11-sequel-ending.png'});expect(errors).toEqual([]);
});
