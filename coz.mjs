// Şifrelenmiş bir aracı geri açar: docs/ içindeki dosyadan kaynak/ dosyasını üretir.
// sifrele.mjs'in tersidir — elinizde yalnızca şifreli kopya kaldığında kullanılır.
//
//   node coz.mjs <şifreli-dosya> [çıktı]
//   node coz.mjs eklenecekler/order.html kaynak/order.html
//
// Çıktı verilmezse dosyanın yanına ".duz.html" ekiyle yazılır.
// Şifre sorulur; yazdıklarınız ekranda yıldızla görünür ve hiçbir yere kaydedilmez.
import { readFileSync, writeFileSync } from 'node:fs';
import { pbkdf2Sync, createDecipheriv } from 'node:crypto';
import { gunzipSync } from 'node:zlib';

const [dosya, hedefArg] = process.argv.slice(2);
if (!dosya) hataCik('Kullanım: node coz.mjs <şifreli-dosya> [çıktı]');
const hedef = hedefArg || dosya.replace(/\.html$/i, '') + '.duz.html';

function hataCik(msg) { console.error('HATA: ' + msg); process.exit(1); }

const html = readFileSync(dosya, 'utf8');
const m = html.match(/<script id="hm-data"[^>]*data-salt="([^"]+)" data-iv="([^"]+)" data-iter="(\d+)">([\s\S]*?)<\/script>/);
if (!m) hataCik(`${dosya} şifreli değil (hm-data bulunamadı) — zaten düz metin olabilir.`);
const SALT = Buffer.from(m[1], 'base64'), IV = Buffer.from(m[2], 'base64'), ITER = +m[3];
const VERI = Buffer.from(m[4].replace(/\s+/g, ''), 'base64');

function sifreSor(soru) {
  if (process.env.HM_SIFRE) return Promise.resolve(process.env.HM_SIFRE);
  if (!process.stdin.isTTY) hataCik('Şifre girilemiyor (terminal yok). Betiği bir terminalde çalıştırın.');
  return new Promise(coz => {
    process.stdout.write(soru);
    const g = process.stdin; let s = '';
    g.setRawMode(true); g.resume(); g.setEncoding('utf8');
    const dinle = parca => {
      for (const c of parca) {
        if (c === '\r' || c === '\n') { g.setRawMode(false); g.pause(); g.off('data', dinle); process.stdout.write('\n'); return coz(s); }
        if (c === '\u0003') { process.stdout.write('\n'); process.exit(130); }
        if (c === '\b' || c === '\u007f') { if (s) { s = s.slice(0, -1); process.stdout.write('\b \b'); } continue; }
        s += c; process.stdout.write('*');
      }
    };
    g.on('data', dinle);
  });
}

const sifre = await sifreSor('Hesap Merkezi şifresi: ');
process.stdout.write('Çözülüyor…');
let duz;
try {
  const anahtar = pbkdf2Sync(sifre.normalize('NFC'), SALT, ITER, 32, 'sha256');
  const d = createDecipheriv('aes-256-gcm', anahtar, IV);
  d.setAuthTag(VERI.subarray(-16));
  duz = gunzipSync(Buffer.concat([d.update(VERI.subarray(0, -16)), d.final()])).toString('utf8');
} catch {
  process.stdout.write('\n');
  hataCik('Şifre yanlış — dosya bu şifreyle açılmıyor. Hiçbir dosya yazılmadı.');
}
console.log(' tamam.');

// sifrele.mjs yayınlarken eklediği "Ana sayfa" düğmesi kaynak dosyada durmamalı;
// yoksa bir sonraki yayında iki tane olur.
const i = duz.indexOf('<a href="index.html" id="hm-ev"');
if (i >= 0) {
  const j = duz.indexOf('</style>', i);
  if (j > 0) { duz = duz.slice(0, i) + duz.slice(j + '</style>'.length).replace(/^\s*\n/, ''); console.log('  yayın sırasında eklenen ana sayfa düğmesi çıkarıldı'); }
}

writeFileSync(hedef, duz);
console.log(`Bitti → ${hedef} (${(duz.length / 1048576).toFixed(2)} MB)`);
