# Move League - API Documentation
**Mobil Uygulama İçin Tüm API Bilgileri**

## 🔗 Base URL
```
Production: https://move-league.vercel.app
Development: http://localhost:3000
```

## 🗄️ Database Connection
```env
DATABASE_URL="postgresql://neondb_owner:npg_G45LdjBVPgsO@ep-curly-rice-adnxc526-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require"
JWT_SECRET="move-league-jwt-secret-2025-production"
```

## 🔐 Authentication

### 1. **Register** - `POST /api/auth/register`
```json
Request:
{
  "email": "user@example.com",
  "password": "123456",
  "name": "John Doe",
  "role": "DANCER"  // DANCER, INSTRUCTOR, STUDIO, REFEREE, JUDGE
}

Response:
{
  "success": true,
  "data": {
    "token": "eyJhbGc...",
    "user": {
      "id": "cm5...",
      "email": "user@example.com",
      "name": "John Doe",
      "role": "DANCER",
      "rating": 1200
    }
  }
}
```

### 2. **Login** - `POST /api/auth/login`
```json
Request:
{
  "email": "user@example.com",
  "password": "123456"
}

Response:
{
  "success": true,
  "data": {
    "token": "eyJhbGc...",
    "user": { /* user data */ }
  }
}
```

### 3. **Get Current User** - `GET /api/auth/me`
```
Headers: { "Authorization": "Bearer <token>" }

Response:
{
  "success": true,
  "data": {
    "user": { /* full user data */ }
  }
}
```

---

## ⚔️ Battles API

### 4. **Get Battles** - `GET /api/battles`
```
Headers: { "Authorization": "Bearer <token>" }
Query Params:
  - status: PENDING | COMPLETED | LIVE | etc.
  - page: 1
  - limit: 20
  - includeDetails: true (detaylı bilgi için)

Response:
{
  "success": true,
  "data": {
    "battles": [
      {
        "id": "cm5...",
        "title": "John vs Jane",
        "category": "SALSA",
        "status": "PENDING",
        "initiator": { "id": "...", "name": "John", "avatar": "..." },
        "challenged": { "id": "...", "name": "Jane" },
        "scheduledDate": "2026-01-25T10:00:00Z",
        "scheduledTime": "14:00",
        "selectedStudio": { "id": "...", "name": "Studio A" }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 45,
      "totalPages": 3,
      "hasMore": true
    }
  }
}
```

### 5. **Get Battle Detail** - `GET /api/battles/:id`
```
Headers: { "Authorization": "Bearer <token>" }

Response:
{
  "success": true,
  "data": {
    "id": "cm5...",
    "title": "John vs Jane",
    "category": "SALSA",
    "status": "CONFIRMED",
    "description": "...",
    "initiator": { /* full user */ },
    "challenged": { /* full user */ },
    "selectedStudio": { /* full studio */ },
    "referee": { /* referee user */ },
    "scheduledDate": "2026-01-25",
    "scheduledTime": "14:00",
    "location": "Studio A, Istanbul",
    "scores": { /* scoring data */ }
  }
}
```

### 6. **Create Battle** - `POST /api/battles`
```json
Headers: { "Authorization": "Bearer <token>" }
Request:
{
  "challengedId": "cm5...",
  "danceStyle": "SALSA",
  "description": "Let's battle!"
}

Response:
{
  "success": true,
  "data": { /* created battle */ },
  "message": "Battle talebi gönderildi"
}
```

### 7. **Battle Actions** - `PATCH /api/battles/:id`
```json
Headers: { "Authorization": "Bearer <token>" }

// Accept battle
{ "action": "ACCEPT" }

// Reject battle
{ "action": "REJECT" }

// Select studios (initiator/challenged)
{
  "action": "SELECT_STUDIOS",
  "studioPreferences": [
    { "studioId": "cm5...", "priority": 1 },
    { "studioId": "cm5...", "priority": 2 }
  ]
}

// Studio approval
{
  "action": "STUDIO_APPROVE",
  "scheduledDate": "2026-01-25",
  "scheduledTime": "14:00",
  "location": "Studio A, Istanbul",
  "duration": 60
}

// Studio rejection
{ "action": "STUDIO_REJECT" }

// Submit scores (referee)
{
  "action": "SUBMIT_SCORES",
  "scores": {
    "initiator": { "technique": 8, "creativity": 9, "performance": 7 },
    "challenged": { "technique": 7, "creativity": 8, "performance": 9 }
  }
}
```

---

## 🎓 Workshops API

### 8. **Get Workshops** - `GET /api/workshops`
```
Headers: { "Authorization": "Bearer <token>" }
Query Params:
  - category: salsa | bachata | hiphop | kpop
  - level: beginner | intermediate | advanced
  - isActive: true

Response:
{
  "success": true,
  "data": [
    {
      "id": "cm5...",
      "title": "Salsa Basics",
      "category": "salsa",
      "level": "beginner",
      "description": "...",
      "scheduledDate": "2026-01-30T10:00:00Z",
      "scheduledTime": "15:00",
      "duration": 90,
      "location": "Studio B",
      "capacity": 20,
      "price": 150,
      "instructor": { "id": "...", "name": "Teacher X" },
      "enrollments": [{ "userId": "...", "isPaid": true }]
    }
  ]
}
```

### 9. **Get Workshop Detail** - `GET /api/workshops/:id`
```
Headers: { "Authorization": "Bearer <token>" }

Response: { /* detailed workshop data */ }
```

### 10. **Create Workshop** - `POST /api/workshops` (INSTRUCTOR only)
```json
Headers: { "Authorization": "Bearer <token>" }
Request:
{
  "title": "Hip Hop Basics",
  "category": "hiphop",
  "level": "beginner",
  "description": "Learn basic hip hop moves",
  "scheduledDate": "2026-02-01",
  "scheduledTime": "16:00",
  "duration": 90,
  "location": "Studio C",
  "capacity": 25,
  "price": 200,
  "requirements": "Comfortable clothes",
  "videoUrl": "base64..." (optional)
}
```

### 11. **Enroll Workshop** - `PATCH /api/workshops/:id`
```json
Headers: { "Authorization": "Bearer <token>" }
Request:
{
  "action": "ENROLL"
}
```

---

## 👥 Users API

### 12. **Get Users** - `GET /api/users`
```
Headers: { "Authorization": "Bearer <token>" }
Query Params:
  - role: DANCER | INSTRUCTOR | STUDIO | etc.
  - search: "john"
  - danceStyle: "salsa"
  - page: 1
  - limit: 50

Response:
{
  "success": true,
  "data": {
    "users": [
      {
        "id": "cm5...",
        "name": "John Doe",
        "email": "john@example.com",
        "role": "DANCER",
        "avatar": "...",
        "danceStyles": ["salsa", "bachata"],
        "rating": 1250,
        "experience": 3
      }
    ],
    "pagination": { /* pagination info */ }
  }
}
```

### 13. **Get All Users** - `GET /api/users/all`
```
Headers: { "Authorization": "Bearer <token>" }

Response:
{
  "success": true,
  "data": {
    "users": [ /* all users without filter */ ]
  }
}
```

---

## 🏢 Studios API

### 14. **Get Studios** - `GET /api/studios`
```
Headers: { "Authorization": "Bearer <token>" }
Query Params:
  - city: "Istanbul"
  - minCapacity: 20
  - maxPrice: 500
  - search: "studio name"

Response:
{
  "success": true,
  "data": [
    {
      "id": "cm5...",
      "name": "Dance Studio A",
      "address": "Kadıköy, Istanbul",
      "city": "Istanbul",
      "capacity": 30,
      "pricePerHour": 300,
      "facilities": ["mirrors", "sound system"],
      "photos": ["url1", "url2"],
      "user": { "name": "Owner", "phone": "555..." }
    }
  ]
}
```

### 15. **Get Studio Detail** - `GET /api/studios/:id`

### 16. **Create Studio** - `POST /api/studios` (STUDIO role only)

---

## 🔔 Notifications API

### 17. **Get Notifications** - `GET /api/notifications`
```
Headers: { "Authorization": "Bearer <token>" }

Response:
{
  "success": true,
  "data": [
    {
      "id": "cm5...",
      "type": "BATTLE_REQUEST",
      "title": "⚔️ Yeni Battle Talebi!",
      "message": "John sana bir battle talebi gönderdi!",
      "isRead": false,
      "battleRequestId": "cm5...",
      "createdAt": "2026-01-21T10:00:00Z"
    }
  ]
}
```

### 18. **Mark as Read** - `POST /api/notifications/:id/read`

### 19. **Mark All as Read** - `POST /api/notifications/read-all`

---

## 🏆 Competitions API

### 20. **Get Competitions** - `GET /api/competitions`
```
Headers: { "Authorization": "Bearer <token>" }

Response:
{
  "success": true,
  "data": [
    {
      "id": "cm5...",
      "name": "Winter Dance Championship",
      "description": "...",
      "category": "salsa",
      "startDate": "2026-02-15",
      "endDate": "2026-02-20",
      "location": "Istanbul",
      "prize": "10000 TL",
      "maxTeams": 16,
      "teamSize": 5,
      "registrationDeadline": "2026-02-01",
      "isActive": true,
      "teams": [ /* teams */ ]
    }
  ]
}
```

### 21. **Get Competition Detail** - `GET /api/competitions/:id`

### 22. **Create Competition** - `POST /api/competitions` (ADMIN only)

---

## 👔 Profile API

### 23. **Update Avatar** - `POST /api/profile/avatar`
```json
Headers: { "Authorization": "Bearer <token>" }
Request:
{
  "avatar": "data:image/png;base64,..."
}
```

### 24. **Change Password** - `PATCH /api/profile/password`
```json
Headers: { "Authorization": "Bearer <token>" }
Request:
{
  "currentPassword": "oldpass",
  "newPassword": "newpass"
}
```

---

## 📊 Admin APIs (ADMIN role only)

### 25. **Get Admin Stats** - `GET /api/admin/stats`
```
Headers: { "Authorization": "Bearer <token>" }
Query Params: period=day|week|month|year|all

Response:
{
  "success": true,
  "data": {
    "overview": {
      "totalUsers": 150,
      "totalBattles": 75,
      "totalWorkshops": 30,
      "totalCompetitions": 5
    },
    "revenue": {
      "total": 15000,
      "commission": {
        "rate": 15,
        "total": "2250.00",
        "inPeriod": "450.00"
      },
      "instructor": {
        "total": "12750.00"
      }
    },
    "users": {
      "distribution": {
        "DANCER": 100,
        "INSTRUCTOR": 20,
        "STUDIO": 10
      }
    }
  }
}
```

### 26. **Get Admin Users** - `GET /api/admin/users`
### 27. **Get Admin Badges** - `GET /api/admin/badges`
### 28. **Assign Referee** - `PATCH /api/admin/battles/:id/assign-referee`

---

## 🎮 Active Battles

### 29. **Get Active Battles** - `GET /api/battles/active`
```
Headers: { "Authorization": "Bearer <token>" }

Response: { battles: [ /* LIVE, SCHEDULED battles */ ] }
```

---

## 📋 Response Format

### Success Response
```json
{
  "success": true,
  "data": { /* data */ },
  "message": "İşlem başarılı"
}
```

### Error Response
```json
{
  "success": false,
  "message": "Hata mesajı",
  "error": "Error details"
}
```

### Unauthorized
```json
{
  "success": false,
  "message": "Giriş yapmanız gerekiyor"
}
Status: 401
```

---

## 🔑 Authentication Flow

1. **Register/Login** → Get token
2. **Store token** in AsyncStorage/SecureStore
3. **Add to headers**: `Authorization: Bearer <token>`
4. **All requests** use this header

---

## 📦 Common Headers
```javascript
{
  "Authorization": "Bearer eyJhbGc...",
  "Content-Type": "application/json"
}
```

---

## 🎯 Dans Stilleri (Dance Styles)
- SALSA
- BACHATA
- HİPHOP
- KPOP

## 👤 Roller (User Roles)
- DANCER (Dansçı)
- INSTRUCTOR (Eğitmen)
- STUDIO (Stüdyo)
- REFEREE (Hakem)
- JUDGE (Jüri)
- ADMIN (Yönetici)

## 🏅 Battle Durumları
1. **PENDING** - Talep gönderildi
2. **CHALLENGER_ACCEPTED** - Kabul edildi
3. **STUDIO_PENDING** - Stüdyo seçimi bekleniyor
4. **CONFIRMED** - Stüdyo onayladı
5. **BATTLE_SCHEDULED** - Planlandı
6. **LIVE** - Canlı
7. **COMPLETED** - Tamamlandı
8. **REJECTED** - Reddedildi
9. **CANCELLED** - İptal edildi

---

## 🚀 Mobil Agent'a Vermeniz Gerekenler

1. **Bu dosya (API_DOCUMENTATION.md)**
2. **Database URL** (.env.local'den)
3. **Base URL**: `https://move-league.vercel.app`
4. **Prisma Schema** (schema.prisma)

### Mobil Agent Prompt Örneği:
```
"React Native + Expo mobil app yap.

Backend hazır: https://move-league.vercel.app/api

Tüm API endpoint'leri API_DOCUMENTATION.md'de detaylı açıklandı.
Database: PostgreSQL (NeonDB) - Aynı database'i kullan.

Özellikler:
1. Login/Register (JWT auth)
2. Battle sistemi (oluştur, kabul et, stüdyo seç)
3. Workshop listesi ve kayıt
4. Bildirimler
5. Profil yönetimi

Tasarım: Kırmızı-siyah tema, gradient'ler, modern UI

API'ler senkron çalışıyor - web ve mobil aynı database'i kullanıyor."
```
