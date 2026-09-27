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
| `tema.mjs` | Hesap Merkezi temasını araçlara uygular; `rtu.html`'i `eklenecekler/rtu_v10.html`'den üretir | Zararsız |
| `ahu.mjs` | AHU Studio'nun ham sürümünü siteye hazırlar (kendi şifre kapısını kaldırır) | Zararsız |

`.gitignore` dosyası `kaynak/`, `yedek/` ve `eklenecekler/` klasörlerini dışarıda bırakır.

## Siteyi üretme

```
node sifrele.mjs
```

Betik Hesap Merkezi şifresini sorar ve `kaynak/hesap-merkezi.html` dosyasının şifresini çözerek doğrular. Yanlış şifreyle hiçbir dosya yazmaz. Doğruysa `docs/` klasörünü baştan üretir.

> **`docs/` klasörüne elle dosya koymayın.** O klasörü `sifrele.mjs` üretir; içine
> doğrudan konan dosya şifrelenmemiş olur ve depo herkese açıksa içeriği internetten
> okunabilir. Güncellemek istediğiniz aracın şifresiz hâlini `kaynak/` klasörüne koyup
> betiği yeniden çalıştırın.

## GitHub'da yayınlama

1. Bu klasörü bir GitHub deposuna gönderin. Gönderirken `.gitignore` sayesinde `kaynak/`, `yedek/` ve `eklenecekler/` depoya girmez.
2. Depoda **Settings → Pages → Build and deployment** bölümünde kaynak olarak `main` dalını ve `/docs` klasörünü seçin.
3. Site `https://<kullanıcı>.github.io/<depo>/` adresinde açılır.

## Araç ekleme ya da güncelleme

1. Aracın şifresiz HTML dosyasını `kaynak/` klasörüne koyun. İki araç ara adım ister:
   AHU Studio için `node ahu.mjs "eklenecekler/ahu studio.html"`, RTU için `node tema.mjs`.
2. Yeni araç için `kaynak/araclar.json` dosyasına bir satır ekleyin (`dosya`, `ad`, `aciklama`, `ikon`).
3. `node sifrele.mjs` komutunu yeniden çalıştırın.

## Şifre

Site tek şifre kullanır: Hesap Merkezi'ninki. Araçların ayrı şifresi yoktur.

Değiştirmek için `kaynak/hesap-merkezi.html` dosyasını tarayıcıda açın → **Şifreyi değiştir** →
inen dosyayı `kaynak/` klasörüne koyun → `node sifrele.mjs` komutunu yeni şifreyle çalıştırın.
Bütün araçlar yeni şifreyle yeniden şifrelenir.

Şifreli dosyalar herkese açık depoda durur; dosyaları indiren biri kendi bilgisayarında
sınırsız deneme yapabilir. Bu yüzden uzun ve tahmin edilemez bir şifre seçin.
