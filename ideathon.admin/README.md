# Emlak Konut Ideathon Admin Paneli

Emlak Konut'un düzenlediği ideathon yarışmalarını yönetmek için geliştirilmiş kapsamlı bir süper admin yönetim panelidir.

---

## Özellikler

| Alan | Açıklama |
|------|----------|
| **Dashboard** | Gerçek zamanlı istatistikler, grafikler ve özet kartlar |
| **Başvuru Yönetimi** | Ideathon başvurularını inceleme, filtreleme ve durum güncelleme |
| **Üye Yönetimi** | Katılımcı üyeleri listeleme ve yönetme |
| **Takım Yönetimi** | Katılımcı takımlarını organize etme |
| **Jüri Sistemi** | Jüri üyelerini yönetme ve final sonuçlarını görüntüleme |
| **Mentor Yönetimi** | Mentorleri ekleme, düzenleme ve listeleme (fotoğraflı) |
| **İletişim Yönetimi** | Sistemden gelen iletişim taleplerini yönetme |
| **Admin/Jüri Hesapları** | Admin ve jüri kullanıcı hesaplarını yönetme |
| **İdeathon Yönetimi** | Birden fazla ideathon dönemini yönetme |
| **Profil Ayarları** | Kullanıcı profili ve şifre değiştirme |

---

## Teknoloji Stack

| Katman | Teknoloji |
|--------|-----------|
| Framework | Next.js 15 (App Router) |
| UI | React 19, Material UI 6 |
| State | Redux Toolkit + Redux Persist |
| Yetki | CASL (Role-based access control) |
| HTTP | Axios |
| Form | Formik + Yup |
| Grafik | ApexCharts, Recharts, MUI X Charts |
| Editor | TipTap |
| Docker | Dockerfile + npm scripts |

---

## Gereksinimler

- **Node.js** >= 20.0.0
- **npm** >= 9.0.0
- **Docker** *(opsiyonel, production deployment için)*

---

## Kurulum

### 1. Bağımlılıkları Yükleyin

```bash
npm install
```

### 2. Environment Değişkenlerini Ayarlayın

```bash
cp .env.example .env
```

`.env` dosyasını açıp değerleri doldurun:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:5001/api
NEXT_PUBLIC_API_BASE_URL_APP=http://localhost:5002/api
NEXT_PUBLIC_APP_NAME="Emlak Konut Ideathon"
```

### 3. Geliştirme Sunucusunu Başlatın

```bash
npm run dev
```

Uygulama `http://localhost:3000` adresinde açılır.

---

## Production

### Build & Start

```bash
npm run build
npm run start
```

Uygulama `http://localhost:3111` portunda çalışır.

### Docker ile Deployment

```bash
# .env.production dosyasını oluşturun ve değerleri doldurun
cp .env.example .env.production

# Build + Container başlat (tek komut)
npm run dockerfull
```

Docker komutları:

| Komut | Açıklama |
|-------|----------|
| `npm run dockerbuild` | Docker image oluşturur |
| `npm run dockerstart` | Container'ı başlatır (port 3111) |
| `npm run dockerstop` | Container'ı durdurur ve siler |
| `npm run dockerfull` | Build + stop + start (tam lifecycle) |

> Container `analiz-net` Docker ağında çalışır, backend servisleri aynı ağda olmalıdır.

---

## Proje Yapısı

```
emlak-admin/
├── public/                     # Statik dosyalar
├── src/
│   ├── app/
│   │   ├── (DashboardLayout)/  # Tüm dashboard sayfaları
│   │   │   ├── admin-juri/     # Admin & Jüri hesap yönetimi
│   │   │   ├── applications/   # Başvuru yönetimi
│   │   │   ├── contacts/       # İletişim yönetimi
│   │   │   ├── ideathons/      # İdeathon dönem yönetimi
│   │   │   ├── jury/           # Jüri & final sonuçları
│   │   │   ├── members/        # Üye yönetimi
│   │   │   ├── mentornet/      # Mentor ağı yönetimi
│   │   │   ├── mentors/        # Mentor istatistikleri
│   │   │   ├── my-profile/     # Profil ayarları
│   │   │   └── teams/          # Takım yönetimi
│   │   ├── api/                # Next.js API route handlers
│   │   ├── auth/               # Login, şifre sıfırlama sayfaları
│   │   ├── components/         # Yeniden kullanılabilir bileşenler
│   │   └── context/            # React context'ler
│   ├── hooks/                  # Custom React hook'ları
│   ├── services/               # Servis katmanı (bildirimler vb.)
│   ├── store/                  # Redux store & slice'lar
│   └── utils/                  # Yardımcı fonksiyonlar & API istemcisi
├── .env.example                # Örnek environment dosyası
├── Dockerfile
├── next.config.js
└── package.json
```

---

## Rol Yapısı

| Rol | Yetki |
|-----|-------|
| `superadmin` | Tüm işlemler |
| `juri` | Başvuruları değerlendirme, final sonuçları |
| `company` | Kısıtlı erişim |

Yetki kontrolü CASL kütüphanesi ile yapılır.

---

## Scriptler

```bash
npm run dev          # Geliştirme sunucusu (localhost:3000)
npm run build        # Production build
npm run start        # Production sunucu (port 3111)
npm run lint         # ESLint kontrolü
npm run dockerbuild  # Docker image oluştur
npm run dockerstart  # Docker container başlat
npm run dockerstop   # Docker container durdur
npm run dockerfull   # Full Docker lifecycle (build+stop+start)
```
