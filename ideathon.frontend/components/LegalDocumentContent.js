import styles from '@/styles/legal.module.css';

export const legalDocuments = {
  privacy_policy_ack: { title: 'Gizlilik Politikası', subtitle: 'Privacy Policy', version: '2026-03' },
  terms_ack: { title: 'Kullanım Şartları', subtitle: 'Terms of Service', version: '2026-03' },
};

export default function LegalDocumentContent({ documentId }) {
  if (documentId === 'privacy_policy_ack') return <PrivacyPolicyContent />;
  if (documentId === 'terms_ack') return <TermsOfServiceContent />;
  return <p>Bu metin şu anda görüntülenemiyor.</p>;
}

function PrivacyPolicyContent() {
  return <div className={styles.content}>
    <div className={styles.section}>
      <h2>1. Giriş</h2>
      <p>
        Bu Gizlilik Politikası, Emlak Konut Gayrimenkul Yatırım Ortaklığı A.Ş. tarafından
        düzenlenen ideathon programı kapsamında kullanılan dijital platformların (bundan sonra
        &quot;Platform&quot; olarak anılacaktır) kullanımında kişisel verilerin nasıl toplandığını, işlendiğini ve
        korunduğunu açıklamaktadır.
      </p>
      <p>
        Platformu kullanarak işbu Gizlilik Politikası&apos;nda belirtilen uygulamaları kabul etmiş
        sayılırsınız.
      </p>
      <p>
        Bu politika, 6698 sayılı Kişisel Verilerin Korunması Kanunu (&quot;KVKK&quot;) başta olmak üzere
        ilgili mevzuata uygun olarak hazırlanmıştır.
      </p>
    </div>

    <div className={styles.section}>
      <h2>2. Veri Sorumlusu</h2>
      <p>Kişisel verileriniz aşağıdaki veri sorumlusu tarafından işlenmektedir:</p>
      <div className={styles.address}>
        <p><strong>Emlak Konut Gayrimenkul Yatırım Ortaklığı A.Ş.</strong></p>
        <p>Barbaros Mah. Mor Sümbül Sok. No:7/2 B</p>
        <p>Ataşehir / İstanbul</p>
        <p>Türkiye</p>
      </div>
    </div>

    <div className={styles.section}>
      <h2>3. Toplanan Kişisel Veriler</h2>
      <p>Platformu kullanmanız halinde aşağıdaki kişisel verileriniz işlenebilir:</p>

      <h3>Kimlik Bilgileri</h3>
      <ul>
        <li>Ad</li>
        <li>Soyad</li>
        <li>Doğum tarihi (varsa)</li>
      </ul>

      <h3>İletişim Bilgileri</h3>
      <ul>
        <li>E-posta adresi</li>
        <li>Telefon numarası</li>
      </ul>

      <h3>Hesap Bilgileri</h3>
      <ul>
        <li>Kullanıcı adı</li>
        <li>Şifre (hashlenmiş olarak)</li>
      </ul>

      <h3>Başvuru Bilgileri</h3>
      <ul>
        <li>Eğitim durumu</li>
        <li>Okul / Bölüm bilgileri</li>
        <li>Deneyim ve yetkinlik alanları</li>
        <li>Takım bilgileri</li>
        <li>Proje ve portfolyo linkleri</li>
      </ul>

      <h3>Teknik Veriler</h3>
      <ul>
        <li>IP adresi</li>
        <li>Tarayıcı bilgileri</li>
        <li>Oturum verileri</li>
      </ul>
    </div>

    <div className={styles.section}>
      <h2>4. Verilerin İşlenme Amaçları</h2>
      <p>Kişisel verileriniz aşağıdaki amaçlarla işlenmektedir:</p>
      <ul>
        <li>Ideathon başvurularının alınması ve değerlendirilmesi</li>
        <li>Kullanıcı hesaplarının oluşturulması ve yönetimi</li>
        <li>Etkinlik süreçlerinin planlanması ve yürütülmesi</li>
        <li>Mentör eşleştirme ve toplantı organizasyonu</li>
        <li>İletişim ve bilgilendirme faaliyetleri</li>
        <li>Yasal yükümlülüklerin yerine getirilmesi</li>
      </ul>
    </div>

    <div className={styles.section}>
      <h2>5. Verilerin Paylaşımı</h2>
      <p>Kişisel verileriniz aşağıdaki durumlar dışında üçüncü kişilerle paylaşılmaz:</p>
      <ul>
        <li>Yasal zorunluluklar kapsamında yetkili kurumlarla</li>
        <li>Etkinlik organizasyonu için görevlendirilmiş iş ortaklarıyla</li>
        <li>Jüri değerlendirme süreçleri kapsamında jüri üyeleriyle</li>
      </ul>
    </div>

    <div className={styles.section}>
      <h2>6. Verilerin Korunması</h2>
      <p>
        Kişisel verilerinizin güvenliği için uygun teknik ve idari tedbirler alınmaktadır.
        Veriler şifrelenmiş bağlantılar üzerinden iletilir ve güvenli sunucularda saklanır.
      </p>
    </div>

    <div className={styles.section}>
      <h2>7. Haklarınız</h2>
      <p>KVKK kapsamında aşağıdaki haklara sahipsiniz:</p>
      <ul>
        <li>Kişisel verilerinizin işlenip işlenmediğini öğrenme</li>
        <li>İşlenmiş ise buna ilişkin bilgi talep etme</li>
        <li>İşlenme amacını ve bunların amacına uygun kullanılıp kullanılmadığını öğrenme</li>
        <li>Eksik veya yanlış işlenmiş verilerin düzeltilmesini isteme</li>
        <li>Verilerin silinmesini veya yok edilmesini isteme</li>
        <li>İşlenen verilerin münhasıran otomatik sistemler vasıtasıyla analiz edilmesi suretiyle aleyhinize bir sonucun ortaya çıkmasına itiraz etme</li>
      </ul>
    </div>

    <div className={styles.section}>
      <h2>8. İletişim</h2>
      <p>
        Gizlilik politikamız ile ilgili sorularınız için{' '}
        <a href="mailto:info@anahtarfikirler.com">info@anahtarfikirler.com</a>{' '}
        adresinden bizimle iletişime geçebilirsiniz.
      </p>
    </div>

    <div className={styles.section}>
      <h2>9. Değişiklikler</h2>
      <p>
        Bu gizlilik politikası gerektiğinde güncellenebilir. Güncellemeler platformda
        yayınlandığı tarihten itibaren geçerli olur.
      </p>
      <p className={styles.date}>Son güncelleme: Mart 2026</p>
    </div>
  </div>;
}

function TermsOfServiceContent() {
  return <div className={styles.content}>
    <div className={styles.section}>
      <h2>1. Genel Hükümler</h2>
      <p>
        Bu Kullanım Şartları, Emlak Konut Gayrimenkul Yatırım Ortaklığı A.Ş. tarafından
        düzenlenen ideathon etkinliklerine yönelik olarak geliştirilen dijital platformun kullanımına
        ilişkin kuralları belirlemektedir.
      </p>
      <p>
        Platformu kullanarak bu şartları kabul etmiş sayılırsınız.
      </p>
    </div>

    <div className={styles.section}>
      <h2>2. Platform Amacı</h2>
      <p>Platform aşağıdaki faaliyetler için kullanılmaktadır:</p>
      <ul>
        <li>Ideathon başvurularının alınması</li>
        <li>Takım oluşturma ve yönetimi</li>
        <li>Proje sunumu ve değerlendirme süreçleri</li>
        <li>Mentör ve jüri etkileşimleri</li>
      </ul>
    </div>

    <div className={styles.section}>
      <h2>3. Kullanıcı Hesapları</h2>
      <p>Platforma erişim için kullanıcı hesabı oluşturulması gerekmektedir.</p>
      <p>Kullanıcılar:</p>
      <ul>
        <li>Doğru ve güncel bilgi vermekle</li>
        <li>Hesap güvenliğini korumakla</li>
        <li>Platform kurallarına uymakla</li>
      </ul>
      <p>yükümlüdür.</p>
    </div>

    <div className={styles.section}>
      <h2>4. Yasaklı Kullanımlar</h2>
      <p>Platform aşağıdaki amaçlarla kullanılamaz:</p>
      <ul>
        <li>Sahte veya yanıltıcı bilgi sunmak</li>
        <li>Platform güvenliğini ihlal etmek</li>
        <li>Diğer kullanıcıların haklarını ihlal etmek</li>
        <li>Kötü amaçlı yazılım veya saldırı girişiminde bulunmak</li>
        <li>Telif hakkı veya fikri mülkiyet haklarını ihlal eden içerik paylaşmak</li>
        <li>Spam veya istenmeyen iletişimde bulunmak</li>
      </ul>
    </div>

    <div className={styles.section}>
      <h2>5. Fikri Mülkiyet Hakları</h2>
      <p>
        Platformdaki tüm içerik, tasarım, logo ve markalar Emlak Konut Gayrimenkul
        Yatırım Ortaklığı A.Ş.&apos;ye aittir.
      </p>
      <p>
        Ideathon sürecinde katılımcılar tarafından geliştirilen projelere ilişkin fikri mülkiyet
        hakları, etkinlik kuralları ve katılım sözleşmesi çerçevesinde belirlenir.
      </p>
    </div>

    <div className={styles.section}>
      <h2>6. Başvuru ve Değerlendirme</h2>
      <p>
        Ideathon başvuruları belirtilen süre ve koşullar dahilinde kabul edilir.
        Değerlendirme süreci jüri tarafından yürütülür. Sonuçlara itiraz hakkı
        etkinlik kuralları çerçevesinde belirlenir.
      </p>
    </div>

    <div className={styles.section}>
      <h2>7. Sorumluluk Sınırları</h2>
      <p>
        Platform &quot;olduğu gibi&quot; sunulmaktadır. Emlak Konut, platformun kesintisiz veya hatasız
        çalışacağını garanti etmez. Teknik sorunlardan kaynaklanan veri kayıplarından
        sorumlu değildir.
      </p>
    </div>

    <div className={styles.section}>
      <h2>8. Hesap Askıya Alma ve Sonlandırma</h2>
      <p>
        Kullanım şartlarını ihlal eden hesaplar önceden bildirim yapılmaksızın
        askıya alınabilir veya sonlandırılabilir.
      </p>
    </div>

    <div className={styles.section}>
      <h2>9. Uygulanacak Hukuk</h2>
      <p>
        Bu kullanım şartları Türkiye Cumhuriyeti hukukuna tabidir. Uyuşmazlıklarda
        İstanbul Mahkemeleri ve İcra Daireleri yetkilidir.
      </p>
    </div>

    <div className={styles.section}>
      <h2>10. Değişiklikler</h2>
      <p>
        Bu kullanım şartları gerektiğinde güncellenebilir. Güncellemeler platformda
        yayınlandığı tarihten itibaren geçerli olur.
      </p>
      <p className={styles.date}>Son güncelleme: Mart 2026</p>
    </div>

    <div className={styles.section}>
      <h2>11. İletişim</h2>
      <p>
        Kullanım şartlarıyla ilgili sorularınız için{' '}
        <a href="mailto:info@anahtarfikirler.com">info@anahtarfikirler.com</a>{' '}
        adresinden bizimle iletişime geçebilirsiniz.
      </p>
    </div>
  </div>;
}
