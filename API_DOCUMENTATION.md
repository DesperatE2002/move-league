# Move League API Documentation

## Base URL
```
http://localhost:3000/api
```

## Authentication
Tüm endpoint'ler (login hariç) `Authorization` header'ı gerektirir:
```
Authorization: Bearer <token>
```

Token, login endpoint'inden döner ve 7 gün geçerlidir.

---

## 🔐 Authentication Endpoints

### POST /api/auth/login
Kullanıcı girişi yapar ve token döner.

**Request Body:**
```json
{
  "email": "dancer1@test.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJ1c2VySWQiOiJjbG...",
    "user": {
      "id": "clxxx",
      "email": "dancer1@test.com",
      "name": "Ahmet Yıldız",
      "role": "DANCER"
    }
  }
}
```

---

## 👥 Users Endpoints

### GET /api/users
Kullanıcı listesini getirir (filtreli).

**Query Parameters:**
- `role` (optional): DANCER, JUDGE, INSTRUCTOR, STUDIO, ADMIN
- `search` (optional): İsim veya email araması
- `danceStyle` (optional): Dans stili filtresi

**Example:**
```
GET /api/users?role=DANCER&search=ahmet
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "clxxx",
      "name": "Ahmet Yıldız",
      "email": "dancer1@test.com",
      "role": "DANCER",
      "profileImage": "https://...",
      "bio": "Hip-hop dancer",
      "danceStyles": ["Hip-Hop", "Breaking"]
    }
  ]
}
```

---

## ⚔️ Battles Endpoints

### GET /api/battles
Kullanıcının battle'larını getirir.

**Query Parameters:**
- `status` (optional): PENDING, CHALLENGER_ACCEPTED, STUDIO_PENDING, etc.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "clxxx",
      "status": "PENDING",
      "danceStyle": "Hip-Hop",
      "description": "Let's battle!",
      "initiator": {
        "id": "clxxx",
        "name": "Ahmet Yıldız",
        "profileImage": "https://..."
      },
      "challenged": {
        "id": "clyyyy",
        "name": "Zeynep Kaya",
        "profileImage": "https://..."
      },
      "createdAt": "2024-01-15T10:00:00Z"
    }
  ]
}
```

### POST /api/battles
Yeni battle talebi oluşturur.

**Request Body:**
```json
{
  "challengedId": "clyyyy",
  "danceStyle": "Hip-Hop",
  "description": "Let's battle!"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Battle talebi gönderildi",
  "data": {
    "id": "clxxx",
    "status": "PENDING",
    "danceStyle": "Hip-Hop",
    "initiatorId": "clxxx",
    "challengedId": "clyyyy"
  }
}
```

### PATCH /api/battles/[id]
Battle'ı günceller (onaylama, reddetme, stüdyo seçimi).

**Actions:**

#### 1. ACCEPT - Battle'ı kabul et
```json
{
  "action": "ACCEPT"
}
```

#### 2. REJECT - Battle'ı reddet
```json
{
  "action": "REJECT"
}
```

#### 3. SELECT_STUDIOS - Stüdyo tercihleri kaydet
```json
{
  "action": "SELECT_STUDIOS",
  "studioPreferences": [
    { "studioId": "clstudio1", "priority": 1 },
    { "studioId": "clstudio2", "priority": 2 },
    { "studioId": "clstudio3", "priority": 3 }
  ]
}
```

#### 4. STUDIO_APPROVE - Stüdyo battle'ı onayla (Sadece STUDIO rolü)
```json
{
  "action": "STUDIO_APPROVE",
  "scheduledDate": "2024-02-01",
  "scheduledTime": "18:00",
  "location": "Ana Salon",
  "duration": 60
}
```

#### 5. STUDIO_REJECT - Stüdyo battle'ı reddet (Sadece STUDIO rolü)
```json
{
  "action": "STUDIO_REJECT"
}
```

---

## 🔔 Notifications Endpoints

### GET /api/notifications
Kullanıcının bildirimlerini getirir.

**Query Parameters:**
- `isRead` (optional): true/false
- `type` (optional): BATTLE_REQUEST, BATTLE_ACCEPTED, STUDIO_REQUEST, etc.

**Response:**
```json
{
  "success": true,
  "data": {
    "notifications": [
      {
        "id": "clxxx",
        "type": "BATTLE_REQUEST",
        "title": "Yeni Battle Talebi",
        "message": "Ahmet Yıldız sana battle atmak istiyor!",
        "isRead": false,
        "createdAt": "2024-01-15T10:00:00Z",
        "battleRequest": {
          "id": "clbattle1",
          "danceStyle": "Hip-Hop"
        }
      }
    ],
    "unreadCount": 3
  }
}
```

### POST /api/notifications/[id]/read
Bildirimi okundu olarak işaretler.

**Response:**
```json
{
  "success": true,
  "message": "Bildirim okundu olarak işaretlendi"
}
```

### POST /api/notifications/read-all
Tüm bildirimleri okundu olarak işaretler.

**Response:**
```json
{
  "success": true,
  "message": "Tüm bildirimler okundu olarak işaretlendi"
}
```

---

## 🏢 Studios Endpoints

### GET /api/studios
Stüdyo listesini getirir.

**Query Parameters:**
- `city` (optional): Şehir filtresi
- `minCapacity` (optional): Minimum kapasite
- `maxPrice` (optional): Maximum saat ücreti
- `search` (optional): İsim, adres veya açıklama araması

**Example:**
```
GET /api/studios?city=Adana&minCapacity=20
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "clxxx",
      "name": "Adana Dans Stüdyosu",
      "description": "Modern dans stüdyosu",
      "address": "Ziyapaşa Bulvarı No:123",
      "city": "Adana",
      "capacity": 30,
      "pricePerHour": 500,
      "amenities": ["Aynalı Salon", "Ses Sistemi", "Klima"],
      "user": {
        "id": "cluserid",
        "name": "Stüdyo Sahibi",
        "email": "studio1@test.com"
      }
    }
  ]
}
```

### POST /api/studios
Yeni stüdyo oluşturur (Sadece STUDIO rolü).

**Request Body:**
```json
{
  "name": "Yeni Dans Stüdyosu",
  "description": "Modern dans stüdyosu",
  "address": "Adres bilgisi",
  "city": "Adana",
  "capacity": 30,
  "pricePerHour": 500,
  "amenities": ["Aynalı Salon", "Ses Sistemi"]
}
```

### GET /api/studios/[id]
Stüdyo detaylarını getirir.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "clxxx",
    "name": "Adana Dans Stüdyosu",
    "description": "Modern dans stüdyosu",
    "address": "Ziyapaşa Bulvarı No:123",
    "city": "Adana",
    "capacity": 30,
    "pricePerHour": 500,
    "amenities": ["Aynalı Salon", "Ses Sistemi", "Klima"],
    "battleRequests": [
      {
        "id": "clbattle1",
        "scheduledDate": "2024-02-01T00:00:00Z",
        "scheduledTime": "18:00",
        "initiator": { "name": "Ahmet Yıldız" },
        "challenged": { "name": "Zeynep Kaya" }
      }
    ]
  }
}
```

### PATCH /api/studios/[id]
Stüdyo bilgilerini günceller.

**Request Body:**
```json
{
  "name": "Güncel Stüdyo Adı",
  "capacity": 40,
  "pricePerHour": 600
}
```

### DELETE /api/studios/[id]
Stüdyoyu siler (aktif battle'ı yoksa).

---

## 🔄 Battle Workflow

1. **Dancer A** battle talebi oluşturur → `POST /api/battles`
   - Status: `PENDING`
   - **Dancer B**'ye bildirim gider

2. **Dancer B** talebi kabul eder → `PATCH /api/battles/[id]` (action: ACCEPT)
   - Status: `CHALLENGER_ACCEPTED`
   - **Dancer A**'ya bildirim gider

3. **Her iki dancer** stüdyo tercihlerini girer → `PATCH /api/battles/[id]` (action: SELECT_STUDIOS)
   - Ortak stüdyo bulunur
   - Status: `STUDIO_PENDING`
   - **Stüdyo**'ya bildirim gider

4. **Stüdyo** talebi onaylar → `PATCH /api/battles/[id]` (action: STUDIO_APPROVE)
   - Status: `CONFIRMED`
   - Tarih/saat belirlenir
   - Her iki dansçıya bildirim gider

5. Battle tamamlanır
   - Status: `COMPLETED`

---

## 🧪 Test Accounts

### Dancers
- **dancer1@test.com** (Ahmet Yıldız) - Password: `password123`
- **dancer2@test.com** (Zeynep Kaya) - Password: `password123`
- **dancer3@test.com** (Mehmet Demir) - Password: `password123`

### Studios
- **studio1@test.com** (Adana Dans Stüdyosu) - Password: `password123`
- **studio2@test.com** (Merkez Park Stüdyosu) - Password: `password123`
- **studio3@test.com** (Urban Dance Academy) - Password: `password123`

### Admin
- **admin@moveleague.com** - Password: `admin123`

---

## 📊 Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized (token gerekli/geçersiz)
- `403` - Forbidden (yetki yok)
- `404` - Not Found
- `500` - Server Error

---

## 🎯 Error Response Format

```json
{
  "success": false,
  "message": "Hata mesajı",
  "error": "Detaylı hata bilgisi (development mode)"
}
```

---

## 🚀 Quick Start

1. Login olun:
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"dancer1@test.com","password":"password123"}'
```

2. Token'ı alın ve diğer endpoint'leri çağırın:
```bash
curl http://localhost:3000/api/battles \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

3. Test script'i çalıştırın:
```bash
npm run test:api
```
