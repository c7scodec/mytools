// AHU Studio'nun ham sürümünü siteye hazırlar: kaynak/ahu-studio.html üretir.
//
//   node ahu.mjs <ham-dosya>        (varsayılan: eklenecekler/ahu studio.html)
//
// Yaptığı iki şey:
//   1. Aracın kendi SHA-256 şifre kapısını kaldırır — dosya sitede zaten Hesap Merkezi
//      şifresiyle AES-256-GCM ile şifreleniyor, ikinci bir kapıya gerek yok. Kapı
//      tarayıcıda koştuğu için kaynağa bakan biri onu zaten geçebiliyordu.
//   2. Araç çubuğundaki kilit düğmesini ana sayfa bağlantısına çevirir.
// Görünüme dokunmaz (AHU Studio kendi koyu temasını korur).
import { readFileSync, writeFileSync } from 'node:fs';

const kaynak = process.argv[2] || 'eklenecekler/ahu studio.html';
const hedef = 'kaynak/ahu-studio.html';
let h = readFileSync(kaynak, 'utf8').replace(/^﻿/, '');

const kes = (bas, son, ad) => {
  const a = h.indexOf(bas);
  if (a < 0) throw new Error(`${ad}: "${bas.slice(0, 32)}" bulunamadı`);
  const b = h.indexOf(son, a);
  if (b < 0) throw new Error(`${ad}: kapanış bulunamadı`);
  return { a, b };
};

// 1) Giriş ekranının CSS'i — yorum satırından </style>'a kadar.
{
  const { a, b } = kes('/* ---------- GIRIS EKRANI', '</style>', 'CSS');
  h = h.slice(0, a) + `/* GIRIS EKRANI KALDIRILDI (ahu.mjs)
   Dosya Hesap Merkezi şifresiyle AES-256-GCM ile şifrelenir; içerik dosyada düz metin
   değildir ve açılırken zaten şifre sorulur. Araç çubuğundaki kilit düğmesi de ana
   sayfa (#btn-ev) bağlantısına dönüştü. */
` + h.slice(b);
}
// 2) Giriş perdesi ve onu süren betik — <div id="giris"> …ilk </script> sonuna kadar.
{
  const a = h.indexOf('<div id="giris"');
  if (a < 0) throw new Error('giriş perdesi bulunamadı');
  const b = h.indexOf('</script>', a);
  if (b < 0) throw new Error('giriş betiğinin sonu bulunamadı');
  h = h.slice(0, a) + h.slice(b + '</script>'.length).replace(/^\s*\n/, '');
}
// 3) Kilit düğmesi → ana sayfa bağlantısı.
{
  const a = h.indexOf('<button class="icon-btn" id="btn-kilit"');
  if (a < 0) throw new Error('kilit düğmesi bulunamadı');
  const b = h.indexOf('</button>', a) + '</button>'.length;
  h = h.slice(0, a) + `<a class="icon-btn" id="btn-ev" href="index.html" title="Ana sayfa — araç listesi">
      <svg class="ic" viewBox="0 0 24 24"><path d="M3 11.5 12 4l9 7.5"/><path d="M5.5 10v10h13V10"/></svg>
    </a>` + h.slice(b);
}

for (const [ad, re] of [['id="giris"', /id="giris"/], ['giris_sifre', /giris_sifre/], ['kapiOzet', /kapiOzet/],
                        ['GIRIS_OZET', /GIRIS_OZET/], ['btn-kilit', /btn-kilit/], ['#giris{', /#giris\{/]])
  if (re.test(h)) throw new Error('kalıntı var: ' + ad);
if (!/id="btn-ev"/.test(h)) throw new Error('ana sayfa bağlantısı eklenmedi');

writeFileSync(hedef, h);
console.log(`${hedef}: ${(h.length / 1048576).toFixed(2)} MB · giriş kapısı kaldırıldı, ana sayfa bağlantısı eklendi`);
