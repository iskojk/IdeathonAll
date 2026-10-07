# Emlak Konut Ideathon — Jüri Değerlendirme Paneli

Next.js tabanlı, jüri üyelerine özel ideathon başvuru ve final değerlendirme yönetim sistemi.

---

## Kurulum

### Gereksinimler

- Node.js 18+
- npm
- Çalışır durumda bir backend API

### Adımlar

```bash
# 1. Bağımlılıkları yükle
npm install

# 2. Ortam değişkenlerini ayarla
cp .env.example .env.local
# .env.local dosyasını açıp API URL'lerini düzenle

# 3. Geliştirme sunucusunu başlat
npm run dev
```

Uygulama `http://localhost:3000` adresinde çalışır.

### Production Build

```bash
npm run build
npm start
```

---

## Ortam Değişkenleri

`.env.example` dosyasını kopyalayarak `.env.local` oluşturun:

| Değişken | Açıklama | Örnek |
|---|---|---|
| `NEXT_PUBLIC_API_BASE_URL` | Backend temel URL | `http://localhost:5002` |
| `NEXT_PUBLIC_API_BASE_URL_APP` | Backend API URL | `http://localhost:5002/api` |
| `NEXT_PUBLIC_APP_NAME` | Uygulama adı | `EMLAKJURI` |

---

## Proje Yapısı

```
src/
├── app/
│   ├── (DashboardLayout)/
│   │   ├── page.jsx                        # Ana sayfa (hoşgeldin ekranı)
│   │   ├── applications/
│   │   │   └── list/                       # Ön değerlendirme listesi
│   │   │   └── [id]/detail/                # Başvuru detay ve ön değerlendirme formu
│   │   ├── jury/
│   │   │   ├── teams/                      # Final: takım listesi
│   │   │   ├── teams/[teamName]/evaluate/  # Final: takım değerlendirme formu
│   │   │   └── my-evaluations/             # Kişisel değerlendirme geçmişi
│   │   └── my-profile/                     # Profil sayfası
│   ├── auth/
│   │   ├── login/                          # Giriş sayfası
│   │   ├── forgot-password/                # Şifremi unuttum
│   │   ├── verify-otp/                     # OTP doğrulama
│   │   └── reset-password/                 # Şifre sıfırlama
│   └── components/
│       ├── applications/                   # Başvuru bileşenleri
│       ├── jury/                           # Jüri değerlendirme bileşenleri
│       └── dashboards/ecommerce/           # Dashboard bileşenleri
├── hooks/
│   └── useAuth.js                          # Auth hook
├── middleware.js                           # Route koruma middleware
├── store/
│   ├── store.js                            # Redux store
│   ├── authSlice.js                        # Auth state
│   └── customizer/                         # Tema state
└── utils/
    ├── axios.js                            # Axios istemcisi (auth header'lı)
    └── api/auth.js                         # Auth API fonksiyonları
```

---

## Sayfalar ve Özellikler

### Giriş Sistemi
- JWT tabanlı kimlik doğrulama
- Middleware ile korunan rotalar
- Otomatik token yenileme ve oturum sürdürme
- Şifremi unuttum / OTP / şifre sıfırlama akışı

### Ön Değerlendirme (`/applications/list`)
- Başvuru listeleme, arama ve filtreleme
- Filtreler: durum, katılımcı tipi, başvuru tipi (takım/bireysel), sunum durumu, değerlendirme kararı
- Filtrelerin sayfa geçişlerinde korunması (localStorage)
- Anlık istatistik sayaçları

### Final Değerlendirme (`/jury/teams`)
- Takım listesi ve değerlendirme istatistikleri
- Takım başına 8 kriter üzerinden 100 puanlık değerlendirme:
  1. Problem Tanımı ve İhtiyaç Analizi — %15
  2. Emlak Konut Odak Alanlarıyla Uyum — %10
  3. Yenilikçilik ve Farklılaşma — %20
  4. Kullanıcı Odaklılık ve Deneyim — %10
  5. Teknik Uygulanabilirlik — %15
  6. Ekip Potansiyeli — %15
  7. Sürdürülebilirlik — %5
  8. Sunum Kalitesi ve Takım Dinamiği — %10
- İki değerlendirme modu: **Adım Adım** (wizard) veya **Tümünü Göster**
- Değerlendirme oluşturma ve güncelleme

### Değerlendirmelerim (`/jury/my-evaluations`)
- Yapılan tüm değerlendirmelerin listesi
- Kriter kırılımı ve puan özeti
- Değerlendirme düzenleme

---

## Teknoloji Yığını

| Katman | Teknoloji |
|---|---|
| Framework | Next.js 15 (App Router) |
| UI | Material UI (MUI) v6 |
| State | Redux Toolkit + Redux Persist |
| HTTP | Axios |
| Form | Native React state |
| Bildirimler | React Toastify |
| İkonlar | Tabler Icons |
| Tarih | Moment.js |

---

## Notlar

- Panele yalnızca `juri` rolündeki kullanıcılar giriş yapabilir.
- Tüm API istekleri `src/utils/axios.js` üzerinden yapılır; her istekte Authorization header otomatik eklenir.
- Oturum bilgisi hem `localStorage` hem de `cookie` üzerinde tutulur. Cookie, Next.js middleware tarafından rota koruması için kullanılır.
