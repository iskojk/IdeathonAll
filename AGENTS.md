# Ideathon — agent devir notu

## 9 Ekim 2026 — Taslaklarım üzerinden ekleme ve silme

Taslaklarım penceresinin üstüne + Yeni Taslak, aktif listede her Düzenle düğmesinin yanına erişilebilir çöp kutusu düğmesi eklendi. Yeni Taslak ana sayfadaki aynı boş taslak akışını kullanır; kaydedilmemiş değişiklik varsa mevcut onay korunur, vazgeçilirse liste ve düzenleme açık kalır. Onaylanınca liste kapanır ve boş editör açılır; kayıt Formu Kaydet ile yapılır.

Liste silmesi mevcut revizyon kontrollü silme API'sini ve ortak onay penceresini kullanır; başarıda liste yenilenir, son sayfa boşaldıysa geçerli son sayfa yüklenir. Başka bir taslağın silinmesi açık düzenlemeyi korur; açık taslak siliniyorsa kaydedilmemiş değişiklik uyarısı gösterilir ve editör boş seçim ekranına döner. Silinenler/Geri Al, sürüm geçmişi ve yayım koruması sürer. API/veritabanı değişmedi.

Doğrulama: genişletilmiş verify:entrepreneur-drafts gerçek React editörü ve yalnızca bellekteki API ile liste silme/vazgeçme/409 hatası/geri alma, başka açık düzenlemenin korunması, seçili taslağın silinmesi, yayın ve sürüm geçmişi koruması, listeden yeni boş taslak açma/kaydetme ve kaydedilmemiş değişiklikte yeni taslaktan vazgeçme/onay dahil geçti. Önceki tam taslak/sıralama/çıkış regresyonları da geçti. JSX ve diff kontrolü geçti; yerel servisler sağlıklı. Gerçek taslak kaydı/silme/yayımı veya push yapılmadı. Önceki kaynaklar .local/ui-checkpoints/draft-library-actions-2026-10-09/ içinde Git dışında korunur.

## 9 Ekim 2026 — soru taslağından çıkış

Üst kontrol kartına Taslaktan Çık düğmesi eklendi. Tıklayınca kaydedilmemiş değişikliklerin kaybolacağını açıklayan dialog açılır. Düzenlemeye Devam Et / Escape / dışarı tıklama yalnızca dialogu kapatır, düzenlemeyi korur. Kaydetmeden Çık, editörün seçim/içerik/geçmiş/kayıt/yayın dialog durumlarını temizleyip aynı girişimci soru seti sayfasının başlangıçtaki boş seçim ekranına döner; kaydırma üste ve odak Taslaklarım'a alınır. Kayıtlı taslak/sürüm/yayım değiştirilmez, yeni kayıt oluşturulmaz. İşlem sürerken düğmeler kapalıdır. API/veritabanı değişikliği yoktur.

Doğrulama: JSX ve git diff --check geçti; soru seti sayfası HTTP 200. Genişletilmiş verify:entrepreneur-drafts gerçek editör ve yalnızca bellekte API ile kayıtlı/değişmiş/yeni taslakta çıkış, onaydan önce uyarı, vazgeçme/Escape içerik koruması, boş ekrana dönüş, yeniden açılışta son kayıt, çıkışta taslak/sürüm/yayın ve yazma sayısının değişmemesi dahil geçti. Mevcut tam taslak/sıralama/yayın regresyonları da geçti. Gerçek taslak kaydı/yayımı/silme veya push yapılmadı. Önceki kaynaklar .local/ui-checkpoints/exit-question-draft-2026-10-09/ içinde Git dışında korunur.

## 8 Ekim 2026 — yayın kimliği/geçmişi ve taslak sürüm göstergeleri

Soru setinde Yayında alanı, taslak listesinde yayın işareti, taslak/sürüm adını ve yerine geçeceği yayını gösteren onay, sayfalı Yayın Geçmişi eklendi. Güncel yayın metaverisi settings.publication içinde; eski yayın metaverisi yeni yayın öncesi EntrepreneurFormPublication koleksiyonuna arşivlenir. Global revizyon CAS kontrolü ve eski yayın uçları korunur; kaynağı tutulmamış eski yayına tahmini taslak/sürüm atanmaz. Taslak yeniden adlandırma, düzenleme ve silme yayındaki kaynak adını/sürümünü değiştirmez. Yeni GET /api/entrepreneurs/admin/form/publications yalnızca süperadmine açıktır. Şema geriye uyumludur, mevcut içerik için toplu geçiş yapılmadı.

Üst kart Kaynak: Sürüm N gösterir; geçmişten açılınca Son kayıt ve kaydedilecek yeni sürüm ayrıca görünür. Kaynak bilgisi düzenlemeye başlayınca kaybolmaz. İçerik değişmediyse yeni sürüm seçeneği kapalı, ayrı kopya açık kalır; API de eşdeğer içerikte kayıt tarihini ve revizyonu artırmaz. Yanıltıcı kaydedildi mesajı kaldırıldı.

Doğrulama: API 33/33 test ve genişletilmiş verify:entrepreneur-draft-versions izole veritabanında no-op kayıt, yayın kimliği/geçmişi, eşzamanlı yayın, sayfalama, kaynak düzenleme/silme koruması ve eski yayın uyumluluğuyla geçti. verify:entrepreneur-drafts gerçek editör ve yalnızca bellekteki API ile yayın onayı/göstergesi/geçmişi, eski/güncel/yeni sürüm etiketleri, değişmeyen kayıtta kopyalama, mevcut tam taslak/sıralama/önizleme akışlarıyla geçti. Gerçek yeni uçta süperadmin 200/kullanıcı 403, soru seti sayfası 200 doğrulandı; gerçek girişimci belgeleri işlem öncesi içerik özetleriyle birebir korundu. API yeniden başlatıldı. Gerçek taslak kaydı veya yayımlama yapılmadı; production build/push yapılmadı. Önceki kaynaklar .local/ui-checkpoints/draft-publication-and-version-status/ içinde Git dışında korunur.

## 8 Ekim 2026 — form başlıklarını üst kartta düzenleme

Ayrı Form bilgileri kartı ve Form açıklaması alanı kaldırıldı. Taslak adı üst kontrol kartında ana başlık; form başlığı hemen altında küçük yazıyla gösterilir. Her satırdaki kalem simgesi yerinde düzenlemeyi açar. Enter/alan dışına tıklama düzenlemeyi tamamlar; Escape o düzenleme başlangıcındaki değeri geri getirir. Formu Kaydet mevcut sürüm/kopya akışını kullanır. Mevcut description verileri silinmedi; düzenleme alanı kaldırıldı. Yeni boş taslak taslak adı alanına odaklanır.

JSX sözdizimi, diff kontrolü ve yerel sayfanın HTTP 200 derlemesi geçti. Chrome'da başlık/alt başlık yerleşimi, eski kartın kaldırılması, kalemle düzenleme, Enter ve Escape davranışı kontrol edildi. Gerçek taslak kaydedilmedi/yayımlanmadı. Mevcut UI regresyon fixture'ı yeni başlık alanlarına uyarlandı; tam otomatik tarayıcı testi çalıştırılmadı. Önceki kaynak `.local/ui-checkpoints/inline-form-headings/EntrepreneurFormEditor.jsx` içinde.

## 8 Ekim 2026 — soru formunu silme ve geri alma

Kontrol kartının alt satırında kırmızı çöp kutulu **Formu Sil** bulunur. Onayda kaydedilmemiş yeni form kapatılır; kayıtlı form `deletedAt/deletedBy` ile Silinenler'e taşınır. Taslaklarım'da Taslaklar/Silinenler sekmeleri ve Geri Al vardır. Onaydan Düzenlemeye Devam Et ile çıkılır. Kaydedilmemiş değişiklikler bırakılır; yayımdaki form/başvurular değişmez.

Yeni silme/geri alma uçları yalnızca süperadmine açıktır. Liste ve get/save/history/publish silinen kayıtları dışlar; eski `legacyKey` taslağı silinince yeniden ithal edilmez. Silme içerik revizyonunu ve updatedAt'ı değiştirmez; yazma silinmemiş olma koşuluyla CAS kullanır. Geri alma liste revizyonu ve birebir silinme zamanını kontrol eder. Önceki sürümler korunur, veri geçişi gerekmez.

API 33/33 test; genişletilmiş `verify:entrepreneur-draft-versions` izole veritabanında silme/geri alma, geçmiş/yayım koruma, silinen forma yazma/yayım retleri ve legacy tekrar oluşturma kontrolüyle geçti. Yerel gerçek API'de geçici taslakla POST silme/geri alma, eski revizyon 409, silinmiş içerik 404, normal admin 403 geçti; geçici taslak temizlendi. API yeni kodla yeniden başlatıldı. JSX kontrolü geçti; Chrome'da kayıtlı formun silme onayı ve düzenlemeye dönüşü kontrol edildi, gerçek taslak silinmedi. Geri dönüş kopyaları `.local/ui-checkpoints/delete-question-draft/` içinde.

## 8 Ekim 2026 — soru seti kontrol kartının görünümü

Kontrol kartı kompakt iki satıra dönüştürüldü: üstte solda taslak adı/sürüm/kayıt durumu, sağda Önizle–Formu Kaydet–Yayımla; ince alt satırda son kayıt tarihi ve geçmiş/indirme/yenileme araçları. Dar ekranda gruplar alt alta yerleşir. Nötr düğmelerin hover yazı rengi okunabilir tutulur. Değişiklik yalnızca görseldir; kayıt ve yayın davranışı aynı kalır. Önceki kaynak `.local/ui-checkpoints/compact-form-toolbar/EntrepreneurFormEditor.jsx` içinde korunur. JSX sözdizimi, yerel sayfanın HTTP 200 derlemesi ve Chrome'da kayıtlı taslak görünümü doğrulandı; taslak kaydı/yayımı yapılmadı.

## 8 Ekim 2026 — taslak seçimiyle açılış ve ara adımdan yeniden gönderim

Soru seti sayfası artık otomatik taslak yüklemez; ilk açılış yalnızca form ayarlarını alır. Taslaklarım/Yeni Taslak sağ üstte kart dışında yan yanadır. Düzenleyici, kayıt/yayım kontrolleri ve soru alanları sadece taslak seçildikten veya Yeni Taslak açıldıktan sonra görünür. Sayfa yeniden açılınca seçim sıfırlanır. Kayıtlı taslaklar ve yayımdaki form değiştirilmedi.

Başvurumu Düzenle akışında her adımın Devam Et düğmesi sağında Güncelle ve Gönder vardır; son adımda da aynı düğme kullanılır. Native modal “Değişiklikleri kaydetmek ister misiniz?” başlığıyla Güncelle ve Gönder / Düzenlemeye Devam Et seçeneklerini açar. Devam/ESC bölüm, yanıt ve kaydırmayı korur. Modal açıkken otomatik kayıt bekler; gönderim sırasında tekrar tıklama engellenir. Onay mevcut tam-form doğrulamasıyla yeniden gönderir; başarı aynı `/girisimciler/basvuru` sayfasının başvuru özetini gösterir. Alan hatasında modal kapanır, ilgili bölüm açılır; bağlantı hatası modal içinde gösterilir. İlk başvuru gönderimi son adımda kalır. API/veritabanı değişmedi.

Doğrulama: frontend 3/3 test, değişen JSX dosyalarının sözdizimi ve yerel sayfaların HTTP 200 derlemesi geçti. Chrome'da sağ üst butonlar, boş açılış, taslak seçme ve yenileyince seçimin temizlenmesi doğrulandı. Gerçek form bileşeniyle yalnızca bellekte çalışan geçici sayfada ara adım, güncel yanıt, modal/odak, düzenlemeye dönüş, başka bölümdeki zorunlu alan hatasına yönlendirme ve onaydan sonra tek gönderim/İletildi özeti kontrol edildi. Deneme sekmesi ve geçici sayfa kaldırıldı; gerçek başvurular kullanılmadı. Admin regresyon fixture'ının otomatik taslak varsayımı güncellendi, tam otomatik tarayıcı testi yeniden çalıştırılmadı. Kaynak geri dönüş kopyaları `.local/ui-checkpoints/draft-selection-and-quick-submit/` içinde.

## 8 Ekim 2026 — boş soru taslağı, kayıt seçenekleri ve sürüm geçmişi

Mevcut yayımdaki 20 soruluk set **Mevcut soru seti — 8 Ekim 2026** adıyla yeni bir taslak olarak korundu. Önceki taslaklar ve yayımdaki form değiştirilmedi. Kaynak kopyaları, özel BSON yedeği ve korunan kayıt kimliği `.local/ui-checkpoints/question-set-versioning/` altında; kullanıcı çalışırken bu yedeği topluca geri yüklemeyin.

**Yeni Taslak** boş bölüm/soru düzenleyicisini açar; zorunlu gizlilik onayları korunur. **Formu Kaydet** mevcut taslağı yeni sürüm olarak kaydetme veya ayrı adla yeni taslak oluşturma seçeneklerini sunar. **Sürüm Geçmişi** önceki içeriği düzenlemeye alabilir; kaydetmek yeni sürüm/kopya üretir. Soru tutamaçları fare/dokunmatik/klavye ile bölüm içi sıralar; görünür bölüm seçicisi başka bölüme taşır. Metin, tek seçim, kutucuklar ve belge yükleme dahil mevcut cevap formatları korunur. Boş taslak saklanabilir ama başvuru sorusu olmadan yayımlanamaz. Yayım ayrı onay gerektirir.

Yeni `EntrepreneurFormDraftVersion` modeli önceki içeriği kayıt revizyonu artırılmadan önce saklar; `{draftId:1, revision:-1}` benzersiz indeksi vardır. Güncel sürüm mevcut taslak belgesinde kalır. Geçmiş listeleme/içerik uçları yalnızca süperadmine açıktır. Sürümleme öncesinde üzerine yazılmış içerikler geri üretilemez; var olan son sürümden itibaren arşivlenir. Standalone MongoDB ile çalışır, mevcut başvuru verilerine geçiş gerektirmez.

Doğrulama: API girişimci testleri 33/33; `verify:entrepreneur-draft-versions` izole veritabanında boş taslak, dört cevap biçimi, sıra, sürüm koruma, eşzamanlı 409, bağımsız kopya, eski sürümü yeniden kaydetme, geçmiş sayfalama ve yayımlama ayrımıyla geçti. Gerçek yeni geçmiş uçları HTTP 200. Chrome'da boş taslak, bölüm/soru ekleme, format seçimi, iki kayıt seçeneği, klavyeyle soru sıralama/iptal kontrol edildi. Kaydedilmemiş deneme içeriği bırakılıp korunan taslak tekrar yüklendi. JSX/derleme kontrolü geçti; UI regresyon fixture'ı yeni akışa uyarlandı ama tam otomatik tarayıcı testi yeniden çalıştırılmadı. API yeniden başlatıldı; yayımlama/push yapılmadı.

## Son arayüz güncellemesi — girişimci detay bölümleri

Girişimciler altındaki tüm `/entrepreneurs` ekranlarında üst Ideathon seçicisi gizlidir (havuz, soru seti, başvuru detayı ve sonraki alt sayfalar). Admin başvuru detayındaki bölüm kartları ve numaralı soru/yanıt alanları native details/summary ile ayrı ayrı açılır kapanır; başlangıçta kapalıdır. Gizlilik kartı da kapalı başlar. Kaynakların JSX sözdizimi ve yerel havuz/soru seti/detay sayfalarının HTTP 200 derlemesi doğrulandı. Bu değişiklikte veri veya API akışı değiştirilmedi.

## Son güncelleme — PDF önizleme, düzenleme ve telefon tekilliği

- Başvuru düzenlemesinin son adımı: Değişiklikleri Kaydet (yeniden gönderim, durum İletildi) / İptal Et (son gönderilen başvuruya dönüş). Erken adımda Enter gönderim yapmaz.
- Girişimci ve admin PDF dışa aktarımı, ayrıca PDF evrak indirmesi aynı ekranda önizleme açar; dosya yalnızca açılan penceredeki İndir ile kaydedilir. İstekler kapanışta iptal edilir, blob adresleri temizlenir.
- Havuz kaldırma simgesi çöp kutusu; havuzda üst Ideathon seçicisi gizli. Kişisel başvuru başlıkları BAŞVURAN / GİRİŞİM ADI / BAŞVURU TARİHİ. Soru seti Yayımla son onay penceresiyle çalışır.
- Girişimci kayıt telefonu zorunlu; User.phoneKey normalize edilmiş benzersiz kısmi indekstir. Eski 5 mükerrer telefon grubu korunur; bir temsilci numarayı ayırır, kayıt ön kontrolü anahtarsız eski kayıtları da kontrol eder. 528 anahtar eklendi. Özgün telefon/e-posta/parola/kullanıcı bilgileri değişmedi.
- `scripts/migrate-user-phones.mjs` yalnızca ideathon_local üzerinde özel BSON yedeğiyle, tekrar çalıştırılabilir. Yedek `.local/backups/before-user-phone-uniqueness-*.bson`, izin 600. Üretime aktarımda veri geçişi ayrıca hazırlanmalı.
- `verify:registration`, `verify:auth`, `verify:entrepreneur-workflow` ve API `test:registration` kontrolleri geçici kayıtları temizler.
- Son kontroller: API 33 girişimci + 2 telefon testi; frontend 7 auth + 3 girişimci testi; verify:registration / verify:auth / verify:entrepreneur-workflow / verify:entrepreneur-pool geçti. Beş servis HTTP 200. Değişen React kaynakları ve UI fixture dosyaları JSX sözdizimi kontrolünden geçti. Tarayıcı yenilenen sekmelerde boş içerik döndürdüğü için PDF/yayımlama pencereleri görsel olarak doğrulanamadı; üretim build çalıştırılmadı.


## 8 Ekim 2026 — girişimci değerlendirme ve yeniden gönderim

Yeni istek: menüde DASHBOARD→IDEATHONLAR, MENTOR→MENTORLAR; başvuru tarihi etiketleri; havuzda Başvuru Türü (Sistem/Manuel) ve ayrı Durum sütunu. Süperadmin detay ekranı, görüntülediği gönderim tarihiyle ayrı POST /view çağırır ve İletildi→Görüntülendi yapar. Liste/GET/PDF/normal admin okuması durumu değiştirmez. Süperadmin detayında İnceleniyor/İncelendi/Onaylandı/Reddedildi seçilip kaydedilebilir; arka uç bu yolları yalnızca süperadmine açar.

Kullanıcı Başvurumu Düzenle ile ayrı editDraft oluşturur; havuz/PDF son gönderilen cevap/evrak/onay sürümünü korur. Taslak ve yüklemeler editDraft'a yazılır. Yeniden gönderim zorunlu cevapları/onayları kontrol eder, son sürümü değiştirir, yeni tarih atar, değerlendirme/görüntüleme metaverisini temizler ve İletildi yapar. İptal eski gönderimi korur. Kullanıcıya bağlı manuel başvuru düzenlense de kaynağı Manuel kalır. Açık kullanıcı ekranında durum 15 saniyede bir/focus'ta yenilenir. Yönetici içerik düzenlemesi açık kullanıcı düzenlemesiyle çakışırsa 409 döner.

Şema eklemeleri geriye uyumludur; mevcut kayıtları dönüştürmeyin/silmeyin. Ayrı editDraft'ın cevapları yöneticiye gönderilmez. Kaldırılan evraklar gönderim/iptale kadar korunur, yalnızca kullanılmayan test/kullanıcı taslağı evrakları sahiplik kontrolüyle temizlenir. Geri dönüş kopyası `.local/ui-checkpoints/entrepreneur-before-review-resubmission-*/` içindedir. `verify:entrepreneur-workflow` geçici verilerle tamamlandı ve özgün kullanıcı/başvuru/evrak/soru setleri birebir korundu. API birim testleri 33/33, ön yüz auth 7/7 ve girişimci 3/3 geçti. `verify:entrepreneur-pool` Excel/arama/havuz regresyonları geçti ve özgün belgeler korundu. Chrome’da menü adları/sütunlar, kullanıcı düzenleme düğmesi ve geçici başvuruda Görüntülendi→İncelendi seçimi/kaydı/havuza yansıması doğrulandı. Geçici arayüz başvurusu temizlendi. Yerel API son kodla yeniden başlatıldı; arayüzler çalışır. Push/yayın yapılmadı.

## 8 Ekim 2026 — girişimci doğrudan kayıt akışına geri dönüldü

Kullanıcı “SMTP protokolünü geri çek, eski usul kayıt almaya devam edeceğiz” dedi. Girişimci e-posta OTP ekranı, geçici kayıt modeli/servisi/API yolları, ayrı gerçek SMTP transportu ve Mailpit manuel relay hazırlığı kaldırıldı. `/girisimciler/register` yeniden ortak `/api/auth/register` üzerinden hesap/JWT oluşturur ve doğrudan başvuru sayfasına geçer. SMS kurulmadı. Ortak şifre sıfırlama/toplantı SMTP akışları, mevcut hesap/başvurular ve diğer girişimci geliştirmeleri korunur. API .env içinden yalnızca yeni ENTREPRENEUR_SMTP_* / ENTREPRENEUR_MAIL_FROM alanları çıkarıldı; ortak SMTP/parolalar değişmedi. Önceki çalışma `.local/ui-checkpoints/registration-before-direct-restore-2026-10-08/` içinde Git dışı özel kopya olarak korunur; otomatik yeniden etkinleştirmeyin. Veritabanındaki önceki hesaplar veya OTP metaverileri için silme/geçiş yapılmadı.

Doğrulama tamamlandı: ön yüz auth testleri 7/7 ve `npm run verify:auth` geçti. Normal/girişimci kayıtları doğrudan hesap/JWT oluşturur; OTP adımı ve kayıt e-postası yoktur. Giriş, oturum, şifre sıfırlama ve başvuruya yeniden erişim doğrulandı; test hesapları/taslakları/e-postaları temizlendi. Kayıt sayfası HTTP 200, kaldırılan OTP başlangıç yolu 404 döner. API yeniden başlatıldı; diğer uygulamalar korunur. Push veya canlıya yayın yapılmadı.

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
- İlk kurulumda beş demo etkinlik, yönetici/jüri/mentor/katılımcı hesapları ve mentor profili oluşturuldu. 8 Ekim'deki ayrı veritabanı aktarımı sonrasında gerçek etkinlik kayıtları da yerelde mevcuttur; aşağıdaki aktarım notunu okuyun. Seed yalnızca belirtilen yerel veritabanında çalışır ve mevcut kayıtları sıfırlamaz.
- E-postalar yerel Mailpit'e gider. Google/Microsoft/Zoom OAuth ayarları sağlanmadı. Redis geliştirmede gerekli değil.

## Tamamlanan doğrulama ve sonraki geliştirmeler

### 8 Ekim 2026 — Emlak Db.zip yerel veri aktarımı

Kullanıcı, `/Users/ismailbekar/Downloads/Emlak Db.zip` verilerini girişimci geliştirmeleri korunarak yerel sistemin boş alanlarına aktarmayı istedi. Aktarım `ideathon_local` üzerinde tamamlandı; canlı sisteme veya Git'e veri gönderilmedi. 7 etkinlik, 790 kullanıcı (776 kaynak + 14 mevcut), 308 katılımcı başvurusu, 164 takım (160 aktif), 892 jüri değerlendirmesi, 16 mentor profili (15 kaynak + 1 mevcut), 165 mentor görüşmesi ve 113 iletişim mesajı bulunur. Diğer mentorluk/mesajlaşma koleksiyonları da taşındı. Beş demo etkinliğin `_id` değerleri korundu, kaynak etkinlikler slug ile eşlendi ve bu etkinliklerin demo içerikleri arşivdeki ayarlarla değiştirildi. Etkinlik adları artık gerçek adlardır; kaynakta kayıt/başvuru açma bayrakları kapalıdır. Girişimci akışı bağımsız kalır.

**Korunanlar:** `entrepreneur*` koleksiyonlarının tümü, 8 girişimci başvurusu, 10 evrak, soru seti ve taslağı ile mevcut yerel hesaplar. Aktarım öncesi/sonrası her belgenin tam içerik özeti karşılaştırıldı. `verify:entrepreneurs` soru içeriğini geri getirirken `revision` ve `updatedAt` artırır; bu çalışmada yalnızca testin değiştirdiği iki alan eşzamanlılık ve tam içerik kontrolüyle yedekteki değerlerine geri alındı. Kullanıcı gerçek düzenleme yaptıysa bu tür metaveri geri yüklemesini yapmayın.

**Uyarlamalar ve eksikler:** 3 gerçek Google OAuth entegrasyon kaydı ve eski şifre sıfırlama kodları taşınmadı. Aynı etkinlikte aynı ada sahip iki takım çiftindeki ikinci kayıt `(2)` ekiyle ayrıldı; özgün ad `localImportOriginalTeamName` alanında korunur. Kimliğe bağlı değerlendirme adları eşleştirildi. Ana dashboard sayacı eski boş `Mentor` yerine `MentorProfile` ile aktif profilleri sayar. ZIP'te 151 sunum dosyası ve 12 mentor fotoğrafının kendisi yoktur; yalnızca yolları/metaverileri vardır. Kaynak arşivdeki 15 kullanıcı rolü, 14 görüşme saati ve 29 kural referansının hedefi eksiktir; bunlar için kayıt uydurulmadı.

**Yedek ve gizlilik:** `.local/backups/before-emlak-import-2026-10-08.archive.gz` tam veritabanı/indeks yedeğidir (izin 600). Özel JSON'lar, aktarım/son kontrol scriptleri ve manifestler `.local/db-import-2026-10-08/` içindedir; Git'e eklemeyin. Yedek izole `ideathon_import_preview_20261008` veritabanına geri yüklenip aynı aktarım ve indeks kontrolleri önce orada geçti. Geri dönüş gerektiğinde bu yedek kullanılır; mevcut veritabanını kullanıcı istemeden sıfırlamayın. Yerel e-postalar Mailpit'te kalır, mevcut `.env` ve parolalar değiştirilmedi.

Son doğrulama: `npm run verify`, `npm run verify:entrepreneurs`, yedi etkinliğin filtreli API listeleri ve başvuru/takım detayları geçti. Dashboard 308 başvuru, 892 değerlendirme ve 16 aktif mentor profili gösterir; Chrome'da dolu başvuru tablosu açıldı. API yeniden başlatıldıktan ve test metaverileri geri alındıktan sonra tüm özgün hesaplar ve girişimci belgeleri tekrar birebir karşılaştırıldı. Beş servis HTTP 200, Docker servisleri sağlıklı. Deneme veritabanı doğrulama sonunda kaldırıldı; tam yedek korunur.

### 8 Ekim 2026 — arayüz geliştirmeleri ve devam noktası

Kullanıcı bu noktada ara verdi ve yapılan değişikliklerin `iskojk/IdeathonAll` deposunun `main` dalına push edilmesini istedi. Son tamamlanan özellik soru setindeki bölümlerin tutamaçla sürüklenerek sıralanmasıdır. Yeni bir özellik isteği gelene kadar bu noktadan devam edin. Canlıya yayın istenmedi.

- Girişimci başvuru formunun kaydırma düzeni, başvuru özeti ve tipografisi iyileştirildi. Gönderilmiş başvuruyla tekrar girişte girişimci sayfası tamamlanmış başvuru görünümünü kullanır. **Başvurumu Görüntüle** düğmesi üstteki bilgi alanının %60 genişliğinde ve ortalıdır.
- Gizlilik politikası ve kullanım şartları yerel içerikle aynı ekranda bir dialog içinde açılır. KVKK, numaralı soru yerine **Gizlilik ve Kullanım Onayları** alanında ilk sıradadır; onaylarda metin sürümü etiketi gösterilmez.
- Yönetici havuzunun durum/işlem sütunları ve başvuru detayları düzenlendi. Detay ekranında yalnızca mavi **PDF olarak indir** düğmesi vardır. PDFKit ve lisanslarıyla eklenen Noto Sans fontları Türkçe karakterleri destekler; uzun içerik tek bir raporda gerektiğinde birden fazla sayfaya yayılır.
- Dinamik soru editörü sadeleştirildi: bölüm ekleme/adlandırma/sıralama, soru ekleme/silme/taşıma ve cevap formatı düzenleme desteklenir. Taslak kütüphanesi, kayıt, kopyalama, önizleme, yayımlama ve çakışma koruması sürer. KVKK uyarı bandı kaldırıldı.
- Sol menüde **GİRİŞİMCİLER**, **MENTOR** ile **YÖNETİM** arasında sabit başlıktır. Havuz ve süperadmine özel soru seti altında sürekli görünür.
- **Bölümler** listesindeki tutamaçlar mevcut dnd-kit paketleriyle fare/dokunmatik/klavye sıralaması sağlar. Bırakıldığında sağda taşınan bölümün soruları ve güncel sıra numarası açılır; önizleme ve taslak içeriği aynı sırayı kullanır. Escape iptal eder. Gizlilik bölümü sonda sabit kalır. Sıra taslak kaydıyla saklanır, yayımlamayla yeni başvurulara geçer.

Doğrulama: API girişimci birim testleri (25), ön yüz girişimci birim testleri, `verify:entrepreneurs` ve `verify:entrepreneur-form` geçti. Son değişiklikten sonra `verify:entrepreneur-drafts` fare/klavye sürükleme, iptal, sağ içerik eşleşmesi, önizleme ve yeniden açılışta sıranın korunması dahil geçti. Yerel Chrome'da menü geçişleri, bölüm tutamaçları ve sağ içerik güncellemesi kontrol edildi. Gerçek soru taslağına test değişiklikleri kaydedilmedi; geçici sıralama geri alındı. PDF indirmesi ve Türkçe karakterlerin çıktısı kontrol edildi. Production build tüm projeler için henüz doğrulanmadı.

Geri dönüş kopyaları `.local/ui-checkpoints/` altında ve Git dışındadır. Son kopyalar: `sections-before-drag-sort-2026-10-08/`, `sidebar-before-entrepreneurs-group-2026-10-08/`, `entrepreneur-form-editor-before-simple-builder-2026-10-08.jsx` ve `entrepreneurs-before-compact-submitted-2026-10-08.js`. Beğenilmezse yalnızca istenen özelliği geri alın; diğer değişiklikleri koruyun.

7 Ekim 2026: dört arayüzde tarayıcıdan giriş ve giriş sonrası ekranlar, beş servisin HTTP yanıtları, rol bazlı API oturumları, mentor/katılımcı Socket.IO ve CORS, panellerin çerez ayrımı başarılı. `npm run stop` / `dev` ve tekrar `dev` doğrulandı. Tüm iş akışları ve production build henüz doğrulanmadı.

Yeni geliştirmeyi ilgili proje klasöründe yap; etkilenen akışları test et. Canlıya entegrasyon istendiğinde önce güncel upstream kodu ve yayın yöntemi doğrulanmalı, geliştirme farkları buna göre birleştirilmeli. Veritabanı şeması değişirse veri geçişi ayrıca hazırlanmalı.

### 8 Ekim 2026 — girişimci havuzu yönetimi

Admin/süperadmin havuza elle ekleme, mevcut hesabı seçme, temel bilgileri ve dinamik yanıtları düzenleme, geri alınabilir havuzdan çıkarma ve geri alma işlemlerini kullanabilir. Hesapsız kayıt `source: admin` ve `contact` alanlarıyla aynı koleksiyonda tutulur; kullanıcı hesabı veya onay kanıtı oluşturulmaz, mail gönderilmez. Havuzdan çıkarma `archivedAt` ile yapılır; başvuru, evrak ve başvuru sahibinin erişimi korunur. Admin yazmaları `__v` üzerinden karşılaştırılır/artırılır; gizlilik yanıtları ve form kopyası değiştirilemez. Soru seti düzenleme yetkisi süperadminde kalır.

Şema geçişi: `scripts/migrate-entrepreneur-pool.mjs` yerelde çalıştırıldı. `.local/backups/before-entrepreneur-pool-*.bson` bütün girişimci koleksiyonlarını/indekslerini korur (600 izin). `entrepreneur_account_unique` kısmi tekil indeks, hesap başına tek başvuru kuralını sürdürür; önce yenisi oluşturulup sonra eski `userId_1` kaldırıldı. Başvuru belgeleri aynen korundu. Diğer ortamlar için geçiş ayrıca hazırlanmalıdır; script yerel URI dışında durur.

Doğrulama: API girişimci birim testleri 28/28; `npm run verify:entrepreneur-pool` geçti (admin/süperadmin CRUD, kullanıcı/mentor/jüri/support yetki retleri, iki hesapsız kayıt, hesap tekilliği, normal kullanıcı gönderimi ve evrakı, düzenleme sırasında onay/form/evrak koruması, arşiv/geri alma, kendi PDF ve evrak erişimi, sürüm çakışması). Geçici hesap/başvurular temizlendi; özgün başvurular, evraklar ve form ayarları içerik özetiyle birebir karşılaştırıldı. Admin havuz/form sayfaları HTTP 200; Chrome’da sabit menü sırası, yeni ekleme ve dolu dinamik düzenleme ekranı kontrol edildi, gerçek kayda değişiklik kaydedilmedi. API yeniden başlatıldı; diğer uygulamalar çalışmaya devam etti. Canlıya yayın veya yeni push yapılmadı.

### 8 Ekim 2026 — girişimci havuzunda canlı arama

Havuzda `searchField=all|name|email|venture` API filtresi ve MUI Autocomplete eklendi. Yazma sırasında 250 ms debounce ile tablo/öneriler aynı sonuçlardan güncellenir; eski istekler AbortController ile iptal edilir, öneriler arama/alan/görünüm/sayfa eşleşmesiyle gösterilir. Kayıt seçimi detaya gider. İletişim ve kayıtlı hesap e-postaları aranır; regex karakterleri düz metin sayılır. Geçersiz/çoklu alan 400 döner. `verify:entrepreneur-pool` alan ayrımı, büyük-küçük harf, düz regex metni, kayıtlı e-posta ve mevcut havuz akışlarını doğruladı; geçici veriler temizlendi, özgün girişimci belgeleri birebir korundu.

Chrome’da yazarken üç demo kaydının açılan listede görünmesi, ad-soyad filtresi, eşleşmeyen arama mesajı, tek ad eşleşmesi ve klavyeyle sonuçtan detay sayfasına geçiş doğrulandı. Admin sayfası HTTP 200, `git diff --check` geçti.

### 8 Ekim 2026 — Excel dosyasından havuza girişimci ekleme

Kullanıcı başlangıçta formatı sonra seçmek istedi, çalışırken Excel olarak netleştirdi. Girişimci ekle penceresinde Manuel ekle / Dosya aktararak ekle sekmeleri, üç adım, `.xlsx` dosya seçimi, güncel soru seti şablonu indirme, eşleşme önizleme, kişi bilgileri/yanıtları düzenleme ve admin kontrol kutusundan sonra kayıt eklendi. API `entrepreneurImport.js` ortak eşleştirme ve `entrepreneurImportExcel.js` ExcelJS okuyucu/şablon servisini kullanır. Başvuru/Seçenekler sayfaları görünür; soru kodları ve sürüm teknik alanları gizlidir. Tek girişimci, 10 MB, sınırlı ZIP açılmış boyutu; formüller, makrolar/şifreli arşivler, farklı şablon sürümü ve çoklu yanıt tabloları reddedilir. Sorular kod+metin veya birebir metin/bölümle eşleşir; bilinmeyen, yinelenen ve geçersiz yanıtlar uyarıya gider. Onay/evrak aktarılmaz. Önizleme kayıt yaratmaz, Excel dosyası saklanmaz. Kayıtta `entryFormVersion` kontrolü ve onay/evrak hariç zorunlu soru doğrulaması vardır. Hesap/e-posta oluşturulmaz. Çok parçalı ad/soyad yanıtları iletişim adıyla eşleşiyorsa özgün ayrımları korunur.

Doğrulama: API birim testleri 33/33, `verify:entrepreneur-pool` Excel şablonu/önizleme/kişi doldurma/yanıt koruma/kayıt, yetkiler, boyut/format/sürüm/eksik zorunlu yanıt retleri ve mevcut havuz akışlarıyla geçti. Geçici kayıtlar temizlendi, özgün girişimci belgeleri birebir korundu. Şablonun iki görünür sayfası Artifact Tool ile render edilip incelendi. Kurgusal dolu Excel ve QA dosyaları `.local/ui-checkpoints/entrepreneur-excel-import-2026-10-08/` altında Git dışındadır. Chrome’da manuel/dosyadan ekleme sekmelerinin erişilebilirlik ağacı görüldü; ardından native pencere kontrolü `noWindowsAvailable` döndüğünden tarayıcıdan dosya seçimi doğrulaması tamamlanamadı. API yeniden başlatıldı; canlıya yayın veya push yapılmadı.


### 8 Ekim 2026 — başvuru numarası, havuz yetkisi ve özet kartı

Başvuru numarası `AFZ26001` biçimindedir: ilk gönderimin Türkiye saatindeki yılı + yıllık, en az üç basamaklı sıra. Atomik `EntrepreneurApplicationCounter` ve `entrepreneur_number_unique` kısmi tekil indeks eşzamanlı gönderimleri korur. Numara ilk gönderimde verilir; taslak, düzenleme/iptal/yeniden gönderim ve arşivleme numarayı değiştirmez. 999 sonrası sıra 1000 olarak devam eder. Mongo `_id` bağlantı/erişim kimliği olarak sürer; kullanıcıya görünen numara liste, detay, özet ve PDF'dedir.

`npm run migrate:entrepreneur-numbers` API kısa süre durdurularak yerelde uygulandı: 11 gönderilmiş kayıt tarih sırasıyla numaralandırıldı. `.local/backups/before-entrepreneur-numbers-*.bson` özgün başvuruları, indeksleri ve sayacı 600 izinle korur. Yanıtlar, evrak referansları, tarih ve sürümler birebir karşılaştırıldı. Diğer ortama geçiş ayrıca hazırlanmalıdır. Sayaç kalıcıdır; gerçek numaraları test temizliği için geri sarmayın.

Önceki admin/süperadmin havuz yazma yetkisi daraltıldı: yalnızca süperadmin ekleme, Excel aktarım önizleme, düzenleme, kaldırma/geri alma ve değerlendirme yapabilir. Admin liste/detay/PDF/evrak okuyabilir. Arayüzde yazma düğmeleri gizlidir; API de 403 döner, rol düşürülmüş eski tokena güvenmez. Girişimcinin kendi başvurusunu düzenleme hakkı sürer. Havuz sütunu **Girişim Adı** olarak güncellendi.

Gönderilmiş başvuru kartında bilgi alanları birbirine yaklaştırıldı; sağdaki sıra **Detayları Görüntüle → Başvurumu Düzenle → Durum**. Detay düğmesi kenarlıklı butondur ve yalnızca bu buton ayrıntıları açar. Düzenleme üst başlıktan bu satıra taşındı; PDF önizleme üstte kalır. Kullanıcı adı/e-posta kutusu kaldırıldı. Küçük ekranlarda satırlar sarılır. Geri dönüş kopyası `.local/ui-checkpoints/before-summary-actions-*` altındadır.

Doğrulama: API girişimci birim testleri 33/33, frontend girişimci testleri 3/3, JSX ayrıştırma ve diff boşluk kontrolü geçti. `verify:entrepreneur-numbers` 20 paralel gönderim, taslak, sabit numara, yıl sınırı ve 999 sonrasını izole veritabanında doğrulayıp kendi veritabanını temizledi. `verify:entrepreneur-access` admin okuma, tüm yazma retleri, süperadmin erişimi ve eski tokenla rol düşürmeyi doğruladı; mevcut kullanıcı/başvuru/evrak/soru seti/sayaç belgeleri birebir korundu. API yeniden başlatıldı; beş servis ve iki ilgili sayfa HTTP 200. Chrome'da yenileme sırasında kısa süre boş ekran görüldü; sayfa yüklendikten sonra yeni kart görsel olarak doğrulandı. Bilgi alanına tıklama detay açmadı; Detayları Görüntüle/Gizle butonu açıp kapattı. Kullanıcı kutusu kaldırılmış, AFZ26011 ve istenen işlem sırası görünür. Gerçek başvuru yanıtları veya durumu değiştirilmedi. Production build, canlıya yayın veya yeni push yapılmadı.


### 8 Ekim 2026 — girişimcinin başvuru detaylarında kapalı bölümler

Gönderilmiş başvuruda Detayları Görüntüle altında düzenleme formu yerine `EntrepreneurApplicationDetails` salt okunur görünümü kullanılır. Her bölüm ve içindeki her soru native details/summary ile bağımsız açılır kapanır; başlangıçta kapalıdır. Dış detay düğmesi kapatınca içerik unmount edilir, yeniden açınca tüm alt alanlar kapalı başlar. Gizlilik/onaylar ayrı, numarasız gruptadır. Yanıtlar, seçenekler, boş alanlar, evrak önizleme/indirme ve yerel metin görüntüleme korunur. Başvurumu Düzenle normal form akışını kullanmaya devam eder; API/veri değişikliği yoktur.

Doğrulama: frontend girişimci testleri 3/3, üç bileşenin JSX ayrıştırılması, diff boşluk kontrolü ve başvuru sayfası HTTP 200 geçti. Chrome erişilebilirlik ağacında dış detay açıldığında tüm bölüm başlıklarının kapalı geldiği görüldü. Native kaydırma noWindowsAvailable ve görünmeyen başlığa tıklama elementHasNoFrame döndüğünden alt soru açma etkileşiminin tarayıcı doğrulaması tamamlanamadı. Geri dönüş dosyaları `.local/ui-checkpoints/before-submitted-accordions-*` altında. Production build veya push yapılmadı.
