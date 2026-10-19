import {test,expect} from '@playwright/test';
test('3D, soundtrack, puzzle, movement, maze relays and connected transition',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/');await expect(page.locator('#graphics-error')).toBeHidden();
 await page.screenshot({path:'test-results/01-village-intro.png'});
 await page.getByRole('button',{name:'COMENÇA LA HISTÒRIA'}).click();
 await expect(page.locator('#hud')).toBeVisible();await expect(page.locator('#objective')).toContainText('campanes');
 await page.getByRole('button',{name:'Pausa i opcions'}).click();await page.getByRole('button',{name:'Navegació assistida'}).click();await page.getByRole('button',{name:'TORNA A LA HISTÒRIA'}).click();
 // All movement and actions use public controls; the test never changes game state.
 async function approach(id,label){await page.locator('[data-object="'+id+'"]').click();await expect(page.locator('#target-label')).toContainText(label,{timeout:60000});await expect(page.locator('#action')).toHaveAttribute('data-ready','true',{timeout:60000});}
 async function tap(id,label){await approach(id,label);await page.locator('[data-object="'+id+'"]').click();}
 await tap('sun','SOL');await expect(page.locator('#objective')).toContainText('1/3');
 await tap('wave','ONA');await expect(page.locator('#objective')).toContainText('2/3');
 await tap('moon','LLUNA');await expect(page.locator('#key-status')).toContainText('◆');
 await page.screenshot({path:'test-results/02-key-awake.png'});
 await tap('portal','ESQUERDA');
 await expect(page.locator('#chapter-label')).toContainText('ACTE II',{timeout:30000});await expect(page.locator('#transition')).toBeHidden({timeout:20000});
 await page.getByRole('button',{name:'Pista i ruta'}).click();
 await page.screenshot({path:'test-results/03-maze.png'});
 for(let i=0;i<3;i++){await approach('relay'+i,'FIL '+(i+1));await page.keyboard.down('e');await page.waitForTimeout(1800);await page.keyboard.up('e');}
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
 await page.getByRole('button',{name:'Pista i ruta'}).tap();await expect(page.locator('#dialogue')).toContainText('Sol, ona, lluna');await context.close();
});
