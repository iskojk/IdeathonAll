# AFZ-Girişimci Başvurum — Yapılan Geliştirmeler

**Belge tarihi: 9 Ekim 2026**

Bu belge, girişimci başvuru süreci için yaptığımız geliştirmeleri kullanım sırasına göre açıklar. Sürece ilk kez dahil olan birinin, hangi işlemi kimin yaptığını ve işlem sonunda sistemde ne değiştiğini anlayabilmesi amaçlanmıştır. Anlatım, geliştirmelerin son halini esas alır.

## 1. Geliştirilen akışın genel yapısı

Girişimci modülünde, başvuru sorularının yönetilmesinden başvurunun değerlendirilmesine kadar birbirini tamamlayan bir akış oluşturuldu:

1. Süperadmin soru setini hazırlar, taslak olarak kaydeder ve hazır olduğunda yayımlar.
2. Girişimci hesap oluşturur ve e-posta adresini doğrular.
3. Girişimci başvuru formunu doldurur; çalışması taslak olarak saklanır.
4. Başvurusunu gönderdiğinde kayıt girişimci havuzuna gelir ve bir başvuru numarası alır.
5. Süperadmin başvuruyu açar, inceler ve değerlendirme durumunu günceller.
6. Girişimci başvurusunu görüntüleyebilir, PDF olarak alabilir veya düzenleyip yeniden gönderebilir.
7. Süperadmin, sistem üzerinden gelmeyen başvuruları da manuel giriş veya Excel aktarımıyla aynı havuza ekleyebilir.

Girişimci havuzu, belirli bir Ideathon etkinliği seçilmesine bağlı olmadan çalışacak şekilde düzenlendi.

### Kim hangi işlemleri yapabilir?

| Kullanıcı | Girişimci modülündeki işlemleri |
| --- | --- |
| Girişimci | Kendi hesabını oluşturur; kendi başvurusunu doldurur, gönderir, görüntüler ve düzenler. Kendi evraklarına erişir. |
| Admin | Girişimci havuzunu, başvuru detaylarını ve evraklarını görüntüler; başvurunun PDF çıktısını alır. |
| Süperadmin | Adminin görüntüleme işlemlerine ek olarak soru setlerini yönetir, başvuru ekler ve düzenler, Excel aktarımı yapar, değerlendirme durumunu değiştirir, havuzdan kaldırır ve geri alır. |

Bu ayrım hem ekrandaki düğmelerde hem sunucu tarafında uygulanır. Jüri, mentor ve diğer roller için girişimci yönetim yetkisi açılmadı.

### Belgede geçen üç farklı taslak

| Kavram | Ne anlama gelir? |
| --- | --- |
| Soru seti taslağı | Süperadminin hazırladığı soruların ve form düzeninin kaydedilmiş halidir. **Taslaklarım** alanında bulunur. |
| İlk başvuru taslağı | Girişimcinin henüz göndermediği cevapları ve yüklediği evraklarıdır. |
| Düzenleme taslağı | Gönderilmiş bir başvuruda değişiklik yapmak için açılan çalışma kopyasıdır. Yeniden gönderilene kadar yönetici son gönderilmiş başvuruyu görür. |

## 2. Soru setinin hazırlanması

### 2.1. Boş açılış ve taslak seçimi

Soru seti sayfası açıldığında herhangi bir taslak otomatik olarak düzenlemeye alınmaz. Süperadmin iki seçenekten biriyle başlar:

- **Taslaklarım:** Daha önce kaydedilmiş soru setlerinden birini açar.
- **Yeni Taslak:** Sıfırdan soru seti hazırlamak için boş düzenleyiciyi açar.

Taslaklarım penceresinin üstündeki **+** düğmesi de aynı yeni taslak oluşturma işlemini yapar. Sayfa yeniden açıldığında seçim temizlenir; kayıtlı taslaklar korunur.

### 2.2. Başlık, bölüm ve soru düzenleme

Taslak adı ile başvuru formunda kullanılacak başlık üst kartta gösterilir. Yanlarındaki kalem simgesiyle yerinde düzenlenebilir. Enter veya alanın dışına tıklamak düzenlemeyi tamamlar; Escape, o düzenleme başlamadan önceki metni geri getirir. Değişikliklerin kalıcı hale gelmesi için **Formu Kaydet** kullanılır.

Soru düzenleyicisine şu işlemler eklendi:

- Bölüm ekleme, adlandırma ve sıralama.
- Soru ekleme, düzenleme ve silme.
- Soruları aynı bölüm içinde sıralama veya başka bir bölüme taşıma.
- Kısa yanıt, uzun yanıt, tek seçim, çoklu seçim ve evrak yükleme alanları oluşturma.
- Sorunun zorunlu olup olmadığını, seçeneklerini ve ilgili alan sınırlarını belirleme.
- Uygun metin alanlarında e-posta, telefon, bağlantı, sayı veya tarih biçimi kullanma.

Bölümler ve sorular tutamaçlarından sürüklenerek sıralanabilir. Fare, dokunmatik kullanım ve klavye ile sıralama desteklenir. Soru numaraları yeni sıraya göre güncellenir.

**Önizle**, hazırlanan formu başvuru görünümüne yakın biçimde incelemeyi sağlar. Önizleme işlemi yayımdaki soru setini değiştirmez.

### 2.3. Kaydetme: yeni sürüm veya ayrı taslak

**Formu Kaydet** işleminde iki farklı ihtiyaç karşılandı:

| Seçenek | İşlem sonucunda ne olur? |
| --- | --- |
| Mevcut taslağın yeni sürümü | Aynı taslak kartı korunur, değiştirilmiş içerik yeni sürüm olarak kaydedilir. Önceki sürümlere erişim sürer. |
| Yeni taslak olarak kaydet | İçerik bağımsız bir taslağa kopyalanır. Taslaklarım listesinde altta ayrı bir kart oluşur. |

Örneğin **Ana Başvuru Formu — Sürüm 1** üzerinde bir soru değiştirilirse, yeni sürüm seçeneği aynı kartta **Sürüm 2** oluşturur. Aynı içerik **Hızlandırma Programı Formu** adıyla yeni taslak olarak kaydedilirse ayrı bir kart oluşur.

Taslak adı ve içeriği değişmemişse gereksiz bir yeni sürüm oluşturulmaz. İçerik değişmeden ayrı kopya oluşturma seçeneği kullanılabilir.

Boş bir soru taslağı kaydedilebilir; ancak başvuru sorusu eklenmeden yayımlanamaz.

### 2.4. Sürümleri aynı karttan görüntüleme

Her taslak kartına açılıp kapanan **Sürümler** alanı eklendi. Bu alanda sürüm numarası, kayıt tarihi, soru sayısı ve güncel/yayında bilgileri gösterilir.

**Düzenlemeye al** ile eski bir sürüm açılabilir. Eski içerik üzerinde çalışılıp kaydedildiğinde, seçime göre yeni sürüm veya bağımsız taslak oluşur. Geçmişteki sürümün üzerine yazılmaz.

Yeni bir sürüm kaydetmek kartın listedeki yerini değiştirmez. Ayrı oluşturulan yeni taslaklar listenin altına eklenir. Sürümleme özelliği eklenmeden önce üzerine yazılmış içerikler bu geçmişten geri getirilemez.

### 2.5. Taslaktan çıkma, silme ve geri alma

**Taslaktan Çık**, kaydedilmemiş değişikliklerin bırakılacağını belirten bir onay penceresi açar. Kullanıcı çıkışı onaylarsa soru seti sayfasının ilk açılan boş seçim ekranına döner. Düzenlemeye devam etmeyi seçerse açık içerik korunur.

Taslak kartındaki çöp kutusu ve düzenleyicideki **Tüm Taslağı Sil**, ilgili taslağı bütün sürümleriyle birlikte **Silinenler** alanına taşır. **Geri Al** ile taslak ve sürümleri geri getirilebilir.

**Silme işleminin kapsamı tüm taslaktır.** Eski bir sürüm açıkken de aynı kapsam geçerlidir; onay metni bunu açıkça belirtir. Tek bir sürümü bağımsız silme özelliği eklenmedi. Taslak silinince mevcut başvurular ve yayımdaki soru seti korunur.

## 3. Soru setinin yayımlanması

Taslak kaydetmek ile başvuru formunu kullanıma açmak ayrı işlemler olarak düzenlendi.

1. Süperadmin kullanmak istediği soru setini açar ve değişikliklerini kaydeder.
2. **Yayımla** düğmesine basar.
3. Onay penceresinde yayımlanacak taslak/sürüm ve yerine geçeceği yayın bilgilerini görür.
4. **Onayla ve Yayımla** ile soru setini başvuru akışında kullanılabilir hale getirir.

Ekrana **Yayında** bilgisi, taslaklarda yayın işareti ve **Yayın Geçmişi** eklendi. Hangi taslağın hangi sürümünün yayımlandığı izlenebilir. Sonradan taslağın adını değiştirmek, düzenlemek veya silmek geçmiş yayın bilgisini değiştirmez.

Yeni başvuru oluşturulurken kullanılacak form bu yayın üzerinden alınır. Mevcut başvurular kendi soru seti kopyasını sakladığı için yeni bir yayın, daha önce gönderilmiş başvurunun sorularını ve cevaplarını topluca değiştirmez.

## 4. Girişimci hesabı oluşturma ve e-posta doğrulaması

Girişimci kayıt akışına e-posta doğrulaması eklendi:

1. Kullanıcı ad, e-posta, telefon ve şifre bilgilerini girer.
2. Sistem bilgileri kontrol eder ve e-posta adresine altı haneli kod gönderir.
3. Kullanıcı doğrulama ekranına kodu yazar.
4. Kod doğrulandığında kullanıcı hesabı oluşturulur, oturum açılır ve başvuru ekranına geçilir.

Kod doğrulanmadan tamamlanmış bir kullanıcı hesabı oluşturulmaz; kayıt girişimi geçici olarak tutulur. Girişimci kaydı için Ideathon seçilmesi gerekmez.

Telefon alanı zorunlu hale getirildi. Farklı yazım biçimleri aynı numaraya karşılık geldiğinde mükerrer kayıt kontrolüne takılacak şekilde telefon kontrolü geliştirildi. E-posta adresi için de tekrar kayıt kontrolü uygulanır. Bu geliştirme sırasında mevcut hesaplar silinmedi.

Doğrulama kodları **5 dakika** geçerlidir. Yeni kod istemeden önce **60 saniye** beklenir. Yanlış kod denemelerine sınır konuldu; kullanıcı gerektiğinde yeni kod isteyebilir veya kayıt bilgilerini değiştirebilir.

Hesap oluşturmak, başvurunun havuza gönderildiği anlamına gelmez. Kullanıcı ayrıca başvuru formunu doldurup göndermelidir.

### E-posta gönderimi ve içerik düzenlemesi

Kayıt doğrulama ve şifre sıfırlama için Microsoft 365 SMTP bağlantısı eklendi. Bu iki işlem için kullanılan gönderim ayarları, diğer e-posta işlemlerinin ayarlarından ayrıldı. Bağlantı şifreli iletişim ve sunucu sertifikası doğrulaması kullanır; erişim bilgileri kaynak koddan ayrı tutulur.

Gönderici adı, konu ve içerikteki eski EKA markalaması **AFZ-Girişimci Başvurum** olarak değiştirildi. Kayıt ve şifre sıfırlama mesajları, yapılacak işlemi açıklayan ayrı metinler içerir. Kodun beş dakikalık geçerliliği e-postada ve ilgili ekranlarda belirtilir.

## 5. Giriş ve başvuru ekranına ulaşma

Girişimcinin farklı bağlantılardan farklı tamamlanmış başvuru ekranlarına yönlenmesi giderildi.

- Oturum açmış girişimci başvuru sayfasına yönlendirilir.
- Başvuru ekranındayken üst menüdeki **Girişimciler** bağlantısına basmak mevcut sayfayı, açık adımı ve alanları korur.
- Tekrarlanan “başvurunuz gönderilmiştir / girişiminiz için ilk adımı attınız” ara ekranı kaldırıldı.
- Oturum açmamış ziyaretçinin tanıtım, giriş ve kayıt seçenekleri korundu.

Başvuru göndermemiş kullanıcı formuyla, göndermiş kullanıcı ise kendi başvuru kartıyla karşılaşır. Açık bir başvuru düzenlemesi varsa düzenleme çalışmasına devam edebilir.

## 6. İlk başvurunun doldurulması

### 6.1. Bölümlere ayrılmış form ve ilerleme

Başvuru formu, soru setindeki bölümler ve sıralama kullanılarak oluşturulur. Kullanıcı adımlar arasında ilerleyerek soruları cevaplar. Uygun alanlarda hesap bilgileri başlangıçta doldurulur.

İlerleme göstergesi zorunlu soruları ve zorunlu onayları esas alır. İsteğe bağlı bir sorunun boş bırakılması tamamlanmayı engellemez. Eksik veya geçersiz alanlar gönderimde açıklanır ve ilgili bölüme yönlendirilir.

Bölüm değişimlerinde ilgili içeriğe kaydırma ve odak yönetimi eklendi. Aranabilir seçim alanları ve tarih alanlarıyla formun kullanımını kolaylaştıran düzenlemeler yapıldı.

### 6.2. Otomatik kayıt ve yarım kalan çalışmaya devam

Cevaplardaki değişiklikler, uygun durumda kısa bir beklemenin ardından otomatik kaydedilir. Kullanıcı bütün zorunlu alanları doldurmadan taslağını saklayabilir.

Ayrıca aynı tarayıcı sekmesinde kaydedilmemiş yanıtları kurtarmaya yardımcı olan geçici bir kopya tutulur. Bu kopyanın farklı başvuru veya eski form verisini güncel kaydın üzerine yazmaması için başvuru, form ve kayıt sürümü kontrol edilir.

Kayıt tamamlanmadan sayfadan ayrılmaya çalışıldığında uyarı gösterilir. Bağlantı veya kayıt çakışması durumunda hata kullanıcıya bildirilir; eski içerik sessizce güncel kaydın üzerine yazılmaz.

### 6.3. Evrak yükleme

Soru setindeki evrak alanlarına PDF, PNG ve JPEG dosyaları yüklenebilir. Dosya başına sınır **10 MB** olarak uygulanır; yüklenebilecek dosya sayısı ilgili sorunun ayarına bağlıdır.

Evraklar başvuruya ve sahibine bağlanır. Girişimci kendi belgelerine, yetkili yönetici ise başvuruya ait belgelere erişebilir. PDF evrakları aynı ekran üzerinde önizlenebilir.

### 6.4. Gizlilik ve kullanım onayları

Güncel başvuru formunda **Gizlilik Politikası** ve **Kullanım Şartları** onayları bırakıldı. Ayrı KVKK alanı ve bu alanın gönderim zorunluluğu kaldırıldı.

Onay metinleri formdan ayrılmadan açılan pencerelerde okunabilir. Onaylar, numaralı başvuru sorularından ayrı gösterilir. Yeni gönderimlerde gerekli onaylar kontrol edilir ve kabul bilgileri başvuruyla birlikte saklanır.

Geçmiş başvurulardaki eski onay kayıtları bu değişiklikle topluca silinmedi veya yeni bir onay verilmiş gibi değiştirilmedi.

## 7. Başvurunun gönderilmesi ve başvuru kartı

İlk başvuru gönderilirken formun tamamındaki zorunlu cevaplar, alan biçimleri, gerekli evraklar ve onaylar kontrol edilir. Kontroller başarılıysa başvuru gönderilmiş olarak kaydedilir ve girişimci havuzunda görünür.

### Başvuru numarası

Başvurulara **AFZ26001** biçiminde kullanıcıya gösterilebilir bir numara eklendi:

- **AFZ:** Başvuru öneki.
- **26:** İlk gönderimin yılı.
- **001:** O yıl için verilen sıra numarası.

Numara ilk gönderimde atanır. Düzenleme, yeniden gönderim veya havuzdan kaldırıp geri alma sırasında değişmez. Aynı anda yapılan gönderimlerde aynı numaranın verilmesini önleyen sayaç ve tekillik kontrolü bulunur.

### Gönderim sonrası görünüm

Kullanıcıya başvuran, girişim adı, başvuru tarihi, başvuru numarası ve durum bilgilerini içeren özet kart gösterilir. Karttan şu işlemler yapılabilir:

- **Detayları Görüntüle:** Gönderilmiş cevapları açar.
- **Başvurumu Düzenle:** Başvuru üzerinde yeniden çalışmayı başlatır.
- **PDF önizleme/indirme:** Başvuruyu rapor olarak görüntüler ve kaydetmeyi sağlar.

Başvuru detayları, bölüm ve soru bazında ayrı ayrı açılıp kapanan alanlara dönüştürüldü. İlk açılışta kapalı gelerek uzun başvuruların daha rahat incelenmesi sağlandı. Görüntüleme alanındaki cevaplar doğrudan değiştirilmez; bunun için düzenleme akışına girilir.

PDF çıktısında Türkçe karakter desteği sağlandı. Uzun cevaplar gerektiğinde birden fazla sayfaya yayılır. PDF önce aynı ekran üzerindeki pencerede gösterilir; dosya kullanıcı **İndir** düğmesine bastığında kaydedilir.

## 8. Yönetici havuzunda arama, filtreleme ve değerlendirme

### 8.1. Havuz görünümü ve arama

Yönetim paneline **GİRİŞİMCİLER** menü grubu altında havuz ve süperadmine özel soru seti alanları yerleştirildi. Girişimci ekranlarında üstteki Ideathon seçicisi gizlendi.

Havuza yazarken çalışan canlı arama ve eşleşen kayıt önerileri eklendi. Arama, tüm alanlarda veya ad-soyad, e-posta ve girişim adı üzerinden daraltılabilir. Bir öneri seçildiğinde ilgili başvuru detayına gidilir.

Arama hızlı değiştirildiğinde eski isteğin sonucunun yeni aramanın üzerine gelmesini önleyen kontrol eklendi. Başvuru tarihi sıralaması ve sayfalama da bu akışla birlikte çalışır.

### 8.2. Başvuru türü ve durum filtreleri

**Başvuru Türü** filtresi eklendi:

- **Sistem:** Girişimcinin kendi hesabından oluşturduğu başvuru.
- **Manuel:** Süperadminin manuel giriş veya Excel aktarımıyla oluşturduğu başvuru.
- **Tüm türler:** İki kaynağı birlikte gösterir.

**Durum** filtresi, başvuruları değerlendirme durumuna göre daraltır. Tür ve durum filtreleri aramayla birlikte kullanılabilir. Filtre değiştiğinde liste ilk sayfaya döner; toplam kayıt sayısı da seçilen filtrelere göre hesaplanır. **Filtreleri temizle**, arama ve bu iki filtreyi sıfırlar.

Aynı arama ve filtreleme işlemleri **Kaldırılanlar** görünümünde de kullanılabilir.

### 8.3. Başvuru değerlendirme durumları

| Durum | Nasıl oluşur? |
| --- | --- |
| İletildi | Başvuru gönderildiğinde veya düzenlenip yeniden gönderildiğinde oluşur. |
| Görüntülendi | Süperadmin, İletildi durumundaki başvurunun detayını açtığında oluşur. |
| İnceleniyor | Süperadmin seçip kaydeder. |
| İncelendi | Süperadmin seçip kaydeder. |
| Onaylandı | Süperadmin seçip kaydeder. |
| Reddedildi | Süperadmin seçip kaydeder. |

Listeye bakmak, PDF açmak veya normal adminin detayı görüntülemesi başvuruyu Görüntülendi yapmaz. Bu geçiş süperadminin başvuru detayını açmasına bağlandı. Son dört durum, her biri zorunlu bir ara adım olacak şekilde sıralanmadı; süperadmin değerlendirmesine uygun durumu seçer.

Başvuru detayında bölüm ve soru bazlı açılır alanlar, evrak erişimi ve PDF çıktısı bulunur. Girişimcinin gönderilmiş başvuru ekranı açıkken durum belirli aralıklarla ve pencereye geri dönüldüğünde yenilenir.

## 9. Gönderilmiş başvurunun düzenlenmesi

Gönderilmiş başvuruyu değiştirmek için ayrı bir düzenleme akışı oluşturuldu:

1. Girişimci başvuru kartındaki **Başvurumu Düzenle** düğmesine basar.
2. Son gönderilmiş cevaplar ve evraklar üzerinden bir düzenleme taslağı açılır.
3. Kullanıcı değişiklik yapar; otomatik kayıt bu çalışma kopyasını saklar.
4. Yönetici havuzu ve başvuru PDF'si, kullanıcı yeniden gönderene kadar son gönderilmiş içeriği kullanır.
5. Kullanıcı herhangi bir düzenleme adımından **Güncelle ve Gönder** ile onay penceresini açabilir.
6. Onaydan sonra formun tamamı kontrol edilir ve değişiklikler yeniden gönderilir.

Gönderim onayı açıkken otomatik kayıt bekletilir. Aynı işlemin art arda tıklamalarla tekrarlanması engellenir. Eksik cevap varsa ilgili alana yönlendirilir; bağlantı hatasında kullanıcıya tekrar deneme imkânı sunulur.

Başarılı yeniden gönderimde başvuru kartına dönülür. Başvuru numarası korunur, gönderim tarihi güncellenir ve değerlendirme durumu tekrar **İletildi** olur. Önceki görüntüleme/değerlendirme bilgileri temizlenerek yeni gönderimin yeniden incelenmesi sağlanır.

### Düzenlemeden çıkış

Düzenleme ekranının üst kartına mavi **Çıkış** düğmesi eklendi. Bu düğme her düzenleme adımında kullanılabilir. Onay verildiğinde düzenleme sırasında yapılan değişiklikler bırakılır ve son gönderilmiş başvurunun kartına dönülür. Çıkıştan vazgeçilirse mevcut düzenleme korunur.

Düzenleme sırasında kaldırılan evrakların son gönderilmiş başvuruyu bozmasını önleyen koruma eklendi. Başvuru sahibinin açık düzenlemesiyle yöneticinin içerik değişikliklerinin çakışması da kontrol edilir.

Buradaki düzenleme taslağı, soru setlerindeki sürüm arşivinden farklıdır. Her yeniden gönderimin ayrı ayrı açılabildiği kapsamlı bir başvuru sürüm geçmişi eklenmedi.

## 10. Havuza manuel veya Excel ile başvuru ekleme

### 10.1. Manuel ekleme

Süperadmin için havuzdan girişimci ekleme ekranı oluşturuldu. Mevcut bir kullanıcı hesabı seçilebilir veya herhangi bir hesaba bağlı olmayan başvuru girilebilir.

Ad-soyad, e-posta, telefon ve girişim bilgileri ile soru setindeki cevaplar doldurulur. Oluşan kayıt **Manuel** türüyle havuzda görünür.

Bu işlem kendi başına yeni kullanıcı hesabı oluşturmaz, e-posta göndermez veya başvuru sahibi adına onay kanıtı üretmez. Bir kullanıcı hesabına bağlanmış başvuru varsa aynı hesaba ikinci girişimci başvurusu oluşturulması engellenir.

Süperadminin temel iletişim bilgilerini ve başvuru cevaplarını düzenlemesi sağlandı. Başvuruya ait form kopyası ve kişinin verdiği onay kanıtları bu düzenleme kapsamında değiştirilemez.

### 10.2. Excel dosyasından ekleme

Girişimci ekleme penceresine **Dosya aktararak ekle** seçeneği eklendi. Akış şu şekilde çalışır:

1. Güncel soru setine uygun Excel şablonu indirilir.
2. Şablondaki başvuru alanları doldurulur ve `.xlsx` dosyası seçilir.
3. Sistem dosyayı okuyarak kişi bilgilerini ve cevapların hangi sorularla eşleştiğini gösterir.
4. Süperadmin önizlemede bilgileri kontrol eder, gerekli düzeltmeleri yapar ve uyarıları giderir.
5. Onay verilip kaydedildiğinde başvuru havuza eklenir.

Önizleme tek başına kayıt oluşturmaz. Aktarım tek girişimci için tasarlandı ve dosya boyutu 10 MB ile sınırlandı. Farklı soru seti sürümü, belirsiz eşleşmeler, geçersiz cevaplar ve uygun olmayan dosyalar kontrol edilir. Formül, makro veya şifreli dosya gibi desteklenmeyen içerikler reddedilir.

Excel dosyasının kendisi saklanmaz; onaylanan kişi bilgileri ve cevaplar başvuruya yazılır. Evrak dosyaları ve başvuru sahibinin onay kanıtları Excel'den aktarılmaz. Oluşan kaydın türü **Manuel** olur.

Mevcut hesaba bağlı manuel bir başvuru sonradan girişimci tarafından düzenlense de kaynak bilgisi Manuel olarak kalır.

### 10.3. Havuzdan kaldırma ve geri alma

Havuzdaki çöp kutusu işlemi, başvuruyu aktif listeden **Kaldırılanlar** görünümüne taşır. Başvuru, hesap ve evraklar kalıcı olarak silinmez. Başvuru sahibinin kendi kaydına erişimi korunur.

Süperadmin kaldırılan başvuruyu geri alabilir. Bu işlemler mevcut başvuru numarasını değiştirmez.

## 11. Şifremi unuttum akışı

Şifre kurtarma işlemi e-posta koduyla çalışacak şekilde tamamlandı ve ilgili ekranlar birbirine bağlandı:

1. Kullanıcı **Şifremi Unuttum** ekranına e-posta adresini girer.
2. Uygun hesaba şifre sıfırlama kodu gönderilir.
3. Sonraki kod ve yeni şifre ekranında e-posta alanı dolu gelir.
4. Kullanıcı kodu ve yeni şifresini girerek işlemi tamamlar.
5. Başarılı işlemden sonra önceki oturumlar geçersiz hale gelir; kullanıcı yeni şifresiyle giriş yapar.

Sıfırlama kodu **5 dakika** geçerlidir ve bir kez kullanılabilir. Yanlış denemeler ve sık kod isteme sınırlandırılır. Kod isteme yanıtı, girilen adresin sistemde kayıtlı olup olmadığını dışarıya açıklamayacak şekilde düzenlendi.

Kullanıcı kod isteme ekranına geri döndüğünde e-posta adresi korunur. Kod veya şifre bu amaçla tarayıcı deposuna yazılmaz.

Şifre sıfırlama e-postasının giriş cümlesi şöyle güncellendi:

> Anahtar Fikirler Zirvesi platformundaki Girişimci hesabınız için bir şifre sıfırlama talebi aldık.

## 12. Ekranları sadeleştiren ve akışı düzelten değişiklikler

İşlevsel geliştirmeleri tamamlamak için şu arayüz düzenlemeleri yapıldı:

- Başvuru düzenleme başlığı, açıklaması ve iki ayrı bilgilendirme kutusu tek kompakt kartta toplandı.
- Çıkış düğmesi mavi zemin ve beyaz yazıyla belirginleştirildi.
- Son kullanıcı ekranlarından “Örnek soru seti” ve geliştirme aşamasını anlatan benzer ifadeler kaldırıldı. Önceki başvuru cevaplarına erişim korundu.
- Giriş, kayıt, doğrulama ve şifre kurtarma düğmelerinin tıklama, yüklenme ve üzerine gelme sırasında boyut değiştirmesine neden olan stiller düzeltildi.
- Başvuru kartında bilgiler ve işlem düğmeleri daha kompakt yerleştirildi; dar ekranlarda alt satıra geçmeleri sağlandı.
- Yönetici menüsündeki **DASHBOARD** adı **IDEATHONLAR**, **MENTOR** adı **MENTORLAR** olarak değiştirildi.
- Soru setinin kayıt, önizleme, yayın ve geçmiş araçları daha az yer kaplayan üst kontrol kartında toplandı.
- PDF penceresi kapatıldığında ilgili isteklerin ve geçici dosya bağlantılarının temizlenmesi sağlandı.

## 13. Verilerin nereye kaydedildiği

Girişimci başvuruları için mevcut Ideathon katılımcı başvurularından ayrı bir kayıt yapısı geliştirildi. Teknik tarafta devralacak kişi için temel ayrım şöyledir:

| Veri | Kayıt yeri | Açıklama |
| --- | --- | --- |
| Kullanıcı hesabı | `users` | Giriş bilgileri, kişi bilgileri ve doğrulama durumu bulunur. |
| Henüz doğrulanmamış kayıt girişimi | `pendingregistrations` | E-posta doğrulaması tamamlanana kadar kullanılan geçici kayıt bulunur. |
| Girişimci başvurusu | `entrepreneurapplications` | Cevaplar, form kopyası, durum, numara ve varsa düzenleme taslağı bulunur. |
| Girişimci evrakı | `entrepreneurdocuments` | Dosya içeriği, başvuru ve sahiplik bağlantıları bulunur. |
| Soru seti taslağının güncel hali | `entrepreneurformdrafts` | Taslağın adı, içeriği ve güncel sürüm bilgisi bulunur. |
| Soru setinin önceki sürümleri | `entrepreneurformdraftversions` | Aynı taslağın geçmiş sürümleri bulunur. |
| Yayımdaki soru seti | `entrepreneurformsettings` | Başvuru akışında kullanılacak form ve güncel yayın bilgisi bulunur. |
| Önceki yayın bilgileri | `entrepreneurformpublications` | Soru seti yayınlarının geçmişi bulunur. |
| Başvuru numarası sayacı | `entrepreneurapplicationcounters` | Yıllık sıra numarası takibi yapılır. |

Dolayısıyla girişimcinin başvurusu mevcut `applications` koleksiyonuna yazılmaz; `entrepreneurapplications` içinde tutulur. Hesap ile başvuru `userId` üzerinden ilişkilendirilir. Hesapsız manuel başvurular da aynı girişimci başvuruları koleksiyonunda saklanır.

## 14. Geliştirmeleri destekleyen düzeltmeler

Başvuru akışına ek olarak, çalışmayı etkileyen ortak alanlarda da düzenlemeler yapıldı:

- **Oturum ve yönlendirme:** Jüri ve mentor panellerinde oturum yüklenmeden yapılan erken yönlendirmeler düzeltildi. Kullanıcının doğrudan açtığı yetkili sayfadan gereksiz yere ana ekrana gönderilmesi önlendi.
- **Şifre kurtarma bağlantıları:** Yönetici tarafındaki eksik çağrılar ve yönetici/jüri formlarının gönderdiği alanlar düzeltildi. Eski telefon doğrulama ekranları mevcut e-posta ile kurtarma başlangıcına yönlendirildi.
- **İstatistik bağlantısı:** Panellerin hatalı başvuru istatistik adresi, çalışan sunucu adresiyle eşleştirildi.
- **Aynı anda yapılan işlemler:** Taslak kaydı, yayımlama ve başvuru düzenlemesinde sürüm kontrolleri eklendi. Başka bir işlemle değişmiş kayıt üzerine eski veriyle yazılması engellendi.
- **Kimlik doğrulama güvenliği:** Kodların güvenli üretilmesi, doğrulama bilgilerinin korunması, tek kullanımlık sıfırlama ve istek/deneme sınırları geliştirildi. Başarılı şifre sıfırlamasının eski web ve anlık bağlantı oturumlarını geçersiz kılması sağlandı.
- **Bağımlılık ve derleme düzeltmeleri:** Uygulama bağımlılıkları güncellendi; derlemeyi engelleyen kaynak hataları giderildi ve hataları yok sayan ayarlar kaldırıldı.
- **Yerel çalışma ortamı:** Beş uygulamanın birlikte başlatılması, durumunun kontrol edilmesi ve durdurulması için ortak araçlar hazırlandı. Aynı bilgisayardaki panellerin oturum çerezlerinin birbirini etkilememesi sağlandı.
- **Veri koruma:** Yerel veri aktarımı ve telefon/başvuru numarası uyarlamalarında mevcut girişimci başvuruları ve evrakları korundu; geri dönüş için özel yedekler oluşturuldu.
- **Doğrulama araçları:** Kayıt, başvuru, yetki, numaralandırma, havuz ve soru seti sürümlerini kontrol eden betikler geliştirildi. Yük testlerine disk/bellek kontrolü, güvenli durdurma ve ilerlemeyi kaydetme mekanizması eklendi.

## 15. Uçtan uca kullanım örneği

1. Süperadmin **Genel Girişimci Başvurusu** adında bir taslak oluşturur, soruları hazırlar, kaydeder ve yayımlar.
2. Bir girişimci kayıt olur, e-postasına gelen kodu doğrular ve başvuru formuna geçer.
3. Formu kısmen doldurur; cevapları taslak olarak saklanır. Daha sonra devam edip gerekli alanları tamamlar ve gönderir.
4. Başvuru bir AFZ numarası alır; havuzda **Sistem / İletildi** olarak görünür.
5. Süperadmin detayı açınca durum **Görüntülendi** olur. İncelemesinden sonra **İnceleniyor** durumunu seçip kaydeder.
6. Girişimci bir bilgisini düzeltmek için **Başvurumu Düzenle** ile çalışma kopyasını açar. Bu sırada yönetici son gönderilmiş içeriği görmeye devam eder.
7. Girişimci **Çıkış** ile değişiklikleri bırakabilir veya **Güncelle ve Gönder** ile yeni içeriği iletebilir. Yeniden gönderirse numarası korunur, tarih güncellenir ve durum **İletildi** olur.
8. Daha sonra soru seti değiştirilecekse süperadmin aynı taslağa yeni sürüm ekler. Başka bir programa ait bağımsız form hazırlayacaksa yeni taslak olarak kaydeder. Kullanıma almak istediği sürümü ayrıca yayımlar.
