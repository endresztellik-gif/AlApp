# AlApp – Design System & UI Patterns

> Referencia dokumentum az admin/settings oldalak egységes design nyelvéhez.
> Használd ezt, ha új oldalakat adsz hozzá vagy meglévőket módosítasz.

---

## Alapelvek

- **Természetvédelmi hatóság esztétika** – Tekintélyes, adatsűrű de légies. Ranger station command center vibes.
- **Minden oldalnak van dark header panel** – Ez az oldal "azonosítója".
- **Kártyák, nem táblák** – `var(--color-bg-card)` alapon, 1px border + árnyék.
- **Framer Motion mindenhol** – Konzisztens easing, belépési animációk, hover effektek.
- **Magyar feliratok** – Minden UI szöveg magyarul.

---

## Design Token-ek (CSS változók)

```css
/* Háttér */
var(--color-bg-card)          /* kártya háttér */
var(--color-bg-surface)       /* oldal háttér */

/* Szöveg */
var(--color-text-primary)     /* főszöveg */
var(--color-text-secondary)   /* másodlagos */
var(--color-text-muted)       /* halvány */
/* Tailwind alias: text-text-primary, text-muted-foreground */

/* Zöld skála (primary) */
var(--color-primary-500)      /* #3d9e52 – fő akcent */
/* Tailwind: primary-100, primary-300, primary-400, primary-500, primary-600, primary-700 */

/* Státusz */
var(--color-status-ok)        /* zöld */
var(--color-status-warning)   /* sárga */
var(--color-status-urgent)    /* narancs */
var(--color-status-critical)  /* piros */

/* Gradiens osztályok */
.gradient-primary             /* zöld primary gradient */
.gradient-sidebar             /* sidebar háttér */
```

---

## Akkordszínek (raw hex – inline stílusokhoz)

| Szerep | Szín | Használat |
|--------|------|-----------|
| Primary green | `#3d9e52` | fő akcent, Személyek modul |
| Secondary green | `#5a7a50` | Járművek modul |
| Equipment green | `#6b8a5a` | Eszközök modul |
| Amber | `#a07828` | modul-ok kezelése, figyelmeztetés |
| Admin red | `#b83c3c` | törlés, kritikus, admin badge |
| Blue text | `#4a78c8` | text típusú mező |
| Purple | `#7a60c0` | number típusú mező |
| Teal | `#3c82a0` | date típusú mező |

---

## Dark Header Panel (minden admin oldalon)

```tsx
<motion.div
    initial={{ opacity: 0, y: -10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
    className="relative overflow-hidden rounded-2xl p-6 flex items-center justify-between gap-4"
    style={{
        background: 'linear-gradient(135deg, rgba(28,72,44,0.97) 0%, rgba(45,72,50,0.94) 100%)',
        boxShadow: '0 6px 28px -6px rgba(25,65,40,0.45), 0 0 0 1px rgba(61,158,82,0.12)',
    }}
>
    {/* Topo-rács textúra */}
    <div className="absolute inset-0 pointer-events-none opacity-[0.04]"
        style={{
            backgroundImage: `
                repeating-linear-gradient(0deg, transparent, transparent 19px, rgba(255,255,255,1) 19px, rgba(255,255,255,1) 20px),
                repeating-linear-gradient(90deg, transparent, transparent 19px, rgba(255,255,255,1) 19px, rgba(255,255,255,1) 20px)
            `,
        }}
    />
    {/* Radial glow jobb felül */}
    <div className="absolute -right-12 -top-12 w-48 h-48 pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(61,158,82,0.12) 0%, transparent 70%)' }}
    />

    {/* Bal: ikon + cím */}
    <div className="relative flex items-center gap-4">
        <motion.div
            whileHover={{ rotate: 15, scale: 1.08 }}
            transition={{ type: 'spring', stiffness: 300 }}
            className="p-3 rounded-2xl shrink-0"
            style={{
                background: 'rgba(255,255,255,0.10)',
                boxShadow: '0 0 0 1px rgba(255,255,255,0.12)',
            }}
        >
            <IconComponent className="w-6 h-6 text-white" strokeWidth={1.75} />
        </motion.div>
        <div>
            <p className="text-[9.5px] font-bold tracking-[0.2em] uppercase text-white/40 mb-1">
                Alcím / kontextus
            </p>
            <h1 className="text-[22px] font-bold text-white tracking-tight leading-none">
                Oldal Cím
            </h1>
            <p className="text-[12px] text-white/50 mt-1">
                Rövid leírás
            </p>
        </div>
    </div>

    {/* Jobb: stat számok (opcionális) */}
    <div className="relative flex items-center gap-5 shrink-0">
        <div className="text-center hidden sm:block">
            <div className="text-[22px] font-black text-white leading-none">{count}</div>
            <div className="text-[9px] font-semibold text-white/40 uppercase tracking-wide mt-0.5">label</div>
        </div>
        <div className="w-px h-10 hidden sm:block" style={{ background: 'rgba(255,255,255,0.12)' }} />
        {/* Akció gomb a headerben */}
        <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-[13px] font-semibold"
            style={{
                background: 'rgba(255,255,255,0.14)',
                boxShadow: '0 0 0 1px rgba(255,255,255,0.16)',
            }}
        >
            Gomb
        </motion.button>
    </div>
</motion.div>
```

---

## Kártya Panel (lista / tábla container)

```tsx
<motion.div
    initial={{ opacity: 0, y: 6 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.10, ease: [0.22, 1, 0.36, 1] }}
    className="rounded-2xl overflow-hidden"
    style={{
        background: 'var(--color-bg-card)',
        boxShadow: '0 1px 4px rgba(30,50,35,0.05), 0 0 0 1px rgba(90,110,95,0.10)',
    }}
>
    {/* Panel fejléc */}
    <div className="px-5 py-3.5 border-b flex items-center gap-2.5"
        style={{ borderColor: 'rgba(90,110,95,0.10)', background: 'rgba(240,245,241,0.45)' }}>
        <div className="p-1.5 rounded-lg bg-primary-100">
            <IconComponent className="w-3.5 h-3.5 text-primary-600" />
        </div>
        <h2 className="text-[13px] font-semibold text-text-primary">Panel cím</h2>
        <div className="ml-auto text-[11px] font-medium text-muted-foreground">
            Meta info
        </div>
    </div>
    {/* Tartalom */}
</motion.div>
```

---

## Lista sorok (items)

```tsx
<motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ delay: index * 0.035 }}
    className="flex items-center justify-between px-5 py-3.5 hover:bg-black/[0.018] transition-colors group"
    style={{ borderTop: index > 0 ? '1px solid rgba(90,110,95,0.07)' : 'none' }}
>
    {/* tartalom */}
</motion.div>
```

---

## Kártya navigáció (SettingsPage stílus)

```tsx
// Bal accent border + watermark ikon + szám jelző
<Link
    to={section.to}
    className="group relative flex items-start gap-4 p-5 rounded-2xl overflow-hidden block h-full"
    style={{
        background: 'var(--color-bg-card)',
        borderLeft: `3px solid ${section.accent}`,
        boxShadow: '0 1px 4px rgba(30,50,35,0.05), 0 0 0 1px rgba(90,110,95,0.10)',
    }}
>
    {/* Watermark ikon */}
    <div className="absolute right-3 bottom-2 pointer-events-none opacity-[0.055] group-hover:opacity-[0.10] transition-opacity">
        <section.icon className="w-[52px] h-[52px]" style={{ color: section.accent }} />
    </div>
    {/* Szám + badge */}
    <span className="text-[10px] font-black font-mono" style={{ color: section.accent }}>01</span>
    <span className="text-[9px] font-bold uppercase tracking-[0.12em] px-2 py-0.5 rounded-full"
        style={{ background: section.accentBg, color: section.accent }}>
        Admin
    </span>
</Link>
```

---

## Form input stílus

```tsx
// Osztály + inline stílus páros – minden input/select-nél
const inputCls = 'w-full rounded-xl px-3 py-2 text-[12.5px] text-text-primary placeholder:text-muted-foreground transition-all';
const inputStyle = {
    background: 'rgba(235,240,236,0.5)',
    border: '1px solid rgba(90,110,95,0.15)',
    outline: 'none',
};
const labelCls = 'text-[10.5px] font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block';

// Összecsukható form (AnimatePresence + motion.form)
<motion.form
    initial={{ height: 0, opacity: 0 }}
    animate={{ height: 'auto', opacity: 1 }}
    exit={{ height: 0, opacity: 0 }}
    transition={{ ease: [0.22, 1, 0.36, 1] }}
    className="px-5 py-4 border-b space-y-3 overflow-hidden"
    style={{ borderColor: 'rgba(90,110,95,0.08)', background: 'rgba(240,245,241,0.40)' }}
>
```

---

## Badge / chip stílusok

```tsx
// Akció badge (create/delete/update)
const actionConfig = {
    create: { bg: 'rgba(61,158,82,0.10)',  color: '#3d9e52', label: 'létrehozás' },
    delete: { bg: 'rgba(184,60,60,0.10)',  color: '#b83c3c', label: 'törlés'     },
    update: { bg: 'rgba(160,120,40,0.10)', color: '#a07828', label: 'módosítás'  },
    login:  { bg: 'rgba(60,100,160,0.10)', color: '#3c78b8', label: 'bejelentkezés' },
};

// Field type badge
const fieldTypeConfig = {
    text:        { label: 'Szöveg',         bg: 'rgba(80,120,200,0.09)',  color: '#4a78c8' },
    number:      { label: 'Szám',           bg: 'rgba(100,80,180,0.09)',  color: '#7a60c0' },
    date:        { label: 'Dátum',          bg: 'rgba(60,130,160,0.09)',  color: '#3c82a0' },
    date_expiry: { label: 'Lejárati dátum', bg: 'rgba(160,100,40,0.10)', color: '#a06428' },
    select:      { label: 'Választólista',  bg: 'rgba(61,158,82,0.09)',  color: '#3d9e52' },
    file:        { label: 'Fájl',           bg: 'rgba(90,90,120,0.09)',  color: '#5a5a78' },
};

// Szerepkör badge
const roleLabels = {
    admin:  { color: '#b83c3c', bg: 'rgba(184,60,60,0.09)'  },
    reader: { color: '#3d7a52', bg: 'rgba(61,122,82,0.09)'  },
    user:   { color: '#5a7060', bg: 'rgba(90,112,96,0.09)'  },
};
```

---

## Animációs konstansok

```tsx
// Belépési easing (minden oldalon)
ease: [0.22, 1, 0.36, 1]

// Staggerelt lista (i = index)
transition={{ delay: i * 0.035, ease: [0.22, 1, 0.36, 1] }}

// Hover lift
whileHover={{ y: -3, transition: { duration: 0.18, ease: 'easeOut' } }}

// Gomb tap
whileTap={{ scale: 0.97 }}

// Spring animáció (togglek, ikonok)
transition={{ type: 'spring', stiffness: 400, damping: 28 }}
```

---

## Skeleton loading

```tsx
// Oldal betöltéskor
if (isLoading) return (
    <div className="space-y-3 max-w-4xl mx-auto animate-fade-in">
        <div className="skeleton h-24 rounded-2xl" />   {/* header */}
        {[1,2,3].map(i => <div key={i} className="skeleton h-16 rounded-xl" />)}
    </div>
);
```

---

## Modul konfiguráció

```tsx
// Szín + ikon per modul (FieldSchemas, entity type csoportok)
const moduleConfig = {
    personnel: { label: 'Személyek', icon: Users,  color: '#3d9e52', bg: 'rgba(61,158,82,0.09)' },
    vehicles:  { label: 'Járművek',  icon: Car,    color: '#5a7a50', bg: 'rgba(90,122,80,0.09)' },
    equipment: { label: 'Eszközök',  icon: Wrench, color: '#6b8a5a', bg: 'rgba(107,138,90,0.09)' },
};
```

---

## Üres állapot (empty state)

```tsx
<div className="px-5 py-12 text-center">
    <div className="w-10 h-10 rounded-xl mx-auto mb-2.5 flex items-center justify-center"
        style={{ background: 'rgba(90,110,95,0.07)' }}>
        <IconComponent className="w-4 h-4 text-muted-foreground opacity-40" />
    </div>
    <p className="text-[12.5px] text-muted-foreground italic">
        Magyar szöveg...
    </p>
</div>
```

---

## Lapozó (pagination)

```tsx
<div className="px-5 py-3.5 border-t flex items-center justify-between"
    style={{ borderColor: 'rgba(90,110,95,0.10)', background: 'rgba(240,245,241,0.35)' }}>
    <motion.button whileHover={{ x: -1 }} whileTap={{ scale: 0.97 }}
        disabled={page === 1}
        className="px-3.5 py-1.5 text-[12px] font-semibold rounded-lg disabled:opacity-35"
        style={{ background: 'var(--color-bg-card)', border: '1px solid rgba(90,110,95,0.15)', color: 'var(--color-text-secondary)' }}>
        ← Előző
    </motion.button>
    <span className="text-[11.5px] text-muted-foreground font-medium tabular-nums">
        {page}. oldal
    </span>
    <motion.button whileHover={{ x: 1 }} whileTap={{ scale: 0.97 }}
        disabled={!hasMore}
        className="px-3.5 py-1.5 text-[12px] font-semibold rounded-lg disabled:opacity-35"
        style={{ background: 'var(--color-bg-card)', border: '1px solid rgba(90,110,95,0.15)', color: 'var(--color-text-secondary)' }}>
        Következő →
    </motion.button>
</div>
```

---

## Fájlok (érintett oldalak)

| Fájl | Minta |
|------|-------|
| `src/modules/settings/pages/SettingsPage.tsx` | kártya grid, accent border, watermark ikon, szám jelző |
| `src/modules/admin/pages/UsersPage.tsx` | dark header stat számokkal, avatar gradiens, szerepkör badge |
| `src/modules/admin/pages/FeatureFlagsPage.tsx` | status dot animáció, modul accent, toggle |
| `src/modules/admin/pages/AuditLogPage.tsx` | filter bar, expandable tábla sorok, diff view |
| `src/modules/admin/pages/FieldSchemasPage.tsx` | két-kolumnás layout, modulszín-kódolt lista, field type badge |
| `src/shared/layouts/Sidebar.tsx` | sidebar nav, active indicator, user avatar |
