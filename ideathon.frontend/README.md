# Emlak Konut Ideathon — Frontend

Emlak Konut GYO tarafından düzenlenen Ideathon programlarının web uygulaması. Next.js 14 ile geliştirilmiştir.

## Teknoloji Stack

- **Next.js 14** — React framework (SSR & SSG)
- **React 18** — UI kütüphanesi
- **Bootstrap 5** — CSS framework
- **Sass** — CSS preprocessor
- **Socket.IO Client** — Gerçek zamanlı bildirimler
- **Docker** — Production deployment

## Gereksinimler

- Node.js >= 18.0.0
- npm

## Kurulum

```bash
npm install
```

## Geliştirme

```bash
npm run dev
```

Tarayıcıda `http://localhost:3000` adresinden erişilir.

## Production Build

```bash
npm run build
npm run start
```

## Docker ile Deploy

```bash
# Build + Run (tek komut)
npm run dockerfull

# Sadece build
npm run dockerbuild

# Sadece çalıştır
npm run dockerstart

# Durdur
npm run dockerstop
```

## Environment Variables

| Değişken | Açıklama |
|----------|----------|
| `NEXT_PUBLIC_API_URL` | Backend API base URL |

`.env` (geliştirme) ve `.env.production` (üretim) dosyaları kullanılır.  
Bu dosyalar `.gitignore` ile versiyon kontrolünden hariç tutulmuştur.

## Proje Yapısı

```
├── components/              # React bileşenleri
│   ├── sections/            # Sayfa section'ları (ideathon bazlı)
│   │   ├── ideathon-ankara/
│   │   ├── ideathon-izmir/
│   │   ├── ideathon-konya/
│   │   ├── ideathon-kahramanmaras/
│   │   └── ...
│   ├── Header.js
│   ├── Layout.js
│   ├── ApplicationForm.js
│   └── Toast.js
├── pages/                   # Next.js sayfaları & routing
│   ├── ideathon-ankara/
│   ├── ideathon-izmir/
│   ├── ideathon-konya/
│   ├── ideathon-kahramanmaras/
│   ├── mentorluk/
│   ├── ayarlar/
│   ├── index.js             # Anasayfa (Ideathon Hub)
│   ├── basvuru.js           # Başvuru formu
│   ├── basvurularim.js      # Başvurularım
│   ├── faydali-linkler.js   # Faydalı linkler
│   └── ...
├── config/
│   └── ideathonConfig.js    # Ideathon açma/kapama konfigürasyonu
├── context/
│   ├── AuthContext.js       # Kimlik doğrulama
│   ├── IdeathonContext.js   # Aktif ideathon yönetimi
│   └── SocketContext.js     # WebSocket bağlantısı
├── lib/
│   ├── api.js               # API servisleri
│   └── auth.js              # Auth yardımcıları
├── public/                  # Statik dosyalar (görseller, PDF, PPTX)
│   └── img/
│       ├── ankara/
│       ├── izmir/
│       ├── konya/
│       └── maras/
└── styles/                  # Global CSS/SCSS
```

## Ideathon Yönetimi

Her ideathon programı `config/ideathonConfig.js` üzerinden yönetilir:

- Başvuru açma/kapama
- Kayıt açma/kapama
- Sunum yükleme açma/kapama
- Takım oluşturma açma/kapama
- Mentorluk açma/kapama

Yeni ideathon eklemek için:
1. `config/ideathonConfig.js`'ye yeni slug key'i ekle
2. `components/sections/ideathon-{slug}/` altında section componentleri oluştur
3. `pages/ideathon-{slug}/index.js` sayfa dosyasını oluştur
4. `pages/index.js`'deki `IDEATHONS` dizisine kart bilgilerini ekle
5. `ApplicationForm.js`'deki `FOCUS_AREAS` objesine odak alanlarını ekle

## Mevcut Programlar

| Program | Slug | Durum |
|---------|------|-------|
| Ideathon İstanbul | `ideathon-2025` | Tamamlandı |
| Ideathon Ankara | `ideathon-ankara` | Tamamlandı |
| Ideathon İzmir | `ideathon-izmir` | Tamamlandı |
| Ideathon Konya | `ideathon-konya` | Tamamlandı |
| Ideathon Kahramanmaraş | `ideathon-kahramanmaras` | Tamamlandı |

## Özellikler

- Çoklu ideathon desteği (slug bazlı)
- Kullanıcı kayıt ve giriş
- Başvuru formu (bireysel / takım)
- Başvuru düzenleme ve geri çekme
- Sunum yükleme
- Mentorluk sistemi (mentör listesi, toplantı, mesajlaşma)
- Faydalı linkler (ideathon bazlı filtreleme)
- Bildirim ayarları
- Responsive tasarım
- SEO optimizasyonu (Open Graph, Twitter Card, Structured Data)
- Docker ile production deploy

## Lisans

Proprietary — Emlak Konut GYO / EKA Enerji ve Teknoloji A.Ş.
