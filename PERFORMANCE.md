# 🚀 Move League - Performance & Scalability Guide

## 📊 Sistem Kapasitesi

Sistem **300+ kullanıcı** için optimize edildi ve binlerce kullanıcıya ölçeklenebilir.

## ✅ Yapılan Optimizasyonlar

### 1. **Database İndeksleme** ✓
```prisma
// User table
@@index([email])
@@index([role])
@@index([rating])

// BattleRequest table  
@@index([initiatorId])
@@index([challengedId])
@@index([status])
@@index([selectedStudioId])
@@index([refereeId])
@@index([scheduledDate])
@@index([createdAt])

// Notification table
@@index([userId, isRead])
@@index([createdAt])

// Workshop table
@@index([scheduledDate])
@@index([isActive])
@@index([category])
```

### 2. **API Pagination** ✓
Tüm liste endpoint'leri pagination destekliyor:

```javascript
// Kullanım örneği
GET /api/users?page=1&limit=50
GET /api/battles?page=1&limit=50

// Response formatı
{
  "success": true,
  "data": {
    "users": [...],
    "pagination": {
      "page": 1,
      "limit": 50,
      "total": 300,
      "totalPages": 6,
      "hasMore": true
    }
  }
}
```

## 🔄 Önerilen İyileştirmeler

### 3. **Caching Stratejisi** (Sonraki Adım)

**Redis veya Vercel KV** ile cache:

```javascript
// Öncelikli cache edilecek veriler:
- Lig sıralaması (top 100) - 5 dakika cache
- Aktif battle listesi - 1 dakika cache
- User profil bilgileri - 10 dakika cache
- Workshop listesi - 5 dakika cache
```

**Implementasyon:**
```bash
npm install @vercel/kv
```

```javascript
// lib/cache.js
import { kv } from '@vercel/kv';

export async function getCached(key, fetcher, ttl = 300) {
  const cached = await kv.get(key);
  if (cached) return cached;
  
  const data = await fetcher();
  await kv.set(key, data, { ex: ttl });
  return data;
}
```

### 4. **Image Optimization** (Önemli!)

**Cloudinary** veya **Vercel Blob** kullan:

```bash
npm install @vercel/blob
```

```javascript
// Avatar upload optimizasyonu
import { put } from '@vercel/blob';

export async function uploadAvatar(file) {
  const blob = await put(`avatars/${userId}.jpg`, file, {
    access: 'public',
    addRandomSuffix: false,
  });
  return blob.url;
}
```

**Faydaları:**
- Base64 yerine URL (Database boyutu %70 azalır)
- Otomatik resize ve optimization
- CDN ile hızlı yükleme

### 5. **Database Connection Pooling** (Kritik!)

**Neon DB Settings:**
```env
# .env
DATABASE_URL="postgresql://user:pass@host/db?pgbouncer=true&connection_limit=10"
```

**Prisma ayarları:**
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  directUrl = env("DIRECT_DATABASE_URL") // Migrations için
}
```

### 6. **Rate Limiting**

**Vercel Edge Config** ile rate limit:

```javascript
// middleware.ts
import { rateLimit } from '@/lib/rate-limit';

export async function middleware(request) {
  const ip = request.ip || 'anonymous';
  const { success } = await rateLimit.check(ip, 100, '1 h'); // 100 req/hour
  
  if (!success) {
    return new Response('Rate limit exceeded', { status: 429 });
  }
}
```

### 7. **Frontend Optimization**

**Lazy Loading:**
```jsx
// BattlesPage.jsx - Virtual scrolling
import { useVirtualizer } from '@tanstack/react-virtual';

const virtualizer = useVirtualizer({
  count: battles.length,
  getScrollElement: () => parentRef.current,
  estimateSize: () => 150,
});
```

**Code Splitting:**
```jsx
// Lazy load heavy components
const AdminPanel = dynamic(() => import('@/components/AdminPanel'), {
  loading: () => <Loading />,
});
```

## 📈 Monitoring

### Vercel Analytics
```bash
npm install @vercel/analytics
```

```jsx
// app/layout.tsx
import { Analytics } from '@vercel/analytics/react';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
```

### Database Query Monitoring
```javascript
// Yavaş query'leri logla
prisma.$on('query', (e) => {
  if (e.duration > 1000) { // 1 saniyeden uzun
    console.warn('Slow query:', e.query, e.duration);
  }
});
```

## 🎯 Performans Metrikleri

### Hedef Değerler:
- **API Response Time:** < 200ms (95th percentile)
- **Database Query Time:** < 100ms
- **Page Load Time:** < 2s (First Contentful Paint)
- **Time to Interactive:** < 3s

### Test:
```bash
# Load testing
npm install -g artillery
artillery quick --count 100 --num 10 https://your-site.vercel.app/api/battles
```

## 🔐 Güvenlik

### Rate Limiting by Role:
```javascript
const limits = {
  DANCER: 100, // requests per hour
  STUDIO: 200,
  REFEREE: 150,
  ADMIN: 500,
};
```

### SQL Injection Prevention:
✓ Prisma ORM kullanılıyor (otomatik korumalı)

### XSS Prevention:
✓ React otomatik escape ediyor
✓ Avatar upload'da validation var

## 📦 Deployment Checklist

- [x] Database indexleri eklendi
- [x] API pagination implementasyonu
- [ ] Redis/KV cache kurulumu
- [ ] Image CDN migration (Cloudinary/Vercel Blob)
- [ ] Rate limiting
- [ ] Monitoring setup
- [ ] Load testing

## 🚀 Ölçeklenebilirlik

### 300 Kullanıcı:
✓ Mevcut sistem hazır
✓ Pagination aktif
✓ Index'ler optimize

### 1000+ Kullanıcı:
- Cache ekle (Redis/KV)
- Image CDN'e taşı
- Connection pooling optimize et

### 10,000+ Kullanıcı:
- Database read replicas
- Microservices mimarisi
- Event-driven architecture (background jobs)

## 💡 Best Practices

1. **Her zaman pagination kullan** (limit=50 default)
2. **Select sadece gerekli field'ları** (include yerine select)
3. **Cache frequently accessed data** (lig sıralaması)
4. **Optimize images** (base64 yerine CDN)
5. **Monitor slow queries** (>100ms log)

## 📞 Support

Herhangi bir performans sorunu için:
- Vercel dashboard'dan logs kontrol et
- Neon DB dashboard'dan query performance bak
- Prisma Studio ile database inspect et
