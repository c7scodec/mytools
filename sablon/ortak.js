/* Hesap Merkezi ile aynı şifreleme: PBKDF2-SHA256 → AES-256-GCM, içerik gzip.
   Tüm dosyalar hesap-merkezi.html'in salt'ı ile şifrelenir; bu yüzden anahtar tek kez türetilir
   ve sekme oturumunda (sessionStorage) Hesap Merkezi'nin kullandığı adla saklanır — bir kez girilen
   şifre ana sayfada, araçlarda ve Hesap Merkezi'nde geçerli olur. */
var $=function(id){return document.getElementById(id);};
var SKEY='hesapMerkezi_oturum';
function b64d(s){var bin=atob(s),u=new Uint8Array(bin.length);for(var i=0;i<bin.length;i++)u[i]=bin.charCodeAt(i);return u;}
function b64e(u){var s='';for(var i=0;i<u.length;i+=0x8000)s+=String.fromCharCode.apply(null,u.subarray(i,i+0x8000));return btoa(s);}
function destek(){return !!(window.crypto&&crypto.subtle&&window.DecompressionStream);}
var VERI=$('hm-data'),SALT=b64d(VERI.dataset.salt),IV=b64d(VERI.dataset.iv),ITER=+VERI.dataset.iter;
async function anahtarBitleri(pw){var baz=await crypto.subtle.importKey('raw',new TextEncoder().encode(pw.normalize('NFC')),'PBKDF2',false,['deriveBits']);
  return new Uint8Array(await crypto.subtle.deriveBits({name:'PBKDF2',hash:'SHA-256',salt:SALT,iterations:ITER},baz,256));}
function SifreHatasi(){this.name='SifreHatasi';}
async function coz(bits){var k=await crypto.subtle.importKey('raw',bits,'AES-GCM',false,['decrypt']),gz;
  try{gz=await crypto.subtle.decrypt({name:'AES-GCM',iv:IV},k,b64d(VERI.textContent.replace(/\s+/g,'')));}catch(_){throw new SifreHatasi();}
  var s=new Blob([gz]).stream().pipeThrough(new DecompressionStream('gzip'));return await new Response(s).text();}
function kayitliAnahtar(){try{var k=sessionStorage.getItem(SKEY);return k?b64d(k):null;}catch(_){return null;}}
function anahtarKaydet(bits){try{sessionStorage.setItem(SKEY,b64e(bits));}catch(_){}}
function anahtarSil(){try{sessionStorage.removeItem(SKEY);}catch(_){}}
function hata(msg){$('hata').textContent=msg;}
function yukle(on){$('kart').classList.toggle('yukleniyor',on);$('gir').disabled=on;$('gir').textContent=on?'Açılıyor…':'Giriş';}
function sars(){var k=$('kart');k.classList.remove('sars');void k.offsetWidth;k.classList.add('sars');}
document.querySelectorAll('.goz').forEach(function(b){b.addEventListener('click',function(){var i=$(b.dataset.hedef);var g=i.type==='password';i.type=g?'text':'password';b.setAttribute('aria-label',g?'Şifreyi gizle':'Şifreyi göster');i.focus();});});

/* ac(bits, metin, otomatik): şifresi çözülmüş içerikle ne yapılacağı (sayfaya göre değişir).
   gizle: kayıtlı oturum denenirken giriş kartı gösterilmesin (küçük içerik anında açılır). */
function girisBagla(ac,gizle){
  if(!destek()){hata('Bu tarayıcı şifre çözmeyi desteklemiyor. Güncel Chrome, Edge, Firefox veya Safari ile açın.');$('gir').disabled=true;return;}
  (async function(){var k=kayitliAnahtar();if(!k)return;yukle(true);if(gizle)$('kart').style.visibility='hidden';
    try{await ac(k,await coz(k),true);}catch(e){anahtarSil();yukle(false);$('kart').style.visibility='';$('sifre').focus();}})();
  $('giris').addEventListener('submit',async function(e){e.preventDefault();var pw=$('sifre').value;if(!pw)return;hata('');yukle(true);
    try{var bits=await anahtarBitleri(pw),metin=await coz(bits);anahtarKaydet(bits);await ac(bits,metin,false);}
    catch(x){yukle(false);if(x instanceof SifreHatasi){hata('Şifre yanlış.');sars();$('sifre').select();}else hata('Açılamadı: '+(x&&x.message||x));}});
}
