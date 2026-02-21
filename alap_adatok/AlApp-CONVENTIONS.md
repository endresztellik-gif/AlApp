# AlApp – Kódstílus és Konvenciók

Ez a dokumentum biztosítja a konzisztens fejlesztést, függetlenül attól, hogy Claude Code (Opus/Sonnet) vagy Gemini 2.5 Pro generálja a kódot.

---

## 1. Nyelv és elnevezés

### Kód nyelve
- **Változónevek, függvénynevek, típusok:** angol
- **Kommentek:** magyar
- **UI szövegek:** magyar (i18n fájlokban, soha nem beégetve a kódba)
- **Git commit üzenetek:** magyar, konvencionális formátum

### Elnevezési konvenciók
| Elem | Stílus | Példa |
|---|---|---|
| React komponens | PascalCase | `VehicleDetailCard.tsx` |
| Hook | camelCase, `use` prefix | `useEntityFields.ts` |
| Utility függvény | camelCase | `calculateDaysUntilExpiry.ts` |
| Típus/Interface | PascalCase, `I` prefix nélkül | `Entity`, `FieldSchema` |
| Enum | PascalCase | `UserRole`, `FieldType` |
| Konstans | UPPER_SNAKE_CASE | `MAX_IMAGE_SIZE_MB` |
| CSS változó | kebab-case | `--primary-500` |
| Fájlnév (komponens) | PascalCase | `IncidentForm.tsx` |
| Fájlnév (utility) | camelCase | `dateUtils.ts` |
| Mappa | kebab-case | `dynamic-fields/` |
| DB tábla | snake_case | `field_schemas` |
| DB oszlop | snake_case | `entity_type_id` |
| Edge Function | kebab-case | `check-expiry-notifications` |

### Commit üzenet formátum
```
típus(hatókör): rövid leírás magyarul

Hosszabb leírás ha szükséges.
```

Típusok: `feat`, `fix`, `refactor`, `style`, `test`, `docs`, `chore`

Példa: `feat(vehicles): jármű adatlap dinamikus mezők implementálása`

---

## 2. TypeScript szabályok

### Strict mód
```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true
  }
}
```

### Típushasználat
- **Soha `any`** – ha nem tudod a típust, használj `unknown`-t és szűkítsd
- **Interface** a domain objektumokhoz, **type** a union/utility típusokhoz
- **Explicit return type** exportált függvényeknél
- **Generikusok** a dinamikus mezőrendszerhez

```typescript
// ✓ Jó
interface Entity {
  id: string;
  displayName: string;
  entityTypeId: string;
  module: ModuleType;
}

type ModuleType = 'personnel' | 'vehicles' | 'equipment';

export function calculateDaysUntilExpiry(expiryDate: Date): number {
  // ...
}

// ✗ Rossz
const data: any = fetchData();
```

---

## 3. React konvenciók

### Komponens struktúra
```typescript
// 1. Importok (csoportosítva: react, külső lib-ek, belső modulok, típusok)
import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useEntity } from '@/modules/vehicles/hooks/useEntity';
import type { Entity } from '@/shared/types';

// 2. Típusok (ha komponens-specifikus)
interface VehicleCardProps {
  entity: Entity;
  onEdit?: (id: string) => void;
}

// 3. Komponens (named export, SOHA default export)
export function VehicleCard({ entity, onEdit }: VehicleCardProps) {
  // 3a. Hookok
  const [isExpanded, setIsExpanded] = useState(false);

  // 3b. Származtatott értékek / memoizáció
  const expiryStatus = useMemo(() => getExpiryStatus(entity), [entity]);

  // 3c. Event handlerek
  const handleEdit = useCallback(() => {
    onEdit?.(entity.id);
  }, [entity.id, onEdit]);

  // 3d. Renderelés
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-lg bg-card p-4 shadow-sm"
    >
      {/* ... */}
    </motion.div>
  );
}
```

### Szabályok
- **Named export** mindenhol (nem default export)
- **Egy komponens per fájl**
- **Hook-ok külön fájlban** ha újrahasznosíthatók
- **Prop drilling helyett** Context vagy TanStack Query
- **Feltételes renderelés:** ternary kis esetben, early return nagyobbnál
- **Key prop:** mindig stabil azonosító, soha index

---

## 4. Tailwind CSS konvenciók

### Osztály sorrend
```
pozíció → display → méret → padding → margin → border → háttér → szöveg → egyéb
```

```tsx
// ✓ Jó
<div className="relative flex h-16 w-full px-4 py-2 rounded-lg bg-bg-secondary text-text-primary shadow-sm" />
```

### Testreszabott osztályok
- AlApp téma színei: `bg-primary-500`, `text-status-critical`, stb. (a tailwind.config.ts-ben definiálva)
- Mikro-animációkhoz Framer Motion, NEM Tailwind animate

### Responsive
- Mobile-first: alap stílusok mobilra, `md:` és `lg:` prefixek desktop-ra
- `md:` = 768px+, `lg:` = 1024px+

---

## 5. Supabase konvenciók

### Lekérdezések
```typescript
// ✓ Jó – TanStack Query wrapper
export function useEntities(module: ModuleType) {
  return useQuery({
    queryKey: ['entities', module],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('entities')
        .select('*, entity_types(*)')
        .eq('module', module)
        .eq('is_active', true)
        .order('display_name');

      if (error) throw error;
      return data;
    },
  });
}
```

### RLS szabályok
- **Minden tábla** RLS-sel védett
- **Tesztek** minden RLS policy-ra
- **Komment** minden policy felett, ami elmagyarázza a szándékot

### Migrációk
- Minden séma módosítás migrációs fájlban
- Fájlnév: `YYYYMMDDHHMMSS_leiras.sql`
- Visszavonási SQL is legyen (DOWN migration)

---

## 6. Fájl és mappastruktúra szabályok

### Modul struktúra (minden modul azonos)
```
modules/
└── vehicles/
    ├── components/           # Modul-specifikus React komponensek
    │   ├── VehicleList.tsx
    │   ├── VehicleDetail.tsx
    │   └── VehicleForm.tsx
    ├── hooks/                # Modul-specifikus hookok
    │   ├── useVehicles.ts
    │   └── useVehicleDetail.ts
    ├── pages/                # Route-olt oldalak
    │   ├── VehiclesPage.tsx
    │   └── VehicleDetailPage.tsx
    ├── types/                # Modul-specifikus típusok
    │   └── index.ts
    └── utils/                # Modul-specifikus segédfüggvények
        └── index.ts
```

### Import aliasok
```typescript
// tsconfig.json paths
"@/*": ["./src/*"]

// Használat
import { Button } from '@/shared/components/ui/Button';
import { useAuth } from '@/core/auth/useAuth';
import { VehicleCard } from '@/modules/vehicles/components/VehicleCard';
```

---

## 7. Hibakezelés

### API hívások
```typescript
// ✓ Jó – központi hibakezelés
try {
  const result = await someApiCall();
  return result;
} catch (error) {
  // Audit log-ba is írjuk ha releváns
  console.error('[VehicleService] Hiba a jármű mentésekor:', error);
  throw new AppError('VEHICLE_SAVE_FAILED', 'Nem sikerült menteni a járművet.', error);
}
```

### Felhasználói hibaüzenetek
- Mindig magyarul
- Nem technikai: "Nem sikerült menteni a járművet." (NEM: "Database constraint violation")
- Toast értesítés (shadcn/ui Sonner)

---

## 8. Tesztelési konvenciók

### Fájl elnevezés
- Unit: `*.test.ts` (a tesztelt fájl mellett)
- Komponens: `*.test.tsx` (a komponens mellett)
- E2E: `tests/e2e/*.spec.ts`
- Átfogó: `tests/integration/*.spec.ts`

### Teszt struktúra
```typescript
describe('calculateDaysUntilExpiry', () => {
  it('visszaadja a napok számát a lejáratig', () => {
    // Arrange
    const expiryDate = new Date('2025-06-01');

    // Act
    const result = calculateDaysUntilExpiry(expiryDate);

    // Assert
    expect(result).toBe(111);
  });

  it('negatív értéket ad ha lejárt', () => {
    // ...
  });
});
```

---

## 9. Verziókezelés

### Branch-ek
- `main` – production-ready
- `develop` – fejlesztési ág
- `feature/modul-neve` – funkció fejlesztés
- `fix/leiras` – hibajavítás
- `chore/leiras` – karbantartás

### PR szabályok
- Legalább tesztek futnak sikeresen
- Semgrep nem talál critical hibát
- Konvencionális commit üzenetek

---

## 10. Fontos: AI modell váltásnál

Ha Claude Code-ról Gemini 2.5 Pro-ra váltasz (vagy fordítva):
1. Mindig add meg ezt a CONVENTIONS.md-t kontextusként
2. Add meg az aktuális fázis feladatlistáját a project.md-ből
3. Mutasd meg a legutóbb módosított fájlokat referenciának
4. Kérd, hogy a meglévő mintákat kövesse (pl. "nézd meg a vehicles modul struktúráját és ugyanígy csináld az equipment modult")
