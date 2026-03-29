# AlApp – Implementációs Terv

## 1. Projekt Áttekintés

### 1.1 Célkitűzés
Erdészeti/természetvédelmi szervezet számára készülő moduláris nyilvántartó és adminisztrációs PWA, amely kezeli a személyek képzettségeit, járműveket, eszközöket, és azok érvényességi idejét. A rendszer hosszú távon komplex irányító alkalmazássá bővíthető.

### 1.2 Felhasználók
- ~10 fő
- 50% terep (mobil), 50% iroda (desktop) használat
- Magyar nyelvű felület (i18n-kompatibilis fejlesztéssel a jövőbeli bővíthetőség érdekében)

### 1.3 Projekt neve
**AlApp** 🌲

---

## 2. Tech Stack

### 2.1 Frontend
| Technológia | Cél |
|---|---|
| React 18+ | UI keretrendszer |
| TypeScript | Típusbiztos fejlesztés |
| Vite | Build tool és dev server |
| Tailwind CSS | Utility-first CSS |
| shadcn/ui | Komponens könyvtár (testreszabott pasztell téma) |
| Framer Motion | Mikro-animációk |
| Workbox | Service Worker / PWA offline |
| IndexedDB (Dexie.js) | Offline adatgyorsítótár |
| React Query (TanStack Query) | Szerver-állapot kezelés + offline sync |
| jsPDF | PDF export |
| SheetJS (xlsx) | Excel/CSV export |
| html5-qrcode | QR-kód olvasás |
| qrcode.react | QR-kód generálás |
| browser-image-compression | Kliensoldali képtömörítés feltöltés előtt |
| react-big-calendar | Szabadság-naptár megjelenítés |
| date-fns | Dátumkezelés (magyar lokalizáció) |
| Vitest | Unit és komponens tesztek |
| Playwright | E2E és átfogó tesztek |
| React Testing Library | Komponens tesztek |
| i18next | Nemzetköziesítés (egyelőre csak magyar, de felkészítve többnyelvűségre) |

### 2.2 Backend
| Technológia | Cél |
|---|---|
| Supabase (Cloud) | Adatbázis (PostgreSQL), Auth, Edge Functions |
| Supabase CLI | Lokális fejlesztés, migrációk |
| Row Level Security (RLS) | Többszintű adathozzáférés |
| Supabase Realtime | Valós idejű frissítések (dashboard) |

### 2.3 Külső szolgáltatások
| Szolgáltatás | Cél |
|---|---|
| Google Drive API | Fotók tárolása (Service Account) |
| Google Calendar API | Szabadság-naptár read-only (Service Account) |
| Resend | Email értesítések (Gmail cím) |
| Web Push (VAPID) | Push értesítések (böngésző natív) |
| Netlify | Production hosting (statikus) |

### 2.4 Lokális fejlesztői környezet
| Eszköz | Cél |
|---|---|
| Vite dev server | Frontend (http://localhost:5173) |
| Supabase CLI (local) | Teljes Supabase emuláció (DB, Auth, Storage, Edge Functions) |
| Mailpit | Lokális email catcher (http://localhost:8025) |
| Mock Google Services | Lokális fájlrendszer Drive mock + JSON Calendar mock |
| Docker Compose | Egy paranccsal indul a teljes környezet |

---

## 3. Fejlesztési Környezet és Workflow

### 3.1 Fejlesztő eszközök
| Eszköz | Szerep |
|---|---|
| Google Antigravity | Projekt menedzsment + fejlesztés koordináció |
| Claude Code (Opus) | Architekturális döntések, komplex logika, 1. fázis |
| Claude Code (Sonnet) | Rutinfeladatok, CRUD, ismétlődő minták, 2-5. fázis |
| Claude AI | Tervezés, konzultáció, dokumentáció |
| Claude Code frontend-design skill | UI/UX csinosítás, design implementáció |
| Gemini 2.5 Pro | Kiegészítő fejlesztés, nagy kontextusú feladatok, fallback |

### 3.2 Modellhasználati stratégia
- **Opus**: alaparchitektúra, jogosultságkezelés, dinamikus mezőséma, értesítési rendszer, RLS policy-k, code review, refaktorálás
- **Sonnet**: modulok implementálása meglévő minták alapján, UI komponensek, tesztek írása, kisebb bugfixek
- **Gemini 2.5 Pro**: nagy kontextusú feladatok, Claude kvóta kiegészítés, alternatív megközelítések

### 3.3 Konzisztencia biztosítása
Egy `CONVENTIONS.md` fájl tartalmazza a kódstílus szabályokat, elnevezési konvenciókat, fájlstruktúra mintákat – ezt minden AI modell kontextusként megkapja fejlesztés előtt.

### 3.4 MCP-k (Model Context Protocol)
**Fejlesztéshez:**
- Supabase MCP – adatbázis séma, RLS, Edge Functions kezelése
- GitHub MCP – verziókezelés, branch-ek, PR-ek
- Filesystem MCP – fájlkezelés a projektben

**Google integrációkhoz:**
- Google Drive MCP – fotó-feltöltési logika tesztelése
- Google Calendar MCP – naptár-lekérdezések tesztelése

**Designhoz:**
- Figma MCP – design tokenek exportálása (opcionális)

**Teszteléshez:**
- Browser MCP / Puppeteer MCP – automatizált tesztelés, screenshot-ok

**Projekt menedzsmenthez (Antigravity):**
- Linear MCP vagy Notion MCP – feladatkövetés

### 3.5 Git workflow
```
main ← develop ← feature/modul-neve
```
- `feature/*` branch-ek modulonként
- `develop`-ba merge tesztelés után
- `main`-be merge fázis végi mérföldkőnél (deploy)
- Commit üzenetek magyarul, konvencionális commit formátum

### 3.6 Deploy stratégia
1. **Fejlesztés közben:** minden lokálban (Vite + lokális Supabase + mock Google + Mailpit)
2. **Fázis végi mérföldkő:** Netlify deploy + cloud Supabase migráció + valódi Google API-k → éles tesztelés
3. **Élesítés:** összes fázis kész és tesztelve → production release

---

## 4. Architektúra

### 4.1 Moduláris keretrendszer
Minden modul (személyek, járművek, eszközök, naptár, káresemény, egyéb) egy közös keretrendszerbe illeszkedik:

```
┌─────────────────────────────────────────────────┐
│                    AlApp Shell                   │
│  ┌─────────┐ ┌──────────┐ ┌───────────────────┐ │
│  │  Auth    │ │  Router  │ │  Feature Flags    │ │
│  └─────────┘ └──────────┘ └───────────────────┘ │
│  ┌─────────────────────────────────────────────┐ │
│  │           Közös szolgáltatások               │ │
│  │  Értesítések │ Audit Log │ Export │ Drive    │ │
│  └─────────────────────────────────────────────┘ │
│  ┌────────┐┌────────┐┌────────┐┌────────┐┌────┐ │
│  │Személyek││Járművek││Eszközök││ Naptár ││ +  │ │
│  │ modul   ││ modul  ││ modul  ││ modul  ││....│ │
│  └────────┘└────────┘└────────┘└────────┘└────┘ │
│  ┌─────────────────────────────────────────────┐ │
│  │          Káresemény mini-app                 │ │
│  └─────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────┘
```

### 4.2 Feature Flag rendszer
Az admin felületen modulok aktiválhatók/deaktiválhatók. A feature flagek Supabase-ben tárolódnak (`app_settings` tábla), és a frontend dinamikusan rendereli a menüt és a modulokat.

```typescript
// Példa feature flag struktúra
interface FeatureFlags {
  module_personnel: boolean;    // Személyek modul
  module_vehicles: boolean;     // Járművek modul
  module_equipment: boolean;    // Eszközök modul
  module_calendar: boolean;     // Szabadság-naptár
  module_incidents: boolean;    // Káresemény mini-app
  module_other: boolean;        // Egyéb (jövőbeli)
  feature_qr_codes: boolean;    // QR-kód funkció
  feature_offline_write: boolean; // Offline írás
}
```

### 4.3 Mappastruktúra (frontend)
```
src/
├── app/                          # App shell, routing, providers
│   ├── App.tsx
│   ├── routes.tsx
│   └── providers/
├── core/                         # Közös szolgáltatások
│   ├── auth/                     # Autentikáció
│   ├── permissions/              # Jogosultságkezelés
│   ├── notifications/            # Email + Push értesítések
│   ├── audit/                    # Audit log
│   ├── export/                   # CSV/Excel/PDF export
│   ├── drive/                    # Google Drive integráció
│   ├── feature-flags/            # Feature flag rendszer
│   ├── offline/                  # Service Worker, IndexedDB
│   └── dynamic-fields/           # Dinamikus mezőséma motor
├── modules/                      # Modulok (feature flag-hez kötve)
│   ├── personnel/                # Személyek modul
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── pages/
│   │   ├── types/
│   │   └── utils/
│   ├── vehicles/                 # Járművek modul
│   ├── equipment/                # Eszközök modul
│   ├── calendar/                 # Szabadság-naptár modul
│   ├── incidents/                # Káresemény mini-app
│   └── other/                    # Egyéb (jövőbeli)
├── shared/                       # Megosztott komponensek
│   ├── components/               # UI komponensek (shadcn/ui testreszabások)
│   ├── hooks/                    # Közös React hookok
│   ├── layouts/                  # Layout komponensek (desktop/mobil)
│   ├── types/                    # Közös TypeScript típusok
│   └── utils/                    # Segédfüggvények
├── styles/                       # Globális stílusok, Tailwind konfig
│   ├── globals.css
│   └── theme.ts                  # AlApp pasztell téma definíció
├── i18n/                         # Nyelvesítés
│   └── hu/                       # Magyar nyelvi fájlok
├── tests/                        # Teszt konfigurációk és segédeszközök
│   ├── e2e/                      # Playwright E2E tesztek
│   ├── integration/              # Átfogó tesztek
│   └── setup/                    # Teszt környezet beállítás
└── sw/                           # Service Worker (Workbox)
```

---

## 5. Adatbázis Séma (Supabase / PostgreSQL)

### 5.1 Alapvető táblák

```sql
-- Felhasználók (Supabase Auth kiegészítése)
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'reader', 'admin')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Feature flagek
CREATE TABLE feature_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  enabled BOOLEAN DEFAULT false,
  updated_by UUID REFERENCES user_profiles(id),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Entitás típusok (személyek, járművek, eszközök, stb.)
CREATE TABLE entity_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,           -- pl. 'személyautó', 'utánfutó', 'láncfűrész'
  module TEXT NOT NULL,          -- 'personnel', 'vehicles', 'equipment'
  icon TEXT,                     -- opcionális ikon azonosító
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Mező sémák (dinamikus mező definíciók)
CREATE TABLE field_schemas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type_id UUID REFERENCES entity_types(id) ON DELETE CASCADE,
  field_name TEXT NOT NULL,                 -- pl. 'Rendszám', 'Forgalmi engedély lejárata'
  field_key TEXT NOT NULL,                  -- pl. 'license_plate', 'registration_expiry'
  field_type TEXT NOT NULL CHECK (field_type IN (
    'text', 'number', 'date', 'date_expiry', 'select', 'file'
  )),
  is_required BOOLEAN DEFAULT false,
  select_options JSONB,                     -- legördülő lista opciók ['aktív', 'javításra vár', 'selejtezett']
  display_order INTEGER DEFAULT 0,
  -- Értesítési küszöbök (csak 'date_expiry' típusnál releváns)
  alert_days_warning INTEGER DEFAULT 90,    -- sárga jelzés
  alert_days_urgent INTEGER DEFAULT 30,     -- narancs jelzés
  alert_days_critical INTEGER DEFAULT 7,    -- piros jelzés
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Entitások (konkrét személyek, járművek, eszközök)
CREATE TABLE entities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type_id UUID REFERENCES entity_types(id),
  display_name TEXT NOT NULL,               -- megjelenítési név (pl. 'ABC-123', 'Kiss Péter')
  responsible_user_id UUID REFERENCES user_profiles(id),  -- személyi felelős
  module TEXT NOT NULL,                     -- 'personnel', 'vehicles', 'equipment'
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Mező értékek (dinamikus adatok tárolása)
CREATE TABLE field_values (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id UUID REFERENCES entities(id) ON DELETE CASCADE,
  field_schema_id UUID REFERENCES field_schemas(id) ON DELETE CASCADE,
  value_text TEXT,                           -- szöveg és szám értékek
  value_date DATE,                           -- dátum értékek
  value_json JSONB,                          -- összetett értékek (fájl referenciák, stb.)
  updated_by UUID REFERENCES user_profiles(id),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(entity_id, field_schema_id)
);

-- Személyes entitás-felhasználó összerendelés
-- (melyik entitás tartozik melyik felhasználóhoz - személyek modulnál)
CREATE TABLE entity_user_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id UUID REFERENCES entities(id) ON DELETE CASCADE,
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  UNIQUE(entity_id, user_id)
);

-- Fotók (Google Drive referenciák)
CREATE TABLE photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id UUID REFERENCES entities(id) ON DELETE CASCADE,
  drive_file_id TEXT NOT NULL,               -- Google Drive file ID
  drive_url TEXT NOT NULL,                   -- Google Drive megtekintési URL
  filename TEXT NOT NULL,
  description TEXT,
  uploaded_by UUID REFERENCES user_profiles(id),
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- Káresemények
CREATE TABLE incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id UUID REFERENCES entities(id) ON DELETE CASCADE,
  reported_by UUID REFERENCES user_profiles(id),
  description TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Káresemény fotók (Google Drive)
CREATE TABLE incident_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id UUID REFERENCES incidents(id) ON DELETE CASCADE,
  drive_file_id TEXT NOT NULL,
  drive_url TEXT NOT NULL,
  filename TEXT NOT NULL,
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- Értesítési napló
CREATE TABLE notification_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES user_profiles(id),
  entity_id UUID REFERENCES entities(id),
  field_schema_id UUID REFERENCES field_schemas(id),
  notification_type TEXT NOT NULL CHECK (notification_type IN ('email', 'push')),
  alert_level TEXT NOT NULL CHECK (alert_level IN ('warning', 'urgent', 'critical', 'expired')),
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  acknowledged BOOLEAN DEFAULT false
);

-- Push subscription (web-push)
CREATE TABLE push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  subscription JSONB NOT NULL,              -- web-push subscription object
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Audit log
CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES user_profiles(id),
  action TEXT NOT NULL,                     -- 'create', 'update', 'delete'
  table_name TEXT NOT NULL,
  record_id UUID NOT NULL,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- App beállítások (feature flagek, rendszerszintű konfiguráció)
CREATE TABLE app_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_by UUID REFERENCES user_profiles(id),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 5.2 Row Level Security (RLS) szabályok

```sql
-- Felhasználó: csak saját profilt látja és szerkeszti
-- Olvasó: minden profilt látja, sajátját szerkeszti
-- Admin: mindent lát és szerkeszt

-- Példa: entities tábla RLS
ALTER TABLE entities ENABLE ROW LEVEL SECURITY;

-- Admin mindent lát
CREATE POLICY "admin_all" ON entities
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Olvasó mindent lát (SELECT), de nem szerkeszt
CREATE POLICY "reader_select" ON entities
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'reader')
  );

-- Felhasználó csak saját entitásait látja
CREATE POLICY "user_own" ON entities
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM entity_user_links
      WHERE entity_id = entities.id AND user_id = auth.uid()
    )
    OR
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('reader', 'admin'))
  );

-- Káresemény: mindenki felvihet
CREATE POLICY "incidents_insert_all" ON incidents
  FOR INSERT TO authenticated
  WITH CHECK (reported_by = auth.uid());

-- Káresemény: mindenki láthatja
CREATE POLICY "incidents_select_all" ON incidents
  FOR SELECT TO authenticated
  USING (true);
```

---

## 6. Jogosultsági Modell

### 6.1 Három szint

| Szint | Kód | Saját adatok | Mások adatai | Rendszer | Értesítés | Káresemény |
|---|---|---|---|---|---|---|
| **Felhasználó** | `user` | olvas + szerkeszt | ✗ | ✗ | saját lejáratok | felvitel + saját megtekintés |
| **Olvasó** | `reader` | olvas + szerkeszt | olvas | ✗ | nincs (dashboard) | felvitel + összes megtekintés |
| **Admin** | `admin` | olvas + szerkeszt | olvas + szerkeszt | teljes hozzáférés | minden lejárat + káresemények | felvitel + összes megtekintés + kezelés |

### 6.2 Admin képességek
- Felhasználók meghívása és szerepkör-kezelés
- Feature flagek kezelése (modulok be/ki)
- Mezőséma szerkesztése (mezők hozzáadása, módosítása, törlése)
- Entitás típusok kezelése
- Személyi felelős hozzárendelése
- Teljes rendszer-export
- Értesítési küszöbök módosítása

---

## 7. Dinamikus Mezőséma Rendszer

### 7.1 Működési elv
Az admin a felületen definiálja az entitás típusokat (pl. "személyautó", "utánfutó") és azok mezőit. A rendszer dinamikusan rendereli az űrlapokat és kezeli a validációt, értesítéseket.

### 7.2 Mezőtípusok

| Típus | Leírás | Értesítés |
|---|---|---|
| `text` | Szabad szöveg (pl. rendszám, név) | ✗ |
| `number` | Szám érték | ✗ |
| `date` | Dátum (értesítés nélkül, pl. születési dátum) | ✗ |
| `date_expiry` | Lejárati dátum – ez triggereli az értesítéseket | ✓ (90/30/7 nap, konfigurálható) |
| `select` | Legördülő lista (admin által definiált opciók) | ✗ |
| `file` | Fájl feltöltés (Drive-ra) | ✗ |

### 7.3 Példa entitás típusok és mezők

**Személyautó / Teherautó:**
- Rendszám (`text`, kötelező)
- Forgalmi engedély száma (`text`)
- Forgalmi engedély lejárata (`date_expiry`, 90/30/7)
- Műszaki vizsga lejárata (`date_expiry`, 90/30/7)
- Személyi felelős (rendszer mező, felhasználó kiválasztás)
- Utolsó javítás ideje (`date`)
- Állapot (`select`: aktív / javításra vár / selejtezett)

**Utánfutó:**
- Rendszám (`text`, kötelező)
- Forgalmi engedély száma (`text`)
- Forgalmi engedély lejárata (`date_expiry`, 90/30/7)
- Személyi felelős (rendszer mező)

**Személy (kolléga):**
- Név (`text`, kötelező)
- Születési idő (`date`)
- Születési hely (`text`)
- Személyi igazolvány száma (`text`)
- Személyi igazolvány érvényessége (`date_expiry`)
- Jogosítvány száma (`text`)
- Jogosítvány érvényessége (`date_expiry`)
- Üzemorvosi engedély érvényessége (`date_expiry`, alert: 60/30/7 – mert általában 1 év)
- Fegyvertartási engedély száma (`text`)
- Fegyvertartási engedély érvényessége (`date_expiry`)
- Fegyvertartási orvosi érvényessége (`date_expiry`)
- Fegyvertartási pszichológiai érvényessége (`date_expiry`)
- Hajóskönyv száma (`text`)
- Hajóskönyv érvényessége (`date_expiry`)
- Hajóskönyv egészségügyi érvényessége (`date_expiry`)
- *(Bővíthető az admin által)*

---

## 8. Értesítési Rendszer

### 8.1 Értesítési csatornák
- **Email** (Resend): részletes információ, hivatkozás az adatlapra
- **Web Push** (VAPID): rövid figyelemfelkeltő üzenet

### 8.2 Értesítési küszöbök
Alapértelmezett (mezőnként felülírható):
- **90 nap** → Figyelmeztetés (sárga) – "Hamarosan lejár"
- **30 nap** → Sürgős (narancs) – "Lejárat közeleg"
- **7 nap** → Kritikus (piros) – "Azonnali intézkedés szükséges"
- **0 nap** → Lejárt (sötétpiros) – "LEJÁRT"

### 8.3 Értesítési logika
- Supabase Edge Function (CRON job) naponta egyszer ellenőrzi a `date_expiry` mezőket
- Összeveti a `notification_log` táblával (ne küldjön duplán)
- Jogosultsági szint alapján szűr: felhasználó → saját, admin → minden
- Olvasó nem kap értesítést (csak dashboard-on lát mindent)

### 8.4 Értesítési sablon (email)
```
Tárgy: [AlApp] ⚠️ Lejáró érvényesség: {entitás_név} - {mező_név}

Kedves {felhasználó_név},

A következő érvényességi idő hamarosan lejár:

  {entitás_típus}: {entitás_név}
  {mező_név}: {lejárati_dátum}
  Hátralévő idő: {napok} nap

Kérjük, intézkedjen a megújításról!

Megtekintés az AlApp-ban: {link}
```

---

## 9. Design Irányelvek

### 9.1 Vizuális koncepció
**Természetes pasztell** – letisztult, modern felület természetes színvilággal, ami az erdészeti munkakör hangulatát tükrözi. Mikro-animációkkal gazdagított, de nem túlzsúfolt.

A végleges design a **Claude Code frontend-design skill** segítségével készül, az alábbi irányelvek mentén.

### 9.2 Színpaletta

```css
:root {
  /* Alap */
  --bg-primary: #FAF8F5;           /* Meleg törtfehér */
  --bg-secondary: #F0EDE8;          /* Halvány homok */
  --bg-card: #FFFFFF;                /* Kártya háttér */

  /* Elsődleges – erdőzöld */
  --primary-50: #F0F7F1;
  --primary-100: #D6EBDA;
  --primary-200: #A8D5AE;
  --primary-500: #5B9A68;            /* Fő zöld */
  --primary-700: #3D7A4A;
  --primary-900: #1E4D29;

  /* Másodlagos – meleg homok */
  --secondary-50: #FDF8F0;
  --secondary-100: #F5E6D0;
  --secondary-500: #C4A46E;
  --secondary-700: #96783E;

  /* Kiemelés – mohazöld */
  --accent: #7CAE7A;

  /* Lejárati jelzések (ezek maradjanak élesek és egyértelműek) */
  --status-ok: #4CAF50;              /* Zöld – rendben */
  --status-warning: #F2C94C;         /* Sárga – 90 nap */
  --status-urgent: #F2994A;          /* Narancs – 30 nap */
  --status-critical: #EB5757;        /* Piros – 7 nap */
  --status-expired: #C0392B;         /* Sötétpiros – lejárt */

  /* Szöveg */
  --text-primary: #2D3436;
  --text-secondary: #636E72;
  --text-muted: #A0ADB2;
}
```

### 9.3 Lejárati vizualizáció
- Színkódolt badge-ek és háttérszínek a lejárati állapotnál
- Visszaszámláló kijelzés: `XX nap` smooth number transition-nel
- Kritikus lejáratnál (7 nap) enyhe pulzáló animáció a figyelemfelkeltés érdekében
- Lejárt elemeknél villogó/kiemelő stílus a dashboard-on
- Állapotjelző kör (zöld → sárga → narancs → piros) az entitás kártyákon

### 9.4 Mikro-animációk (Framer Motion)
- Kártya megjelenéseknél: fade-in + enyhe felfelé slide (staggered)
- Lejárati számláló: smooth number transition
- Hover-effektek: enyhe emelkedés (translateY + shadow)
- Értesítési toast: slide-in jobbról
- Oldal váltás: fade crossfade
- Dashboard statisztikák: count-up animáció betöltéskor
- Kritikus lejárat: enyhe pulzálás (scale 1.0 ↔ 1.02)
- Modális ablakok: backdrop fade + tartalom scale-up

### 9.5 Responsive design
- **Mobile-first** megközelítés
- Breakpointok: mobil (<768px), tablet (768-1024px), desktop (>1024px)
- Mobil: kártya-alapú nézet, bottom navigation
- Desktop: sidebar navigáció, táblázatos nézetek
- Közös komponensek adaptív elrendezéssel

---

## 10. Modulok Részletes Specifikációja

### 10.1 Dashboard (Áttekintő)
**Mindig aktív, nem feature flag mögött.**

**Felhasználó nézet:**
- Saját lejáró engedélyek (piros/sárga/zöld kártyák, visszaszámláló)
- Saját nyitott káresemény-bejelentések
- Szabadság-naptár (ha modul aktív)

**Olvasó nézet:**
- Összesített lejárat-áttekintés (minden kolléga, minden jármű/eszköz)
- Legutóbbi káresemény-bejelentések
- Szabadság-naptár (ha modul aktív)

**Admin nézet:**
- Összesített lejárat-áttekintés + figyelmeztető összesítők
- Rendszerszintű statisztikák (hány eszköz, hány aktív engedély, hány kritikus lejárat)
- Legutóbbi káresemény-bejelentések
- Legutóbbi audit log bejegyzések
- Szabadság-naptár (ha modul aktív)

### 10.2 Személyek modul
- Kollégák listázása (keresés, szűrés)
- Kolléga adatlap (dinamikus mezőkkel)
- Lejárati összesítő az adatlapon
- Személyes adatok szerkesztése (jogosultság szerint)
- Fotó feltöltés (Google Drive)

### 10.3 Járművek modul
- Jármű típusok: személyautó, teherautó, traktor, utánfutó, hajó, stb. (admin bővítheti)
- Járműlista szűrhető (típus, állapot, felelős)
- Jármű adatlap (dinamikus mezők, fotók, káresemények időrendben)
- Személyi felelős hozzárendelés (admin)
- QR-kód generálás (későbbi fázis)

### 10.4 Eszközök modul
- Eszköz típusok: admin definiálja (pl. láncfűrész, GPS, drón, stb.)
- Eszközlista szűrhető
- Eszköz adatlap (dinamikus mezők, fotók, káresemények)
- Személyi felelős hozzárendelés
- QR-kód generálás (későbbi fázis)

### 10.5 Szabadság-naptár modul
- Google Calendar API read-only integráció (Service Account)
- Közös szervezeti naptár olvasása
- Naptár nézet (havi/heti) az AlApp-on belül
- Kollégák szabadságainak megjelenítése színkódolva

### 10.6 Káresemény mini-app
- **Bárki** felvihet káreseményt bármely eszközhöz/járműhöz
- Felvitel: eszköz kiválasztás (lista) → leírás → fotó(k) → mentés
- Automatikus adatok: dátum/idő, bejelentő személy
- Megjelenik az érintett eszköz/jármű adatlapján, időrendben
- Admin kap push + email értesítést új káreseményről
- Későbbi fázisban: QR-kód beolvasással gyors eszközkiválasztás

### 10.7 Egyéb modul
- Egyelőre üres keretrendszer
- Később bővíthető: pályázati adminisztráció, beruházások, stb.
- A feature flag rendszer lehetővé teszi az egyszerű hozzáadást

---

## 11. Google Integráció

### 11.1 Service Account
Egy Google Cloud Service Account szolgálja ki az összes Google API-t:
- Google Drive API (fotók)
- Google Calendar API (szabadság-naptár)

A Service Account hitelesítő adatai (JSON key) Supabase Edge Function-ben / környezeti változóban tárolódnak.

### 11.2 Google Drive – fotók
**Mappastruktúra (automatikusan létrehozva):**
```
AlApp/
├── Járművek/
│   ├── ABC-123/
│   │   ├── foto_20250210_001.jpg
│   │   └── foto_20250210_002.jpg
│   └── DEF-456/
├── Eszközök/
│   ├── Láncfűrész-001/
│   └── GPS-002/
├── Személyek/
│   └── Kiss-Péter/
└── Káresemények/
    └── 2025-02-10_ABC-123/
```

**Feltöltési folyamat:**
1. Felhasználó kiválaszt fotót (kamera vagy galéria)
2. Kliensoldali tömörítés (browser-image-compression, max 1MB)
3. Supabase Edge Function fogadja a képet
4. Edge Function feltölti Google Drive-ba a megfelelő mappába
5. Drive file ID és URL visszakerül az adatbázisba

### 11.3 Google Calendar – szabadságok
- Service Account megosztva a közös naptárra (olvasási jog)
- Supabase Edge Function periodikusan (vagy on-demand) lekérdezi a naptár eseményeket
- Események a frontenden react-big-calendar-ral megjelenítve
- Szűrés: név, dátum tartomány

---

## 12. QR-kód Rendszer (Későbbi fázis)

### 12.1 Generálás
- Minden eszköz/jármű adatlapján "QR-kód generálás" gomb
- A QR-kód az adatlap URL-jét tartalmazza (pl. `https://alapp.netlify.app/vehicles/uuid`)
- Nyomtatható formátum (A6 vagy matrica méret)

### 12.2 Beolvasás
- PWA-ban beépített QR-kód olvasó (html5-qrcode)
- Beolvasás után: egyből megnyílik az eszköz adatlapja
- Gyors állapotjelentés megjelenítése: utolsó karbantartás, felelős, lejáró érvényességek

### 12.3 Káresemény-bejelentés QR-ral
- Beolvasod a QR-kódot → felajánlja a káresemény-felviteli űrlapot az eszközhöz előre kitöltve

---

## 13. Offline Stratégia

### 13.1 Fázis 1: Offline olvasás
- **Service Worker** (Workbox): statikus fájlok cache-elése (app shell)
- **IndexedDB** (Dexie.js): utolsó szinkronizált adatok tárolása
- **TanStack Query**: kérések cache-elése, stale-while-revalidate stratégia
- Offline jelzés a UI-ban (banner: "Offline mód – az adatok a legutóbbi szinkronizálásból származnak")

### 13.2 Fázis 2: Offline írás (későbbi)
- Background Sync API: várakozó írások sorba állítása
- Konfliktuskezelés: last-write-wins (10 főnél alacsony ütközési esély)
- Sync státusz jelzése a UI-ban

---

## 14. Export Funkciók

### 14.1 Felhasználói export
Kipipálható opciókkal:
- **Formátumok:** Excel (.xlsx), CSV (.csv), PDF (.pdf – egyszerű táblázatos)
- **Tartalom kiválasztás:** mely modulok, mely mezők, szűrők (dátumtartomány, státusz, stb.)
- Felhasználó csak a saját adatait exportálhatja (jogosultság szerinti)

### 14.2 Admin rendszer-export
- Teljes adatbázis export (Excel/CSV/PDF)
- Modulonkénti export
- Lejárat-összesítő riport (pl. "Minden 30 napon belül lejáró engedély")

### 14.3 Technikai megvalósítás
- CSV/Excel: kliensoldali generálás (SheetJS)
- PDF: kliensoldali generálás (jsPDF, egyszerű táblázatos formátum)
- Nagy adatmennyiségnél: Supabase Edge Function-ből generálás

---

## 15. Audit Log

### 15.1 Naplózott események
- Minden CRUD művelet (létrehozás, módosítás, törlés)
- Felhasználó bejelentkezés/kijelentkezés
- Jogosultság-változtatás
- Export műveletek
- Feature flag módosítások
- Mezőséma módosítások

### 15.2 Tárolt adatok
- Ki (user_id)
- Mikor (timestamp)
- Mit (tábla + rekord ID)
- Mi változott (régi érték → új érték, JSONB)

### 15.3 Megjelenítés
- Admin: audit log nézet szűrőkkel (felhasználó, dátum, tábla, művelet)
- Keresés és szűrés lehetőség
- Export (CSV)

---

## 16. Autentikáció

### 16.1 Regisztrációs folyamat
1. Admin megadja az új felhasználó email címét és szerepkörét
2. Rendszer küld egy meghívó emailt (Resend-en keresztül)
3. Felhasználó megnyitja a linket, beállítja a jelszavát
4. Bejelentkezés: email + jelszó VAGY Magic Link

### 16.2 Bejelentkezési lehetőségek
- **Email + jelszó**: klasszikus, terepen is gyors
- **Magic Link**: jelszó nélkül, emailben kapott link
- **Elfelejtett jelszó**: email-es jelszó-visszaállítás

### 16.3 Biztonsági szempontok
- Supabase Auth (JWT token)
- Session kezelés (refresh token)
- RLS biztosítja az adathozzáférést szerver oldalon is

---

## 17. Tesztelési Stratégia

### 17.1 Tesztelési szintek

| Szint | Eszköz | Tartalom | Kötelező |
|---|---|---|---|
| Unit | Vitest | Üzleti logika (lejárat-számítás, jogosultság-ellenőrzés, értesítési küszöbök, mezővalidáció) | ✓ |
| Komponens | React Testing Library | UI komponensek helyes renderelése és interakciói | Fokozatosan |
| E2E | Playwright | Kritikus user flow-k (auth → CRUD → értesítés) | ✓ |
| Átfogó | Playwright | Teljes rendszer teszt (lásd 17.2) | ✓ |
| API | Vitest + Supabase | Edge Function-ök, RLS policy-k tesztelése | ✓ |

### 17.2 Átfogó teszt forgatókönyv
Egy végponttól végpontig tartó teszt, ami a teljes alkalmazást teszteli:

1. Admin bejelentkezik
2. Létrehoz egy új entitás típust és mezőséma mezőket
3. Létrehoz egy járművet, kitölti a mezőket
4. Feltölt fotót
5. Hozzárendel személyi felelőst
6. Felhasználó bejelentkezik, látja a saját adatait, nem látja másét
7. Felhasználó felvisz egy káreseményt
8. Admin kapja az értesítést (email mock ellenőrzés)
9. Olvasó bejelentkezik, lát mindent (beleértve káreseményeket), de nem tud szerkeszteni
10. Export funkció működik (Excel, CSV, PDF)
11. Dashboard helyesen mutatja a lejáratokat színkódolva
12. Offline mód: adatok elérhetők hálózat nélkül

### 17.3 RLS tesztek (kritikus)
Külön tesztesetek, amelyek ellenőrzik:
- `user` szerepkör nem lát más felhasználó adatait
- `reader` szerepkör nem tud módosítani
- `admin` szerepkör mindent elér
- Káreseményt mindenki fel tud vinni
- Törölt/inaktív felhasználó nem fér hozzá semmilyen adathoz

---

## 18. Biztonsági Ellenőrzés

### 18.1 Statikus analízis
| Eszköz | Cél | Futtatás |
|---|---|---|
| Semgrep | Biztonsági sérülékenységek, kódminőség | Minden commit előtt |
| ESLint + eslint-plugin-security | JS/TS biztonsági szabályok | Fejlesztés közben (IDE) + CI |
| npm audit | Dependency sérülékenységek | Hetente + deploy előtt |

### 18.2 Alkalmazás-szintű biztonság
| Ellenőrzés | Leírás |
|---|---|
| RLS tesztek | Jogosultsági szabályok automatizált tesztelése |
| OWASP ZAP | Webalkalmazás penetrációs tesztelés (opcionális, fázis végi) |
| Input validáció | Minden felhasználói bemenet szerver- és kliensoldalon is validálva |
| CORS beállítások | Csak engedélyezett domainek |
| CSP (Content Security Policy) | XSS védelem |

### 18.3 CI/CD pipeline
```
Push → Lint + Semgrep → Unit tesztek → E2E tesztek → npm audit → Deploy (csak fázis végi mérföldkőnél)
```

---

## 19. Fejlesztési Fázisok

### Fázis 1 – Alapok (Opus)
**Cél:** Működő keretrendszer, autentikáció, jogosultságkezelés, admin felület

- [ ] Projekt inicializálás (Vite + React + TS + Tailwind + shadcn/ui)
- [ ] Docker Compose (lokális Supabase + Mailpit)
- [ ] CONVENTIONS.md elkészítése
- [ ] Supabase adatbázis séma és migrációk
- [ ] RLS policy-k implementálása
- [ ] Autentikáció (regisztráció meghívóval, bejelentkezés, magic link, jelszó-visszaállítás)
- [ ] Jogosultsági rendszer (3 szint)
- [ ] Feature flag rendszer
- [ ] Dinamikus mezőséma motor (admin CRUD + frontend form renderer)
- [ ] Admin felület (felhasználó kezelés, mezőséma kezelés, feature flagek)
- [ ] Dashboard váz (szerepkör-specifikus nézetek)
- [ ] Audit log alapok
- [ ] Alap design rendszer (pasztell paletta, komponensek, layout-ok)
- [ ] Alap tesztek (RLS, auth, mezőséma)

### Fázis 2 – Személyek modul (Sonnet)
**Cél:** Teljes személyi nyilvántartás, lejárat-kezelés, értesítések

- [ ] Személyek modul (lista, adatlap, dinamikus mezők)
- [ ] Lejárat-számítás és vizualizáció (visszaszámláló, színkódok)
- [ ] Értesítési rendszer (Supabase Edge Function CRON)
- [ ] Email értesítések (Resend integráció)
- [ ] Push értesítések (web-push VAPID)
- [ ] Dashboard: lejáró engedélyek összesítő
- [ ] Értesítési küszöbök konfigurálása (mezőnkénti)
- [ ] Tesztek (unit + E2E)

### Fázis 3 – Járművek + Eszközök modul (Sonnet)
**Cél:** Jármű- és eszköznyilvántartás, fotókezelés

- [ ] Járművek modul (típusok, lista, adatlap, dinamikus mezők)
- [ ] Eszközök modul (típusok, lista, adatlap, dinamikus mezők)
- [ ] Google Drive integráció (Service Account, mappastruktúra, feltöltés)
- [ ] Kliensoldali képtömörítés
- [ ] Fotógaléria az adatlapokon
- [ ] Személyi felelős hozzárendelés
- [ ] Dashboard bővítés (járművek/eszközök lejáratai)
- [ ] Tesztek

### Fázis 4 – Kiegészítő funkciók (Sonnet)
**Cél:** Naptár, export, QR-kód, offline olvasás, káresemény

- [ ] Google Calendar integráció (read-only, közös naptár)
- [ ] Szabadság-naptár modul (naptár nézet)
- [ ] Export funkció (Excel, CSV, PDF, kipipálható opciók)
- [ ] Admin teljes rendszer-export
- [ ] QR-kód generálás és beolvasás
- [ ] QR gyors állapotjelentés
- [ ] Offline olvasás (Service Worker + IndexedDB)
- [ ] Káresemény mini-app (felvitel, fotók, lista az adatlapon)
- [ ] Káresemény értesítés adminnak
- [ ] Design finomhangolás (Claude Code frontend-design skill)
- [ ] Átfogó teszt
- [ ] Tesztek

### Fázis 5 – Bővítések (Sonnet/Opus)
**Cél:** Offline írás, finomhangolás, jövőbeli modulok előkészítése

- [ ] Offline írás (Background Sync, konfliktuskezelés)
- [ ] Audit log finomhangolás és admin nézet
- [ ] Teljesítmény optimalizáció
- [ ] Biztonsági audit (Semgrep, OWASP ZAP)
- [ ] Káresemény QR-kóddal
- [ ] "Egyéb" modul keretrendszer előkészítése
- [ ] Netlify production deploy + saját domain (opcionális)
- [x] Felhasználói dokumentáció / használati útmutató

---

## 20. Lokális Fejlesztői Környezet

### 20.1 Docker Compose

```yaml
# docker-compose.yml
version: '3.8'
services:
  # Supabase lokális (supabase CLI kezeli, de Mailpit külön)
  mailpit:
    image: axllent/mailpit
    ports:
      - "8025:8025"   # Web UI
      - "1025:1025"   # SMTP
    environment:
      MP_SMTP_AUTH_ACCEPT_ANY: 1
      MP_SMTP_AUTH_ALLOW_INSECURE: 1
```

### 20.2 Indítási parancsok
```bash
# 1. Docker szolgáltatások
docker compose up -d

# 2. Supabase lokális indítás
npx supabase start

# 3. Frontend dev server
npm run dev

# 4. Egy parancs az egészre (package.json script):
npm run dev:full
```

### 20.3 Mock szolgáltatások
- **Google Drive mock:** lokális fájlrendszerbe ment (`./mock-drive/`), ugyanazzal az API felülettel
- **Google Calendar mock:** `./mock-data/calendar.json` fájlból olvas
- **Resend mock:** Mailpit SMTP-re irányítva
- Környezeti változó (`VITE_USE_MOCKS=true`) kapcsolja a valódi és mock szolgáltatásokat

---

## 21. Környezeti Változók

```env
# .env.local (fejlesztés)
VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_ANON_KEY=eyJ...
VITE_USE_MOCKS=true
VITE_APP_URL=http://localhost:5173

# .env.production (éles)
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
VITE_USE_MOCKS=false
VITE_APP_URL=https://alapp.netlify.app

# Supabase Edge Functions (secrets)
GOOGLE_SERVICE_ACCOUNT_KEY='{...}'
GOOGLE_DRIVE_ROOT_FOLDER_ID=xxxxx
GOOGLE_CALENDAR_ID=xxxxx@group.calendar.google.com
RESEND_API_KEY=re_xxxxx
RESEND_FROM_EMAIL=alapp@yourdomain.com
VAPID_PUBLIC_KEY=xxxxx
VAPID_PRIVATE_KEY=xxxxx
```

---

## 22. Összefoglaló

Az AlApp egy moduláris, bővíthető PWA, amely:
- **Dinamikus mezősémával** kezeli a személyek, járművek és eszközök nyilvántartását
- **Automatikus értesítésekkel** jelzi a lejáró érvényességeket (90/30/7 nap)
- **Többszintű jogosultsággal** biztosítja az adathozzáférést
- **Google Drive-ba** menti a fotókat
- **Google Calendar-ból** olvassa a szabadságokat
- **Offline módban** is használható (először olvasás, később írás)
- **QR-kódokkal** gyorsítja a terepen a munkafolyamatot
- **Feature flag rendszerrel** rugalmasan bővíthető új modulokkal
- **Természetes pasztell designnal** biztosítja a kellemes felhasználói élményt

A fejlesztés lokálisan indul, fázisonkénti mérföldkövekkel, és az Antigravity + Claude Code + Gemini 2.5 Pro hármassal valósul meg.

---

## 23. Fejlesztési Napló

### 2026-03-29 – Felhasználói Útmutató elkészítve

**Elkészült:** `FELHASZNALOI_UTMUTATO.html`

**Tartalom:**
- 12 fejezet, teljes körű HTML dokumentáció böngészőből PDF-be nyomtathatóan (`@page { size: A4 }`)
- 14 beágyazott képernyőkép (Playwright MCP-vel készítve localhost:5173-ról)

**Képernyőképek (`docs/screenshots/`):**
- `01_login.png` – Bejelentkezési oldal
- `02_dashboard.png` – Dashboard / főoldal
- `03_personnel.png` – Személy részletes adatlap
- `04_personnel_list.png` – Személyek lista
- `05_vehicles.png` – Járművek lista
- `06_equipment_list.png` – Eszközök lista (Dji Mavic 3 kártyával)
- `07_equipment_detail.png` – Eszköz részletes adatlap
- `08_equipment_qr.png` – QR-kód az eszköz adatlapján
- `09_equipment_checkout.png` – QR-kódos kölcsönzés oldala
- `10_calendar.png` – Naptár havi nézet (valódi adatokkal)
- `11_incidents.png` – Káresemények lista
- `12_water_facilities.png` – Vízi Létesítmények lista
- `13_reminders.png` – Emlékeztetők lista
- `13b_reminders_new.png` – Új emlékeztető létrehozása dialóg

**Javított/pontosított tartalom az előző verzióhoz képest:**
- Navigáció javítva (Emlékeztetők hozzáadva, helyes sorrendben)
- „Felszerelések" → „Eszközök" (az app valódi elnevezése)
- „Incidensek" → „Káresemények" (az app valódi elnevezése)
- Eszközök fejezet átírva: dinamikus mező rendszer leírása, statikus kategóriák eltávolítva
- Vízi létesítmények leírás javítva: táblázatos nézet (Engedély száma, Hatóság, Érvényesség)
- Új önálló fejezet: **10. Emlékeztetők** (push értesítés beállítás, értesítési időpontok)
- Új alfejezet: **6.4 Eszköz QR-kódos Kölcsönzés** (kölcsönzési állapotok, admin lezárás)
- PWA telepítési útmutató (1.4 fejezet)
- GYIK bővítve (QR-kód, push értesítés, jogosultság témák)
- Verzió: 1.1.0 / 2026. március 29.

**Hiányzó képernyőképek (admin hozzáférés szükséges):**
- Beállítások → Felhasználók (`/settings/users`)
- Beállítások → Mező sémák (`/settings/field-schemas`)
- Beállítások → Funkció kapcsolók (`/settings/feature-flags`)
- Beállítások → Audit log (`/settings/audit-log`)
- Szöveges leírás mindegyikhez elkészült.

---

### 2026-03-29 – Szerepkör átnevezés: `reader` → `vezető`

**Motiváció:** A `reader` elnevezés félrevezető volt (szerkesztési jogai is vannak). Az egyeztetett új név: `vezető`.

**Érintett fájlok:**
- `supabase/migrations/20260329130000_rename_reader_to_vezeto.sql` — DB migráció:
  - `user_profiles` CHECK constraint frissítve: `('user', 'vezető', 'admin')`
  - Meglévő `reader` role-os userek `UPDATE`-elve `vezető`-re
  - 20+ RLS policy: `reader_*` → `vezeto_*` (user_profiles, entities, field_values, photos, incidents, water_facilities, water_facility_photos, water_facility_documents, maintenance_logs, vehicle_checklists)
  - `equipment_checkouts` UPDATE policy: `'manager'` → `'vezető'`
  - Storage object policy-k (water_facility buckets): `admin_reader_*` → `admin_vezeto_*`
- `src/shared/types/index.ts` — `UserRole`: `'reader'` → `'vezető'`
- `src/core/permissions/usePermissions.ts` — 4× `role === 'reader'` → `'vezető'`
- `src/modules/admin/hooks/useUsersAdmin.ts` — lokális `UserRole` típus
- `src/modules/admin/pages/UsersPage.tsx` — `roleLabels`, dropdown, role tömb
- `src/modules/personnel/components/PersonnelForm.tsx` — dropdown option
- `src/modules/export/components/ExportModal.tsx` — `isAdminOrReader` ellenőrzés

**Commit:** `2d7846b`

---

### 2026-03-29 – Mobil modal UX + Új típusok

**Mobil UX javítás:**
- `EquipmentForm`: `items-center` → `items-end lg:items-center` (bottom sheet mobilon)
- Animáció: `scale` → `y: 48` csúszás
- `max-h-[90dvh]` (dynamic viewport height iOS-kompatibilis)

**Új típusok (DB + field_schemas):**
- Járművek: `Motor`
- Eszközök: `Áramfejlesztő`, `Fa vizsgáló - Fakopp`, `Magassági ágvágó`, `Gödörfúró`
- Minden új eszköz típushoz standard field_schemas: széria szám, használatba vétel dátuma, leltárfelelős, megjegyzés

**Commit:** `42408d9`

---

### 2026-03-29 – Jármű detail bug + Motor mezők + Modal háttér

**Bug fix – "Nem található a keresett jármű":**
- `VehiclesDetailPage`: a detail page `entities` táblát kérdezte, de járművek a dedikált `vehicles` táblában vannak
- Javítás: `vehicles` tábla + közvetlen JSONB `field_values` + `field_schemas` külön query a mezőcímkékhez + `photos` direkt lekérdezés

**Motor field sémák:**
- `supabase/migrations/20260329150000_motor_field_schemas_and_vehicles_rls_vezeto.sql`
- Motor típushoz hozzáadva: `license_plate` (kötelező), `registration_number`, `registration_expiry`, `inspection_expiry`
- `vehicles` tábla RLS: `reader_insert/update_vehicles` → `vezeto_insert/update_vehicles`

**Modal input háttér (desktop + mobil):**
- `bg-background` (`#EBE8DC`) szinte azonos volt `bg-card` (`#FDFAF5`) — beviteli mezők alig látszottak
- Javítás: `bg-white` mindkét formban (`VehicleForm` + `EquipmentForm`)
- `VehicleForm` is megkapta a bottom sheet mobilos megjelenítést
- Modal kártya háttér: `bg-card` → `bg-white`

**Commit:** `0ef0418`

---

### 2026-03-29 – Personnel INSERT bug, modal háttérszín, export javítás

**Bug fix – Személyek felvitele sikertelen volt (admin sem tudott felvinni):**
- **Gyökérok:** `personnel.intended_role` oszlopon CHECK constraint: `('user', 'reader', 'admin')`.
  A form `'vezető'` értéket küldött (a reader→vezető átnevezés után), de `'vezető'` nem szerepelt az allowed értékek között → minden INSERT elutasítva DB szinten.
- **Migráció:** `supabase/migrations/20260329160000_fix_personnel_intended_role_and_vezeto_rls.sql`
  - CHECK constraint frissítve: `('user', 'vezető', 'admin')`
  - Meglévő `'reader'` értékű rekordok UPDATE-elve `'vezető'`-re
  - `reader_select_personnel`, `reader_insert_personnel`, `reader_update_personnel` policy-k → `vezeto_*` variánsokra cserélve (a 20260329130000 migráció ezeket kihagyta)

**Modal háttérszín egységesítés:**
- `PersonnelForm`: backdrop `bg-black/50 backdrop-blur-sm` → `bg-black/60`; kártya `bg-card` → `bg-white`
- `PersonnelForm` megkapta a bottom sheet mobilos megjelenítést: `items-end lg:items-center`, `rounded-t-2xl lg:rounded-2xl`, `max-h-[90dvh]`
- `ExportModal`: backdrop `backdrop-blur-sm` eltávolítva; kártya `bg-card` → `bg-white`

**Bug fix – Adatok exportálása sikertelen volt:**
- **Gyökérok:** Az export a régi `entities` + `field_values` EAV táblákból kérdezett le (2026-02-24 előtti schema). Ezek üresek, mert az adatok a dedikált `personnel`/`vehicles`/`equipment` táblákba lettek migrálva JSONB `field_values`-szal. Üres workbook → `XLSX.writeFile` kivételt dobott → "Hiba az exportálás során" toast.
- **Javítás:** `ExportModal.handleExport` átírva:
  - Dedikált táblákból kérdez (`TABLE_MAP`: `personnel`, `vehicles`, `equipment`)
  - `field_schemas` alapján fejti ki a JSONB `field_values` mezőket emberi olvasható oszlopnevekre
  - Ha valóban nincs adat: értelmes hibaüzenet (`'Nincs exportálható adat...'`) az általános hiba helyett
  - Az RLS a dedikált táblákon már kezeli a jogosultságokat (felesleges `isAdminOrReader` logika eltávolítva)

**Érintett fájlok:**
- `supabase/migrations/20260329160000_fix_personnel_intended_role_and_vezeto_rls.sql` (új)
- `src/modules/personnel/components/PersonnelForm.tsx` — backdrop + kártya bg + mobil layout
- `src/modules/export/components/ExportModal.tsx` — backdrop + kártya bg + teljes export logika újraírva
