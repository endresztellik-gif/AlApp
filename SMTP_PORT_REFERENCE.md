# Gmail SMTP Port Választási Útmutató

## 🔌 Port Összehasonlítás

| Port | Protocol | Jellemzők | Ajánlás |
|------|----------|-----------|---------|
| **587** | STARTTLS | Modern standard, explicit TLS, jobb kompatibilitás | ⭐ **AJÁNLOTT** |
| **465** | SSL/TLS | Régebbi standard, implicit SSL, működik | ✅ Alternatíva |
| **25** | Plain SMTP | Nem titkosított, ISP-k blokkolják | ❌ NE HASZNÁLD |

---

## 🎯 Melyiket válaszd?

### **Ajánlott: Port 587 (STARTTLS)**

**Miért?**
- ✅ Modern iparági standard (RFC 6409)
- ✅ Explicit TLS encryption (STARTTLS parancs)
- ✅ Jobb firewall kompatibilitás
- ✅ Supabase ajánlja
- ✅ Kevésbé gyanús a spam filtereknek

**Mikor használd:**
- Új konfiguráció esetén (mint most)
- Production környezetben
- Amikor biztos akarod, hogy működjön

**Konfiguráció:**
```
SMTP Host: smtp.gmail.com
SMTP Port: 587
Security: STARTTLS
```

---

### **Alternatíva: Port 465 (SSL/TLS)**

**Miért?**
- ✅ Implicit SSL encryption (biztonságos)
- ✅ Gyors connection (nincs negotiation)
- ✅ Működik Gmail-lel
- ⚠️ Régebbi standard (RFC 8314 deprecálta)

**Mikor használd:**
- Ha a 587 valami oknál fogva nem működik
- Legacy rendszerekkel való kompatibilitás
- Ha már működik, nincs ok változtatni

**Konfiguráció:**
```
SMTP Host: smtp.gmail.com
SMTP Port: 465
Security: SSL/TLS
```

---

## 🔄 Mi van, ha mindkettő működik?

**Választás:** Maradj a **587**-nél.

**Indoklás:**
1. Modern standard
2. Jobb támogatás
3. Kevesebb jövőbeli probléma
4. Könnyebb troubleshooting (több dokumentáció)

---

## 🛠️ Jelenlegi Konfiguráció az Edge Functions-ben

A jelenlegi Edge Functions (**check-expirations**, **checklist-alert**, **database-backup**) a **465** portot használják:

```typescript
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true, // SSL/TLS
  auth: {
    user: Deno.env.get("SMTP_USER"),
    pass: Deno.env.get("SMTP_PASS"),
  },
});
```

**Változtatás szükséges?** ❌ NEM

**Miért?**
- Működik, nincs probléma
- Edge Functions és Auth SMTP független
- Különböző transport mechanizmusok

**Opcionális:**
Ha később egységesíteni akarod (mindenhol 587), akkor:
1. Edge Functions-ben `port: 587` és `secure: false`
2. Auth SMTP-ben is `port: 587`

---

## 🔍 Port Probléma Diagnosztika

### Probléma: "Connection refused" (Port 587)

**Lehetséges okok:**
1. Firewall blokkolja a 587 portot
2. ISP blokkolja az SMTP-t
3. Proxy/VPN interferál

**Megoldás:**
1. Próbáld meg a 465 portot
2. Ellenőrizd a firewall beállításokat
3. Kapcsold ki a VPN-t teszteléshez

### Probléma: "Connection timeout" (Port 465)

**Lehetséges okok:**
1. Implicit SSL nem támogatott
2. Firewall blokkolja
3. SMTP Host hibás

**Megoldás:**
1. Próbáld meg a 587 portot
2. Ellenőrizd: `smtp.gmail.com` (nem `mail.google.com`)
3. Várj 5 percet és próbáld újra

### Probléma: "SSL/TLS error"

**Lehetséges okok:**
1. Port és Security Mode mismatch
2. Expired SSL certificate (ritka)

**Megoldás:**
```
Port 587 → Security: STARTTLS
Port 465 → Security: SSL/TLS
```

---

## 📊 Performance Összehasonlítás

| Szempont | Port 587 | Port 465 |
|----------|----------|----------|
| **Connection Speed** | ⚡ Gyors | ⚡⚡ Gyorsabb (nincs negotiation) |
| **Security** | 🔒 Biztonságos | 🔒 Biztonságos |
| **Kompatibilitás** | ✅ Széles | ⚠️ Kisebb |
| **Future-proof** | ✅ Igen | ⚠️ Deprecált |
| **Error Messages** | 📝 Részletesebb | 📝 Kevésbé informatív |

**Következtetés:** A **587** jobb választás hosszú távon.

---

## 🧪 Tesztelés Terminálból (Opcionális)

### Port 587 teszt:

```bash
openssl s_client -starttls smtp -connect smtp.gmail.com:587
```

**Elvárás:**
- `220 smtp.google.com ESMTP` üzenet
- `STARTTLS` parancs elérhető

### Port 465 teszt:

```bash
openssl s_client -connect smtp.gmail.com:465
```

**Elvárás:**
- Immediate SSL handshake
- Certificate details megjelennek

---

## ✅ Döntési Fa

```
Új Supabase Auth SMTP konfiguráció?
│
├─ Igen → Használj 587-et (STARTTLS)
│
└─ Meglévő Edge Functions módosítása?
   │
   ├─ Működik jelenleg? → Hagyd 465-nél
   │
   └─ Nem működik? → Próbáld meg a 587-et
```

---

## 📚 További Olvasnivaló

1. **Gmail SMTP Settings:**
   - https://support.google.com/a/answer/176600

2. **STARTTLS vs SSL/TLS:**
   - https://www.mailgun.com/blog/which-smtp-port-understanding-ports-25-465-587/

3. **RFC 6409 (Port 587):**
   - https://tools.ietf.org/html/rfc6409

4. **Supabase Custom SMTP:**
   - https://supabase.com/docs/guides/auth/auth-smtp

---

**Gyors Döntés:** Ha kétségeid vannak, **használd a 587-et**.
