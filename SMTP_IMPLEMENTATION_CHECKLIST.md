# 📋 Gmail SMTP Implementációs Checklist

**Projekt:** AlApp - Supabase Auth Email SMTP
**Dátum:** 2026-02-22
**Cél:** Built-in 2 email/óra limit felváltása Gmail SMTP-vel (500 email/nap)

---

## ⚡ Gyors Start (5 perc)

### 1️⃣ Nyisd meg a Supabase Dashboard-ot

```
https://supabase.com/dashboard/project/mgducjqbzqcmrzcsklmn/auth/email-templates
```

- [ ] Bejelentkezve vagy
- [ ] Authentication menüpont látható

---

### 2️⃣ SMTP Settings Beállítás

Kattints: **Authentication → Email → SMTP Settings**

- [ ] "Enable Custom SMTP" → **BE**
- [ ] SMTP Host: `smtp.gmail.com`
- [ ] SMTP Port: `587`
- [ ] SMTP User: `dunaddnpi@gmail.com`
- [ ] SMTP Password: `buwilryyaxrwjieu`
- [ ] Sender Email: `dunaddnpi@gmail.com`
- [ ] Sender Name: `Dunai Osztály AlApp`
- [ ] **SAVE** gomb megnyomva

---

### 3️⃣ Tesztelés

**Teszt 1: Meghívó küldés**
- [ ] Settings → Users → Meghívás gomb
- [ ] Email cím megadása (saját teszteléséhez)
- [ ] Meghívás elküldve
- [ ] Email megérkezett (ellenőrizd a spam mappát is)
- [ ] Sender: `dunaddnpi@gmail.com`

**Teszt 2: Magic Link (Opcionális)**
- [ ] Kijelentkezés
- [ ] Login → Magic Link tab
- [ ] Email megadása
- [ ] Email megérkezett
- [ ] Link működik

**Teszt 3: Password Reset (Opcionális)**
- [ ] Kijelentkezés
- [ ] Login → Elfelejtett jelszó
- [ ] Email megadása
- [ ] Email megérkezett
- [ ] Reset link működik

---

## 🎯 Sikerességi Kritériumok

### ✅ Működik, ha:
1. Email érkezik pár percen belül
2. Sender cím: `Dunai Osztály AlApp <dunaddnpi@gmail.com>`
3. Link-ek kattinthatók és működnek
4. Nincs "invalid credentials" hiba a Dashboard-on

### ❌ Hibaelhárítás szükséges, ha:
1. "Invalid credentials" hiba → Ellenőrizd a password-öt
2. "Connection timeout" → Próbáld meg a 465 portot
3. Email nem érkezik → Nézd meg a spam mappát
4. "Too many requests" → Várj pár percet

---

## 📊 Konfiguráció Referencia

### Jelenlegi Beállítások (.env fájl)

```env
SMTP_USER=dunaddnpi@gmail.com
SMTP_PASS=buwilryyaxrwjieu
```

### Dashboard SMTP Settings

| Paraméter | Érték |
|-----------|-------|
| Host | smtp.gmail.com |
| Port | 587 (TLS) |
| User | dunaddnpi@gmail.com |
| Password | buwilryyaxrwjieu |
| Sender Email | dunaddnpi@gmail.com |
| Sender Name | Dunai Osztály AlApp |

---

## 🔍 Ellenőrzési Pontok

### Supabase Dashboard
- [ ] Authentication → Email → SMTP Settings
- [ ] "Custom SMTP enabled" látható
- [ ] Green checkmark az SMTP konfiguránál

### Gmail Fiók
- [ ] 2FA engedélyezve: https://myaccount.google.com/security
- [ ] App Passwords létezik
- [ ] Nincs gyanús bejelentkezési figyelmeztetés

### Email Deliverability
- [ ] Emailek a Beérkezett mappába érkeznek (nem spam)
- [ ] Sender domain `gmail.com` (megbízható)
- [ ] Link-ek nem törtek el (kattinthatók)

---

## 📈 Limitek és Monitoring

### Gmail SMTP Limitek

| Limit | Érték | Státusz |
|-------|-------|---------|
| Napi max | 500 email/nap | ✅ Bőven elég |
| Óránkénti ajánlott | 20-30 email/óra | ✅ Normál használatra OK |
| Built-in Supabase (régi) | 2 email/óra | ❌ Túl lassú (lecseréltük) |

### Monitoring Checklist

- [ ] Első héten figyelj a napi email számra
- [ ] Ha 100+ email/nap → fontold meg a fizetős SMTP-t
- [ ] Ellenőrizd havonta a Gmail Elküldött mappát
- [ ] Ha sok spam report → javíts az email template-en

---

## 🛡️ Biztonsági Checklist

- [ ] `.env` fájl nincs commitolva (`.gitignore`)
- [ ] App Password nincs megosztva
- [ ] 2FA engedélyezve a Gmail fiókon
- [ ] Production környezetben használj environment secrets-et
- [ ] Ne használd személyes emailekhez ezt a konfigurációt

---

## 📝 Changelog

### v1.0 - 2026-02-22 (Initial Setup)

**Változtatások:**
- ✅ Gmail Custom SMTP bekapcsolva
- ✅ Port 587 (STARTTLS) beállítva
- ✅ Sender cím: `dunaddnpi@gmail.com`
- ✅ Sender név: `Dunai Osztály AlApp`

**Előnyök:**
- Built-in 2 email/óra → Gmail 500 email/nap (250x gyorsabb)
- Egységes sender cím
- Jobb deliverability
- Nincs költség

**Mit NEM változtattunk:**
- Edge Functions SMTP (továbbra is 465 porton működik)
- `.env` fájl (már tartalmazta a helyes adatokat)
- Email template-ek (még angolul vannak)

---

## 🚀 Következő Lépések (Opcionális)

Ezek OPCIONÁLISAK, NEM kötelezők:

### Rövid távú (1-2 hét)
- [ ] Email template-ek magyarra fordítása
- [ ] Email template design testreszabása (AlApp logo, színek)
- [ ] Rate limit emelés 50-100 email/órára (ha szükséges)

### Hosszú távú (1-3 hónap)
- [ ] Monitoring dashboard a napi email számra
- [ ] Automatikus backup az SMTP beállításokról
- [ ] Custom domain fontolgatása (`noreply@dunaliosztaly.hu`)

---

## 📞 Hibaelhárítási Gyors Segítség

### Probléma 1: "Invalid credentials"
```
1. Ellenőrizd a Dashboard-on: password pontosan "buwilryyaxrwjieu"
2. Nincs szóköz a végén/elején
3. 2FA engedélyezve a Gmail-en
```

### Probléma 2: "Connection timeout"
```
1. Változtasd meg: Port 587 → 465
2. Várj 5 percet
3. Próbáld újra
```

### Probléma 3: Email nem érkezik
```
1. Ellenőrizd a spam mappát
2. Nézd meg: Supabase Dashboard → Auth → Logs
3. Gmail "Elküldött üzenetek" mappa
```

### Probléma 4: Spam mappába kerül
```
1. Jelöld meg "Nem spam"-ként
2. Add hozzá dunaddnpi@gmail.com a Kapcsolatokhoz
3. Kérd meg 2-3 felhasználót, hogy tegyék meg ugyanezt
```

---

## ✅ Végső Ellenőrzés

**Minden rendben van, ha:**
- [x] SMTP Settings mentve a Dashboard-on
- [ ] Teszt email elküldve és megérkezett
- [ ] Sender cím: `dunaddnpi@gmail.com`
- [ ] Nincs hiba a Dashboard Logs-ban
- [ ] Link-ek működnek
- [ ] Email nem spam mappában van

**Ha minden ✅, akkor kész vagy!** 🎉

---

## 📚 Hasznos Linkek

1. **Supabase Auth SMTP Docs:**
   - https://supabase.com/docs/guides/auth/auth-smtp

2. **Gmail SMTP Settings:**
   - https://support.google.com/a/answer/176600

3. **Troubleshooting Guide:**
   - https://supabase.com/docs/guides/troubleshooting/using-google-smtp-with-supabase-custom-smtp-ZZzU4Y

4. **Supabase Dashboard:**
   - https://supabase.com/dashboard/project/mgducjqbzqcmrzcsklmn

---

**Utolsó frissítés:** 2026-02-22
**Verzió:** 1.0
**Időigény:** ~5 perc (Dashboard konfiguráció) + 5 perc (tesztelés)
