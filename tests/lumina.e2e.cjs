'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ acceptDownloads: true });
  const pageErrors = [];
  page.on('pageerror', error => pageErrors.push(error.message));
  page.on('dialog', async dialog => {
    if (dialog.type() === 'prompt') await dialog.accept('Lumina QA');
    else if (dialog.type() === 'confirm') { if (dialog.message().includes('Criar no universo')) await dialog.dismiss(); else await dialog.accept(); }
    else await dialog.accept();
  });

  try {
    const base = 'http://127.0.0.1:4173';

    // Identidade visual: cabeçalho escuro integrado, landing editorial e editor em papel.
    await page.goto(base + '/index.html', { waitUntil: 'domcontentloaded' });
    await page.locator('body.lumina-refined').waitFor();
    const navVisual = await page.locator('#site-nav').evaluate(el => {
      const s = getComputedStyle(el);
      const login = el.querySelector('.nav-links .btn');
      return { image: s.backgroundImage, color: s.color, loginRadius: getComputedStyle(login).borderRadius };
    });
    assert.match(navVisual.image, /linear-gradient/);
    assert.equal(navVisual.loginRadius, '999px');
    await page.evaluate(() => window.scrollTo(0, 120));
    await page.locator('#site-nav.is-solid').waitFor();
    await page.waitForFunction(() => {
      const nav = document.getElementById('site-nav');
      return nav && getComputedStyle(nav).backgroundColor === 'rgba(13, 25, 19, 0.91)';
    }, { timeout: 3000 });
    const solidNav = await page.locator('#site-nav').evaluate(el => getComputedStyle(el).backgroundColor);
    assert.equal(solidNav, 'rgba(13, 25, 19, 0.91)');
    const sectionSurface = await page.locator('#manifesto').evaluate(el => getComputedStyle(el).backgroundImage);
    assert.match(sectionSurface, /radial-gradient/, 'Manifesto deve usar acabamento editorial de papel.');
    const pillarsSurface = await page.locator('#pilares').evaluate(el => getComputedStyle(el).backgroundImage);
    assert.match(pillarsSurface, /radial-gradient/, 'Pilares devem manter a paleta editorial clara.');
    const featureText = await page.locator('#mundo-vivo .lede').evaluate(el => getComputedStyle(el).color);
    assert.equal(featureText, 'rgba(243, 234, 216, 0.72)', 'Texto da seção escura Mundo Vivo deve manter contraste claro.');
    const portalTitle = await page.locator('#portal h2').evaluate(el => getComputedStyle(el).color);
    assert.equal(portalTitle, 'rgb(243, 234, 216)', 'Título do portal cinematográfico deve permanecer claro.');
    await page.setViewportSize({ width: 390, height: 844 });
    const landingOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    assert.equal(landingOverflow, false, 'Landing institucional mobile não deve ter overflow horizontal.');



    // Demo: criar, editar, recarregar e reabrir uma história.
    await page.goto(base + '/demo.html', { waitUntil: 'domcontentloaded' });
    await page.locator('#btn-start').click();
    await page.locator('#screen-dashboard.is-active').waitFor();
    await page.locator('.add-card').click();
    await page.locator('#screen-editor.is-active').waitFor();
    const editorPalette = await page.locator('.editor-layout:not(.nocturne-layout) .page-frame').evaluate(el => getComputedStyle(el).backgroundColor);
    assert.equal(editorPalette, 'rgb(251, 248, 239)', 'Editor Lumina deve manter o papel claro.');
    for (const label of ['Salvar agora', 'Exportar .txt', 'Backup .json', 'Importar backup']) {
      await page.getByRole('button', { name: label }).waitFor();
    }
    await page.locator('#manuscript').fill('Texto de teste persistente do Lumina QA.');
    await page.waitForFunction(() => {
      const data = JSON.parse(localStorage.getItem('lumina-library-v1') || '{}');
      return Object.values(data).some(item => item.title === 'Lumina QA' && item.html.includes('Texto de teste persistente'));
    });
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.locator('#btn-start').click();
    await page.locator('#screen-dashboard.is-active').waitFor();
    await page.locator('.lumina-library-card').filter({ hasText: 'Lumina QA' }).click();
    await page.locator('#screen-editor.is-active').waitFor();
    assert.match(await page.locator('#manuscript').innerText(), /Texto de teste persistente/);

    // Nocturne: abrir o editor alternativo e verificar ferramentas sem trocar seu tema.
    await page.locator('#screen-editor .nocturne-link').click();
    await page.locator('#screen-nocturne.is-active').waitFor();
    await page.locator('#nocturne-manuscript').waitFor();
    const nocturneSurface = await page.locator('.nocturne-layout .page-frame').evaluate(el => getComputedStyle(el).backgroundImage);
    assert.match(nocturneSurface, /linear-gradient/, 'Nocturne deve preservar sua superfície escura em degradê.');
    await page.getByRole('button', { name: 'Salvar agora' }).waitFor();
    assert.equal(await page.locator('body').evaluate(el => el.classList.contains('lumina-demo')), true);

    // Escrita imersiva: autosave, exportação e restauração de backup.
    await page.goto(base + '/write.html', { waitUntil: 'domcontentloaded' });
    await page.locator('body.lumina-writing').waitFor();
    const paperSurface = await page.locator('.sheet').evaluate(el => getComputedStyle(el).backgroundColor);
    assert.equal(paperSurface, 'rgb(251, 248, 239)', 'Modo imersivo deve manter a folha editorial clara.');
    await page.locator('#manuscript').fill('Manuscrito de teste da área de escrita.');
    await page.waitForFunction(() => {
      const saved = JSON.parse(localStorage.getItem('lumina-draft-v1') || 'null');
      return saved && saved.html && saved.html.includes('Manuscrito de teste da área de escrita');
    });
    await page.reload({ waitUntil: 'domcontentloaded' });
    assert.match(await page.locator('#manuscript').innerText(), /Manuscrito de teste da área de escrita/);
    const txtDownloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Exportar .txt' }).click();
    const txtDownload = await txtDownloadPromise;
    assert.match(txtDownload.suggestedFilename(), /\.txt$/);

    const backupDownloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Backup .json' }).click();
    const backupDownload = await backupDownloadPromise;
    assert.match(backupDownload.suggestedFilename(), /\.json$/);

    const backupPath = '/tmp/lumina-qa-backup.json';
    fs.writeFileSync(backupPath, JSON.stringify({
      format: 'lumina-backup', version: 2, story: 'História recuperada',
      chapter: 'Capítulo restaurado', html: '<p>Conteúdo restaurado pelo teste E2E.</p>'
    }));
    await page.locator('input[type="file"]').setInputFiles(backupPath);
    await page.waitForFunction(() => document.getElementById('manuscript').innerText.includes('Conteúdo restaurado pelo teste E2E.'));
    assert.equal(await page.locator('#story-title').innerText(), 'História recuperada');

    // Layout mobile: landing, biblioteca e editor não devem criar overflow horizontal.
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(base + '/demo.html', { waitUntil: 'domcontentloaded' });
    await page.locator('#btn-start').click();
    await page.locator('#screen-dashboard.is-active').waitFor();
    const dashboardOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    assert.equal(dashboardOverflow, false, 'Dashboard mobile não deve ter rolagem horizontal da página.');
    await page.locator('#story-card-1').click();
    await page.locator('#screen-editor.is-active').waitFor();
    const editorOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    assert.equal(editorOverflow, false, 'Editor mobile não deve ter rolagem horizontal da página.');

    assert.deepEqual(pageErrors, [], 'Não deve haver erros JavaScript não tratados nas páginas testadas.');
    console.log('PASS: demo, biblioteca, autosave, recarga, Nocturne, exportação/importação e layout mobile.');
  } finally {
    await browser.close();
  }
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
