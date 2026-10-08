# Ideathon — agent devir notu

## Aktif çalışma alanı — 8 Ekim 2026

Geliştirmeye `/Users/ismailbekar/Developer/Ideathon` klasöründen devam edin. VS Code çalışma alanı `Ideathon.code-workspace` dosyasıdır. Bu klasör iCloud dışında, fiziksel olarak yerelde bulunur. Eski `/Users/ismailbekar/Documents/ChatGPT/Ideathon` kopyası iCloud dosya erişiminde takıldığı için korunmuş, geliştirme yeni kopyaya alınmıştır. Eski kopyadan servis başlatmayın.

Yeni kopya `https://github.com/iskojk/IdeathonAll.git` deposunun `main` dalından, `f3f7bc9` commit'iyle klonlandı. Bu commit girişimci ilerleme göstergesi ve soru başlığı düzeltmelerini içerir. Ürün kodu taşıma sırasında değiştirilmedi. Sonraki arayüz geliştirmeleri aşağıda özetlenmiştir; güncel commit'i `git log -1` ile kontrol edin.

8 Ekim doğrulaması: beş uygulama HTTP 200 dönüyor; süperadmin/jüri/mentor/katılımcı girişleri, oturum, CORS ve Socket.IO geçti. İlk derleme sonrasında ana sayfa 65 ms, girişimci sayfası 51 ms, yönetici girişi 58 ms ölçüldü. Önceden iCloud'da takılan CSS dosyası 71 ms'de yüklendi. İlk sayfa açılışı geliştirme derlemesi nedeniyle daha uzun sürebilir.

API'nin mevcut `.env` dosyası, `.local/credentials.json`, `.local/entrepreneur-demo-credentials.json` ve `login bilgileri.txt` eski kopyadan içerikleri değiştirilmeden kurtarıldı. Dört arayüzün `.env.local` dosyaları ortak kurulumdaki aynı localhost ayarlarıyla oluşturuldu. Beş projenin bağımlılıkları kilit dosyalarından `npm ci` ile kuruldu.

Mevcut `ideathon-local_mongo-data` Docker volume'ü kullanılıyor. Veritabanı sıfırlanmadı. 7 girişimci başvurusunun detayları, 8 evrağın tamamının indirilmesi, aktif soru seti ve taslak API üzerinden doğrulandı. Taşıma öncesi MongoDB yedeği `.local/backups/before-local-move-2026-10-08.archive.gz` dosyasında, erişim izni 600 olarak korunur.

Kalan iCloud dosyaları: eski API'nin `uploads/mentors` ve `uploads/presentations` klasörlerindeki 4 arşiv dosyası ile `.local/source-archives/` henüz indirilemedi; orijinalleri eski klasörde duruyor. Bunları silmeyin. Girişimci başvurularının 8 evrağı MongoDB'de saklanır ve bu eksik arşiv dosyalarından bağımsız olarak çalıştığı doğrulanmıştır.

Sistemde başka bir projenin Node araçları PATH'in önünde bulunabiliyor. Bu kurulumda `/usr/local/bin/node` (24.13.0), `/usr/local/bin/npm` ve `/Users/ismailbekar/.docker/bin/docker` kullanıldı. Gerekirse komutları `PATH="/usr/local/bin:/Users/ismailbekar/.docker/bin:$PATH" npm run dev` biçiminde çalıştırın. Parolaları ve ortam anahtarlarını çıktılara veya Git'e eklemeyin.

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

- Kaynaklar başlangıçta ZIP arşivlerinden açılmıştı. Güncel çalışma alanı yukarıda belirtilen `iskojk/IdeathonAll` GitHub klonudur.
- Güncel remote `iskojk/IdeathonAll` deposudur. Canlı sistemin upstream kodu/yayın bağlantısı ayrıca doğrulanmalıdır; bu public depo tek başına canlı sürümün kaynağı olarak varsayılmamalıdır.
- Orijinal arşivler eski iCloud kopyasının `.local/source-archives/` dizinindedir; yeni çalışma alanına aktarılmaları henüz tamamlanmamıştır.
- `.local/credentials.json` dört yerel demo hesabının giriş bilgilerini içerir. Parolaları kodlara, loglara veya commitlere ekleme.
- API `.env`, arayüz `.env.local`, `.local/`, `node_modules/` ve `.next/` Git dışındadır. Bu dosyaları canlıya taşıma.
- Beş demo etkinlik, yönetici/jüri/mentor/katılımcı hesapları ve mentor profili oluşturuldu. Gerçek üretim verileri ve yüklemeleri mevcut değildir. Seed yalnızca belirtilen yerel veritabanında çalışır ve mevcut kayıtları sıfırlamaz.
- E-postalar yerel Mailpit'e gider. Google/Microsoft/Zoom OAuth ayarları sağlanmadı. Redis geliştirmede gerekli değil.

## Tamamlanan doğrulama ve sonraki geliştirmeler

### 8 Ekim 2026 — arayüz geliştirmeleri ve devam noktası

Kullanıcı bu noktada ara verdi ve yapılan değişikliklerin `iskojk/IdeathonAll` deposunun `main` dalına push edilmesini istedi. Son tamamlanan özellik soru setindeki bölümlerin tutamaçla sürüklenerek sıralanmasıdır. Yeni bir özellik isteği gelene kadar bu noktadan devam edin. Canlıya yayın istenmedi.

- Girişimci başvuru formunun kaydırma düzeni, başvuru özeti ve tipografisi iyileştirildi. Gönderilmiş başvuruyla tekrar girişte girişimci sayfası tamamlanmış başvuru görünümünü kullanır. **Başvurumu Görüntüle** düğmesi üstteki bilgi alanının %60 genişliğinde ve ortalıdır.
- Gizlilik politikası ve kullanım şartları yerel içerikle aynı ekranda bir dialog içinde açılır. KVKK, numaralı soru yerine **Gizlilik ve Kullanım Onayları** alanında ilk sıradadır; onaylarda metin sürümü etiketi gösterilmez.
- Yönetici havuzunun durum/işlem sütunları ve başvuru detayları düzenlendi. Detay ekranında yalnızca mavi **PDF olarak indir** düğmesi vardır. PDFKit ve lisanslarıyla eklenen Noto Sans fontları Türkçe karakterleri destekler; uzun içerik tek bir raporda gerektiğinde birden fazla sayfaya yayılır.
- Dinamik soru editörü sadeleştirildi: bölüm ekleme/adlandırma/sıralama, soru ekleme/silme/taşıma ve cevap formatı düzenleme desteklenir. Taslak kütüphanesi, kayıt, kopyalama, önizleme, yayımlama ve çakışma koruması sürer. KVKK uyarı bandı kaldırıldı.
- Sol menüde **Girişimciler** başlangıçta kapalıdır; altında role göre **Girişimci Havuzu** ve süperadmine özel **Girişimci Soru Seti** açılır.
- **Bölümler** listesindeki tutamaçlar mevcut dnd-kit paketleriyle fare/dokunmatik/klavye sıralaması sağlar. Bırakıldığında sağda taşınan bölümün soruları ve güncel sıra numarası açılır; önizleme ve taslak içeriği aynı sırayı kullanır. Escape iptal eder. Gizlilik bölümü sonda sabit kalır. Sıra taslak kaydıyla saklanır, yayımlamayla yeni başvurulara geçer.

Doğrulama: API girişimci birim testleri (25), ön yüz girişimci birim testleri, `verify:entrepreneurs` ve `verify:entrepreneur-form` geçti. Son değişiklikten sonra `verify:entrepreneur-drafts` fare/klavye sürükleme, iptal, sağ içerik eşleşmesi, önizleme ve yeniden açılışta sıranın korunması dahil geçti. Yerel Chrome'da menü geçişleri, bölüm tutamaçları ve sağ içerik güncellemesi kontrol edildi. Gerçek soru taslağına test değişiklikleri kaydedilmedi; geçici sıralama geri alındı. PDF indirmesi ve Türkçe karakterlerin çıktısı kontrol edildi. Production build tüm projeler için henüz doğrulanmadı.

Geri dönüş kopyaları `.local/ui-checkpoints/` altında ve Git dışındadır. Son kopyalar: `sections-before-drag-sort-2026-10-08/`, `sidebar-before-entrepreneurs-group-2026-10-08/`, `entrepreneur-form-editor-before-simple-builder-2026-10-08.jsx` ve `entrepreneurs-before-compact-submitted-2026-10-08.js`. Beğenilmezse yalnızca istenen özelliği geri alın; diğer değişiklikleri koruyun.

7 Ekim 2026: dört arayüzde tarayıcıdan giriş ve giriş sonrası ekranlar, beş servisin HTTP yanıtları, rol bazlı API oturumları, mentor/katılımcı Socket.IO ve CORS, panellerin çerez ayrımı başarılı. `npm run stop` / `dev` ve tekrar `dev` doğrulandı. Tüm iş akışları ve production build henüz doğrulanmadı.

Yeni geliştirmeyi ilgili proje klasöründe yap; etkilenen akışları test et. Canlıya entegrasyon istendiğinde önce güncel upstream kodu ve yayın yöntemi doğrulanmalı, geliştirme farkları buna göre birleştirilmeli. Veritabanı şeması değişirse veri geçişi ayrıca hazırlanmalı.
