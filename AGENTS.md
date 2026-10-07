# Ideathon — agent devir notu

## Kullanıcının amacı

Canlıda kullanılan beş projenin ZIP kopyaları bu workspace'te yerelde çalışır hale getirildi. Kullanıcı geliştirmelere VS Code içindeki agent ile devam etmek istiyor. Sonraki özellik isteğini kullanıcı belirleyecek. Canlıya yayın talebi henüz verilmedi.

## Önce okunacak dosyalar

- `README.md`: yerel adresler, çalıştırma, test ve ortam bilgileri.
- `source-archives.json`: orijinal ZIP'lerin SHA-256 değerleri ve ilk yerel kurulumda değişen özgün dosyalar.
- `package.json`, `scripts/local.mjs`, `compose.yaml`: ortak geliştirme ortamı.

## Projeler ve servisler

| Klasör | Teknoloji | Yerel adres |
|---|---|---|
| `ideathon.api` | Express 5, Mongoose 8, Socket.IO | http://localhost:5010 |
| `ideathon.frontend` | Next.js 14, React 18 | http://localhost:3110 |
| `ideathon.admin` | Next.js 15, React 19 | http://localhost:3111 |
| `ideathon.juri` | Next.js 15, React 19 | http://localhost:3112 |
| `ideathon.mentor` | Next.js 15, React 19 | http://localhost:3113 |

Panel giriş sayfaları `/auth/login`; katılımcı girişi web sitesinde `/login`.
MongoDB Docker'da `127.0.0.1:27027`, veritabanı `ideathon_local`. Mailpit arayüzü http://localhost:8025, SMTP portu 1025. Node.js 24 kullanıldı. Arayüzler ve API native Node süreçleri olarak, yalnızca loopback arayüzünde çalışır.

## Komutlar

Workspace kökünde:

```sh
npm run status  # Önce mevcut süreçleri kontrol et
npm run dev     # Docker servisleri + seed + beş uygulama; çalışanları çoğaltmaz
npm run stop    # Yalnızca bu workspace servislerini durdurur; verileri silmez
npm run verify  # Rol girişleri, oturum, Socket.IO, CORS, çerez ayrımı, etkinlik API'si
npm run setup   # Yalnızca ilk kurulumda veya bağımlılıkları yeniden kurarken
```

Docker Desktop çalışır durumda olmalı. Bağımlılıklar zaten kuruldu. Testlerin ve süreçlerin önceki oturumda çalışıyor olması hâlen çalıştıkları anlamına gelmez; gerektiğinde `status` kullan.

## Yerel kurulumda yapılan kaynak değişiklikleri

- API sunucusuna `HOST` desteği ve Socket.IO / Mongoose 8 ile uyumlu temiz kapanış eklendi.
- API Socket.IO CORS listesine tüm panellerin ortam adresleri eklendi.
- Jüri ve mentor panellerine `NEXT_PUBLIC_AUTH_COOKIE_NAME` desteği eklendi. Aynı localhost üzerinde çerezler portlara göre ayrılmadığından farklı yerel adlar kullanılır. Değişken yoksa eski `token` adı korunur.
- Üç panelin `.npmrc` dosyasında mevcut React/UI bağımlılıkları için `legacy-peer-deps=true` var.
- Ortak başlatma, durdurma, yerel seed ve doğrulama scriptleri eklendi; npm lock dosyaları oluşturuldu/güncellendi.

## Veri ve Git durumu

- Bu klasörler ZIP'ten açıldı; GitHub klonları değildir. Kurulum sonunda kök Git deposunda henüz commit yoktu ve kaynaklar untracked durumdaydı.
- GitHub'da istenen `ismailbekarr/ideathon.*` repolarına doğrulanmış erişim sağlanamadı. Mevcut CLI hesabının adı `iskojk` idi. Remote veya canlı sürüm/commit bağlantısı varsayma.
- Orijinal arşivler `.local/source-archives/` içinde saklanır. Bunlar sonraki kod karşılaştırmaları için başlangıç kopyasıdır.
- `.local/credentials.json` dört yerel demo hesabının giriş bilgilerini içerir. Parolaları kodlara, loglara veya commitlere ekleme.
- API `.env`, arayüz `.env.local`, `.local/`, `node_modules/` ve `.next/` Git dışındadır. Bu dosyaları canlıya taşıma.
- Beş demo etkinlik, yönetici/jüri/mentor/katılımcı hesapları ve mentor profili oluşturuldu. Gerçek üretim verileri ve yüklemeleri mevcut değildir. Seed yalnızca belirtilen yerel veritabanında çalışır ve mevcut kayıtları sıfırlamaz.
- E-postalar yerel Mailpit'e gider. Google/Microsoft/Zoom OAuth ayarları sağlanmadı. Redis geliştirmede gerekli değil.

## Tamamlanan doğrulama ve sonraki geliştirmeler

7 Ekim 2026: dört arayüzde tarayıcıdan giriş ve giriş sonrası ekranlar, beş servisin HTTP yanıtları, rol bazlı API oturumları, mentor/katılımcı Socket.IO ve CORS, panellerin çerez ayrımı başarılı. `npm run stop` / `dev` ve tekrar `dev` doğrulandı. Tüm iş akışları ve production build henüz doğrulanmadı.

Yeni geliştirmeyi ilgili proje klasöründe yap; etkilenen akışları test et. Canlıya entegrasyon istendiğinde önce güncel upstream kodu ve yayın yöntemi doğrulanmalı, geliştirme farkları buna göre birleştirilmeli. Veritabanı şeması değişirse veri geçişi ayrıca hazırlanmalı.
