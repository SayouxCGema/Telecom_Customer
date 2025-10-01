/* eslint-disable no-console */
const path = require('path');
const express = require('express');
const puppeteer = require('puppeteer');

async function startServer(staticDir, port) {
  const app = express();
  app.use(express.static(staticDir));
  return new Promise((resolve) => {
    const server = app.listen(port, () => resolve(server));
  });
}

(async () => {
  const port = 5051;
  const server = await startServer(__dirname, port);
  const url = `http://localhost:${port}/index.html`;

  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();

  await page.goto(url, { waitUntil: 'networkidle2' });
  await page.emulateMediaType('screen');

  const outputPath = path.resolve(__dirname, 'propuesta_maquinasdeozono.pdf');
  await page.pdf({
    path: outputPath,
    format: 'A4',
    printBackground: true,
    margin: { top: '10mm', right: '10mm', bottom: '10mm', left: '10mm' }
  });

  await browser.close();
  await new Promise((r) => server.close(r));
  console.log('PDF saved to:', outputPath);
})().catch((err) => {
  console.error(err);
  process.exit(1);
});

