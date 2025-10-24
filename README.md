# 💃 Move League - Adana's Digital Dance Battle Platform

Move League, Adana'nın ilk dijital dans battle platformu. Dansçılar arası rekabet, workshop organizasyonu, stüdyo işbirlikleri ve Move Show yarışmaları için kapsamlı bir ekosistem.

## 🚀 Özellikler

### Battle Sistemi
- 🥊 Dansçılar arası battle talepleri
- 🏢 Stüdyo seçimi ve onay sistemi
- 📊 Anlık bildirimler
- ⚡ Otomatik durum yönetimi

### Move Show Yarışmaları
- 🎭 Admin tarafından yarışma ilanları
- 👥 Eğitmenler takım kurabilir
- 💌 Dansçılara davetiye gönderme
- 🎵 Şarkı açıklama sistemi
- 🏆 Ödül ve puan yönetimi

### Workshop Sistemi
- 📚 Eğitmen workshop oluşturabilir
- 🎓 Dansçılar kayıt olabilir
- 📅 Tarih ve kontenjan yönetimi

### Kullanıcı Rolleri
- 💃 **Dancer** - Battle talepleri, workshop katılımı
- 👨‍🏫 **Instructor** - Workshop ve takım yönetimi
- 🏢 **Studio** - Battle onay ve konum sağlama
- 👑 **Admin** - Yarışma ve sistem yönetimi

## 🛠️ Teknoloji Stack

- **Frontend**: Next.js 15.5.5 + React 19
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL (NeonDB)
- **ORM**: Prisma
- **Auth**: JWT + bcryptjs
- **Styling**: CSS Modules + Tailwind CSS

## 📦 Kurulum

1. Repository'yi klonlayın:
```bash
git clone <repo-url>
cd dancetwo
```

2. Bağımlılıkları yükleyin:
```bash
npm install
```

3. Environment variables ayarlayın:
```bash
cp .env.example .env
# .env dosyasını düzenleyin ve gerçek değerleri girin
```

4. Prisma client oluşturun:
```bash
npm run db:generate
```

5. Database schema'yı deploy edin:
```bash
npm run db:push
```

6. Development server'ı başlatın:
```bash
npm run dev
```

http://localhost:3000 adresinde uygulama çalışacaktır.

## 🌐 Vercel'e Deploy

### 1. GitHub Repository Hazırlama

```bash
git init
git add .
git commit -m "Initial commit - Move League"
git branch -M main
git remote add origin <your-github-repo-url>
git push -u origin main
```

### 2. Vercel Dashboard

1. [Vercel Dashboard](https://vercel.com)'a gidin
2. "New Project" → GitHub repository'nizi seçin
3. Environment Variables ekleyin:
   - `DATABASE_URL` - NeonDB connection string
   - `JWT_SECRET` - Güçlü bir secret key
   - `NEXTAUTH_SECRET` - Güçlü bir secret key
4. "Deploy" butonuna tıklayın

### 3. Vercel CLI ile Deploy

```bash
npm i -g vercel
vercel login
vercel
```

Environment variables'ı Vercel dashboard'dan ekleyin.

## 🗄️ Database Komutları

```bash
# Prisma client oluştur
npm run db:generate

# Schema'yı database'e uygula
npm run db:push

# Prisma Studio'yu aç (database GUI)
npm run db:studio

# Test verisi ekle
npm run db:seed
```

## 🔐 Environment Variables

```env
DATABASE_URL="postgresql://..."
JWT_SECRET="your-jwt-secret"
NEXTAUTH_SECRET="your-nextauth-secret"
NEXTAUTH_URL="https://your-domain.vercel.app"
NODE_ENV="production"
```

## 📱 İlk Kullanıcı Oluşturma

1. Siteye gidin
2. "Hesap Oluştur" butonuna tıklayın
3. Formu doldurun:
   - Ad Soyad
   - Email
   - Şifre (min 6 karakter)
   - Rol seçimi (Dancer/Instructor/Studio)
   - Dans stilleri (isteğe bağlı)
4. "Kayıt Ol" butonuna tıklayın

## 🧪 Test Akışı

### Battle Flow
1. Dancer1 login → Battle oluştur → Dancer2'yi seç
2. Dancer2 login → Bildirim gelir → Battle kabul
3. Her iki dancer 3'er stüdyo seçer → Ortak stüdyo belirlenir
4. Studio login → Battle onaylar → Tarih/saat/konum belirler
5. Her iki dancer bildirim alır → Battle confirmed

### Move Show Flow
1. Admin login → Yarışma oluştur
2. Instructor login → Takım oluştur → Dansçılara davet gönder
3. Dancer login → Davetleri görüntüle → Kabul et
4. Admin → Etkinlik 1 gün öncesi şarkıyı açıkla
5. Takım lideri bildirim alır

## 📝 API Endpoints

- `POST /api/auth/login` - Kullanıcı girişi
- `POST /api/auth/register` - Yeni kullanıcı kaydı
- `GET /api/battles` - Battle listesi
- `POST /api/battles` - Yeni battle
- `PATCH /api/battles/:id` - Battle güncelle
- `GET /api/competitions` - Yarışma listesi
- `POST /api/competitions` - Yeni yarışma (admin)
- `GET /api/workshops` - Workshop listesi
- `GET /api/notifications` - Bildirimler

## 👥 Katkıda Bulunma

1. Fork yapın
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Commit edin (`git commit -m 'Add amazing feature'`)
4. Push yapın (`git push origin feature/amazing-feature`)
5. Pull Request açın

## 📄 Lisans

Bu proje MIT lisansı altındadır.

## 👨‍💻 Geliştirici

**Berkay Şimşek**
- Email: [your-email]
- GitHub: [@yourusername]

---

🎉 **Move League** - Dance, Battle, Win!
