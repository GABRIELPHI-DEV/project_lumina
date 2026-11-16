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

    // Demo: criar, editar, recarregar e reabrir uma história.
    await page.goto(base + '/demo.html', { waitUntil: 'domcontentloaded' });
    await page.locator('#btn-start').click();
    await page.locator('#screen-dashboard.is-active').waitFor();
    await page.locator('.add-card').click();
    await page.locator('#screen-editor.is-active').waitFor();
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
    await page.getByRole('button', { name: 'Salvar agora' }).waitFor();
    assert.equal(await page.locator('body').evaluate(el => el.classList.contains('lumina-demo')), true);

    // Escrita imersiva: autosave, exportação e restauração de backup.
    await page.goto(base + '/write.html', { waitUntil: 'domcontentloaded' });
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

    assert.deepEqual(pageErrors, [], 'Não deve haver erros JavaScript não tratados nas páginas testadas.');
    console.log('PASS: demo, biblioteca, autosave, recarga, Nocturne, exportação e importação de backup.');
  } finally {
    await browser.close();
  }
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
