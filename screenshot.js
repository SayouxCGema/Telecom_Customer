/* eslint-disable no-console */
const path = require('path');
const fs = require('fs');
const express = require('express');
const puppeteer = require('puppeteer');

async function ensureDir(dir) {
  await fs.promises.mkdir(dir, { recursive: true });
}

async function startServer(staticDir, port) {
  const app = express();
  app.use(express.static(staticDir));
  return new Promise((resolve) => {
    const server = app.listen(port, () => resolve(server));
  });
}

async function capture(page, url, fileBase, viewport) {
  await page.setViewport(viewport);
  await page.goto(url, { waitUntil: 'networkidle2' });
  await page.waitForSelector('.hero');
  const outPng = `${fileBase}-${viewport.width}x${viewport.height}.png`;
  await page.screenshot({ path: outPng, fullPage: true });

  // Also export JPG
  const outJpg = `${fileBase}-${viewport.width}x${viewport.height}.jpg`;
  await page.screenshot({ path: outJpg, fullPage: true, type: 'jpeg', quality: 90 });
}

async function captureSections(page, baseUrl, outDir) {
  const sections = [
    { selector: '.hero', name: 'hero' },
    { selector: '#products', name: 'products' },
    { selector: '#about', name: 'about' },
    { selector: '#contact', name: 'contact' }
  ];

  await page.goto(baseUrl, { waitUntil: 'networkidle2' });
  for (const s of sections) {
    const el = await page.$(s.selector);
    if (!el) continue;
    const pngPath = path.join(outDir, `section-${s.name}.png`);
    const jpgPath = path.join(outDir, `section-${s.name}.jpg`);
    await el.screenshot({ path: pngPath });
    await el.screenshot({ path: jpgPath, type: 'jpeg', quality: 90 });
  }
}

(async () => {
  const outDir = path.resolve(__dirname, 'screenshots');
  await ensureDir(outDir);

  const port = 5050;
  const server = await startServer(__dirname, port);
  const baseUrl = `http://localhost:${port}/index.html`;

  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();

  const viewports = [
    { width: 1440, height: 900 }, // desktop
    { width: 834, height: 1112 }, // tablet (iPad Air)
    { width: 390, height: 844 }   // mobile (iPhone 12/13/14)
  ];

  for (const vp of viewports) {
    const fileBase = path.join(outDir, 'proposal');
    await capture(page, baseUrl, fileBase, vp);
  }

  await captureSections(page, baseUrl, outDir);

  await browser.close();
  await new Promise((r) => server.close(r));
  console.log('Screenshots saved to:', outDir);
})().catch((err) => {
  console.error(err);
  process.exit(1);
});

