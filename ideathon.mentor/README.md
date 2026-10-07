# Emlak Konut Mentor Paneli

Emlak Konut Ideathon sürecinde mentorlerin katılımcılarını yönettiği, toplantı planladığı, mesajlaştığı ve başvuru ön değerlendirmesi yaptığı web tabanlı yönetim panelidir.

## Özellikler

### Mentor Modülü
- **Müsaitlik Yönetimi** — Haftalık tekrar eden kurallar ve manuel slot oluşturma
- **Toplantılar** — Planlama, katılım takibi, not ve geri bildirim
- **Mesajlar** — Katılımcılarla gerçek zamanlı mesajlaşma (Socket.io)
- **Katılımcılar** — Atanmış katılımcı listesi, profil ve mesaj kısayolu
- **Geri Bildirimler** — Mentor geri bildirim görüntüleme ve yönetimi
- **Bildirimler** — Bildirim tercihleri ayarları
- **Entegrasyonlar** — Google Calendar, Zoom gibi harici araçlarla bağlantı
- **Profil** — Mentor profil bilgileri ve şifre güncelleme

### Başvuru Modülü
- Ön değerlendirme listesi (filtreleme, arama, sıralama)
- Başvuru detayı ve ön değerlendirme formu
- Durum yönetimi (bekliyor / inceleniyor / onaylandı / reddedildi)

## Teknik Altyapı

| Katman | Teknoloji |
|--------|-----------|
| Framework | Next.js 15 (App Router) |
| UI | Material-UI (MUI) v6 |
| State | Redux Toolkit + Redux Persist |
| HTTP | Axios |
| Real-time | Socket.io Client |
| Formlar | Formik + Yup |
| Grafikler | Recharts, ApexCharts, MUI X Charts |
| Yetkilendirme | JWT (HTTP-only cookie + localStorage) |
| İzin Sistemi | CASL |

## Kurulum

### Gereksinimler
- Node.js 20+
- npm
- Backend API servisi (ayrı proje)

### Adımlar

```bash
# 1. Projeyi klonlayın
git clone <repository-url>
cd emlak-mentor

# 2. Bağımlılıkları yükleyin
npm install

# 3. Ortam değişkenlerini ayarlayın
cp .env.example .env.local
# .env.local dosyasını düzenleyip API URL'lerini girin

# 4. Geliştirme sunucusunu başlatın
npm run dev
```

Uygulama `http://localhost:3000` adresinde açılır.

### Ortam Değişkenleri

| Değişken | Açıklama | Örnek |
|----------|----------|-------|
| `NEXT_PUBLIC_API_BASE_URL_APP` | Backend API base URL | `http://localhost:5002/api` |
| `NEXT_PUBLIC_API_URL` | Backend base URL (dosya/medya için) | `http://localhost:5002` |

`.env.example` dosyası şablon olarak repo içinde mevcuttur.

## Build ve Dağıtım

### Production Build

```bash
npm run build
npm start
# Uygulama port 3113'te ayağa kalkar
```

### Docker ile Dağıtım

```bash
# Image oluştur
npm run dockerbuild

# Container başlat (analiz-net ağına bağlı, .env.production ile)
npm run dockerstart

# Container durdur ve sil
npm run dockerstop

# Tek komutla: build + stop + start
npm run dockerfull
```

Docker image adı: `emlakmentor`  
Port: `3113`  
Network: `analiz-net`  
Env dosyası: `.env.production`

#### Manuel Docker Komutu

```bash
docker build -t emlakmentor .
docker run -d --name emlakmentor \
  --restart unless-stopped \
  --network analiz-net \
  -p 127.0.0.1:3113:3113 \
  --env-file .env.production \
  emlakmentor
```

## Proje Yapısı

```
src/
├── app/
│   ├── (DashboardLayout)/
│   │   ├── mentor/
│   │   │   ├── availability/        # Müsaitlik yönetimi
│   │   │   ├── meetings/            # Toplantı listesi
│   │   │   ├── messages/            # Mesajlaşma
│   │   │   ├── participants/        # Katılımcı listesi
│   │   │   ├── feedbacks/           # Geri bildirimler
│   │   │   ├── integrations/        # Entegrasyonlar
│   │   │   ├── notification-settings/
│   │   │   └── my-profile/
│   │   ├── applications/
│   │   │   ├── list/                # Ön değerlendirme listesi
│   │   │   └── [id]/detail/         # Başvuru detayı
│   │   └── layout/                  # Dashboard layout (sidebar, header)
│   ├── auth/                        # Giriş, şifre sıfırlama
│   └── api/                         # Next.js route handlers
├── components/
│   ├── mentor/                      # Mentor sayfaları için bileşenler
│   ├── applications/                # Başvuru bileşenleri
│   ├── messaging/                   # Mesajlaşma bileşenleri
│   └── jury/                        # Juri değerlendirme bileşenleri
├── hooks/                           # Custom React hook'lar
├── services/                        # Servis katmanı (bildirim vb.)
├── store/                           # Redux store ve slice'lar
└── utils/
    ├── axios.js                     # Axios instance, interceptor'lar
    ├── api/                         # API fonksiyon modülleri
    └── statusHelpers.js             # Durum etiket/renk yardımcıları
```

## Güvenlik

- JWT tabanlı kimlik doğrulama (cookie + localStorage)
- Middleware korumalı rotalar (`src/middleware.js`)
- CASL tabanlı rol/yetki yönetimi
- Axios interceptor'da otomatik oturum sonlandırma (401)
- Input validasyonu (Formik + Yup)

## Lisans

Bu proje Emlak Konut bünyesinde geliştirilmiş olup dahili kullanım içindir.
