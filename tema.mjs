// Hesap Merkezi temasını kaynak/ klasöründeki araçlara uygular.
// Yalnızca <style> bloklarını değiştirir; araçların HTML ve JS'ine dokunmaz.
// Bir kez çalıştırılır (tekrar çalıştırmak zararsızdır — işaret görürse atlar).
//   node tema.mjs
import { readFileSync, writeFileSync } from 'node:fs';

const ISARET = '/* ===== Hesap Merkezi teması ===== */';

// Hesap Merkezi giriş ekranındaki palet, araçların kullandığı değişken adlarına eşlenmiş hâli.
const KOK = `:root{
  --bg:#f7f8fa;--card-bg:#fff;--panel-2:#f4f6f9;--hover:#eef1f6;
  --border:#e3e7ee;--border-soft:#eef1f5;--border-2:#d2d8e2;
  --text:#0d1117;--text-2:#31383f;--text-muted:#697585;--muted:#697585;--secondary:#697585;
  --primary:#4a57c9;--primary-dark:#3d49b3;--on-primary:#fff;--accent-soft:#eceefb;
  --danger:#c0362c;--danger-bg:#fdecea;--danger-border:#f3b9b3;--danger-ink:#8f231b;
  --warn:#a15c07;--warn-bg:#fff6e5;--warn-border:#f5c77e;--warn-ink:#7a4306;
  --success:#12855c;--success-bg:#e7f5ee;--success-border:#9fd9bf;--success-ink:#0b5c3f;
  --auto-tag-bg:#eceefb;--auto-tag-text:#4a57c9;
  --wash:rgba(74,87,201,.10);--gridc:rgba(13,17,23,.045);
  --shadow:0 1px 2px rgba(16,24,40,.04),0 8px 24px -14px rgba(16,24,40,.16);
  --shadow-lg:0 2px 4px rgba(16,24,40,.04),0 16px 40px -12px rgba(16,24,40,.18);
  --radius:12px;--ease:cubic-bezier(.16,1,.3,1);
  --font:ui-sans-serif,-apple-system,BlinkMacSystemFont,"Inter","Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif;
  color-scheme:light dark;
}
@media screen and (prefers-color-scheme:dark){:root{
  --bg:#08090b;--card-bg:#101214;--panel-2:#16181c;--hover:#1c1f24;
  --border:#2a2e35;--border-soft:#1f2228;--border-2:#353a42;
  --text:#e8eaed;--text-2:#c4c9d1;--text-muted:#858c98;--muted:#858c98;--secondary:#858c98;
  --primary:#8b93f8;--primary-dark:#a3a9fa;--on-primary:#0a0b0e;--accent-soft:#171a2e;
  --danger:#ff8d84;--danger-bg:#2a1513;--danger-border:#5c2a25;--danger-ink:#ffb4ad;
  --warn:#f0b35a;--warn-bg:#271c0b;--warn-border:#5a4115;--warn-ink:#f7cf8f;
  --success:#4cc38a;--success-bg:#0e2419;--success-border:#1f5a3f;--success-ink:#8fdcb6;
  --auto-tag-bg:#171a2e;--auto-tag-text:#8b93f8;
  --wash:rgba(139,147,248,.16);--gridc:rgba(255,255,255,.035);
  --shadow:0 1px 3px rgba(0,0,0,.45),0 8px 24px -14px rgba(0,0,0,.7);
  --shadow-lg:0 2px 6px rgba(0,0,0,.45),0 16px 40px -12px rgba(0,0,0,.7);
}}`;

// Arka plan ışığı + ızgara ve giriş animasyonu — Hesap Merkezi'ndekinin aynısı.
const ZEMIN = `@media screen{
body::before,body::after{content:"";position:fixed;inset:0;pointer-events:none}
body::before{z-index:-2;background:radial-gradient(62% 44% at 50% -12%,var(--wash),transparent 68%),radial-gradient(38% 30% at 96% -4%,color-mix(in srgb,var(--primary) 8%,transparent),transparent 70%)}
body::after{z-index:-1;background-image:linear-gradient(var(--gridc) 1px,transparent 1px),linear-gradient(90deg,var(--gridc) 1px,transparent 1px);background-size:46px 46px;
 -webkit-mask-image:radial-gradient(78% 55% at 50% 0%,#000,transparent 76%);mask-image:radial-gradient(78% 55% at 50% 0%,#000,transparent 76%)}
}
@keyframes panelIn{from{opacity:0;transform:translateY(14px) scale(.99);filter:blur(2px)}to{opacity:1;transform:none;filter:none}}
@keyframes sweep{0%{background-position:-40% 0}100%{background-position:150% 0}}`;

// Web arayüzlü iki aracın (batarya, order) ortak katmanı.
const ORTAK = `${ISARET}
${ZEMIN}
body{font-family:var(--font);-webkit-font-smoothing:antialiased;letter-spacing:-.005em;background:var(--bg);color:var(--text)}
h1{font-weight:650;letter-spacing:-.025em}
h2{font-weight:650;letter-spacing:-.015em}
.card,.wo-card{transition:box-shadow .2s var(--ease),transform .2s var(--ease),border-color .2s}
.wo-card:hover{border-color:var(--border-2);box-shadow:var(--shadow-lg);transform:translateY(-2px)}
button,.btn,.btn-file{transition:background .16s,border-color .16s,filter .18s,transform .12s var(--ease)}
.btn-primary,.btn.birincil{font-weight:600}
.btn-primary:hover,.btn.birincil:hover{background:var(--primary);filter:brightness(1.07);transform:translateY(-1px)}
input,select,textarea{transition:border-color .16s,box-shadow .16s,background .16s}
input:hover,select:hover,textarea:hover{border-color:var(--border-2)}
input:focus,select:focus,textarea:focus{outline:none;border-color:var(--primary);box-shadow:0 0 0 3px color-mix(in srgb,var(--primary) 18%,transparent)}
input[type=checkbox],input[type=radio]{accent-color:var(--primary)}
::selection{background:color-mix(in srgb,var(--primary) 26%,transparent)}
@media (prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important}}`;

// Kök bloğu dışındaki sabit açık renkler → tema değişkenleri.
// Sıra önemli: özel eşleşmeler genel olanlardan önce gelir.
const RENKLER = [
  [/(\.btn-primary \{[^}]*?)color: #fff/, '$1color: var(--on-primary)'],
  [/(\.btn\.birincil \{[^}]*?)color: #fff/, '$1color: var(--on-primary)'],
  [/outline: 2px solid #bfdbfe/g, 'outline: none'],
  [/rgba\(37, 99, 235, \.12\)/g, 'color-mix(in srgb,var(--primary) 18%,transparent)'],
  [/background: #fff\b/g, 'background: var(--card-bg)'],
  [/#(fbfcfe|f8fafc|f1f5f9|eef1f6)\b/g, 'var(--panel-2)'],
  [/#(e4e9f0|eceff3)\b/g, 'var(--hover)'],
  [/#e5eaf1\b/g, 'var(--border)'],
  [/#eff6ff\b/g, 'var(--accent-soft)'],
  [/#(fef2f2|fee2e2)\b/g, 'var(--danger-bg)'],
  [/#(fca5a5|fecaca)\b/g, 'var(--danger-border)'],
  [/#991b1b\b/g, 'var(--danger-ink)'],
  [/#(fffbeb|fef3c7|fff7ed)\b/g, 'var(--warn-bg)'],
  [/#(fcd34d|fdba74)\b/g, 'var(--warn-border)'],
  [/#(92400e|9a3412)\b/g, 'var(--warn-ink)'],
  [/#b45309\b/g, 'var(--warn)'],
  [/#dcfce7\b/g, 'var(--success-bg)'],
  [/#86efac\b/g, 'var(--success-border)'],
  [/#14532d\b/g, 'var(--success-ink)'],
];

// Çizim ve logo önizlemeleri koyu temada da beyaz zeminde kalmalı (siyah çizgiler / logolar).
const BEYAZ_KALSIN = [
  [/(\.dxf-cizim-onizleme \{[^}]*?)background: var\(--card-bg\)/, '$1background: #fff'],
  [/(\.antet-onizleme \{[^}]*?)background: #f7f8fa/, '$1background: #fff'],
];

function styleBlogu(html) {
  const a = html.indexOf('<style>'), b = html.indexOf('</style>', a);
  if (a < 0 || b < 0) throw new Error('<style> bloğu bulunamadı');
  return { a: a + 7, b };
}

function webAraci(dosya, ek = '') {
  let html = readFileSync(dosya, 'utf8');
  if (html.includes(ISARET)) return console.log(`${dosya}: zaten temalı, atlandı`);
  const { a, b } = styleBlogu(html);
  let css = html.slice(a, b);
  css = css.replace(/:root\s*\{[^}]*\}/, KOK);
  const [kok, ...kalan] = css.split(KOK);
  let govde = kalan.join(KOK);
  for (const [r, s] of RENKLER) govde = govde.replace(r, s);
  for (const [r, s] of BEYAZ_KALSIN) govde = govde.replace(r, s);
  css = kok + KOK + govde + '\n' + ORTAK + '\n' + ek + '\n';
  html = html.slice(0, a) + css + html.slice(b);
  writeFileSync(dosya, html);
  console.log(`${dosya}: tema uygulandı`);
}

// ---------- batarya ----------
webAraci('kaynak/batarya.html', `
.topbar h1{font-size:22px}
#app>.topbar,#app>.alt-baslik,#app>.card{animation:panelIn .55s var(--ease) backwards}
#app>.alt-baslik{animation-delay:.04s}
#app>.card{animation-delay:.08s}
#app>.card+.card{animation-delay:.12s}
.drop{border-radius:10px}
.drop:hover,.drop.uzerinde{border-color:var(--primary);background:var(--accent-soft)}
.karar{animation:panelIn .4s var(--ease) backwards}`);

// ---------- order ----------
webAraci('kaynak/order.html', `
.view:not([hidden]){animation:panelIn .5s var(--ease) backwards}
.modal-overlay{background:color-mix(in srgb,#05060a 45%,transparent);backdrop-filter:blur(3px)}
.modal-overlay:not([hidden]) .modal-box{animation:panelIn .4s var(--ease) backwards}
.modal-box{background:var(--card-bg);border:1px solid var(--border);border-radius:14px;box-shadow:var(--shadow-lg)}
.btn-danger:hover{background:var(--danger-bg);filter:brightness(.97)}
.dxf-progress-bar{background:linear-gradient(90deg,var(--primary),color-mix(in srgb,var(--primary) 60%,#fff))}`);

// ---------- cfd rapor ----------
// A4 rapor sayfaları referans PDF ölçüsünde kalır; yalnızca sol form paneli ve masa zemini temalanır.
{
  const dosya = 'kaynak/cfd-rapor.html';
  let html = readFileSync(dosya, 'utf8');
  if (html.includes(ISARET)) console.log(`${dosya}: zaten temalı, atlandı`);
  else {
    const bas = html.indexOf('body{ background:#54585d;');
    const son = html.indexOf('#rapor{ margin-left:340px;');
    if (bas < 0 || son < 0) throw new Error('cfd: panel CSS bölgesi bulunamadı');
    const PANEL = `${ISARET}
:root{
  --panel:#fff;--panel-2:#f4f6f9;--ink:#0d1117;--ink-2:#31383f;--muted:#697585;--line:#e3e7ee;--line-2:#d2d8e2;
  --accent:#4a57c9;--on-accent:#fff;--accent-soft:#eceefb;--ok:#12855c;--desk:#e6e9ef;
  --wash:rgba(74,87,201,.10);--gridc:rgba(13,17,23,.05);--primary:var(--accent);
  --shadow:0 2px 4px rgba(16,24,40,.04),0 16px 40px -12px rgba(16,24,40,.18);
  --ease:cubic-bezier(.16,1,.3,1);
  --font:ui-sans-serif,-apple-system,BlinkMacSystemFont,"Inter","Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif;
}
@media screen and (prefers-color-scheme:dark){:root{
  --panel:#101214;--panel-2:#16181c;--ink:#e8eaed;--ink-2:#c4c9d1;--muted:#858c98;--line:#2a2e35;--line-2:#353a42;
  --accent:#8b93f8;--on-accent:#0a0b0e;--accent-soft:#171a2e;--ok:#4cc38a;--desk:#08090b;
  --wash:rgba(139,147,248,.16);--gridc:rgba(255,255,255,.035);
  --shadow:0 2px 6px rgba(0,0,0,.45),0 16px 40px -12px rgba(0,0,0,.7);
  color-scheme:dark;
}}
body{ background:var(--desk); font-family:Arial,"Helvetica Neue",Helvetica,sans-serif; }
${ZEMIN}

/* ============ EKRAN: form paneli ============ */
#panel{
  position:fixed; top:0; left:0; bottom:0; width:340px;
  background:var(--panel); color:var(--ink); overflow-y:auto;
  padding:22px 18px 24px; font:13px/1.45 var(--font); letter-spacing:-.005em; -webkit-font-smoothing:antialiased;
  border-right:1px solid var(--line); box-shadow:var(--shadow); z-index:10;
  animation:panelIn .55s var(--ease) backwards;
}
#panel h1{ font-size:18px; font-weight:650; letter-spacing:-.025em; margin:0 0 4px; line-height:1.2; }
#panel .panel-alt{ font-size:12.5px; color:var(--muted); margin:0 0 18px; }
#panel fieldset{ border:1px solid var(--line); border-radius:12px; margin:0 0 14px; padding:10px 12px 12px; }
#panel legend{ font-size:11px; font-weight:650; text-transform:uppercase; letter-spacing:.06em; color:var(--accent); padding:0 6px; }
#panel label{ display:block; margin:10px 0 4px; font-size:12px; font-weight:600; color:var(--muted); }
#panel input[type=text], #panel textarea{
  width:100%; background:var(--panel-2); border:1px solid var(--line); border-radius:9px;
  color:var(--ink); font:13px/1.4 var(--font); padding:8px 10px;
  transition:border-color .16s, box-shadow .16s, background .16s;
}
#panel textarea{ resize:vertical; min-height:52px; }
#panel input:hover, #panel textarea:hover{ border-color:var(--line-2); }
#panel input:focus, #panel textarea:focus{ outline:none; border-color:var(--accent); background:var(--panel);
  box-shadow:0 0 0 3px color-mix(in srgb,var(--accent) 18%,transparent); }
#panel .ipucu{ font-size:11.5px; color:var(--muted); margin:4px 0 0; }
#panel .klasor{ color:var(--ok); font-family:Consolas,ui-monospace,monospace; font-size:11.5px; }
#panel button.tara{
  margin-top:6px; padding:6px 10px; border:1px solid var(--line); border-radius:8px;
  background:var(--panel-2); color:var(--ink-2); font:500 12px var(--font); cursor:pointer;
  transition:border-color .16s, color .16s, background .16s, transform .12s var(--ease);
}
#panel button.tara:hover{ border-color:var(--accent); color:var(--accent); background:var(--accent-soft); }
#panel button.tara-ana{
  width:100%; margin-top:0; padding:10px 12px; font:600 13px var(--font);
  background:var(--accent); color:var(--on-accent); border:1px solid var(--accent);
}
#panel button.tara-ana:hover{ background:var(--accent); color:var(--on-accent); filter:brightness(1.07); transform:translateY(-1px); }
#panel .jf-katalog{ margin-top:6px; border:1px solid var(--line); border-radius:9px; overflow:hidden; }
#panel .jf-satir{ display:flex; align-items:center; gap:8px; padding:6px 10px; border-top:1px solid var(--line); }
#panel .jf-satir:first-child{ border-top:none; }
#panel .jf-satir span{ flex:1; font-size:12.5px; color:var(--ink); }
#panel .jf-satir i{ color:var(--muted); font-style:normal; }
#panel .jf-satir input{ width:64px; text-align:center; background:var(--panel-2); border:1px solid var(--line);
  border-radius:7px; color:var(--ink); font:12.5px var(--font); padding:5px 4px; }
#panel .jf-satir input:focus{ outline:none; border-color:var(--accent); }
#panel .butonlar{ display:flex; gap:8px; margin-top:16px; position:sticky; bottom:-24px; padding:10px 0 14px;
  background:linear-gradient(transparent,var(--panel) 30%); }
#panel button{ flex:1; padding:10px 12px; border:1px solid transparent; border-radius:9px; cursor:pointer; font:600 13px var(--font);
  transition:filter .18s, transform .12s var(--ease), background .16s; }
#btnYazdir{ background:var(--accent); border-color:var(--accent); color:var(--on-accent); }
#btnYazdir:hover{ filter:brightness(1.07); transform:translateY(-1px); }
#btnSifirla{ background:var(--panel-2); border-color:var(--line); color:var(--ink); }
#btnSifirla:hover{ border-color:var(--line-2); }
#panel::-webkit-scrollbar{ width:10px; }
#panel::-webkit-scrollbar-thumb{ background:var(--line); border-radius:10px; border:3px solid var(--panel); }
@media (prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important}}

`;
    html = html.slice(0, bas) + PANEL + html.slice(son);
    // Ekran gölgesi koyu masaya göre yumuşatılır; yazdırmada zaten kapalı.
    html = html.replace('margin:0 auto 26px; box-shadow:0 2px 14px rgba(0,0,0,.55);',
                        'margin:0 auto 26px; box-shadow:0 2px 4px rgba(0,0,0,.08),0 18px 44px -16px rgba(0,0,0,.45);');
    writeFileSync(dosya, html);
    console.log(`${dosya}: tema uygulandı`);
  }
}

// ---------- RTU seçim aracı ----------
// Kendi değişken adlarını kullanır (--s1, --txt, --accent…); bunlar Hesap Merkezi paletine eşlenir.
// Devre şeması SVG'si kendi açık zeminini taşır, koyu temada da okunur kalır.
{
  const dosya = 'kaynak/rtu.html';
  let html = readFileSync(dosya, 'utf8');
  if (html.includes(ISARET)) console.log(`${dosya}: zaten temalı, atlandı`);
  else {
    const { a, b } = styleBlogu(html);
    let css = html.slice(a, b);
    const RTU_KOK = `:root{
  --bg:#f7f8fa;--s1:#fff;--s2:#f4f6f9;--s3:#eef1f5;--border:#e3e7ee;--border2:#d2d8e2;
  --txt:#0d1117;--txt2:#56606d;--txt3:#8a93a0;
  --accent:#4a57c9;--acc-dim:#eceefb;--acc-glow:rgba(74,87,201,.18);--on-accent:#fff;--accent-ink:#3441a8;
  --cool:var(--accent);--cool-dim:var(--acc-dim);
  --heat:#c2410c;--heat-dim:#fef1ea;--heat-ink:#9a3412;
  --green:#12855c;--green-dim:#e7f5ee;--green-ink:#0b5c3f;
  --amber:#8a6300;--amber-dim:#fdf5e4;--amber-ink:#6b4e00;
  --red:#c0362c;--red-dim:#fdecea;
  --ui:ui-sans-serif,-apple-system,BlinkMacSystemFont,"Inter","Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif;
  --mono:ui-monospace,SFMono-Regular,"SF Mono",Menlo,Consolas,"Liberation Mono",monospace;
  --head:var(--ui);
  --shadow:0 1px 2px rgba(16,24,40,.04),0 8px 24px -14px rgba(16,24,40,.16);
  --shadow-lift:0 2px 4px rgba(16,24,40,.04),0 16px 40px -12px rgba(16,24,40,.18);
  --primary:var(--accent);--wash:rgba(74,87,201,.10);--gridc:rgba(13,17,23,.045);--ease:cubic-bezier(.16,1,.3,1);
  color-scheme:light dark;
}
@media screen and (prefers-color-scheme:dark){:root{
  --bg:#08090b;--s1:#101214;--s2:#16181c;--s3:#1c1f24;--border:#2a2e35;--border2:#353a42;
  --txt:#e8eaed;--txt2:#aab1bc;--txt3:#7c8492;
  --accent:#8b93f8;--acc-dim:#171a2e;--acc-glow:rgba(139,147,248,.25);--on-accent:#0a0b0e;--accent-ink:#b3b9fb;
  --heat:#fb8a5a;--heat-dim:#2a170e;--heat-ink:#fdba8c;
  --green:#4cc38a;--green-dim:#0e2419;--green-ink:#8fdcb6;
  --amber:#f0b35a;--amber-dim:#271c0b;--amber-ink:#f7cf8f;
  --red:#ff8d84;--red-dim:#2a1513;
  --shadow:0 1px 3px rgba(0,0,0,.45),0 8px 24px -14px rgba(0,0,0,.7);
  --shadow-lift:0 2px 6px rgba(0,0,0,.45),0 16px 40px -12px rgba(0,0,0,.7);
  --wash:rgba(139,147,248,.16);--gridc:rgba(255,255,255,.035);
}}`;
    css = css.replace(/:root\{[\s\S]*?\n\}/, RTU_KOK);
    const kok = css.indexOf(RTU_KOK) + RTU_KOK.length;
    let govde = css.slice(kok);
    for (const [r, s] of [
      [/rgba\(255,255,255,\.86\)/g, 'color-mix(in srgb,var(--s1) 86%,transparent)'],
      [/color:#04121f|color:#04160c/g, 'color:var(--on-accent)'],
      [/(\.run-btn\{[^}]*?)color:#fff/, '$1color:var(--on-accent)'],
      [/(\.stp\.cur \.stp-n\{[^}]*?)color:#fff/, '$1color:var(--on-accent)'],
      [/#0952BD/g, 'color-mix(in srgb,var(--accent) 88%,#000)'],
      [/#08479F/g, 'color-mix(in srgb,var(--accent) 78%,#000)'],
      [/#BCD5FA/g, 'color-mix(in srgb,var(--accent) 30%,var(--s1))'],
      [/#F5CDB6/g, 'color-mix(in srgb,var(--heat) 30%,var(--s1))'],
      [/#B8E0CD/g, 'color-mix(in srgb,var(--green) 30%,var(--s1))'],
      [/#EBD9A8|#F0DFB4/g, 'color-mix(in srgb,var(--amber) 30%,var(--s1))'],
      [/#6B4E00|#5A4200/g, 'var(--amber-ink)'],
      [/#0B4CA8/g, 'var(--accent-ink)'],
      [/#0A6440/g, 'var(--green-ink)'],
      [/#9A3412/g, 'var(--heat-ink)'],
      [/#C9CFD8/g, 'var(--border2)'],
      [/#AEB6C2/g, 'var(--txt3)'],
    ]) govde = govde.replace(r, s);
    css = css.slice(0, kok) + govde + `
${ISARET}
${ZEMIN}
body{background:var(--bg)}
.sidebar{animation:panelIn .5s var(--ease) backwards}
.main>*:first-child{animation:panelIn .55s var(--ease) .06s backwards}
.run-btn,.wiz-btn{transition:background .16s,filter .18s,transform .12s var(--ease),box-shadow .16s}
.run-btn:hover,.wiz-btn.primary:hover:not(:disabled){filter:brightness(1.07);transform:translateY(-1px)}
.card{transition:box-shadow .2s var(--ease),border-color .2s}
::selection{background:color-mix(in srgb,var(--accent) 26%,transparent)}
`;
    html = html.slice(0, a) + css + html.slice(b);
    writeFileSync(dosya, html);
    console.log(`${dosya}: tema uygulandı`);
  }
}
