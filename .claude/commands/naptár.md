Naptár dátumkezelési diagnosztika és javítás.

Olvasd el a következő fájlokat:
- `src/modules/calendar/hooks/useCalendarEvents.ts`
- `src/modules/calendar/pages/CalendarPage.tsx`
- `src/core/api/google-services.ts`

Majd ellenőrizd az alábbi 5 pontot, és jelezd ha valamelyik hibás vagy hiányzik:

## 1. UTC vs. lokális dátum parse
A Google Calendar `YYYY-MM-DD` formátumú (all-day) dátumokat LOCAL időként kell értelmezni, nem UTC-ként.
**Helyes minta:**
```ts
function parseLocalDate(dateStr: string): Date {
    const [y, m, d] = dateStr.split('-').map(Number);
    return new Date(y, m - 1, d);
}
```
❌ Hiba: `new Date("2026-04-01")` → UTC midnight → CET/CEST-ben március 31-re csúszik.

## 2. Google Calendar exclusive end dátum
All-day eseményeknél a Google Calendar az `end.date`-t a következő napra állítja (exclusive).
**Helyes minta:**
```ts
if (isAllDay) {
    endDate = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate() - 1);
}
```
❌ Hiba: kivonás nélkül az esemény egy nappal túlnyúlik.

## 3. All-day esemény overlap filter
`areIntervalsOverlapping` hívásokban all-day esemény `end`-jét `endOfDay()`-jel kell kezelni – mind a `todayEvents` filterelésnél, mind a `LeaveSummaryCard`-ban.
**Helyes minta:**
```ts
{ start: e.start, end: e.allDay ? endOfDay(e.end) : e.end }
```
❌ Hiba: `event.end` közvetlenül → a nap 00:00:00-ja nem fed át az aznapi intervallummal.

## 4. Vacation kategorizálás – elismert kulcsszavak
A `categorizeEvent()` függvény cím alapján azonosítja a szabadságot.
**Elvárt kulcsszavak (case-insensitive):** `szabadság`, `szabi`, `szabadsag`, `holiday`, `pihenő`
Ha más kulcsszó is felmerül (pl. `beteg`, `táppénz`), jelezd és adj javaslatot a bővítésre.

## 5. Naptár lekérési ablak
A `useCalendarEvents` hook 3 hónapos ablakban kér le eseményeket (előző hónap – következő hónap vége), hogy a havi nézet szélein se hiányozzanak események.
**Helyes minta:**
```ts
const start = new Date(date.getFullYear(), date.getMonth() - 1, 1);
const end   = new Date(date.getFullYear(), date.getMonth() + 2, 0);
```

---

Ha hibát találsz, javítsd és futtasd: `npx tsc -b --noEmit`
Ha minden rendben, jelentsd: „Naptár dátumkezelés: minden pont OK ✅"
