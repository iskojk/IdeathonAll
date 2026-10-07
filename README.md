# IdeathonAll

Web sitesi, API, süperadmin, jüri ve mentor uygulamalarını ve ortak yerel geliştirme araçlarını içeren monorepo. Girişimci başvuruları, dinamik soru yönetimi ve çoklu soru taslakları bu kaynaklara dahildir.

```sh
git clone https://github.com/iskojk/IdeathonAll.git
cd IdeathonAll
npm run setup
npm run dev
```

Docker Desktop ve Node.js 24 gerekir. Ortam dosyaları ilk kurulumda yerel değerlerle oluşturulur. `login bilgileri.txt`, gerçek ortam değişkenleri, veritabanı, yüklenen kullanıcı evrakları ve `.local/` içeriği public repoya dahil değildir. Kurulum kendi yerel demo hesaplarını üretir.

Kullanıcının sağladığı beş ZIP, ayrı proje klasörlerinde bir araya getirildi. GitHub commit geçmişi ZIP arşivlerinde bulunmadığından bu klasörler GitHub klonu değildir. VS Code için `Ideathon.code-workspace` dosyasını açabilirsiniz.

Orijinal ZIP'lerin kopyaları ilk çalışma alanının `.local/source-archives/` klasöründe korunur; public repoya eklenmez. `source-archives.json` dosyası SHA-256 değerlerini ve ilk yerel kurulum sırasında değiştirilen özgün dosyaları kaydeder. Canlıya aktarım hazırlığında bu başlangıç kopyaları güncel upstream koduyla karşılaştırılabilir.

| Uygulama | Adres | Klasör |
|---|---|---|
| Web sitesi / katılımcı | http://localhost:3110 | `ideathon.frontend` |
| Yönetici | http://localhost:3111/auth/login | `ideathon.admin` |
| Jüri | http://localhost:3112/auth/login | `ideathon.juri` |
| Mentor | http://localhost:3113/auth/login | `ideathon.mentor` |
| API | http://localhost:5010/health | `ideathon.api` |
| Yerel e-posta kutusu | http://localhost:8025 | Docker / Mailpit |

## Kullanım

Node.js 24 ve çalışan Docker Desktop gerekir. Komutları bu ana klasörde çalıştırın:

```sh
# İlk kurulum / bağımlılıkları tekrar kurma
npm run setup

# MongoDB, Mailpit ve beş uygulamayı arka planda başlat
npm run dev

# Sayfaların HTTP yanıtlarını ve Docker servislerini kontrol et
npm run status

# Dört rolün API girişleri, Socket.IO ve etkinlik verilerini test et
npm run verify

# Uygulamaları ve bu workspace'in Docker servislerini durdur
npm run stop
```

Uygulamalar geliştirme modunda çalışır; kaynak değişiklikleri otomatik yüklenir. İlk sayfa açılışı derleme nedeniyle daha uzun sürebilir. Terminal kapansa da servisler çalışmayı sürdürür. Bilgisayar yeniden başlatıldıktan sonra `npm run dev` komutunu tekrar çalıştırın. Sunucular yalnızca yerel ağ arayüzüne (`127.0.0.1`) bağlıdır.

## Giriş bilgileri ve veriler

İlk başlatmada `.local/credentials.json` dosyasına rastgele bir yerel parola yazılır. Hesaplar:

- Yönetici: `admin@ideathon.dev`
- Jüri: `juri@ideathon.dev`
- Mentor: `mentor@ideathon.dev`
- Katılımcı: `katilimci@ideathon.dev`

Jüri, mentor ve katılımcı İstanbul yerel demo etkinliğine atanır. Mentor profili de hazırdır. Ön yüzdeki mevcut etkinlik sayfalarıyla uyumlu beş **örnek etkinlik** oluşturulur. Yönetici panelindeki etkinlik seçicisinden İstanbul — Yerel Demo seçilebilir. Başvuru, takım ve değerlendirme listeleri başlangıçta boştur. Üretim veritabanı, geçmiş başvurular ve kullanıcıların yüklediği dosyalar ZIP'lerde bulunmaz.

MongoDB bağlantısı: `mongodb://127.0.0.1:27027/ideathon_local`. Veriler `ideathon-local_mongo-data` Docker volume'ünde saklanır; `npm run stop` verileri silmez. Seed yalnızca bu yerel veritabanında çalışır, tekrar çalıştırıldığında mevcut hesapları ve verileri değiştirmez.

## Ayarlar ve loglar

- API: `ideathon.api/.env`
- Arayüzler: her proje klasöründeki `.env.local`
- Çalışma logları: `.local/logs/api.log`, `frontend.log`, `admin.log`, `juri.log`, `mentor.log`
- Docker servisleri: `compose.yaml`
- Kurulum / süreç yönetimi: `scripts/local.mjs`
- Yerel demo verileri: `scripts/seed-local.cjs`

Ortam ve parola dosyaları Git tarafından dışlanır. Ortam değişkenleri değiştirildikten sonra `npm run stop` ve `npm run dev` çalıştırın. Mevcut ortam dosyaları başlatma sırasında üzerine yazılmaz.

API'nin ayrı `src/seeds/createInitialAdmin.js` scripti sabit parola içermez. Elle kullanılacaksa `INITIAL_ADMIN_EMAIL` ve en az 12 karakterli benzersiz `INITIAL_ADMIN_PASSWORD` ortam değişkenleri sağlanmalıdır. Ortak yerel kurulum bunun yerine `scripts/seed-local.cjs` ile rastgele parola üretir.

E-postalar yalnızca yerel Mailpit'e teslim edilir; buradan dışarı gönderilmez. Google, Microsoft ve Zoom OAuth entegrasyonları için gerçek uygulama kimlik bilgileri sağlanmadı; bu entegrasyonlar yapılandırılmamıştır. Redis tek API örneğiyle geliştirme modunda gerekli değildir.

Üç paneldeki mevcut React / UI paketlerinin peer dependency sürümleri çakıştığı için `.npmrc` içinde `legacy-peer-deps=true` kullanılır. Mevcut uygulama sürümleri korunur; bu kurulum yerel geliştirme içindir.

Kurulum sırasında API'ye `HOST` desteği, mentor dahil tüm yerel arayüzler için Socket.IO CORS listesi ve Mongoose 8 ile uyumlu kapanış işlemi eklendi.

Jüri ve mentor panellerinde `NEXT_PUBLIC_AUTH_COOKIE_NAME` ile çerez adını ayarlama desteği eklendi. Yerel ortamda her panel ayrı çerez kullanır; böylece aynı `localhost` üzerinde eşzamanlı girişler birbirini etkilemez.

## Girişimci başvuruları

Menüde **Ideathon → Girişimciler → Odak Alanlarımız** sırası kullanılır. Alan `http://localhost:3110/girisimciler`, giriş `/girisimciler/login`, kayıt `/girisimciler/register`, oturum gerektiren form `/girisimciler/basvuru` adresindedir. Mevcut hesaplar geçerlidir; girişimci kaydı için Ideathon seçimi gerekmez.

Girişimci alanı mevcut `LoginPage` / `RegisterPage`, `AuthContext`, `/api/auth/login` ve `/api/auth/register` akışını paylaşır. Hesaplar aynı `User` modelinde `user` rolüyle tutulur. Giriş e-posta/şifre ve JWT ile, kayıt başarılı olduğunda otomatik oturum açılarak çalışır. Mevcut kaynakta giriş veya kayıt sırasında OTP doğrulaması yoktur. Şifre sıfırlamada aynı SMTP servisi e-postaya 6 haneli, 15 dakika geçerli kod gönderir. Giriş, kayıt, şifre sıfırlama ve yeniden kod isteme bağlantıları girişimci bağlamını ve güvenli dönüş adresini korur. Yerelde e-postalar yalnızca Mailpit'e gider; canlı SMTP ayarları değiştirilmemiştir.

`npm run verify:auth`, mevcut Ideathon ve girişimci kaydını, ortak girişi, Mailpit'e ulaşan gerçek SMTP koduyla şifre sıfırlamayı, hatalı/süresi dolmuş/tekrar kullanılan kodları ve şifre değişiminden sonra başvuruya erişimi doğrular. Yalnızca yerel veritabanı ve Mailpit üzerinde çalışır; kendi geçici hesaplarını ve e-postalarını temizler, kullanıcının demo başvurularını korur.

Ortak oturum katmanı `/auth/me` yanıtındaki doğrudan `data` kullanıcı kaydını ve giriş/kayıt yanıtlarındaki `data.user` biçimini birlikte destekler. Böylece yerel kullanıcı önbelleği olmasa bile geçerli JWT ile oturum geri yüklenir.

Form, `ideathon_başvuru_soru_seti.docx` belgesindeki 21 soruyu 7 bölümde sunar: kısa metin, uzun metin, şehir seçimi, evrak ve zorunlu KVKK onayı. 7 (Odak Alanlar), 8 (Girişim Aşaması), 9 (Şirketleşme Durumu) ve 11 (Ekibiniz kaç kişi) serbest metin alanlarıdır. Son sorudaki aydınlatma metni kurum bilgileri tamamlanana kadar taslak olarak işaretlidir. Onay zamanı ve o anda gösterilen metnin sürümü başvuruyla saklanır. Şehir seçimi zorunludur; Türkiye'nin 81 ili arama yapılabilen listede sunulur. Türkçe karakterler kullanılmadan da aranabilir. Tüm evrak alanları isteğe bağlıdır; dosya eklemeden başvuru gönderilebilir. Soru/bölüm sayısı listeden hesaplanır. Taslaklar ve gönderilen başvurular API'de saklanır. PDF, PNG ve JPEG evraklar dosya başına 10 MB sınırıyla kullanıcıya özel indirme uçları üzerinden tutulur. Gönderilmiş başvurular salt okunur hale gelir.

Yanıtlar yazmaya 1,5 saniye ara verildiğinde otomatik olarak sunucuya kaydedilir. Kayıt sırasında yazılan yeni yanıtlar önceki kayıt yanıtıyla ezilmez. Kayıt hatası gösterilir ve kullanıcı bir değişiklik yapana veya elle tekrar deneyene kadar otomatik deneme durur. Henüz kaydedilmemiş yanıtlar kullanıcıya özel `sessionStorage` taslağıyla aynı sekmede sayfadan ayrılıp geri dönmeye karşı korunur; kayıt ve gönderim tamamlanınca temizlenir. Menü bağlantısıyla ayrılırken ve sekmeyi yenilerken/kapatırken kaydedilmemiş işlem uyarısı verilir. Tarayıcı geri tuşuyla dönüldüğünde taslak geri yüklenir. Sunucudaki başvuru/soru sürümü farklıysa eski yanıtlar otomatik uygulanmaz; indirme ve güncel başvuruyla devam seçenekleri gösterilir. Bu geçici kopya sekme kapandıktan sonra kalıcı saklama yerine geçmez.

Telefon soruları sunucuda doğrulanır: Türkiye numaraları `0532 123 45 67`, `5321234567` veya `+90 532 123 45 67` biçiminde girilebilir ve `+905321234567` olarak saklanır. Sabit hatlar ve ülke koduyla verilen uluslararası numaralar da desteklenir. Bu biçim kontrolüdür; SMS doğrulaması değildir. Yeni yüklenen evrakların Türkçe/Unicode dosya adları multipart karakter kodlaması düzeltilerek saklanır.

Gönderimden sonra ve sayfa tekrar açıldığında başvuru kapalı bir özet kartında gösterilir: başvuran adı, girişim başlığı, gönderim tarihi (Türkiye saati) ve **İletildi** durum rozeti. **Detayları görüntüle** ile mevcut yanıtlar ve evraklar salt okunur açılır. `EntrepreneurApplicationSummary` bileşeni sonraki onay akışı için `pending_approval` → **Onay bekliyor**, `approved` → **Onaylandı** görünümlerini de içerir. Mevcut API yalnızca `draft` / `submitted` üretir; bu geliştirme yönetici onay işlemi veya otomatik durum geçişi eklemez.

KVKK'nın altında sırasıyla [Gizlilik Politikası](https://ideathon.anahtarfikirler.com/gizlilik-politikasi) ve [Kullanım Şartları](https://ideathon.anahtarfikirler.com/kullanim-sartlari) için iki ayrı zorunlu onay kutusu vardır. Bağlantılar resmi metinleri yeni sekmede açar. Üç onay da verilmeden gönderim düğmesi açılmaz; API eksik, `false` veya boolean olmayan onayları da reddeder. Taslak kaydetmek için onay gerekmez. Ek onaylar soru sayısına dahil değildir; `form.agreements` altında tutulur. Gönderimde onay cümlesi, bağlantısı, sürümü (resmi sayfalarda Mart 2026) ve sunucunun gönderim zamanı `privacy.agreements` alanında saklanır; havuz detayında görüntülenir. Tanımlar `ideathon.api/src/config/entrepreneurAgreements.js` dosyasındadır ve soru düzenleme API'siyle kaldırılamaz veya isteğe bağlı hale getirilemez.

Yeni onaylar açık başvuru taslaklarına ilk erişimde eklenir; mevcut sorular, yanıtlar, dosyalar ve KVKK metni korunur. Yeni/değişen bir metin otomatik onaylanmaz. Sürüm/revizyon artışı eski açık sekmelerin kontrolü atlamasını engeller. Önceden gönderilmiş başvurular değiştirilmez ve bu metinleri onaylamış gibi gösterilmez. Mevcut kurulumlara kod taşınırken yayımdaki soru seti ve yönetim taslağına da bu onaylar uygulanmalıdır; yerel yapılandırma yedeklenerek güncellenmiştir.

Şirketleşme Tarihi alanı `inputType: date` kullanır: kullanıcı gün/ay/yıl girebilir veya tarayıcının takviminden seçebilir. İsteğe bağlıdır. Tarih saat dilimi dönüşümü yapılmadan `YYYY-MM-DD` olarak kaydedilir; geçersiz takvim tarihleri API tarafından reddedilir.

### Süperadmin: Dinamik soru yönetimi

`http://localhost:3111/entrepreneurs/form` adresindeki **Girişimci Soru Seti** ekranı yalnızca `superadmin` rolüne açıktır. Menüden veya havuzdaki **Soru Setini Düzenle** düğmesinden erişilir. Süperadmin 1–100 soru ekleyebilir/silebilir; bölüm içi sıralamayı, bölümü, soru metnini, açıklamasını, zorunluluğunu, seçeneklerini ve cevap türünü değiştirebilir. Kısa metin, uzun metin, tek seçim, çoklu seçim ve dosya yükleme desteklenir. Kısa metinlerde e-posta, telefon, web adresi, tarih ve sayı formatları seçilebilir. Dosya sınırı soru başına 1–10, dosya başına 10 MB'dır. KVKK onayı son sırada ve zorunlu kalır; aydınlatma metni düzenlenebilir.

**Taslaklarım** ad, soru sayısı, oluşturulma ve son kayıt tarihiyle kaydedilen soru setlerini listeler; **Düzenle** ile geçmişte kaydedilmiş bir taslak açılır. Liste 12 kayıtlık sayfalara ayrılır. **Yeni Taslak Olarak Kaydet** ekrandaki soru setini ayrı bir adla kopyalar; eski taslağı değiştirmez. **Taslağı Kaydet** açık taslağı günceller. Taslak adı yalnızca yönetim panelinde görünür; kullanıcıya gösterilen form başlığından ayrıdır. Taslaklar bu global soru setini yöneten süperadminler arasında ortaktır. İlk erişimde mevcut tek çalışma taslağı **Mevcut soru taslağı** adıyla bir kez korunur; daha önce üzerine yazılmış eski düzenlemeler için geriye dönük bir sürüm geçmişi oluşturulmaz.

Taslak açma/kaydetme yayımdaki formu değiştirmez. **Yayımla** açık taslağı kaydedip onun içeriğini yeni bir sürüm olarak yeni başvurulara uygular; başlamış veya gönderilmiş başvurular kendi soru/cevap kopyasını korur. Kaydedilmemiş değişikliklerle başka bir taslağa geçerken uyarı gösterilir. Her taslağın kendi revizyonu vardır; eşzamanlı düzenlemede eski revizyonla yazma 409 döndürür. Yayım ayrıca global soru seti revizyonunu denetler. Taslak kaydı başarılı olup yayım çakışırsa taslak korunur ve yayım hatası ayrıca bildirilir. Panelde JSON indirme, seçili taslağın güncel halini yükleme ve önizleme seçenekleri bulunur.

Google Sheet/Form bağlantısı kullanılmaz. Yayımdaki soru seti MongoDB `entrepreneurformsettings` koleksiyonundaki tek kayıtta tutulur; ilk açılışta `ideathon.api/src/config/entrepreneurForm.js` içindeki Word setiyle başlatılır. Adlandırılmış taslaklar `entrepreneurformdrafts` koleksiyonundadır. Sonraki API yeniden başlatmaları süperadmin değişikliklerini sıfırlamaz. Eski yapılandırma uçları uyumluluk için korunur: `GET/PUT /api/entrepreneurs/admin/form`, `POST /api/entrepreneurs/admin/form/publish`. Kütüphane: `GET/POST /api/entrepreneurs/admin/form/drafts`, `GET/PUT /api/entrepreneurs/admin/form/drafts/:draftId`, `POST /api/entrepreneurs/admin/form/drafts/:draftId/publish`. Tümü yalnızca süperadmine açıktır. Otomatik indeks oluşturma kapalı ortamda `entrepreneurformdrafts` için benzersiz sparse `legacyKey` indeksi ve `{ updatedAt: -1, _id: -1 }` liste indeksi ayrıca oluşturulmalıdır.

İlk örnek setin açık v1/v2 taslakları Word setinin güncel başlangıç sürümüne ilk erişimde geçirilir. Eşleşen alanlar taşınır, ad-soyad ayrılır, önceki çözüm açıklamaları birleştirilir ve şehir adları normalize edilir. Eski soru ve yanıtların tamamı `previousVersions` altında saklanır ve arayüzden okunabilir. Şirket evrakları ek doküman alanına taşınır; dosyalar silinmez. KVKK otomatik onaylanmaz. Gönderilmiş örnek başvurular değiştirilmez. Geçiş kayıt revizyonunu artırır; eski açık sekmelerde kullanıcıya sürüm çakışması gösterilir.

KVKK metni başlangıçta kurum unvanı, başvuru kanalı, hukuki sebep, alıcılar ve saklama süresi için yer tutucular içerir. Kuruma ait nihai metin ve onayın hizmet koşulu olarak kullanımının hukuki uygunluğu canlıya geçmeden önce kurum tarafından tamamlanmalıdır; bu teknik alan tek başına hukuki uygunluk sağlamaz.

Yeni `entrepreneurapplications` ve `entrepreneurdocuments` koleksiyonları mevcut Ideathon kayıtlarından ayrıdır. Eski veriler için dönüşüm gerekmez. Mongoose yeni koleksiyonları, kullanıcı başına benzersiz başvuru indeksini ve havuz için `{ status: 1, submittedAt: -1, _id: -1 }` indeksini oluşturur; yayın ortamında otomatik indeksler kapalıysa bu indeksler ayrıca oluşturulmalıdır.

### Yönetim paneli: Girişimci Havuzu

Yönetici panelinde **Girişimci Havuzu**, `http://localhost:3111/entrepreneurs/list` adresindedir. Mevcut `admin` ve `superadmin` hesapları erişebilir. Girişimcinin **Başvuruyu Gönder** işlemiyle `submitted` durumuna geçen başvuru otomatik olarak havuzda görünür; taslaklar görünmez. Önceden gönderilmiş başvurular da aynı koleksiyondan okunur, veri taşıma gerekmez. Havuz seçili Ideathon'dan bağımsızdır.

Liste girişim adı, başvuran, e-posta, gönderim tarihi ve evrak sayısını gösterir. Girişim/ad/e-posta araması, tarih sıralaması ve sayfalama sunar. Liste özetindeki girişim adı için `venture_name`, başvuran için `first_name` + `last_name` (eski setlerde `full_name`) ve `email` kullanılır. Bu alanlar olmayan soru setlerinde hesap bilgileri gösterilir.

**Detay** bağlantısı `/entrepreneurs/:id` sayfasını açar. Her başvurunun kendi soru seti kopyası, bütün cevapları, boş bırakılan alanları ve evrakları bölüm bölüm görüntülenir; güncel soru sayısına bağlı değildir. KVKK bölümünde yalnızca onay durumu, tarihi ve metin sürümü gösterilir; uzun aydınlatma metni bu ekranda gösterilmez, başvuru kaydında korunur. Evraklar oturum doğrulanarak panel içinde önizlenebilir veya indirilebilir. Jüri, mentor ve katılımcı rolleri yönetici uçlarına erişemez. Başvuran kendi evrakına önceki akış üzerinden erişmeye devam eder.

API uçları: `GET /api/entrepreneurs/admin` (arama/sayfalama), `GET /api/entrepreneurs/admin/:id` (detay), `GET /api/entrepreneurs/admin/:id/documents/:documentId` (evrak). Evrak erişimi hem başvuru durumunu hem evrakın başvuruya ait olduğunu kontrol eder. Yanıtlar `no-store` kullanır. Havuz bu aşamada inceleme ekranıdır; onay/red veya jüri atama akışı eklenmemiştir.

Doğrulama: kökte `npm run verify:entrepreneurs`; API'de `npm run test:entrepreneurs`; frontend'de `npm run test:auth`. Entegrasyon testi yalnızca `ideathon_local` veritabanında çalışır ve kendi test kullanıcılarını, başvurularını ve evraklarını sonunda temizler.

Ek regresyon testleri: frontend'de `npm run test:entrepreneurs`; kökte `npm run verify:entrepreneur-form`. Tarayıcı testi çalışan yerel frontend ve Google Chrome gerektirir (`CHROME_BIN` ile yolu değiştirilebilir). Gerçek form bileşenini geçici bir sayfada, ayrı tarayıcı profili ve taklit API ile sınar: geçişi iptal etme, otomatik kayıt, geciken yanıt sırasında yazma, bağlantı hatası, geri tuşuyla kurtarma, resmi metin bağlantılarının sırası, üç ayrı zorunlu onay kutusu ve gönderim. `verify:entrepreneurs` eksik/geçersiz onayları API'de reddetmeyi, açık taslakların onay geçişini ve havuz detayındaki onay kayıtlarını da doğrular. Geçici sayfa/profil ve test kayıtları sonunda silinir; mevcut oturum ve başvurular kullanılmaz.

`npm run verify:entrepreneur-drafts`, gerçek yönetim formu bileşeniyle taslak listeleme/açma, adlandırılmış kopya, bağımsız kaydetme, yeniden adlandırma, kaydedilmemiş değişikliklerde geçişi iptal etme, tekrar açma, sürüm çakışmasında yanıtı koruma ve seçilen taslağı yayımlamayı sınar. Ayrı Chrome profili, geçici sayfa ve bellekte taklit API kullanır; gerçek taslakları veya oturumu değiştirmez. `verify:entrepreneurs` aynı akışların gerçek API/veritabanı ve yetki kontrollerini geçici kayıtlarla doğrular.

## Doğrulama

7 Ekim 2026 tarihinde dört arayüzde deneme hesaplarıyla tarayıcıdan giriş doğrulandı. Beş servisin HTTP kontrolleri, dört rolün API girişleri, oturum doğrulama, mentor/katılımcı Socket.IO bağlantıları, CORS ve panellerin çerez ayrımı başarılı. `npm run stop` / `npm run dev` ve çalışan servislerde tekrar `npm run dev` akışları kontrol edildi. Tüm uygulama özelliklerinin uçtan uca testi veya üretim derlemesi bu yerel kurulum doğrulamasının kapsamına dahil değildir.
