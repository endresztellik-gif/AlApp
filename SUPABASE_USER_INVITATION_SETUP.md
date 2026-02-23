# Supabase User Invitation + Netlify Authentication - Teljes Setup Útmutató

**Projekt:** AlApp
**Utolsó frissítés:** 2026-02-23
**Státusz:** ✅ Működik

---

## 🎯 Áttekintés

Ez a dokumentáció leírja a Supabase user invitation flow teljes implementációját Netlify-on deployolt React alkalmazásban, beleértve:
- ✅ Gmail SMTP integráció (500 email/nap)
- ✅ Edge Function alapú user invitation
- ✅ Kötelező jelszó beállítás invited usereknek
- ✅ Biztonságos authentication flow

---

## 📋 1. SMTP Beállítás (Gmail)

### 1.1 Gmail App Password létrehozás

1. **Gmail fiók:** `dunaddnpi@gmail.com`
2. **2FA engedélyezés** (kötelező!)
3. **App Password generálás:**
   - Google Account → Security → 2-Step Verification → App passwords
   - App name: "Supabase AlApp"
   - **Password:** `buwilryyaxrwjieu` (szóközök nélkül!)

### 1.2 Supabase Dashboard SMTP konfiguráció

**URL:** `https://supabase.com/dashboard/project/mgducjqbzqcmrzcsklmn/auth/email-templates`

**Navigáció:** Authentication → Email → SMTP Settings

**Beállítások:**
```
Enable Custom SMTP: ✅
SMTP Host: smtp.gmail.com
SMTP Port: 465
SMTP User: dunaddnpi@gmail.com
SMTP Password: buwilryyaxrwjieu
Sender Email: dunaddnpi@gmail.com
Sender Name: Dunai Osztály AlApp
```

**⚠️ KRITIKUS HIBÁK elkerülése:**
- ❌ **SOHA ne legyen WHITESPACE** az SMTP Host mezőben!
- ✅ Helyes: `smtp.gmail.com`
- ❌ Hibás: `smtp.gmail.com ` (extra szóköz a végén → DNS lookup failed!)
- Port: **465** (SSL) vagy **587** (STARTTLS) - mindkettő működik
- Password: **szóközök nélkül** másold be!

### 1.3 Email Template (opcionális)

Ha magyar nyelvű emaileket szeretnél:
- Authentication → Email Templates → Invite User
- Subject: "Meghívó az AlApp rendszerbe"
- Tartsd meg a `{{ .ConfirmationURL }}` változókat!

---

## 📋 2. Supabase URL Configuration

**URL:** `https://supabase.com/dashboard/project/mgducjqbzqcmrzcsklmn/auth/url-configuration`

**Navigáció:** Authentication → URL Configuration

### 2.1 Site URL

```
https://dunaialapp.netlify.app
```

**⚠️ KRITIKUS:** Pontos domain név! (`dunaialapp` NEM `alapp`!)

### 2.2 Redirect URLs

```
https://dunaialapp.netlify.app/**
```

**A `/**` wildcard KÖTELEZŐ** - engedélyezi az összes alútvonalat (pl. `/auth/setup-password`)

---

## 📋 3. Edge Function Setup

### 3.1 Edge Function kód

**Fájl:** `supabase/functions/invite-user/index.ts`

**Kulcs funkciók:**
1. Admin client létrehozás service role key-vel
2. `inviteUserByEmail` hívás
3. **`password_set: false` flag beállítása** a user metadata-ban (KRITIKUS!)
4. Redirect URL beállítása

**Példa kód:**
```typescript
const { data, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
  data: {
    full_name: fullName,
    role,
    password_set: false  // ← KRITIKUS! Persistent flag
  },
  redirectTo: `${Deno.env.get('SITE_URL') || 'http://localhost:5173'}/auth/setup-password`
})
```

### 3.2 Environment Variables

**Beállítás:**
```bash
SUPABASE_ACCESS_TOKEN=sbp_f0bfa57b8365a3dff0b8dbe54bd06e82d6f88bf2 \
  npx supabase secrets set SITE_URL=https://dunaialapp.netlify.app
```

**Elérhető secrets:**
- `SUPABASE_URL` (automatikus)
- `SUPABASE_ANON_KEY` (automatikus)
- `SUPABASE_SERVICE_ROLE_KEY` (manuálisan beállítva)
- `SITE_URL` (manuálisan beállítva)

### 3.3 Deploy

```bash
SUPABASE_ACCESS_TOKEN=sbp_f0bfa57b8365a3dff0b8dbe54bd06e82d6f88bf2 \
  npx supabase functions deploy invite-user --no-verify-jwt
```

**⚠️ Fontos:** `--no-verify-jwt` flag szükséges mert ES256 JWT-t használunk!

---

## 📋 4. Frontend Setup (React + React Router)

### 4.1 ProtectedRoute - Kötelező jelszó beállítás

**Fájl:** `src/core/auth/ProtectedRoute.tsx`

**Kulcs logika:**
```typescript
// Ellenőrizzük hogy a user invited-e és nincs jelszava
const needsPasswordSetup = user?.user_metadata?.password_set === false;

// Ha invited user, KÖTELEZŐ redirect a password setup oldalra
if (needsPasswordSetup && location.pathname !== '/auth/setup-password') {
    return <Navigate to="/auth/setup-password" replace />;
}
```

**Miért működik ez?**
- ✅ Persistent (user metadata-ban tárolva)
- ✅ Működik még akkor is ha user bezárja a böngészőt
- ✅ Nem függ az URL hash-től

### 4.2 SetupPasswordPage - Jelszó beállítás

**Fájl:** `src/core/auth/SetupPasswordPage.tsx`

**Kulcs funkció:**
```typescript
// Jelszó beállítás + metadata frissítés
await supabase.auth.updateUser({
    password,
    data: { password_set: true }  // ← Flag frissítése!
});

// URL hash törlése
window.location.hash = '';
navigate('/', { replace: true });
```

### 4.3 Routes beállítás

**Fájl:** `src/app/routes.tsx`

```typescript
{
    path: '/auth/setup-password',
    element: <SetupPasswordPage />,  // NEM protected!
},
{
    path: '/',
    element: (
        <ProtectedRoute>  // Protected route wrapper
            <MainLayout />
        </ProtectedRoute>
    ),
    // ...
}
```

**Fontos:** `/auth/setup-password` **NEM lehet** ProtectedRoute-ban!

---

## 📋 5. Netlify Setup

### 5.1 SPA Routing

**Fájl:** `public/_redirects`

```
/*    /index.html   200
```

Ez biztosítja hogy minden URL (beleértve `/auth/setup-password`) az `index.html`-re irányítson.

### 5.2 TypeScript Strict Mode

**⚠️ KRITIKUS:** A Netlify deploy FAIL-el ha unused imports vannak!

**Helyes:**
```typescript
import { supabase } from '@/lib/supabase';
// használd is!
```

**Hibás:**
```typescript
import { useAuth } from '@/core/auth/useAuth';  // ← nincs használva!
```

**Error:** `error TS6133: 'useAuth' is declared but its value is never read.`

**Megoldás:** Távolítsd el az összes unused import-ot!

---

## 🔄 6. Teljes Flow

### User meghívás → Jelszó beállítás → Bejelentkezés

```
1. Admin meghívja a usert (email + név + role)
   ↓
2. Edge Function létrehozza a usert
   - password_set: false flag beállítása
   - Email küldés (Gmail SMTP)
   ↓
3. User megkapja az emailt
   - Kattint a linkre
   ↓
4. Link átirányít: /auth/setup-password
   - Supabase automatikusan belépteti (session létrehozás)
   ↓
5. ProtectedRoute ellenőrzi: password_set === false
   - Redirect /auth/setup-password oldalra
   ↓
6. User beállítja a jelszót
   - supabase.auth.updateUser({ password, data: { password_set: true } })
   ↓
7. Redirect dashboard-ra
   - User bejelentkezett ✅
   ↓
8. Kijelentkezés + újra bejelentkezés
   - Email + password működik ✅
```

---

## 🐛 Troubleshooting

### Probléma #1: "Error sending invite email"

**Tünet:** 500-as hiba az Edge Function-ben

**Ok:** SMTP konfiguráció hibás

**Megoldás:**
1. Ellenőrizd az SMTP Host mezőt → **NINCS whitespace**!
   ```bash
   # Helyes:
   smtp.gmail.com

   # Hibás (extra szóköz):
   smtp.gmail.com
   ```
2. Töröld ki és írd be újra (NE copy-paste!)
3. Save
4. Várj 1-2 percet (cache frissítés)

**Hiba üzenet Supabase logs-ban:**
```
error: "dial tcp: lookup smtp.gmail.com  : no such host"
```

### Probléma #2: "Site not found" Netlify hiba

**Tünet:** Invitation link 404-et ad

**Ok:** Rossz domain név a `SITE_URL`-ben

**Megoldás:**
1. Ellenőrizd hogy `dunaialapp.netlify.app` vagy `alapp.netlify.app`?
2. Frissítsd a `SITE_URL` environment változót:
   ```bash
   npx supabase secrets set SITE_URL=https://dunaialapp.netlify.app
   ```
3. Redeploy Edge Function
4. Frissítsd a Supabase Dashboard URL Configuration-t

### Probléma #3: `otp_expired` hiba

**Tünet:** Link átirányít de `error=access_denied&error_code=otp_expired`

**Ok:** Redirect URL nincs engedélyezve a Supabase Dashboard-on

**Megoldás:**
1. Supabase Dashboard → Authentication → URL Configuration
2. Redirect URLs: `https://dunaialapp.netlify.app/**`
3. Save

### Probléma #4: Invited user simán beenged jelszó nélkül

**Tünet:** User invitation link után egyből dashboard, NEM kér jelszót

**Ok:** `password_set: false` flag nincs beállítva vagy a frontend kód nem deployed

**Megoldás:**
1. **Ellenőrizd a Netlify deploy státuszt** → legyen sikeres!
2. **Hard refresh:** Cmd+Shift+R
3. **Töröld a régi invited usert** a Supabase Dashboard-on
4. **Hívj meg ÚJ usert** (új email címmel)
5. **Console ellenőrzés:**
   ```javascript
   supabase.auth.getUser().then(({data}) =>
     console.log(data.user?.user_metadata?.password_set)
   )
   ```
   Eredmény: `false` (ha invited user)

### Probléma #5: Netlify deploy failed (TypeScript error)

**Tünet:** Build error: `error TS6133: '...' is declared but its value is never read.`

**Ok:** Unused imports

**Megoldás:**
1. Távolítsd el az összes unused import-ot
2. Commit + push
3. Várj a deploy-ra

---

## 📊 Ellenőrző Checklist

### SMTP Setup ✅
- [ ] Gmail App Password létrehozva
- [ ] Supabase SMTP Settings mentve
- [ ] SMTP Host **NINCS whitespace**
- [ ] Port: 465 vagy 587
- [ ] Teszt email megérkezett

### Supabase URL Configuration ✅
- [ ] Site URL beállítva (pontos domain!)
- [ ] Redirect URLs: `https://<domain>/**`
- [ ] Save

### Edge Function ✅
- [ ] `password_set: false` flag a kódban
- [ ] `SITE_URL` environment változó beállítva
- [ ] Deployed (`--no-verify-jwt`)
- [ ] Logs-ban nincs hiba

### Frontend ✅
- [ ] `ProtectedRoute` ellenőrzi `password_set === false`
- [ ] `SetupPasswordPage` frissíti `password_set: true`
- [ ] `/auth/setup-password` route beállítva (NEM protected!)
- [ ] Netlify deploy sikeres (zöld pipa)
- [ ] Nincs unused import

### Netlify ✅
- [ ] `public/_redirects` fájl létezik
- [ ] Deploy sikeres (TypeScript build OK)
- [ ] Domain név helyes

### End-to-End Teszt ✅
- [ ] User meghívás működik
- [ ] Email megérkezik (spam mappát is nézd!)
- [ ] Invitation link helyes URL-re mutat
- [ ] Automatikus redirect `/auth/setup-password` oldalra
- [ ] Jelszó beállítás kötelező (NEM enged tovább nélküle!)
- [ ] Kijelentkezés + bejelentkezés működik

---

## 🔐 Biztonsági Megjegyzések

1. **Service Role Key:** Csak Edge Function-ben használd (SOHA ne a frontend-en!)
2. **App Password:** Tárold biztonságosan (Git ignore!)
3. **SMTP Rate Limit:** Gmail: 500 email/nap (vs. 2 email/óra Supabase built-in)
4. **Invited userek:** KÖTELEZŐ jelszó beállítás (nem tudnak belépni nélküle)

---

## 📚 További Dokumentáció

- `GMAIL_SMTP_SETUP.md` - Részletes SMTP útmutató
- `USER_INVITATION_IMPLEMENTATION_LOG.md` - Implementációs napló
- Supabase Docs: https://supabase.com/docs/guides/auth/auth-email
- Netlify Docs: https://docs.netlify.com/routing/redirects/

---

**Készítette:** Claude Sonnet 4.5
**Dátum:** 2026-02-23
**Projekt:** AlApp - Dunai Osztály Állományi Alkalmazás
