import { test, expect } from '@playwright/test';

test('named causes filter projects and describe matching partners', async ({page})=>{
  await page.goto('/projects?cause_id=4');
  await expect(page.getByLabel('Filter by cause')).toHaveValue('4');
  await expect(page.locator('.project-card').first()).toBeVisible();
  const strips=await page.locator('.project-strip').allTextContents();
  expect(strips.length).toBeGreaterThan(0);
  expect(strips.every(text=>text.includes('Education'))).toBe(true);
  await page.locator('.project-card').first().getByRole('link',{name:'View project'}).click();
  await expect(page.locator('.page-heading .eyebrow')).toHaveText('Education');
  await page.getByRole('button',{name:'Find matching partners',exact:true}).click();
  await expect(page.getByRole('tab',{name:'Matching partners'})).toHaveAttribute('aria-selected','true');
  await expect(page.locator('.reasons').first()).toContainText('Supports Education projects.');
  const tab=page.getByRole('tab',{name:'Matching partners'});
  await tab.focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.getByRole('tab',{name:'Partnership network'})).toBeFocused();
  await expect(page.getByRole('tabpanel')).toContainText('Proposed partnership network');
  expect(await page.locator('body').innerText()).not.toMatch(/\bsdg\b|\bsdgs\b/i);
});

test('cause selection and motion preferences work on mobile',async({page})=>{
  await page.setViewportSize({width:390,height:844});
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.goto('/login');
  await page.getByRole('tab',{name:'Register organization'}).click();
  await expect(page.getByLabel('Supported cause')).toHaveValue('4');
  await expect(page.getByLabel('Supported cause').locator('option')).toHaveCount(17);
  await page.getByLabel('Supported cause').selectOption({label:'Healthcare'});
  await expect(page.getByLabel('Supported cause')).toHaveValue('3');
  await page.goto('/impact');
  await expect(page.getByRole('heading',{name:'Projects by community cause'})).toBeVisible();
  await expect(page.locator('.cause-chart .recharts-bar')).toBeVisible();
  expect(await page.locator('body').innerText()).not.toMatch(/\bsdg\b|\bsdgs\b/i);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth)).toBe(false);
  expect(await page.evaluate(()=>document.getAnimations().filter(a=>a.playState==='running').length)).toBe(0);
});
