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

İlk kurulumda jüri, mentor ve katılımcı İstanbul yerel demo etkinliğine atanır. Mentor profili ve ön yüzdeki etkinlik sayfalarıyla uyumlu beş örnek etkinlik oluşturulur; başvuru, takım ve değerlendirme listeleri başlangıçta boştur. Uygulamaların kaynak ZIP'leri veritabanı veya yüklenen dosyaları içermez.

8 Ekim 2026'da kullanıcının ayrıca sağladığı **Emlak Db.zip** verileri yerel sisteme aktarıldı: 7 etkinlik, 308 katılımcı başvurusu, 164 takım, 892 jüri değerlendirmesi, 113 iletişim mesajı ve 165 mentor görüşmesi mevcut. Toplam kullanıcı sayısı mevcut 14 yerel hesapla birlikte 790, mentor profili sayısı yerel demo profiliyle birlikte 16'dır. Beş mevcut etkinliğin kimlikleri korundu; aynı slug ile eşleşen demo etkinlik bilgileri arşivdeki bilgilerle güncellendi ve kaynak kayıtlardaki etkinlik referansları bu kimliklere eşlendi. Etkinlik seçicisinde artık gerçek etkinlik adları görünür.

Girişimci koleksiyonları, 8 başvuru, 10 evrak, etkin soru seti ve adlandırılmış taslak aktarım öncesiyle birebir korundu. Mevcut yerel hesaplar ve giriş bilgileri değişmedi. Üretimdeki Google OAuth bağlantı tokenları ve şifre sıfırlama kodları aktarılmadı. Aynı etkinlikte aynı ada sahip iki takım çifti mevcut benzersiz indeksle uyum için ikinci kayıtta `(2)` ekiyle ayrıldı; özgün ad `localImportOriginalTeamName` alanında saklandı ve takım kimliğine bağlı değerlendirme adları eşleştirildi. Ana dashboard mentor sayacı güncel `MentorProfile` koleksiyonunu kullanır.

Aktarım öncesi tam veritabanı/indeks yedeği `.local/backups/before-emlak-import-2026-10-08.archive.gz` dosyasında (izin 600); özel aktarım planı, kaynak JSON'lar ve doğrulama kayıtları `.local/db-import-2026-10-08/` altında, Git dışındadır. Yedek ayrı bir yerel deneme veritabanına geri yüklenerek aktarım önce orada doğrulandı. Arşivdeki 151 sunum dosyası ve 12 mentor fotoğrafının **yalnızca kayıtları/yolları** var; dosyaların kendisi ayrıca sağlanmadıkça açılamaz. Arşivde zaten eksik olan kullanıcı/müsaitlik kuralı/saat referansları için yeni kayıt uydurulmadı.

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

Toplantı ve başvuru bildirimlerinin ortak SMTP e-postaları yerel Mailpit'e teslim edilir. Kayıt doğrulama ve şifre sıfırlama e-postaları ayrı `AUTH_SMTP_*` ayarlarını kullanır. Google, Microsoft ve Zoom OAuth entegrasyonları için gerçek uygulama kimlik bilgileri sağlanmadı; bu entegrasyonlar yapılandırılmamıştır. Redis tek API örneğiyle geliştirme modunda gerekli değildir.

Üç paneldeki mevcut React / UI paketlerinin peer dependency sürümleri çakıştığı için `.npmrc` içinde `legacy-peer-deps=true` kullanılır. Mevcut uygulama sürümleri korunur; bu kurulum yerel geliştirme içindir.

Kurulum sırasında API'ye `HOST` desteği, mentor dahil tüm yerel arayüzler için Socket.IO CORS listesi ve Mongoose 8 ile uyumlu kapanış işlemi eklendi.

Jüri ve mentor panellerinde `NEXT_PUBLIC_AUTH_COOKIE_NAME` ile çerez adını ayarlama desteği eklendi. Yerel ortamda her panel ayrı çerez kullanır; böylece aynı `localhost` üzerinde eşzamanlı girişler birbirini etkilemez.

## Girişimci başvuruları

Başvuru numarası ilk gönderimde **AFZ26001, AFZ26002…** biçiminde verilir. İlk gönderimin Türkiye saatindeki yılı ve o yılın sırası kullanılır; 2027'de **AFZ27001** ile başlar. Düzenleme, iptal, yeniden gönderim ve havuzdan kaldırma numarayı değiştirmez; taslaklar numara tüketmez. Numara havuzda, başvuru özetinde, yönetici detayında ve PDF raporunda görünür. Havuz sütun başlığı **Girişim Adı** olarak güncellendi.

`scripts/migrate-entrepreneur-numbers.mjs` yalnızca yerel veritabanında özel BSON yedeği alıp eski gönderilmiş kayıtları tarihe göre numaralandırır, atomik yıllık sayacı ve kısmi tekil indeksi oluşturur. 11 mevcut başvuruya uygulandı; yanıtlar, evrak referansları, tarihler ve sürümler birebir korundu. Başka ortama taşımadan önce aynı geçiş ayrıca hazırlanmalıdır. `verify:entrepreneur-numbers` eşzamanlı gönderim, numaranın sabit kalması, Türkiye yıl sınırı ve 999 sonrası devamı ayrı bir geçici veritabanında doğrular. `verify:entrepreneur-access` geçici rollerle gerçek başvuruları değiştirmeden okuma/yazma yetkilerini sınar; mevcut verileri ve sayacı karşılaştırıp kendi hesaplarını temizler. Başvuru oluşturan diğer entegrasyon testleri yıllık sayaçtan deneme numarası tüketir; gerçek numaralar yeniden kullanılmaz.

Gönderilmiş başvuru kartında kişi, girişim ve tarih alanları daha yakın yerleşir. İşlemler **Detayları Görüntüle → Başvurumu Düzenle → Durum** sırasındadır. Ayrıntılar yalnızca kendi düğmesinden açılır; PDF önizlemesi üstte kalır. Başlık yanındaki kullanıcı adı/e-posta kutusu kaldırıldı. Detaylar bölümler ve alt sorular halinde açılır kapanır; dış detay görünümü her açıldığında tüm alt alanlar kapalı başlar. Gönderilmiş yanıtlara salt okunur görünümden, düzenlemeye ayrı düğmeden erişilir.

Başvuru düzenlemesinin her adımında **Devam Et** yanında **Güncelle ve Gönder** bulunur. Bu düğme “Değişiklikleri kaydetmek ister misiniz?” onayını açar. **Düzenlemeye Devam Et** aynı bölüm, yanıtlar ve kaydırma konumuyla forma döner; onay penceresindeki **Güncelle ve Gönder** bütün formu doğrulayarak yeniden iletir ve **Girişimci Başvurum** özetini açar. Durum İletildi olur. Eksik/geçersiz alanlarda ilgili bölüme geçilir; bağlantı hatasında yeniden deneme mümkündür. İlk başvuru gönderimi son adımda kalır. Son adımdaki **İptal Et** son gönderilen başvuruyu geri getirir. Girişimci ve yönetici PDF düğmeleri önce aynı ekranda önizleme açar; belge bu penceredeki **İndir** ile kaydedilir. PDF evraklar da önce önizlenir. Havuzdaki kaldırma çöp kutusu simgesiyle gösterilir; bu sayfada genel Ideathon seçicisi gizlidir. Girişimci özet sütunları **BAŞVURAN / GİRİŞİM ADI / BAŞVURU TARİHİ** biçimindedir. Soru seti **Yayımla** işlemi son onay penceresinden sonra gerçekleşir.

Girişimci kayıt ekranında telefon zorunludur. Yeni hesaplarda e-posta ve normalize edilmiş telefon benzersizdir; farklı yazılmış aynı numaralar da engellenir. Eski veri içindeki 5 mükerrer telefon grubu ve eksik/geçersiz telefonlu hesaplar silinmedi. Telefon anahtarı geçişi `npm run migrate:user-phones` ile yalnızca yerel veritabanında, özel BSON yedeği alınarak uygulanır; 528 telefon grubu yeni kayıtlara karşı ayrıldı. `phoneKey` alanı dışa dönük sorgularda gizlidir. Başka ortama taşımadan önce aynı veriyi koruyan indeks geçişi ayrıca hazırlanmalı ve uygulanmalıdır.

`npm run verify:registration` zorunlu/geçerli telefon, e-posta tekilliği, eski numaralar, farklı telefon yazımları ve eşzamanlı çift kayıt denemelerini geçici hesaplarla doğrular. API'de `npm run test:registration` normalizasyon ve indeks tanımını test eder. `verify:auth` e-posta doğrulamalı kayıt ve şifre sıfırlamayı; `verify:entrepreneur-workflow` düzenleme/iptal ve yeniden gönderim akışlarını denetler.


Menüde **Ideathon → Girişimciler → Odak Alanlarımız** sırası kullanılır. Alan `http://localhost:3110/girisimciler`, giriş `/girisimciler/login`, kayıt `/girisimciler/register`, oturum gerektiren form `/girisimciler/basvuru` adresindedir. Mevcut hesaplar geçerlidir; girişimci kaydı için Ideathon seçimi gerekmez.

Girişimci alanı mevcut `LoginPage` / `RegisterPage`, `AuthContext` ve `/api/auth/register` / `/api/auth/login` akışını paylaşır. Hesaplar aynı `User` modelinde `user` rolüyle tutulur. Kullanıcı bilgilerini girip **Kayıt Ol** dediğinde e-postasına altı haneli doğrulama kodu gönderilir. Kod doğrulanana kadar kullanıcı hesabı ve oturum oluşturulmaz. Doğrulama tamamlanınca hesap açılır ve ilgili başvuru sayfasına yönlendirilir. Normal Ideathon kaydı da aynı doğrulamayı kullanır. Mevcut hesaplar ve yönetici tarafından açılan hesaplar korunur; bu hesaplara geriye dönük doğrulanmış etiketi verilmez. SMS akışı yoktur.

`npm run verify:auth`, mevcut Ideathon ve girişimci kaydını, ortak girişi, Mailpit'e ulaşan şifre sıfırlama kodunu, hatalı/süresi dolmuş/tekrar kullanılan kodları ve şifre değişiminden sonra başvuruya erişimi doğrular. Kayıt/e-posta kullanan `verify:auth`, `verify:registration` ve `verify:entrepreneurs` artık yalnızca `RELEASE_QA_DB` / `RELEASE_QA_API_ORIGIN` ile seçilen izole QA API/veritabanında çalışır. QA API'nin `AUTH_SMTP_*` ayarları Mailpit olmalıdır; harici SMTP sunucu tarafında da reddedilir. Kendi geçici hesaplarını, bekleyen kayıtlarını ve e-postalarını temizlerler. Normal yerel API gerçek e-posta gönderebildiği için bu betikler orada durur. Yeni akışa uyarlanan betikler henüz çalıştırılmadı.

### Kayıt doğrulama ve şifre sıfırlama e-postası

Gönderici görünen adı ve e-posta başlığı **AFZ-Girişimci Başvurum** olarak kullanılır. Kayıt doğrulama mesajı hesap oluşturma ve başvuruya devam etme adımlarını; şifre sıfırlama mesajı yeni şifre belirleme adımını açıklar. HTML ve düz metin içerikleri aynı bilgileri taşır.

Özel yapılandırma `ideathon.api/.env.auth-mail` dosyasında, 600 dosya izniyle tutulur ve Git/Docker build bağlamından dışlanır. Örnek alan adları `ideathon.api/.env.example` içinde yorum olarak bulunur. Ortamdan verilen değerler özel dosyaya göre önceliklidir. Üretime geçişte gizli değerler sunucu ortamında ayrıca tanımlanmalıdır; yerel dosya repoya eklenmez.

Microsoft 365 için `AUTH_SMTP_HOST=smtp.office365.com`, `AUTH_SMTP_PORT=587`, `AUTH_SMTP_SECURE=false`, `AUTH_SMTP_REQUIRE_TLS=true` kullanılır. 587 bağlantısı STARTTLS ile şifrelenir ve TLS sertifikası doğrulanır. Gönderici `AUTH_MAIL_FROM` / `AUTH_MAIL_FROM_NAME`, kimlik doğrulama `AUTH_SMTP_USER` / `AUTH_SMTP_PASS` alanlarıdır. Kodları imzalamak ve HMAC üretmek için bağımsız, en az 32 karakterlik rastgele `AUTH_VERIFICATION_SECRET` gerekir. Bu anahtar değiştirilirse bekleyen kayıt/sıfırlama kodları geçersiz olur. Mevcut `SMTP_*` alanları toplantı ve diğer bildirimlerde kullanılmaya devam eder.

`POST /api/auth/register` artık HTTP 202 ve `verificationRequired`, `registrationToken`, `email`, `expiresAt`, `codeExpiresAt`, `resendAvailableAt` döner. Hesap/JWT, `POST /api/auth/register/verify` ile `{registrationToken, code}` doğrulandıktan sonra HTTP 201 ile döner. `POST /api/auth/register/resend` `{registrationToken}` alır. Başvuru bilgisi önceki bir girişimin üstüne yazılmaz; her girişim ayrı kimlik taşır. Parola yalnızca bcrypt özeti, doğrulama kodu yalnızca amaca bağlı HMAC olarak saklanır. Kod 10 dakika, kayıt girişimi 30 dakika geçerlidir; tekrar gönderme 60 saniye bekler; kod başına en çok 5 yanlış deneme vardır. Bekleyen kayıtlar TTL indeksiyle temizlenir; API ayrıca zaman aşımını her istekte kontrol eder. Otomatik indeks oluşturmayan ortamlarda `PendingRegistration.expiresAt` TTL indeksi ayrıca oluşturulmalıdır.

Şifre sıfırlama kodu 15 dakika ve tek kullanımlıktır; 5 yanlış deneme ve 60 saniye gönderim aralığı uygulanır. Başarılı sıfırlama `sessionVersion` artırarak eski JWT'leri geçersiz kılar ve bağlı kullanıcı Socket.IO oturumlarını kapatır. Eşzamanlı sıfırlama yalnızca bir kez başarılı olabilir. Önceden verilmiş, henüz süresi dolmamış eski kodlar geçiş sırasında bir kez kullanılabilir. Var olan kullanıcıları dönüştüren toplu veri geçişi yapılmaz. E-posta adresi profil üzerinden değiştirilirse önceki adresin doğrulama/kurtarma metaverisi temizlenir; profil adres değişikliği için ayrı kod ekranı bu kapsamda eklenmemiştir.

IP ve hesap istek limitleri mevcut Express limiter altyapısındadır; birden fazla API süreciyle yayında ortak rate-limit deposu gerekir. Microsoft 365 bağlantısı ve gerçek teslimat henüz doğrulanmadı. Kullanıcının testleri durdurma talebi korunarak yalnızca sözdizimi/lint kontrolleri yapıldı; entegrasyon testleri yeniden başlatılmadı.

Ortak oturum katmanı `/auth/me` yanıtındaki doğrudan `data` kullanıcı kaydını ve giriş/kayıt yanıtlarındaki `data.user` biçimini birlikte destekler. Böylece yerel kullanıcı önbelleği olmasa bile geçerli JWT ile oturum geri yüklenir.

Form, `ideathon_başvuru_soru_seti.docx` belgesindeki 21 soruyu 7 bölümde sunar: kısa metin, uzun metin, şehir seçimi, evrak ve zorunlu KVKK onayı. 7 (Odak Alanlar), 8 (Girişim Aşaması), 9 (Şirketleşme Durumu) ve 11 (Ekibiniz kaç kişi) serbest metin alanlarıdır. Son sorudaki aydınlatma metni kurum bilgileri tamamlanana kadar taslak olarak işaretlidir. Onay zamanı ve o anda gösterilen metnin sürümü başvuruyla saklanır. Şehir seçimi zorunludur; Türkiye'nin 81 ili arama yapılabilen listede sunulur. Türkçe karakterler kullanılmadan da aranabilir. Tüm evrak alanları isteğe bağlıdır; dosya eklemeden başvuru gönderilebilir. Soru/bölüm sayısı listeden hesaplanır. Taslaklar ve gönderilen başvurular API'de saklanır. PDF, PNG ve JPEG evraklar dosya başına 10 MB sınırıyla kullanıcıya özel indirme uçları üzerinden tutulur. Gönderilmiş başvurular özet ekranında gösterilir; kullanıcı **Başvurumu Düzenle** ile yeniden düzenlemeye başlayabilir.

Yanıtlar yazmaya 1,5 saniye ara verildiğinde otomatik olarak sunucuya kaydedilir. Kayıt sırasında yazılan yeni yanıtlar önceki kayıt yanıtıyla ezilmez. Kayıt hatası gösterilir ve kullanıcı bir değişiklik yapana veya elle tekrar deneyene kadar otomatik deneme durur. Henüz kaydedilmemiş yanıtlar kullanıcıya özel `sessionStorage` taslağıyla aynı sekmede sayfadan ayrılıp geri dönmeye karşı korunur; kayıt ve gönderim tamamlanınca temizlenir. Menü bağlantısıyla ayrılırken ve sekmeyi yenilerken/kapatırken kaydedilmemiş işlem uyarısı verilir. Tarayıcı geri tuşuyla dönüldüğünde taslak geri yüklenir. Sunucudaki başvuru/soru sürümü farklıysa eski yanıtlar otomatik uygulanmaz; indirme ve güncel başvuruyla devam seçenekleri gösterilir. Bu geçici kopya sekme kapandıktan sonra kalıcı saklama yerine geçmez.

Telefon soruları sunucuda doğrulanır: Türkiye numaraları `0532 123 45 67`, `5321234567` veya `+90 532 123 45 67` biçiminde girilebilir ve `+905321234567` olarak saklanır. Sabit hatlar ve ülke koduyla verilen uluslararası numaralar da desteklenir. Bu biçim kontrolüdür; SMS doğrulaması değildir. Yeni yüklenen evrakların Türkçe/Unicode dosya adları multipart karakter kodlaması düzeltilerek saklanır.

Gönderimden sonra başvuru özetinde **Başvuru Tarihi** ve güncel değerlendirme durumu görünür. **Başvurumu Düzenle** gönderilmiş yanıt ve evrakları ayrı bir düzenleme taslağına kopyalar; son gönderilen başvuru havuzda ve PDF'de korunur. Taslak kaydı veya evrak değişikliği gönderilmiş sürümü değiştirmez. **Başvuruyu Yeniden Gönder** zorunlu soruları/onayları tekrar doğrular, yeni yanıt/evrakları gönderilmiş sürüme geçirir, başvuru tarihini yeniler ve durumu **İletildi** yapar. **Düzenlemeyi İptal Et** son gönderilen başvuruya döner. Başvuru sahibi, hesabına bağlı manuel başvuruyu da düzenleyebilir; ilk başvuru kaynağı korunur. Düzenleme taslağı sayfa yenilenince devam eder. Durumlar açık kullanıcı ekranlarında 15 saniyede bir ve pencereye dönünce yenilenir.

Havuzdaki **Başvuru Türü** ilk kaynağa göre **Sistem** (girişimcinin kendisi) veya **Manuel** (yönetici eklemesi) gösterir. Ayrı **Durum** sütunu **İletildi**, **Görüntülendi**, **İnceleniyor**, **İncelendi**, **Onaylandı**, **Reddedildi** değerlerini gösterir. Yalnızca süperadmin detay ekranını açtığında, görüntülediği gönderim tarihiyle `POST /api/entrepreneurs/admin/:id/view` çağrılır; liste, PDF, normal admin görüntülemesi veya arka plandaki GET istekleri durumu değiştirmez. Eski bir detay ekranı yeni gönderimi görüntülenmiş olarak işaretleyemez. Süperadmin detay ekranından `POST /:id/review` ile inceleme/onay/ret durumunu kaydeder. Kullanıcı düzenleme yolları `POST /api/entrepreneurs/my/edit` ve `/my/cancel-edit` şeklindedir; mevcut PUT ve evrak yolları açık düzenleme taslağını kullanır.

Başvuru modeline `reviewStatus`, görüntüleme/değerlendirme metaverileri ve `editDraft` eklendi. Eski kayıtlar alan yoksa **İletildi**/**Sistem** olarak okunur; toplu veri güncellemesi veya indeks geçişi gerekmez. İçerik değiştiren işlemlerde mevcut sürüm/çakışma koruması sürer. Girişimci düzenleme yaparken yönetici yanıt düzenlemesi çakışmayı önlemek için durdurulur. Evrak kaldırma son gönderilen sürümdeki dosyayı yeniden gönderim/iptal sonucuna kadar korur; yalnızca kullanılmayan dosyalar sahiplik kontrolüyle temizlenir.

`npm run verify:entrepreneur-workflow`, geçici yerel kayıtlarla rol/sahiplik, durum geçişleri, eski gönderimin korunması, taslak/iptal/yeniden gönderim, evrak/PDF/onay ve sürüm çakışmalarını doğrular. Özgün kullanıcı ve girişimci belgelerini tam içerik özetiyle karşılaştırır; test kayıtlarını temizler.

KVKK'nın altında sırasıyla [Gizlilik Politikası](https://ideathon.anahtarfikirler.com/gizlilik-politikasi) ve [Kullanım Şartları](https://ideathon.anahtarfikirler.com/kullanim-sartlari) için iki ayrı zorunlu onay kutusu vardır. Metin başlıkları başvuru ekranında bir okuma penceresi açar; yeni sekme veya dış site açılmaz. Gizlilik ve kullanım metinleri `LegalDocumentContent` bileşeninden, bağımsız yerel sayfalarla ortak olarak gösterilir. Kapat düğmesi, Başvuruya dön veya Escape ile forma dönülür; klavye odağı açan düğmeye geri gelir. Metni açmak/kapatmak onay kutusunu otomatik işaretlemez. Üç onay da verilmeden gönderim düğmesi açılmaz; API eksik, `false` veya boolean olmayan onayları da reddeder. Taslak kaydetmek için onay gerekmez. Ek onaylar soru sayısına dahil değildir; `form.agreements` altında tutulur. Gönderimde onay cümlesi, bağlantısı, sürümü (resmi sayfalarda Mart 2026) ve sunucunun gönderim zamanı `privacy.agreements` alanında saklanır; havuz detayında görüntülenir. Tanımlar `ideathon.api/src/config/entrepreneurAgreements.js` dosyasındadır ve soru düzenleme API'siyle kaldırılamaz veya isteğe bağlı hale getirilemez.

Yeni onaylar açık başvuru taslaklarına ilk erişimde eklenir; mevcut sorular, yanıtlar, dosyalar ve KVKK metni korunur. Yeni/değişen bir metin otomatik onaylanmaz. Sürüm/revizyon artışı eski açık sekmelerin kontrolü atlamasını engeller. Önceden gönderilmiş başvurular değiştirilmez ve bu metinleri onaylamış gibi gösterilmez. Mevcut kurulumlara kod taşınırken yayımdaki soru seti ve yönetim taslağına da bu onaylar uygulanmalıdır; yerel yapılandırma yedeklenerek güncellenmiştir.

Şirketleşme Tarihi alanı `inputType: date` kullanır: kullanıcı gün/ay/yıl girebilir veya tarayıcının takviminden seçebilir. İsteğe bağlıdır. Tarih saat dilimi dönüşümü yapılmadan `YYYY-MM-DD` olarak kaydedilir; geçersiz takvim tarihleri API tarafından reddedilir.

İlerleme göstergesi zorunlu sorular ile KVKK, gizlilik ve kullanım onaylarından hesaplanır; isteğe bağlı alanlar ve belgeler boş bırakıldığında eksik görünmez. Yalnızca isteğe bağlı alanlar içeren bölümlerde "İsteğe bağlı alanlar" yazılır. Güncel Word setinde toplam 20 zorunlu alan vardır; soru seti veya zorunluluklar değiştiğinde bu sayı yeniden hesaplanır.

### Süperadmin: Dinamik soru yönetimi

Sol menüde **GİRİŞİMCİLER**, **MENTOR** ile **YÖNETİM** arasında sabit bölüm başlığıdır. **Girişimci Havuzu** ve **Girişimci Soru Seti** bağlantıları altında sürekli görünür; açılır kapanır menü kullanılmaz. Soru seti bağlantısı yalnızca süperadmine gösterilir.

Soru setinin **Bölümler** listesinde her bölümün tutamacı basılı tutularak sürüklenebilir. Bırakınca sağdaki düzenleyici taşınan bölümün sorularını ve yeni sıra numarasını gösterir; önizleme de aynı sırayı izler. Soruların yanında da bölüm içi sıralama tutamacı bulunur. Klavyeyle tutamaçta boşluk, yukarı/aşağı ok ve tekrar boşluk kullanılır; Escape taşımayı iptal eder. Sıra **Formu Kaydet** ile saklanır, **Yayımla** ile yeni başvurulara uygulanır. Gizlilik ve kullanım onayları sonunda kalır.

`http://localhost:3111/entrepreneurs/form` adresindeki **Girişimci Soru Seti** ekranı yalnızca `superadmin` rolüne açıktır. Sol menüden erişilir. Süperadmin 1–100 soru ekleyebilir/silebilir; bölüm içi sıralamayı, bölümü, soru metnini, açıklamasını, zorunluluğunu, seçeneklerini ve cevap türünü değiştirebilir. Kısa metin, uzun metin, tek seçim, çoklu seçim ve dosya yükleme desteklenir. Kısa metinlerde e-posta, telefon, web adresi, tarih ve sayı formatları seçilebilir. Dosya sınırı soru başına 1–10, dosya başına 10 MB'dır. KVKK onayı son sırada ve zorunlu kalır; aydınlatma metni düzenlenebilir.

Soru düzenleyicisinde soldaki bölüm listesinden bir bölüm seçilir; sağda yalnızca o bölümün soruları gösterilir. **Soru ekle** yeni bir alan açar; sorunun üzerine tıklanarak metni, **Cevap formatı** ve zorunluluğu düzenlenir. Kısa/uzun metin, e-posta, telefon, web adresi, sayı, tarih, **Çoktan seçmeli (tek yanıt)**, **Kutucuklar (çoklu seçim)** ve **Belge yükleme** tek menüdedir. Seçim biçimlerinde seçenekler her satıra bir tane yazılır. Bölüm seçicisi soruyu başka bölüme taşır; açıklama, karakter sınırı ve yer tutucu **Ek ayarlar** altında bulunur. Hatalı sınırlar ve tekrar eden seçenekler kayıt öncesi sorunun yanında açıklanır. Kayıt sırasında seçili bölüm ve soru korunur.

**Bölüm ekle** ve **Bölümü düzenle** bölüm adını/açıklamasını yönetir. Sorular ve bölümler yukarı/aşağı taşınabilir. Yalnızca boş bölümler silinir; dolu bir bölümdeki sorular önce taşınmalı veya silinmelidir. KVKK ve diğer zorunlu onaylar ayrı **Gizlilik ve Kullanım Onayları** alanındadır. Toplam soru/bölüm sayısı değiştikçe ekran güncellenir. API'nin 100 soru ve 20 bölüm sınırı korunur.

Soru seti sayfası her açıldığında seçim ekranıyla başlar; son kullanılan veya en güncel taslak kendiliğinden yüklenmez. **Taslaklarım** ve **Yeni Taslak** başlığın sağında yan yana, kart dışında yer alır. Kayıtlı form ancak **Taslaklarım → Düzenle** ile seçildiğinde açılır.

**Taslaklarım** penceresinin üstündeki **+ Yeni Taslak**, ana sayfadaki düğmeyle aynı boş düzenleyiciyi açar; kayıt **Formu Kaydet** ile yapılır. Listede **Düzenle** yanındaki çöp kutusu, onaydan sonra taslağı **Silinenler** bölümüne taşır; **Geri Al** son kaydedilen içerik ve sürüm geçmişiyle geri getirir. Başka bir taslağı silmek açık taslaktaki değişiklikleri korur. Açık taslağı silmek kaydedilmemiş değişiklikleri bırakır ve boş seçim ekranına döndürür. Yayımdaki soru seti korunur.

Düzenleyicideki **Taslaktan Çık** düğmesi, kaydedilmemiş değişikliklerin kaybolacağı uyarısıyla onay penceresi açar. **Kaydetmeden Çık** editörü kapatıp aynı sayfanın başlangıçtaki boş taslak seçim ekranına döndürür. **Düzenlemeye Devam Et**, Escape veya pencere dışına tıklama düzenlemeyi korur. Çıkış kayıtlı taslağı, sürüm geçmişini veya yayımdaki formu değiştirmez; kaydedilmemiş yeni taslak için kayıt oluşturmaz.

**Yeni Taslak** boş bir form açar: taslak adı ve form başlığı üst karttan yazılır, bölümler ve sorular sıfırdan eklenir. Zorunlu gizlilik onayları korunur. Sorusu olmayan taslak kaydedilebilir; en az bir başvuru sorusu eklenmeden yayımlanamaz. **Taslaklarım** ad, sürüm, soru sayısı ve tarihlerle kayıtları listeler; **Düzenle** kayıtlı taslağı açar. Liste 12 kayıtlık sayfalara ayrılır. Taslak adı yalnızca yönetim panelinde görünür; kullanıcıya gösterilen form başlığından ayrıdır. Taslaklar bu global soru setini yöneten süperadminler arasında ortaktır.

Taslaklarım'ın üstündeki **+** düğmesi aynı boş taslak akışını açar. Her aktif taslak kartındaki **Sürümler** satırı açılıp kapanır; güncel ve önceki sürümler tarih, ad ve soru sayısıyla, gerektiğinde 12 sürümlük sayfalarda listelenir. **Düzenlemeye al** o sürümü editöre yükler. Yeni sürüm kaydı aynı kartta kalır; **Yeni taslak olarak kaydet** ayrı kart oluşturur. Aktif taslaklar oluşturulma sırasındadır: yeni kayıt listenin sonuna eklenir, sürüm kaydetmek kartın yerini değiştirmez.

**Taslak adı** üst kartta ana başlık, **form başlığı** hemen altında daha küçük yazıyla görünür. Yanlarındaki kalem simgeleri yerinde düzenlemeyi açar. Enter veya alan dışına tıklama düzenlemeyi tamamlar; Escape o düzenlemeyi geri alır. Kalıcı kayıt **Formu Kaydet** ile yapılır. Ayrı **Form bilgileri** kartı ve form açıklaması düzenleme alanı kaldırılmıştır.

**Formu Kaydet**, kayıtlı bir taslak için iki seçenek sunar: **Mevcut taslağın yeni sürümü** önceki içeriği koruyarak sürümü artırır; **Yeni taslak olarak kaydet** farklı adla bağımsız bir kopya oluşturur. **Sürüm Geçmişi** önceki kayıtları tarih ve soru sayısıyla listeler. **Düzenlemeye al** eski içeriği editöre yükler; kaydetme yine yeni sürüm veya ayrı taslak oluşturur, geçmiş kayıtlar değiştirilmez. Sürümleme öncesinde üzerine yazılmış içerikler geriye dönük üretilemez; o andaki mevcut içerikten itibaren geçmiş tutulur. İlk erişimde eski tek çalışma taslağı **Mevcut soru taslağı** adıyla bir kez korunur.

Değişiklik yoksa **Mevcut taslağın yeni sürümü** seçeneği kapalıdır; aynı içerikten **Yeni taslak olarak kaydet** kullanılabilir. API de değişmeyen içerik ve adda sürüm/son kayıt tarihini artırmaz. Üst kart **Kaynak: Sürüm N** bilgisini korur; eski sürüm açıldığında ayrıca **Son kayıt: Sürüm M** ve kaydedilecek yeni sürüm gösterilir.

**Yayında** alanı yayımlama anındaki taslak adı, sürümü ve tarihi gösterir. Taslak listesi ve sürüm geçmişi yayımdaki sürümü işaretler; kaynak taslak daha sonra değişse veya silinse de yayın kimliği korunur. Yayın onayında yayımlanacak taslak/sürüm ve yerine geçeceği yayın gösterilir. **Yayın Geçmişi** sayfalı yayın kayıtlarını açar. Kaynağı önceki kodda tutulmamış mevcut/eski yayınlara tahmini taslak veya sürüm atanmaz; eski içerik aynen kullanılır. Yeni kayıtlar bundan sonraki yayınlarda oluşur.

Yeni süperadmin ucu `GET /api/entrepreneurs/admin/form/publications?page=1` olur. Güncel yayın metaverisi `entrepreneurformsettings.publication` alanında, önceki yayınların değişmez metaverileri `entrepreneurformpublications` koleksiyonunda korunur. Eski yayın, yeni yayın yazılmadan önce arşivlenir; global revizyon kontrolü eşzamanlı yazmada 409 üretir. Yayın tarihi liste indeksi `{ publishedAt: -1, _id: -1 }` otomatik indeksler kapalı ortamlarda ayrıca hazırlanabilir. Mevcut başvuru/taslak verileri için toplu geçiş gerekmez; daha önce tutulmamış yayın geçmişi geriye dönük oluşturulamaz.

Kayıtlı formdaki **Tüm Taslağı Sil**, güncel ve bütün geçmiş sürümleriyle taslağı **Taslaklarım → Silinenler** bölümüne taşır. Eski sürüm düzenlenirken de kapsam aynıdır; onay penceresi kaynak sürümü, silinecek taslağın güncel adını ve bütün sürümlerin etkileneceğini belirtir. **Geri Al** son kayıtlı içeriği ve sürüm geçmişini koruyarak taslağı yeniden listeler. Kaydedilmemiş yeni formdaki **Formu Sil** yalnızca kaydedilmemiş editörü kapatır. Kaydedilmemiş düzenlemeler saklanmaz. Silme yayımdaki soru setini veya mevcut başvuruları etkilemez. Süperadmin uçları: `POST /api/entrepreneurs/admin/form/drafts/:draftId/delete` (`revision`) ve `/restore` (`revision`, `deletedAt`); silinenler listesi `GET /api/entrepreneurs/admin/form/drafts?view=deleted`. Silinen kayda düzenleme/yayım yapılamaz. Silme ve geri alma içerik sürümünü ya da son kayıt tarihini artırmaz.

Taslak açma/kaydetme yayımdaki formu değiştirmez. **Yayımla**, kaydedilmemiş içerik varsa önce kayıt seçeneklerini, ardından ayrı bir son onay penceresini açar. Onaydan sonra kaydedilen içerik yeni başvurulara uygulanır; başlamış veya gönderilmiş başvurular kendi soru/cevap kopyasını korur. Kaydedilmemiş değişikliklerle başka bir taslağa geçerken uyarı gösterilir. Her taslağın kendi revizyonu vardır; eşzamanlı düzenlemede eski revizyonla yazma 409 döndürür. Yayım ayrıca global soru seti revizyonunu denetler. Taslak kaydı başarılı olup yayım çakışırsa taslak korunur ve yayım hatası ayrıca bildirilir. Panelde JSON indirme, seçili taslağın güncel halini yükleme ve önizleme seçenekleri bulunur.

Google Sheet/Form bağlantısı kullanılmaz. Yayımdaki soru seti MongoDB `entrepreneurformsettings` koleksiyonundaki tek kayıtta tutulur; ilk açılışta `ideathon.api/src/config/entrepreneurForm.js` içindeki Word setiyle başlatılır. Adlandırılmış taslaklar `entrepreneurformdrafts` koleksiyonundadır. Sonraki API yeniden başlatmaları süperadmin değişikliklerini sıfırlamaz. Eski yapılandırma uçları uyumluluk için korunur: `GET/PUT /api/entrepreneurs/admin/form`, `POST /api/entrepreneurs/admin/form/publish`. Kütüphane: `GET/POST /api/entrepreneurs/admin/form/drafts`, `GET/PUT /api/entrepreneurs/admin/form/drafts/:draftId`, `POST /api/entrepreneurs/admin/form/drafts/:draftId/publish`. Tümü yalnızca süperadmine açıktır. Otomatik indeks oluşturma kapalı ortamda `entrepreneurformdrafts` için benzersiz sparse `legacyKey` indeksi ve `{ createdAt: 1, _id: 1 }` liste indeksi ayrıca oluşturulmalıdır. Önceki `{ updatedAt: -1, _id: -1 }` indeksi korunur.

Önceki sürümler `entrepreneurformdraftversions` koleksiyonunda `{ draftId: 1, revision: -1 }` benzersiz indeksiyle saklanır; güncel sürüm taslak kaydındadır. İndekslerin otomatik oluşturulmadığı ortamda bu indeks de hazırlanmalıdır. Geçmiş API'si: `GET /api/entrepreneurs/admin/form/drafts/:draftId/versions?page=1` ve `GET /api/entrepreneurs/admin/form/drafts/:draftId/versions/:revision`; yalnızca süperadmin erişebilir. API revizyonu sıfırdan, ekrandaki sürüm numarası birden başlar. `npm run verify:entrepreneur-draft-versions` ayrı bir geçici yerel veritabanında geçmiş koruması, eşzamanlı kayıt, kopyalama, eski sürümü yeniden kaydetme, sayfalama, cevap formatları ve yayımlama ayrımını doğrular; sonunda sadece kendi veritabanını temizler.

İlk örnek setin açık v1/v2 taslakları Word setinin güncel başlangıç sürümüne ilk erişimde geçirilir. Eşleşen alanlar taşınır, ad-soyad ayrılır, önceki çözüm açıklamaları birleştirilir ve şehir adları normalize edilir. Eski soru ve yanıtların tamamı `previousVersions` altında saklanır ve arayüzden okunabilir. Şirket evrakları ek doküman alanına taşınır; dosyalar silinmez. KVKK otomatik onaylanmaz. Gönderilmiş örnek başvurular değiştirilmez. Geçiş kayıt revizyonunu artırır; eski açık sekmelerde kullanıcıya sürüm çakışması gösterilir.

KVKK metni başlangıçta kurum unvanı, başvuru kanalı, hukuki sebep, alıcılar ve saklama süresi için yer tutucular içerir. Kuruma ait nihai metin ve onayın hizmet koşulu olarak kullanımının hukuki uygunluğu canlıya geçmeden önce kurum tarafından tamamlanmalıdır; bu teknik alan tek başına hukuki uygunluk sağlamaz.

Yeni `entrepreneurapplications` ve `entrepreneurdocuments` koleksiyonları mevcut Ideathon kayıtlarından ayrıdır. Eski veriler için dönüşüm gerekmez. Mongoose yeni koleksiyonları, kullanıcı başına benzersiz başvuru indeksini ve havuz için `{ status: 1, submittedAt: -1, _id: -1 }` indeksini oluşturur; yayın ortamında otomatik indeksler kapalıysa bu indeksler ayrıca oluşturulmalıdır.

### Yönetim paneli: Girişimci Havuzu

**Excel'den girişimci ekleme:** “Girişimci ekle → Dosya aktararak ekle” sekmesinden güncel `.xlsx` soru seti şablonu indirilebilir. Her dosyada tek girişimcinin Yanıt sütunu doldurulur; tek seçimler açılır listeyle, çoklu seçimler ayrı satırlar veya `;` ile yazılır. Seçenekler ayrı sayfada görülebilir. Yükleme (en fazla 10 MB), kayıt oluşturmadan soru/yanıt eşleşmesini ve kişi bilgilerini önizler. Admin eksik/geçersiz/eşleşmeyen alanları kontrol eder, gerekli düzeltmeleri yapar, kontrol kutusunu işaretler ve “Havuza ekle” ile kaydeder. Manuel ekleme seçeneği de sürer.

Sorular sıra numarasına göre değil soru kodu ve birebir soru metniyle; kod yoksa soru metni/bölümle eşleştirilir. Yinelenen/kararsız eşleşmeler otomatik aktarılmaz. Sistemin ürettiği eski sürüm şablonları ve kayıt öncesi değişmiş soru seti 409 ile durdurulur; aktarım kaydında zorunlu yanıtlar doğrulanır. Genel Excel dosyasında tek bir `Soru` + `Yanıt` (veya `Cevap`) tablosu olmalıdır; isteğe bağlı `Bölüm`/`Soru kodu` sütunları desteklenir. Formüllü yanıtlar, makrolu/şifreli dosyalar ve `.xls` desteklenmez.

API uçları: admin/süperadmin için `GET /api/entrepreneurs/admin/import/formats`, `GET /import/template`; yalnızca süperadmin için `POST /import/preview` (multipart `file`). ExcelJS mevcut uygulama bağımlılığıdır; format okuyucuları ortak eşleştirme servisine bağlanır. Orijinal Excel sunucuda saklanmaz; önizleme/aktarım yeni hesap, e-posta, KVKK/onay kanıtı veya evrak oluşturmaz. Başvuru kayıtları mevcut yönetici ekleme akışıyla korunur.

Arama alanında **Tüm alanlar**, **Ad-soyad**, **E-posta** ve **Girişim adı** seçilebilir. Yazarken 250 ms kısa bekleme sonrası eşleşen kayıtlar açılan listede ve tabloda güncellenir; bir sonuç seçildiğinde başvuru detayı açılır. E-posta araması başvurudaki iletişim adresini ve bağlı hesabın kayıtlı e-postasını kapsar. Önceki istekler iptal edilir; eski arama sonuçları yeni önerilere karışmaz.

**Havuz yönetimi:** Yalnızca süperadmin **Girişimci ekle** ile hesap açmadan ad/e-posta/girişim bilgisi girerek manuel kayıt oluşturabilir; isterse başvurusu olmayan aktif bir kullanıcı hesabını seçebilir. Manuel ekleme hesabı veya gizlilik onayı üretmez, e-posta göndermez. Temel bilgiler ve başvurunun kendi soru setindeki yanıtlar **Düzenle** ile değiştirilebilir; soru seti, evraklar, onay kanıtları ve kullanıcı hesabı korunur. **Havuzdan kaldır** kayıtları silmeden **Kaldırılanlar** sekmesine taşır; **Havuza geri al** ile geri alınır. Başvuru sahibi kendi dosyasına erişmeye devam eder. Yazma işlemleri kayıt sürümüyle çakışmaya karşı korunur.

**İndeks geçişi:** Hesabı olmayan kayıtlar için `userId` isteğe bağlıdır; kullanıcı hesabı başına tek başvuru kuralı `entrepreneur_account_unique` kısmi tekil indeksiyle korunur. Eski yerel veritabanlarında `/usr/local/bin/node scripts/migrate-entrepreneur-pool.mjs` çalıştırılır. Script yalnızca `ideathon_local` üzerinde çalışır, bütün `entrepreneur*` koleksiyonlarını ve indekslerini `.local/backups/before-entrepreneur-pool-*.bson` dosyasına (600 izin) yedekler, yeni indeksi önce oluşturur, sonra eski `userId_1` indeksini kaldırır; belgeleri değiştirmez. 8 Ekim yerel geçişi tamamlandı.

`npm run verify:entrepreneur-pool` sadece geçici yerel hesap/kayıtlarla ekleme, düzenleme, kaldırma/geri alma, hesap bağlama, sürüm çakışması, rol yetkileri, normal kullanıcı başvurusu, PDF, evrak ve gizlilik onaylarının korunmasını doğrular. Test verilerini temizler; özgün girişimci belgelerinin içerik özetlerini karşılaştırır ve soru setini yayımlamaz.

Admin rolü havuzda yalnızca liste/detay, PDF ve evrak görüntüler; ekleme, Excel önizleme/aktarım, düzenleme, kaldırma/geri alma ve değerlendirme API uçları süperadmin gerektirir. Arayüz de bu işlemleri admin rolüne göstermez. Rol kontrolü güncel veritabanı hesabından yapılır; eski süperadmin tokenı rol düşürüldüğünde yazma hakkını korumaz. Girişimci kendi başvurusunu düzenlemeye devam eder.

Yönetici panelinde **Girişimci Havuzu**, `http://localhost:3111/entrepreneurs/list` adresindedir. Mevcut `admin` ve `superadmin` hesapları erişebilir. Girişimcinin **Başvuruyu Gönder** işlemiyle `submitted` durumuna geçen başvuru otomatik olarak havuzda görünür; taslaklar görünmez. Önceden gönderilmiş başvurular da aynı koleksiyondan okunur, veri taşıma gerekmez. Havuz seçili Ideathon'dan bağımsızdır.

Liste girişim adı, başvuran, e-posta, gönderim tarihi ve evrak sayısını gösterir. Girişim/ad/e-posta araması, tarih sıralaması ve sayfalama sunar. Liste özetindeki girişim adı için `venture_name`, başvuran için `first_name` + `last_name` (eski setlerde `full_name`) ve `email` kullanılır. Bu alanlar olmayan soru setlerinde hesap bilgileri gösterilir.

**Detay** bağlantısı `/entrepreneurs/:id` sayfasını açar. Her başvurunun kendi soru seti kopyası, bütün cevapları, boş bırakılan alanları ve evrakları bölüm bölüm görüntülenir; güncel soru sayısına bağlı değildir. KVKK, Gizlilik ve Kullanım Onayları alanının başında gösterilir. Onay durumu ve tarihleri görüntülenir; metin sürümü etiketleri gösterilmez; uzun aydınlatma metni bu ekranda gösterilmez, başvuru kaydında korunur. Evraklar oturum doğrulanarak panel içinde önizlenebilir veya indirilebilir. Jüri, mentor ve katılımcı rolleri yönetici uçlarına erişemez. Başvuran kendi evrakına önceki akış üzerinden erişmeye devam eder.

**PDF olarak indir** düğmesi başvuran hesabını, tarihlerini, başvuruya kaydedilmiş soru setindeki tüm yanıtları, evrak listesini, onayları ve önceki örnek form yanıtlarını tek belgede toplar. Uzun yanıtlar kesilmeden A4 sayfalara yayılır. PDF çıktısı Türkçe karakterleri destekleyen gömülü açık lisanslı Noto Sans fontuyla oluşturulur. Evrakların kendisi belgeye eklenmez; adları, boyutları ve türleri listelenir ve mevcut evrak indirme akışı korunur. Çıktılar API tarafından yerelde oluşturulur; harici bir belge servisine gönderilmez.

PDF şablonunda ilk sayfada girişim adı ve iki sütunlu başvuru özeti, devamında numaralı mavi bölüm başlıkları ve soru–cevap hiyerarşisi bulunur. Her sayfada üst bilgi, alt bilgi ve sayfa numarası gösterilir. Uzun yanıtların devam sayfalarında ilgili soru adı belirtilir; kısa yanıtlar ve bağlı onay metinleri birlikte tutulur.

Girişimci kendi gönderilmiş başvurusunu, **Başvurunuz iletildi** kartındaki **PDF olarak indir** veya **Girişimci Başvurum** ekranındaki **Başvurumu PDF olarak indir** düğmesinden aynı şablonla indirebilir. Düğme taslaklarda gösterilmez; özetin detayları kapalıyken de erişilebilir. `GET /api/entrepreneurs/my/export?format=pdf` başvuruyu yalnızca oturumdaki kullanıcının kimliğiyle seçer; istemciden verilen başvuru veya kullanıcı kimliği başka hesaba erişim sağlamaz. Gönderilmemiş başvurular indirilemez. İndirme sırasında durum/hata ve tekrar deneme gösterilir; sayfadan ayrılınca bekleyen istek ve geçici dosya adresi temizlenir.

API uçları: `GET /api/entrepreneurs/admin` (arama/sayfalama), `GET /api/entrepreneurs/admin/:id` (detay), `GET /api/entrepreneurs/admin/:id/export?format=pdf` (dışa aktarma), `GET /api/entrepreneurs/admin/:id/documents/:documentId` (evrak). Evrak erişimi hem başvuru durumunu hem evrakın başvuruya ait olduğunu kontrol eder. Yanıtlar `no-store` kullanır. Süperadmin inceleme/onay/ret durumunu başvuru detayından yönetir; jüri atama akışı eklenmemiştir.

Dışa aktarma da mevcut detay erişimiyle aynı admin/superadmin yetkisini ve yalnızca gönderilmiş başvuru koşulunu kullanır.

Doğrulama: kökte `npm run verify:entrepreneurs`; API'de `npm run test:entrepreneurs`; frontend'de `npm run test:auth`. Entegrasyon testi yalnızca `ideathon_local` veritabanında çalışır ve kendi test kullanıcılarını, başvurularını ve evraklarını sonunda temizler.

Ek regresyon testleri: frontend'de `npm run test:entrepreneurs`; kökte `npm run verify:entrepreneur-form`. Tarayıcı testi çalışan yerel frontend ve Google Chrome gerektirir (`CHROME_BIN` ile yolu değiştirilebilir). Gerçek form bileşenini geçici bir sayfada, ayrı tarayıcı profili ve taklit API ile sınar: geçişi iptal etme, otomatik kayıt, geciken yanıt sırasında yazma, bağlantı hatası, geri tuşuyla kurtarma, metin başlıklarının sırası, aynı ekranda iki metni okuma, odak/arka plan kaydırma yönetimi, kapatınca forma dönüş, üç ayrı zorunlu onay kutusu ve gönderim. `verify:entrepreneurs` eksik/geçersiz onayları API'de reddetmeyi, açık taslakların onay geçişini ve havuz detayındaki onay kayıtlarını da doğrular. Geçici sayfa/profil ve test kayıtları sonunda silinir; mevcut oturum ve başvurular kullanılmaz.

`npm run verify:entrepreneur-drafts`, gerçek yönetim formu bileşeniyle taslak listeleme/açma, adlandırılmış kopya, bağımsız kaydetme, yeniden adlandırma, kaydedilmemiş değişikliklerde geçişi iptal etme, tekrar açma, sürüm çakışmasında yanıtı koruma ve seçilen taslağı yayımlamayı, dinamik soru/bölüm ekleme-silme-sıralamayı, tüm cevap formatlarını, önizlemeyi ve seçenek doğrulamasını sınar. Ayrı Chrome profili, geçici sayfa ve bellekte taklit API kullanır; gerçek taslakları veya oturumu değiştirmez. `verify:entrepreneurs` aynı akışların gerçek API/veritabanı ve yetki kontrollerini geçici kayıtlarla doğrular.

## Doğrulama

7 Ekim 2026 tarihinde dört arayüzde deneme hesaplarıyla tarayıcıdan giriş doğrulandı. Beş servisin HTTP kontrolleri, dört rolün API girişleri, oturum doğrulama, mentor/katılımcı Socket.IO bağlantıları, CORS ve panellerin çerez ayrımı başarılı. `npm run stop` / `npm run dev` ve çalışan servislerde tekrar `npm run dev` akışları kontrol edildi. Tüm uygulama özelliklerinin uçtan uca testi veya üretim derlemesi bu yerel kurulum doğrulamasının kapsamına dahil değildir.
