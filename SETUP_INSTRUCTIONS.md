# 🎯 Move League - Battle Sistemi Kurulum Adımları

## ✅ TAMAMLANAN İŞLEMLER:

### 1. Database Schema Tasarlandı ✓
- **Dosya:** `prisma/schema.prisma`
- **Tablolar:**
  - `User` (dancer, judge, instructor, studio, admin rolleri)
  - `BattleRequest` (battle talepleri ve durumları)
  - `Studio` (stüdyo bilgileri)
  - `StudioPreference` (dansçıların stüdyo tercihleri)
  - `Notification` (bildirim sistemi)
  - `Workshop`, `Competition` (gelecek için hazır)

### 2. Prisma Kurulumu ✓
- **Dosyalar:**
  - `package.json` → Prisma paketleri eklendi
  - `src/lib/prisma.ts` → Prisma client singleton
  - `prisma/seed.js` → Mock data script
  - `.env` → Database connection string template

### 3. Seed Script Hazırlandı ✓
Mock kullanıcılar:
- Admin, 3 dansçı, 3 stüdyo
- Örnek battle talebi
- Test şifreleri: `password123` / `admin123`

---

## 🚀 ŞİMDİ YAPMAN GEREKENLER:

### Adım 1: NeonDB Hesabı Oluştur

1. https://neon.tech adresine git
2. "Sign Up" butonuna tıkla (GitHub ile giriş yapabilirsin - hızlı)
3. "Create a new project" tıkla
4. **Project Name:** `moveleague`
5. **Region:** Europe (Frankfurt) - en yakın bölge
6. "Create Project" butonuna bas

### Adım 2: Connection String'i Kopyala

Proje oluşturulduktan sonra:
1. Dashboard'da **"Connection String"** bölümünü bul
2. **"Pooled connection"** seçeneğini seç
3. **Copy** butonuna tıkla (şöyle bir şey olacak):
   ```
   postgresql://username:password@ep-xxx-xxx.eu-central-1.aws.neon.tech/moveleague?sslmode=require
   ```

### Adım 3: .env Dosyasını Güncelle

Proje root dizininde `.env` dosyasını aç ve `DATABASE_URL` satırını NeonDB'den kopyaladığın string ile değiştir:

```env
DATABASE_URL="kopyaladığın_connection_string_buraya"
```

**ÖNEMLİ:** Connection string'de şifre otomatik gelir, değiştirme!

### Adım 4: Prisma Komutlarını Çalıştır

Terminal'de sırasıyla şu komutları çalıştır:

```powershell
# 1. Prisma Client'ı oluştur
npm run db:generate

# 2. Schema'yı database'e gönder (tablolar oluşur)
npm run db:push

# 3. Mock verileri yükle
npm run db:seed
```

Her komut başarılı olursa şöyle mesajlar göreceksin:
- ✓ Generated Prisma Client
- ✓ Your database is now in sync with your Prisma schema
- 🎉 Seeding completed successfully!

### Adım 5: Database'i Kontrol Et

```powershell
npm run db:studio
```

Tarayıcıda http://localhost:5555 açılır.
Sol menüden `User`, `Studio`, `BattleRequest` tablolarını görebilirsin.

---

## 🎮 TEST HESAPLARI:

Seed script'i çalıştırdıktan sonra bu hesaplarla giriş yapabilirsin:

| Rol | Email | Şifre |
|-----|-------|-------|
| Admin | admin@moveleague.com | admin123 |
| Dansçı 1 | dancer1@test.com | password123 |
| Dansçı 2 | dancer2@test.com | password123 |
| Dansçı 3 | dancer3@test.com | password123 |
| Stüdyo 1 | studio1@test.com | password123 |
| Stüdyo 2 | studio2@test.com | password123 |
| Stüdyo 3 | studio3@test.com | password123 |

---

## 📊 DATABASE AKIŞI:

```
1. Dansçı A → BattleRequest oluştur (status: PENDING)
   ↓
2. Dansçı B → Notification alır (type: BATTLE_REQUEST)
   ↓
3. Dansçı B → ONAYLAR (status: CHALLENGER_ACCEPTED)
   ↓
4. Her iki dansçı → StudioPreference oluşturur (1., 2., 3.)
   ↓
5. Sistem → Ortak studio bulur (selectedStudioId)
   ↓
6. Stüdyo → Notification alır (type: STUDIO_REQUEST)
   ↓
7. Stüdyo → ONAYLAR + tarih/saat girer (status: CONFIRMED)
   ↓
8. Dansçı A & B → Notification alır (type: BATTLE_SCHEDULED)
```

---

## 🛠️ SONRAKİ ADIMLAR (seninle birlikte yapacağız):

- [ ] API Routes oluştur (`/api/battles`, `/api/users`, `/api/notifications`)
- [ ] Auth sistemi (login/register)
- [ ] Dansçı battle talebi sayfası (dansçı listesi + arama)
- [ ] Bildirim componenti
- [ ] Stüdyo onay paneli
- [ ] Battle akışı entegrasyonu

---

## 🔧 YARDIMCI KOMUTLAR:

```powershell
# Database'i sıfırlama (dikkat: tüm data silinir!)
npx prisma db push --force-reset

# Yeni seed verisi yükle
npm run db:seed

# Prisma Studio aç (database görüntüle)
npm run db:studio

# Schema değişikliği yaptıysan
npm run db:generate
npm run db:push
```

---

## 📞 SORUN ÇÖZÜMLEME:

### "Cannot find module '@prisma/client'"
→ Çözüm: `npm run db:generate` çalıştır

### "Authentication failed" hatası
→ Çözüm: `.env` dosyasındaki DATABASE_URL doğru mu kontrol et

### Seed hatası alıyorsan
→ Çözüm: `npx prisma db push --force-reset` sonra tekrar `npm run db:seed`

---

**Hazır olunca bana "database kuruldu" diye yaz, API routes'lara geçelim!** 🚀
