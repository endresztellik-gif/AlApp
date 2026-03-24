# Playwright Smoke Test Suite – Design

**Dátum:** 2026-03-24
**Scope:** Teljes app smoke test + Reminders modul E2E tesztek
**Verzió:** 2 (spec reviewer feedback alapján javítva)

---

## Célok

1. Minden fő route elérhető és betölt (modul-specifikus landmark elem látszik)
2. Login / logout / unauthenticated redirect flow működik
3. Bottom nav navigáció működik
4. Reminders modul: create, toggle done, delete
5. Privacy: admin emlékeztetőjét másik user NEM látja (RLS ellenőrzés)

---

## Technikai döntések

- **Megközelítés:** Real Supabase + cleanup (valódi RLS-t tesztel)
- **Test runner:** Playwright (`@playwright/test`)
- **Base URL:** `http://localhost:5173` (local dev server – `webServer` configban auto-indítva)
- **Credentials:** `.env` fájlból (`SUPABASE_ADMIN_EMAIL`, `SUPABASE_ADMIN_PASSWORD`, `SUPABASE_TEST_USER_EMAIL`, `SUPABASE_TEST_USER_PASSWORD`, `SUPABASE_SERVICE_ROLE_KEY`)

---

## Fájlstruktúra

```
e2e/
  helpers/
    auth.ts            ← login/logout segédfüggvények
    supabase-admin.ts  ← cleanup: service role key-vel direkt DB törlés
  smoke/
    auth.spec.ts       ← login, logout, unauthenticated redirect
    navigation.spec.ts ← összes route, bottom nav
    reminders.spec.ts  ← CRUD + privacy teszt
playwright.config.ts   ← webServer: npm run dev, baseURL, .env betöltés
```

---

## Selector stratégia

A Lucide ikonok SVG-ként renderelnek, `data-testid` nélkül nem szelektálhatók megbízhatóan. A `ReminderCard` komponensbe hozzáadott `data-testid` attribútumok:

| Elem | Selector |
|------|----------|
| Toggle gomb | `[data-testid="reminder-toggle-btn"]` |
| Kész állapot | `[data-testid="reminder-toggle-btn"][data-done="true"]` |
| Cím szöveg (áthúzva) | `[data-testid="reminder-title"].line-through` |
| Törlés gomb | `[data-testid="reminder-delete-btn"]` |
| Bottom nav link | `getByRole('link', { name: 'Emlékeztetők' })` |

---

## Teszt esetek

### auth.spec.ts
| # | Leírás | Assert |
|---|--------|--------|
| 1 | Admin bejelentkezés | URL: `/`, `h1` dashboard elem látszik |
| 2 | Hibás jelszóval login | Hibaüzenet látszik (pl. `text=Hibás`) |
| 3 | Logout | URL: `/login`, majd `/` navigáció visszairányít `/login`-ra |
| 4 | Unauthenticated: `/reminders` direkt elérés | Redirect `/login`-ra |

### navigation.spec.ts
| # | Route | Assert |
|---|-------|--------|
| 5 | `/` | `h1` látszik (visibility check – tartalom dinamikus üdvözlés, NEM name assertion!) |
| 6 | `/personnel` | `Személyek` szöveg látszik |
| 7 | `/vehicles` | `Járművek` szöveg látszik |
| 8 | `/equipment` | `Eszközök` szöveg látszik |
| 9 | `/calendar` | `Szabadság-naptár` szöveg látszik (tényleges h1 szöveg a CalendarPage-ben) |
| 10 | `/incidents` | `Káresemények` szöveg látszik |
| 11 | `/water-facilities` | `Vízi Létesítmények` szöveg látszik |
| 12 | `/reminders` | `Emlékeztetők` heading látszik |
| 13 | `/settings` | `Beállítások` szöveg látszik |
| 14 | Bottom nav Bell | `getByRole('link', { name: 'Emlékeztetők' })` kattintható → URL: `/reminders` |

### reminders.spec.ts
| # | Leírás | Setup | Assert |
|---|--------|-------|--------|
| 15 | Admin létrehoz emlékeztetőt | – | Cím szövege megjelenik a listában |
| 16 | Toggle done | #15 után | `[data-testid="reminder-toggle-btn"][data-done="true"]` látszik; `[data-testid="reminder-title"]` `line-through` class-t kapott |
| 17 | Törlés | `is_done=false` emlékeztető | `[data-testid="reminder-delete-btn"]` kattintás → cím eltűnik |
| 18 | Privacy | Admin létrehoz upcoming emlékeztetőt (future due_at!) → test user loginol | `[data-testid="reminder-title"]` **nem** látszik test user számára |

**Megjegyzés a #18-hoz:** A `due_at` mindig 1 évvel jövőre állítandó, hogy az emlékeztető az "upcoming" (látható) szekcióba kerüljön, ne a kollapszált "kész" listába – így a false-positive elkerülhető.

---

## Cleanup stratégia

- **`beforeEach` a reminders teszteknél:** Töröl minden `title LIKE 'E2E_%'` formátumú emlékeztetőt az admin accountnál (előző teszt maradékai)
- **`afterEach`:** Ugyanaz – test adat cleanup
- **Megvalósítás:** `supabase-admin.ts` helper service role key-vel HTTP DELETE a Supabase REST API-n

---

## `playwright.config.ts` fő beállítások

```ts
webServer: {
  command: 'npm run dev',
  url: 'http://localhost:5173',
  reuseExistingServer: !process.env.CI,
},
use: {
  baseURL: 'http://localhost:5173',
  trace: 'on-first-retry',
},
```

---

## `.env` szükséges változók (tesztekhez)

```
SUPABASE_ADMIN_EMAIL=...
SUPABASE_ADMIN_PASSWORD=...
SUPABASE_TEST_USER_EMAIL=...
SUPABASE_TEST_USER_PASSWORD=...
SUPABASE_SERVICE_ROLE_KEY=...   ← cleanup-hoz kell, .env.example-ba is kerül
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```
