import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright-core';
import {rendrePage} from './rendu.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../../..');
const dest=path.join(root,'cnesst-validation');fs.mkdirSync(dest,{recursive:true});
const executable=process.env.CHROME||['/usr/bin/google-chrome','/usr/bin/chromium','/usr/bin/chromium-browser'].find(x=>fs.existsSync(x));
const browser=await chromium.launch({executablePath:executable,args:['--no-sandbox']});
const html=rendrePage({inline:true});const results=[];
try{
 for(const width of [320,390,800,1280])for(const theme of ['dark','light']){
  const ctx=await browser.newContext({viewport:{width,height:900},hasTouch:width<1000});
  const page=await ctx.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.setContent(html);await page.evaluate(t=>document.documentElement.dataset.theme=t,theme);
  await page.locator('[data-ci-ready]').waitFor();
  for(const view of ['comprendre','echanges','cas']){
   await page.locator(`[data-ci-view="${view}"]`).click();
   const measure=await page.evaluate(()=>({width:innerWidth,scrollWidth:document.documentElement.scrollWidth,smallTargets:[...document.querySelectorAll('.ci-root button,.ci-root summary,.ci-root a')].filter(e=>{const r=e.getBoundingClientRect();return r.width>0&&r.height>0&&r.height<24}).map(e=>e.textContent.trim().slice(0,40))}));
   assert.ok(measure.scrollWidth<=measure.width,`Débordement ${width}/${theme}/${view}`);assert.deepEqual(measure.smallTargets,[]);
   results.push({width,theme,view,...measure});
   if(width===390&&theme==='dark')await page.locator('.ci-root').screenshot({path:path.join(dest,view+'-mobile.png')});
  }
  await page.locator('[data-ci-view="echanges"]').click();
  for(const branch of ['prevention','indemnisation','normes']){
   await page.locator(`[data-ci-branch="${branch}"]`).click();
   const exchanges=await page.locator(`[data-ci-branch-panel="${branch}"] [data-ci-exchange]`).all();
   for(const exchange of exchanges){
    await exchange.locator('summary').click();await page.waitForTimeout(35);
    assert.notEqual(await exchange.getAttribute('open'),null);
    assert.equal(await page.locator(`[data-ci-branch-panel="${branch}"] [data-ci-exchange][open]`).count(),1);
   }
  }
  await page.locator('[data-ci-view="cas"]').click();
  await page.locator('#ci-cas-manutention > summary').click();
  await page.locator('#ci-cas-manutention [data-ci-target="i-reclamation"]').click();await page.waitForTimeout(35);
  assert.notEqual(await page.locator('#ci-i-reclamation').getAttribute('open'),null);
  await page.locator('[data-ci-reading]').click();await page.waitForTimeout(35);
  assert.equal(await page.locator('.ci-root details[open]').count(),await page.locator('.ci-root details').count());
  await page.locator('[data-ci-reading]').click();await page.waitForTimeout(35);
  assert.notEqual(await page.locator('#ci-i-reclamation').getAttribute('open'),null);
  await page.locator('[data-ci-view="comprendre"]').focus();await page.keyboard.press('ArrowRight');
  assert.equal(await page.locator('[data-ci-view="echanges"]').getAttribute('aria-selected'),'true');
  await page.evaluate(()=>document.documentElement.style.setProperty('--echelle','2'));
  for(const view of ['comprendre','echanges','cas']){
   await page.locator(`[data-ci-view="${view}"]`).click();
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`Débordement à texte 200% ${width}/${theme}/${view}`);
  }
  assert.deepEqual(errors,[]);await ctx.close();
 }
 const ctx=await browser.newContext({javaScriptEnabled:false,viewport:{width:390,height:900}});
 const page=await ctx.newPage();await page.setContent(html);
 assert.equal(await page.locator('[data-ci-panel]:visible').count(),3);
 assert.equal(await page.locator('[data-ci-exchange][open]').count(),12);await ctx.close();
 fs.writeFileSync(path.join(dest,'navigateur.json'),JSON.stringify({results,keyboard:true,crossView:true,reading:true,text200:true,noScript:true},null,2));
 console.log('24 présentations testées; 12 échanges dans chaque configuration, navigation clavier, cas vers échange, lecture complète, texte 200% et version sans JavaScript : OK.');
}finally{await browser.close();}
