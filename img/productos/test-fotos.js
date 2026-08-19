const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1280, height: 1000 } });
  const errs = []; p.on('pageerror', e => errs.push(String(e)));
  await p.goto('file:///home/claude/tienda/catalogo.html?genero=mujer');
  await p.waitForTimeout(1500);
  const info = await p.$$eval('.producto', els => els.map(e => ({
    txt: e.innerText.replace(/\n+/g,' | '),
    img: e.querySelector('img') ? e.querySelector('img').getAttribute('src') : null,
    ok: e.querySelector('img') ? e.querySelector('img').naturalWidth : 0
  })));
  console.log(JSON.stringify(info, null, 1));
  console.log('ERRORES:', errs);
  await p.screenshot({ path: '/home/claude/shots/v20-mujer.png', fullPage: false });
  await p.goto('file:///home/claude/tienda/index.html');
  await p.waitForTimeout(1500);
  await p.screenshot({ path: '/home/claude/shots/v20-inicio.png', fullPage: true });
  await b.close();
})();
