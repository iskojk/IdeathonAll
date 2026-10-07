const { createHash } = require('node:crypto');
const text = `Hızlandırma Programı Başvurusu Kişisel Verilerin İşlenmesi Aydınlatma Metni

Veri sorumlusu: [Kurumun tam unvanı ve adresi]. Başvuru kanalı: [Kurumun e-posta/KEP ve başvuru adresi].

Başvuru kapsamında adınız, soyadınız, e-posta adresiniz, telefonunuz, şehriniz; girişiminiz, ekibiniz, fikri haklarınız, program, ödül, pilot çalışma ve yatırım geçmişiniz hakkında paylaştığınız bilgiler ile isteğe bağlı yüklediğiniz belgeler elektronik başvuru formu üzerinden alınır. Bu bilgiler başvurunuzun alınması, değerlendirilmesi, program süreçlerinin yürütülmesi ve sizinle iletişim kurulması amacıyla işlenir.

İşleme faaliyetlerinin hukuki sebepleri: [Her amaç için 6698 sayılı Kanunun 5. veya gerektiğinde 6. maddesindeki uygulanabilir işleme şartı]. Verilere erişecek alıcı grupları ve aktarım amaçları: [Yetkili değerlendirme birimleri ve varsa diğer alıcılar]. Varsa yurt dışı aktarım mekanizması ayrıca açıklanacaktır.

Saklama süresi veya belirleme kriteri: [Kurumun başvuru kayıtları için belirlediği süre/kriter]. Süre sonunda veriler ilgili silme, yok etme veya anonimleştirme sürecine tabi tutulur.

6698 sayılı Kanunun 11. maddesi kapsamında verilerinizin işlenip işlenmediğini öğrenme, işlenmişse bilgi isteme, işleme amacını ve amaca uygun kullanımı öğrenme, aktarılan üçüncü kişileri bilme, eksik veya yanlış verilerin düzeltilmesini isteme, kanuni şartlarla silinmesini veya yok edilmesini ve bu işlemlerin aktarılan kişilere bildirilmesini isteme, yalnızca otomatik analiz sonucunda aleyhinize çıkan sonuca itiraz etme ve hukuka aykırı işleme nedeniyle zararın giderilmesini talep etme haklarınız vardır. Taleplerinizi yukarıda belirtilen başvuru kanalına iletebilirsiniz.

Başvuruyla ilgisi olmayan kişisel verileri ve özel nitelikli kişisel verileri evraklara eklemeyin. Bu aydınlatma metni genel bir açık rıza metni değildir.`;
module.exports = { draft: true, version: createHash('sha256').update(text).digest('hex').slice(0, 16), text,
  note: 'KVKK metni taslaktır. Kurum bilgileri, hukuki sebepler, aktarım ve saklama koşulları tamamlanmalıdır.' };
