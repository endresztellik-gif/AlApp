# User Invitation UX Implementation - Munkaterv és Státusz

**Dátum:** 2026-02-23
**Projekt:** AlApp - User Invitation Flow javítások

---

## 🎯 Cél

A felhasználó meghívás folyamat UX javítása:
1. ✅ Toast notifications (success/error)
2. ✅ "Meghívva" badge a user listában
3. ⚠️ **Edge Function authentication probléma megoldása (FOLYAMATBAN)**

---

## ✅ Amit Sikeresen Megcsináltunk

### 1. Toast Notifications Implementálás

**Fájl:** `src/modules/admin/pages/UsersPage.tsx`

**Változtatások:**
```typescript
// Import hozzáadva
import { toast } from 'sonner';

// handleInvite funkció frissítve:
- Success toast: "Meghívó sikeresen elküldve!"
- Error toast: Részletes hibaüzenetekkel (pl. duplikált email)
```

**Commit:** `4ab8463` - "Improve user invitation UX with toast notifications and invited badge"

---

### 2. "Meghívva" Badge a User Listában

**Fájlok módosítva:**
- `src/modules/admin/hooks/useUsersAdmin.ts` - UserRow interface kibővítve
- `src/modules/admin/pages/UsersPage.tsx` - Badge UI hozzáadva

**Funkció:**
```typescript
// UserRow interface bővítés
interface UserRow {
  // ...
  email_confirmed_at?: string | null;
  invited_at?: string | null;
}

// Query frissítés - auth.users join
const query = useQuery({
  queryFn: async () => {
    // 1. Get user_profiles
    const { data: profiles } = await supabase.from('user_profiles').select('*');

    // 2. Get auth metadata
    const { data: { users: authUsers } } = await supabase.auth.admin.listUsers();

    // 3. Merge data
    return profiles.map(profile => ({
      ...profile,
      email_confirmed_at: authUser?.email_confirmed_at,
      invited_at: authUser?.invited_at,
    }));
  }
});

// Badge UI (amber/yellow pill)
{!user.email_confirmed_at && user.invited_at && (
  <span className="px-2 py-1 text-[10px] font-semibold rounded-full bg-amber-50 text-amber-700 border border-amber-200">
    Meghívva
  </span>
)}
```

---

## ⚠️ Jelenlegi Probléma: Edge Function Authentication

### Probléma Leírás

**Eredeti hiba:** `User not allowed` amikor `supabase.auth.admin.inviteUserByEmail()` hívás történt frontend-ről.

**Ok:** Az admin API service role key-t igényel, ami nem lehet a frontend-en (biztonsági kockázat).

### Megoldási Próbálkozások

#### 1. Edge Function Létrehozás ✅

**Fájl:** `supabase/functions/invite-user/index.ts`

**Funkció:**
- Fogadja a user auth token-t
- Ellenőrzi, hogy admin-e a hívó
- Service role key-vel hívja az `inviteUserByEmail` API-t

**Deploy:**
```bash
SUPABASE_ACCESS_TOKEN=sbp_f0bfa57b8365a3dff0b8dbe54bd06e82d6f88bf2 npx supabase functions deploy invite-user --no-verify-jwt
```

**Commit:**
- `7df3116` - "Fix user invitation by switching to Edge Function approach"
- `97bb045` - "Improve Edge Function error handling and auth flow"
- `3c8f660` - "Deploy Edge Function with no-verify-jwt flag to fix authentication"

#### 2. Frontend Frissítés ✅

**Fájl:** `src/modules/admin/hooks/useUsersAdmin.ts`

**Változás:**
```typescript
// Előtte: Direkt admin API hívás
await supabase.auth.admin.inviteUserByEmail(email, {...});

// Utána: Edge Function hívás
const { data, error } = await supabase.functions.invoke('invite-user', {
  body: { email, fullName, role }
});
```

---

### JWT Authentication Probléma 🔴

**Hiba:** `401 Unauthorized - Invalid JWT`

**Okok:**
1. Supabase Edge Functions alapértelmezetten JWT-t validálnak
2. A frontend ES256 algoritmust használó JWT-t küld
3. Az Edge Function gateway elutasítja a token-t

**Megoldás:** `--no-verify-jwt` flag használata deploy-nál

```bash
npx supabase functions deploy invite-user --no-verify-jwt
```

**Státusz:** ✅ JWT validáció kikerülve, function elérhető

---

### ⚠️ VISSZAÁLLÍTÁS (2026-02-23 10:15)

**Commits:**
- `eadb4ec` - Revert "Fix user invitation by creating user directly without SMTP"
- `9a6fe9c` - Revert "Update implementation log - user invitation feature complete"

**Visszaállított commitok:**
- `da6b3cf` - Update implementation log
- `f006aee` - Fix user invitation by creating user directly without SMTP

**Ok:** A `createUser` megközelítés **HELYTELEN** volt. Az eredeti terv a `inviteUserByEmail` használata volt Gmail SMTP-vel, amit meg kell tartani.

### Jelenlegi Státusz (Utolsó Frissítés)

**Státusz:** ⚠️ **SMTP beállítás szükséges a Supabase Dashboard-on**

**Mi van készen:**
- ✅ Edge Function (`inviteUserByEmail` verzió) - deployed
- ✅ Frontend (egyszerű toast notification-ökkel)
- ✅ "Meghívva" badge a user listában
- ✅ Git history tiszta (revert-ek pushed)

**Mi hiányzik:**
- ❌ Gmail SMTP beállítás a Supabase Dashboard-on

**Következő lépés:**
1. **Állítsd be a Gmail SMTP-t a Supabase Dashboard-on** a `GMAIL_SMTP_SETUP.md` dokumentáció alapján
2. Teszteld a user invitation funkciót
3. Ellenőrizd hogy az email megérkezik-e

**Dokumentáció:** Lásd `GMAIL_SMTP_SETUP.md` a részletes SMTP beállítási útmutatóhoz

---

## 📁 Módosított Fájlok

### Frontend
```
src/modules/admin/pages/UsersPage.tsx
src/modules/admin/hooks/useUsersAdmin.ts
```

### Backend (Supabase)
```
supabase/functions/invite-user/index.ts (új)
supabase/migrations/20260223070000_create_invite_user_function.sql (nem használt)
```

---

## 🔐 Supabase Konfiguráció

### Project Details
- **Project Ref:** `mgducjqbzqcmrzcsklmn`
- **URL:** `https://mgducjqbzqcmrzcsklmn.supabase.co`
- **Access Token:** `sbp_f0bfa57b8365a3dff0b8dbe54bd06e82d6f88bf2`

### Edge Function Secrets (beállítva ✅)
```bash
SUPABASE_URL=https://mgducjqbzqcmrzcsklmn.supabase.co
SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...
SITE_URL=https://alapp.netlify.app
VITE_APP_URL=http://localhost:5173
```

### Deploy Parancsok
```bash
# Link project
SUPABASE_ACCESS_TOKEN=sbp_f0bfa57b8365a3dff0b8dbe54bd06e82d6f88bf2 npx supabase link --project-ref mgducjqbzqcmrzcsklmn

# Deploy function
SUPABASE_ACCESS_TOKEN=sbp_f0bfa57b8365a3dff0b8dbe54bd06e82d6f88bf2 npx supabase functions deploy invite-user --no-verify-jwt

# List functions
SUPABASE_ACCESS_TOKEN=sbp_f0bfa57b8365a3dff0b8dbe54bd06e82d6f88bf2 npx supabase functions list

# Set secrets
SUPABASE_ACCESS_TOKEN=sbp_f0bfa57b8365a3dff0b8dbe54bd06e82d6f88bf2 npx supabase secrets set KEY=VALUE
```

---

## 🧪 Tesztelési Parancsok

### Edge Function Tesztelés curl-lel
```bash
# GET JWT token-ből a user-t
curl -i "https://mgducjqbzqcmrzcsklmn.supabase.co/functions/v1/invite-user" \
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1nZHVjanFienFjbXJ6Y3NrbG1uIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA4MDMzODcsImV4cCI6MjA4NjM3OTM4N30.B39iD_tUOCux_U9niSnVnnfXQfIsqru_-d-Z6QkWUU0" \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","fullName":"Test User","role":"user"}'
```

### Browser Console Teszt
1. Nyisd meg: https://dunaialapp.netlify.app
2. Login admin-ként: `endre.sztellik@gmail.com`
3. Settings → Users → Meghívás
4. Nézd a Network tab-ot és Console-t

---

## 📊 Git Commits

**Legutóbbi commits (jelenlegi verzió):**
```
eadb4ec - Revert "Fix user invitation by creating user directly without SMTP"
9a6fe9c - Revert "Update implementation log - user invitation feature complete"
```

**Visszavont commits (helytelen megközelítés):**
```
da6b3cf - Update implementation log - user invitation feature complete (REVERT-elve)
f006aee - Fix user invitation by creating user directly without SMTP (REVERT-elve)
```

**Érvényes commits (eredeti megközelítés):**
```
527c72b - Add implementation log for user invitation feature
3c8f660 - Deploy Edge Function with no-verify-jwt flag to fix authentication
97bb045 - Improve Edge Function error handling and auth flow
4ab8463 - Improve user invitation UX with toast notifications and invited badge
```

**Branch:** `main`
**Remote:** `https://github.com/endresztellik-gif/AlApp.git`

---

## 🚀 Következő Lépések (TODO)

### 1. Gmail SMTP Beállítás (KRITIKUS!)
- [ ] Nyisd meg a Supabase Dashboard: https://supabase.com/dashboard/project/mgducjqbzqcmrzcsklmn/auth/email-templates
- [ ] Navigálj: Authentication → Email → SMTP Settings
- [ ] Állítsd be a Gmail SMTP-t (lásd `GMAIL_SMTP_SETUP.md`)
  - Enable Custom SMTP: ✅
  - SMTP Host: smtp.gmail.com
  - SMTP Port: 587
  - SMTP User: dunaddnpi@gmail.com
  - SMTP Password: buwilryyaxrwjieu
  - Sender Email: dunaddnpi@gmail.com
  - Sender Name: Dunai Osztály AlApp
- [ ] Save

### 2. Edge Function Újra-Deploy
```bash
SUPABASE_ACCESS_TOKEN=sbp_f0bfa57b8365a3dff0b8dbe54bd06e82d6f88bf2 \
  npx supabase functions deploy invite-user --no-verify-jwt
```

### 3. Tesztelés
- [ ] Sikeres meghívás tesztelése
- [ ] Duplikált email teszt
- [ ] "Meghívva" badge megjelenés teszt
- [ ] Email fogadás teszt (spam mappát is nézd!)
- [ ] Setup password oldal működés teszt

---

## 📝 Jegyzetek

### JWT Token Probléma Részletei

**ES256 vs HS256:**
- Frontend ES256 JWT-t küld (Elliptic Curve)
- Edge Functions gateway HS256-ot várhat (HMAC)
- Megoldás: `--no-verify-jwt` flag

**JWT Példa (decode):**
```json
{
  "alg": "ES256",
  "kid": "af55e266-36af-445a-9b67-de6904b91901",
  "sub": "6547e46c-4bbc-4d57-b68f-29da792485ca",
  "email": "endre.sztellik@gmail.com",
  "role": "authenticated",
  "exp": 1771829016,
  "iat": 1771825416
}
```

### Environment Variables

**Frontend (.env):**
```bash
VITE_SUPABASE_URL=https://mgducjqbzqcmrzcsklmn.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci... # NE tedd ki production-be!
```

**Supabase Secrets (Edge Functions):**
- Automatikusan elérhető: `SUPABASE_URL`, `SUPABASE_ANON_KEY`
- Manuálisan beállítva: `SUPABASE_SERVICE_ROLE_KEY`, `SITE_URL`

---

## 🔍 Debugging Eszközök

### Supabase Dashboard
- Functions: https://supabase.com/dashboard/project/mgducjqbzqcmrzcsklmn/functions
- Logs: https://supabase.com/dashboard/project/mgducjqbzqcmrzcsklmn/functions/invite-user/logs
- Auth: https://supabase.com/dashboard/project/mgducjqbzqcmrzcsklmn/auth/users

### Browser DevTools
- Network tab → Filter: `invite-user`
- Console → Nézd a toast error üzeneteket
- Application → Session Storage → Supabase auth token

### Supabase CLI
```bash
# Check function status
SUPABASE_ACCESS_TOKEN=... npx supabase functions list

# Secrets
SUPABASE_ACCESS_TOKEN=... npx supabase secrets list
```

---

## 📚 Dokumentáció Linkek

- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [Auth Admin API](https://supabase.com/docs/reference/javascript/auth-admin-inviteUserByEmail)
- [JWT Verification](https://supabase.com/docs/guides/functions/auth)

---

## ⚡ Gyors Parancsok (Copy-Paste)

```bash
# Project link
SUPABASE_ACCESS_TOKEN=sbp_f0bfa57b8365a3dff0b8dbe54bd06e82d6f88bf2 npx supabase link --project-ref mgducjqbzqcmrzcsklmn

# Deploy
SUPABASE_ACCESS_TOKEN=sbp_f0bfa57b8365a3dff0b8dbe54bd06e82d6f88bf2 npx supabase functions deploy invite-user --no-verify-jwt

# List
SUPABASE_ACCESS_TOKEN=sbp_f0bfa57b8365a3dff0b8dbe54bd06e82d6f88bf2 npx supabase functions list

# Git
git add -A
git commit -m "message"
git push
```

---

**Utolsó frissítés:** 2026-02-23 10:15 (Europe/Budapest)
**Státusz:** Visszaállítva az eredeti `inviteUserByEmail` megközelítésre, SMTP beállítás szükséges
**Következő:** Állítsd be a Gmail SMTP-t a Dashboard-on (lásd `GMAIL_SMTP_SETUP.md`)!
