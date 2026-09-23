# Araçlarım

Hesap Merkezi ile aynı şifreyle korunan araç sitesi. Ana sayfaya bir kez giriş yapınca araçlar ve Hesap Merkezi aynı sekmede tekrar şifre sormadan açılır.

## Klasörler

| Klasör / dosya | İçerik | GitHub'a yüklenir mi? |
|---|---|---|
| `docs/` | Yayınlanacak site: `index.html` (ana sayfa) ve şifreli araçlar | **Evet** |
| `kaynak/` | Araçların şifresiz, temalı hâlleri, `hesap-merkezi.html` ve `araclar.json` (menü) | **Hayır** |
| `yedek/` | Tema uygulanmadan önceki orijinal dosyalar | **Hayır** |
| `eklenecekler/` | Siteye eklenmek üzere bırakılan ham HTML ve Excel dosyaları | **Hayır** |
| `sablon/` | Ana sayfa ve kilit ekranı şablonları | Zararsız |
| `sifrele.mjs` | `kaynak/` → `docs/` üretir | Zararsız |
| `tema.mjs` | Hesap Merkezi temasını `kaynak/` araçlarına uygular (bir kez çalıştırıldı) | Zararsız |

`.gitignore` dosyası `kaynak/`, `yedek/` ve `eklenecekler/` klasörlerini dışarıda bırakır.

## Siteyi üretme

```
node sifrele.mjs
```

Betik Hesap Merkezi şifresini sorar ve `kaynak/hesap-merkezi.html` dosyasının şifresini çözerek doğrular. Yanlış şifreyle hiçbir dosya yazmaz. Doğruysa `docs/` klasörünü baştan üretir.

## GitHub'da yayınlama

1. Bu klasörü bir GitHub deposuna gönderin. Gönderirken `.gitignore` sayesinde `kaynak/` ve `yedek/` depoya girmez. GitHub web arayüzünden sürükleyip bırakıyorsanız yalnızca `docs/` klasörünü yükleyin.
2. Depoda **Settings → Pages → Build and deployment** bölümünde kaynak olarak `main` dalını ve `/docs` klasörünü seçin.
3. Site `https://<kullanıcı>.github.io/<depo>/` adresinde açılır.

## Araç ekleme ya da güncelleme

1. Aracın şifresiz HTML dosyasını `kaynak/` klasörüne koyun.
2. Yeni araç için `kaynak/araclar.json` dosyasına bir satır ekleyin (`dosya`, `ad`, `aciklama`, `ikon`).
3. `node sifrele.mjs` komutunu yeniden çalıştırın.

Hesap Merkezi'nde şifreyi değiştirdiyseniz yeni `hesap-merkezi.html` dosyasını `kaynak/` klasörüne koyun ve betiği yeni şifreyle çalıştırın. Bütün araçlar yeni şifreyle yeniden şifrelenir.
