# Gmail SMTP Beállítás - Supabase Auth

## 🎯 Cél

Supabase Authentication emailek (meghívók, jelszó reset, magic link) küldése Gmail SMTP-n keresztül a `dunaddnpi@gmail.com` címről, hogy elkerüljük a 2 email/óra built-in limitet.

---

## ✅ Előfeltételek (Már megvannak!)

- ✅ Gmail fiók: `dunaddnpi@gmail.com`
- ✅ App Password: `buwilryyaxrwjieu`
- ✅ 2FA engedélyezve a Gmail fiókon
- ✅ Edge Functions már működnek Gmail SMTP-vel

---

## 📋 Implementációs Lépések

### 1. Supabase Dashboard Megnyitása

1. Nyisd meg a böngészőt és menj a Supabase Dashboard-ra:
   ```
   https://supabase.com/dashboard/project/mgducjqbzqcmrzcsklmn/auth/email-templates
   ```

2. Jelentkezz be a Supabase fiókkal

3. Navigálj az Authentication beállításokhoz:
   - Bal oldali menü → **Authentication**
   - Felül → **Email** tab

---

### 2. SMTP Settings Konfiguráció

1. Kattints a **"SMTP Settings"** fülre (vagy másik néven "Provider Settings")

2. Kapcsold **BE** a "Enable Custom SMTP" opciót

3. Töltsd ki a következő mezőket:

   | Mező | Érték |
   |------|-------|
   | **SMTP Host** | `smtp.gmail.com` |
   | **SMTP Port** | `587` |
   | **SMTP User** | `dunaddnpi@gmail.com` |
   | **SMTP Password** | `buwilryyaxrwjieu` |
   | **Sender Email** | `dunaddnpi@gmail.com` |
   | **Sender Name** | `Dunai Osztály AlApp` |

   **FONTOS:**
   - Port: **587** (STARTTLS) - ez a modern és ajánlott
   - Password: másold be szóközök nélkül
   - Sender Email és SMTP User azonos legyen

4. Kattints a **"Save"** gombra

5. Várj pár másodpercet amíg menti

---

### 3. Email Templates Ellenőrzés (Opcionális)

Ha magyar nyelvű emaileket szeretnél:

1. Menj az **Email Templates** fülre
2. Szerkeszd a következő template-eket:
   - **Invite User** (Meghívó email)
   - **Magic Link** (Magic link login)
   - **Password Reset** (Jelszó visszaállítás)
   - **Email Change** (Email cím változtatás)

3. Minden template-nél:
   - Subject: magyarra fordíthatod (pl. "Meghívó az AlApp rendszerbe")
   - Body: használd a `{{ .ConfirmationURL }}` változókat
   - **NE változtasd** meg a változók nevét ({{ .SiteURL }}, stb.)

---

## 🧪 Tesztelés

### Test 1: Felhasználó Meghívás

1. Jelentkezz be az alkalmazásba **adminként**
2. Menj a **Settings → Users** oldalra
3. Kattints a **"Meghívás"** gombra
4. Add meg:
   - Email cím (használj egy saját email címet, amit el tudsz érni)
   - Teljes név
   - Szerepkör
5. Kattints **"Meghívás"**
6. ✅ **Ellenőrzés:**
   - Email megérkezett pár percen belül
   - Sender: `Dunai Osztály AlApp <dunaddnpi@gmail.com>`
   - Subject: "You have been invited"
   - Body: meghívó link látható

### Test 2: Jelszó Reset

1. Kijelentkezés
2. Login oldalon kattints **"Elfelejtett jelszó?"**
3. Add meg egy létező felhasználó email címét
4. Kattints **"Jelszó visszaállítási link küldése"**
5. ✅ **Ellenőrzés:**
   - Email megérkezett
   - Sender: `dunaddnpi@gmail.com`
   - Reset link működik

### Test 3: Magic Link Login

1. Kijelentkezés
2. Login oldalon válts **"Magic Link"** tabra
3. Add meg email címed
4. Kattints **"Magic Link küldése"**
5. ✅ **Ellenőrzés:**
   - Email megérkezett
   - Magic link működik (bejelentkeztet)

---

## 🔍 Hibaelhárítás

### Probléma: "Invalid credentials" hiba

**Okok:**
- Hibás App Password
- 2FA nincs engedélyezve

**Megoldás:**
1. Ellenőrizd, hogy a password pontosan `buwilryyaxrwjieu` (szóközök nélkül)
2. Nézd meg, hogy a 2FA be van-e kapcsolva:
   - https://myaccount.google.com/security
   - **2-Step Verification** → ON

### Probléma: "Connection timeout"

**Okok:**
- Rossz port
- Tűzfal blokkolja

**Megoldás:**
1. Próbáld meg a **465** portot (SSL helyett STARTTLS):
   - SMTP Port: `465`
2. Várj 5 percet és próbáld újra
3. Ellenőrizd, hogy nincs-e hálózati probléma

### Probléma: Emailek spam mappába kerülnek

**Megoldás:**
1. Gmail-ben nyisd meg a spam mappát
2. Jelöld meg az AlApp emailt
3. Kattints **"Nem spam"**
4. Add hozzá `dunaddnpi@gmail.com` címet a **Kapcsolatok**hoz

### Probléma: Emailek nem érkeznek meg

**Ellenőrzési lépések:**
1. Nézd meg a Supabase Dashboard-on az **Authentication → Logs** oldalt
2. Keresd meg a "send email" eseményeket
3. Ha van hibaüzenet, olvass el
4. Ellenőrizd a Gmail fiók **Elküldött üzenetek** mappáját

---

## 📊 Gmail SMTP Limitek

| Limit típus | Érték | Megjegyzés |
|-------------|-------|------------|
| **Napi email limit** | 500 email/nap | Gmail ingyenes fiók |
| **Ajánlott sebesség** | 20-30 email/óra | Kerüld a spam jelzést |
| **Built-in Supabase** | 2 email/óra | Régi limit, már nem használt |

**Következtetés:**
- ✅ 10-20 meghívó/nap → Tökéletes
- ✅ Normál használat → Sose lesz probléma
- ⚠️ Tömeges meghívók (100+ egy nap) → Figyelj a limitekre

---

## 🔐 Biztonsági Megjegyzések

### ✅ Jó gyakorlatok:

1. **App Password tárolása:**
   - `.env` fájl **NE** legyen commitolva
   - Production környezetben használj environment secrets-et

2. **2FA:**
   - Mindig legyen engedélyezve
   - App Password csak 2FA mellett működik

3. **Monitoring:**
   - Figyelj a napi email számra
   - Ha közelíted a 500-at, fontold meg egy fizetős SMTP service-t

### ⚠️ Figyelmeztetések:

- **NE oszd meg** az App Password-öt senkivel
- **NE használd** személyes emailekhez ezt a konfigurációt
- **Rotáld** az App Password-öt időnként (3-6 havonta)

---

## 📈 Mi Változott?

### Régi állapot:
- ❌ Built-in Supabase SMTP
- ❌ 2 email/óra limit
- ❌ Lassú meghívások
- ❌ Névtelen sender cím

### Új állapot:
- ✅ Gmail Custom SMTP
- ✅ 500 email/nap limit (~20/óra)
- ✅ Gyors meghívások
- ✅ Egységes sender: `dunaddnpi@gmail.com`

---

## 🚀 Következő Lépések (Opcionális)

### Ha később több emailre van szükség:

1. **Google Workspace** (fizetős)
   - 2000 email/nap/felhasználó
   - Saját domain (`info@dunaliosztaly.hu`)

2. **Resend** (dedikált SMTP)
   - Ingyenes tier: 100 email/nap
   - Fizetős: 3000 email/hó
   - Jobb deliverability

3. **Magyar nyelvű email template-ek**
   - Fordítsd le a built-in template-eket magyarra
   - Custom branding (AlApp logo, színek)

---

## ✅ Ellenőrző Checklist

Nyomtasd ki vagy mentsd el ezt a listát a beállítás során:

- [ ] Supabase Dashboard megnyitva
- [ ] Authentication → Email → SMTP Settings
- [ ] "Enable Custom SMTP" bekapcsolva
- [ ] SMTP Host: `smtp.gmail.com`
- [ ] SMTP Port: `587`
- [ ] SMTP User: `dunaddnpi@gmail.com`
- [ ] SMTP Password: `buwilryyaxrwjieu`
- [ ] Sender Email: `dunaddnpi@gmail.com`
- [ ] Sender Name: `Dunai Osztály AlApp`
- [ ] "Save" gomb megnyomva
- [ ] Teszt meghívó elküldve
- [ ] Email megérkezett
- [ ] Sender cím helyes
- [ ] Magic Link teszt sikeres
- [ ] Password Reset teszt sikeres

---

## 📞 Segítség

Ha bármi probléma merül fel:

1. **Supabase Docs:**
   - https://supabase.com/docs/guides/troubleshooting/using-google-smtp-with-supabase-custom-smtp-ZZzU4Y

2. **Gmail SMTP Docs:**
   - https://support.google.com/a/answer/176600

3. **Supabase Support:**
   - https://supabase.com/support

---

**Utolsó frissítés:** 2026-02-22
**Szerző:** Claude Code
**Verzió:** 1.0
