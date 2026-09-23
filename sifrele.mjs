// Yayın klasörünü üretir: ana sayfa + şifreli araçlar.
//
//   node sifrele.mjs
//
// Şifre sorulur ve kaynak/hesap-merkezi.html'in şifreli içeriği çözülerek doğrulanır —
// yani yalnızca Hesap Merkezi'nin şifresi kabul edilir. Tüm dosyalar aynı salt ile şifrelenir;
// tarayıcıda bir kez girilen şifre ana sayfada, araçlarda ve Hesap Merkezi'nde geçerli olur.
// Hesap Merkezi'nde şifreyi değiştirirseniz yeni hesap-merkezi.html'i kaynak/ içine koyup
// bu betiği yeni şifreyle yeniden çalıştırın.
//
// Seçenekler (test için): --hm <dosya>  --cikti <klasör>   Şifre ortam değişkeninden de verilebilir: HM_SIFRE
import { readFileSync, writeFileSync, mkdirSync, copyFileSync, rmSync, existsSync } from 'node:fs';
import { pbkdf2Sync, createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';
import { gzipSync } from 'node:zlib';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const KOK = dirname(fileURLToPath(import.meta.url));
const arg = (ad, vars) => { const i = process.argv.indexOf(ad); return i > 0 ? process.argv[i + 1] : vars; };
const KAYNAK = join(KOK, 'kaynak');
const HM = arg('--hm', join(KAYNAK, 'hesap-merkezi.html'));
const CIKTI = arg('--cikti', join(KOK, 'docs'));
const oku = p => readFileSync(p, 'utf8');

// ---------- Hesap Merkezi'nin şifreleme parametreleri ----------
const hmHtml = oku(HM);
const m = hmHtml.match(/<script id="hm-data"[^>]*data-salt="([^"]+)" data-iv="([^"]+)" data-iter="(\d+)">([\s\S]*?)<\/script>/);
if (!m) hataCik(`${HM} içinde şifreli veri (hm-data) bulunamadı.`);
const SALT = Buffer.from(m[1], 'base64'), HM_IV = Buffer.from(m[2], 'base64'), ITER = +m[3];
const HM_VERI = Buffer.from(m[4].replace(/\s+/g, ''), 'base64');

function hataCik(msg) { console.error('HATA: ' + msg); process.exit(1); }

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

function sifrele(anahtar, metin) {
  const iv = randomBytes(12);
  const c = createCipheriv('aes-256-gcm', anahtar, iv);
  const ct = Buffer.concat([c.update(gzipSync(Buffer.from(metin, 'utf8'), { level: 9 })), c.final(), c.getAuthTag()]);
  const b64 = ct.toString('base64').replace(/.{1,120}/g, '$&\n');
  return `<script id="hm-data" type="application/octet-stream" data-salt="${SALT.toString('base64')}" data-iv="${iv.toString('base64')}" data-iter="${ITER}">\n${b64}</script>`;
}

// ---------- Şablon parçaları (logo ve göz simgesi Hesap Merkezi'nden birebir alınır) ----------
const LOGO = (hmHtml.match(/<div class="logo">\s*(<svg[\s\S]*?<\/svg>)/) || [])[1];
const GOZ = (hmHtml.match(/class="goz"[^>]*>(<svg[\s\S]*?<\/svg>)/) || [])[1];
if (!LOGO || !GOZ) hataCik('Hesap Merkezi logosu okunamadı.');
const FAVICON = 'data:image/svg+xml,' + encodeURIComponent(
  LOGO.replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" fill="#4a57c9" ').replace(/ aria-hidden="true"/, ''));
const cizgi = d => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;
const IKONLAR = {
  hesap: LOGO.replace(/<circle /g, '<circle class="n" ').replace(/ aria-hidden="true"/, ''),
  batarya: cizgi('<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M7 5v14M10.5 5v14M14 5v14M17.5 5v14"/><path d="M1 9h2M1 15h2M21 9h2M21 15h2"/>'),
  order: cizgi('<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 3h6v3H9z"/><path d="M8.5 11h7M8.5 14.5h7M8.5 18h4"/>'),
  cfd: cizgi('<path d="M3 8h10a3 3 0 1 0-3-3"/><path d="M3 12h15a3 3 0 1 1-3 3"/><path d="M3 16h6"/>'),
  ahu: cizgi('<rect x="2.5" y="6" width="19" height="12" rx="2"/><path d="M9 6v12"/><circle cx="15.2" cy="12" r="3.1"/><path d="M15.2 12 13 9.6M15.2 12l3 .9M15.2 12l-1.4 3"/><path d="M5.8 9.2v5.6"/>'),
  rtu: cizgi('<rect x="3" y="7" width="18" height="12" rx="2"/><circle cx="15" cy="13" r="3.5"/><path d="M15 9.5v7M11.5 13h7"/><path d="M6 10.5h3M6 13h3M6 15.5h3"/><path d="M7 7V5h10v2"/>'),
  nem: cizgi('<path d="M9 21a4 4 0 0 1-4-4c0-2.6 4-7 4-7s4 4.4 4 7a4 4 0 0 1-4 4z"/><path d="M15 4c1.2 1-1.2 2 0 3s-1.2 2 0 3M19 4c1.2 1-1.2 2 0 3s-1.2 2 0 3"/>'),
  sukacagi: cizgi('<path d="M12 3 4.5 6v5.5c0 4.6 3.2 8.2 7.5 9.5 4.3-1.3 7.5-4.9 7.5-9.5V6z"/><path d="M12 8.5s-2.5 2.7-2.5 4.4a2.5 2.5 0 0 0 5 0c0-1.7-2.5-4.4-2.5-4.4z"/>'),
  plan: cizgi('<path d="M3 20h18"/><path d="M4.5 20V9.5L10 5l5.5 4.5V20"/><path d="M9 20v-4.5h2.5V20"/><circle cx="18" cy="16" r="2.6"/><path d="M18 13.4V9h2.5"/>'),
  varsayilan: cizgi('<rect x="4" y="4" width="16" height="16" rx="3"/><path d="M9 12h6M12 9v6"/>'),
};
const ORTAK_CSS = oku(join(KOK, 'sablon', 'ortak.css')).trim();
const ORTAK_JS = oku(join(KOK, 'sablon', 'ortak.js')).trim();
const doldur = (sablon, alanlar) => sablon.replace(/\{\{(\w+)\}\}/g, (t, ad) => (ad in alanlar ? alanlar[ad] : t));
const ortakAlanlar = { ORTAK_CSS, ORTAK_JS, LOGO, GOZ, FAVICON };

// Araç açıldıktan sonra ana sayfaya dönüş düğmesi (yazdırmada gizli).
const EV_DUGMESI = `
<a href="index.html" id="hm-ev" title="Ana sayfa">${cizgi('<path d="M3 11.5 12 4l9 7.5"/><path d="M5.5 10v10h13V10"/>')}<span>Ana sayfa</span></a>
<style>
#hm-ev{position:fixed;right:16px;bottom:16px;z-index:2147483000;display:inline-flex;align-items:center;gap:7px;padding:8px 14px 8px 11px;border-radius:999px;
 font:600 12.5px/1 ui-sans-serif,-apple-system,BlinkMacSystemFont,"Inter","Segoe UI",Roboto,Arial,sans-serif;letter-spacing:-.005em;text-decoration:none;
 color:#31383f;background:rgba(255,255,255,.86);border:1px solid #e3e7ee;box-shadow:0 2px 4px rgba(16,24,40,.05),0 10px 26px -12px rgba(16,24,40,.28);
 -webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px);opacity:.88;animation:hmEv .55s cubic-bezier(.16,1,.3,1) .4s backwards;
 transition:opacity .16s,color .16s,border-color .16s,transform .16s cubic-bezier(.16,1,.3,1)}
#hm-ev svg{width:16px;height:16px}
#hm-ev:hover,#hm-ev:focus-visible{opacity:1;color:#4a57c9;border-color:#4a57c9;transform:translateY(-1px);outline:none}
@keyframes hmEv{from{opacity:0;transform:translateY(10px)}}
@media (prefers-color-scheme:dark){#hm-ev{color:#c4c9d1;background:rgba(16,18,20,.86);border-color:#2a2e35;box-shadow:0 2px 6px rgba(0,0,0,.45),0 10px 26px -12px rgba(0,0,0,.7)}
 #hm-ev:hover,#hm-ev:focus-visible{color:#8b93f8;border-color:#8b93f8}}
@media (max-width:560px){#hm-ev span{display:none}#hm-ev{padding:10px}}
@media print{#hm-ev{display:none!important}}
@media (prefers-reduced-motion:reduce){#hm-ev{animation:none;transition:none}}
</style>
`;
// evDugmesi: araç kendi arayüzünde ana sayfa bağlantısı taşıyorsa (araclar.json'da
// "evDugmesi": false) yüzen düğme eklenmez — iki düğme birden olmasın.
function aracaEkle(html, evDugmesi = true) {
  if (!/<link[^>]+rel="icon"/.test(html)) html = html.replace(/<\/title>/, `</title>\n<link rel="icon" href="${FAVICON}">`);
  if (!evDugmesi) return html;
  const i = html.lastIndexOf('</body>');
  if (i < 0) throw new Error('</body> bulunamadı');
  return html.slice(0, i) + EV_DUGMESI + html.slice(i);
}

// ---------- Çalıştır ----------
const sifre = await sifreSor('Hesap Merkezi şifresi: ');
process.stdout.write('Şifre doğrulanıyor…');
const ANAHTAR = pbkdf2Sync(sifre.normalize('NFC'), SALT, ITER, 32, 'sha256');
try {
  const d = createDecipheriv('aes-256-gcm', ANAHTAR, HM_IV);
  d.setAuthTag(HM_VERI.subarray(-16));
  d.update(HM_VERI.subarray(0, -16)); d.final();
} catch { process.stdout.write('\n'); hataCik('Şifre yanlış — Hesap Merkezi bu şifreyle açılmıyor. Hiçbir dosya yazılmadı.'); }
console.log(' tamam.');

const araclar = JSON.parse(oku(join(KAYNAK, 'araclar.json')));
if (existsSync(CIKTI)) rmSync(CIKTI, { recursive: true });
mkdirSync(CIKTI, { recursive: true });
const kilit = oku(join(KOK, 'sablon', 'kilit.html'));

for (const a of araclar) {
  const hedef = join(CIKTI, a.dosya);
  if (a.hazirSifreli) {
    copyFileSync(a.dosya === 'hesap-merkezi.html' ? HM : join(KAYNAK, a.dosya), hedef);
    console.log(`  ${a.dosya}  (zaten şifreli, kopyalandı)`);
    continue;
  }
  const duz = aracaEkle(oku(join(KAYNAK, a.dosya)), a.evDugmesi !== false);
  writeFileSync(hedef, doldur(kilit, { ...ortakAlanlar, VERI: sifrele(ANAHTAR, duz) }));
  console.log(`  ${a.dosya}  şifrelendi`);
}

const menu = araclar.map(({ dosya, ad, aciklama, ikon }) => ({ dosya, ad, aciklama, ikon }));
const anaSayfa = oku(join(KOK, 'sablon', 'ana-sayfa.html'));
writeFileSync(join(CIKTI, 'index.html'), doldur(anaSayfa, {
  ...ortakAlanlar, IKONLAR: JSON.stringify(IKONLAR).replace(/</g, '\\u003c'), VERI: sifrele(ANAHTAR, JSON.stringify(menu)),
}));
console.log('  index.html  (ana sayfa, araç listesi şifreli)');
// GitHub Pages'in Jekyll işlemesine gerek yok; dosyalar olduğu gibi yayınlansın.
writeFileSync(join(CIKTI, '.nojekyll'), '');
console.log(`\nBitti → ${CIKTI}\nGitHub'a yüklenecek site bu klasördür. kaynak/ ve yedek/ şifresiz dosyalar içerir — onları yüklemeyin.`);
