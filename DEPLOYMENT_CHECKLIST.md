# AlApp - Deployment Checklist 🚀

**Implementáció dátuma:** 2026-02-24
**Deployment státusz:** ⏳ Pending

---

## ✅ Pre-Deployment (Helyi ellenőrzés)

- [x] Minden migration fájl létezik:
  - [x] `20260224120000_create_personnel_table.sql`
  - [x] `20260224120001_create_vehicles_table.sql`
  - [x] `20260224120002_create_equipment_table.sql`
  - [x] `20260224120003_migrate_data_to_dedicated_tables.sql`
  - [x] `20260224120004_fix_handle_new_user_upsert.sql`

- [x] Frontend kód módosítva:
  - [x] `usePersonnel.ts` refactor
  - [x] `useVehicles.ts` refactor
  - [x] `useEquipment.ts` refactor
  - [x] PersonnelForm "Felelős" mező eltávolítva
  - [x] Glass effect CSS javítva
  - [x] DatePickerField komponens létrehozva
  - [x] UsersPage display logic javítva
  - [x] SetupPasswordPage full_name sync fix

- [x] Dependencies telepítve:
  - [x] `react-day-picker` (~15KB)
  - [x] `date-fns` (peer dependency)

---

## 🔐 Deployment - Database Migrations

### Step 1: Backup

```bash
# KRITIKUS: Mindig készíts backup-ot deployment előtt!
supabase db dump -f backup_pre_refactor_$(date +%Y%m%d_%H%M%S).sql

# Verify backup
ls -lh backup_pre_refactor_*.sql
```

- [ ] Backup létrehozva és elmentve biztonságos helyre

### Step 2: Apply Migrations

**Option A: Supabase CLI**
```bash
# Set production access token
export SUPABASE_ACCESS_TOKEN="sbp_your_token_here"

# Push migrations
supabase db push
```

**Option B: Supabase Dashboard (Manual)**
1. Dashboard → SQL Editor
2. Másolj be sorrendben:
   - `20260224120000_create_personnel_table.sql`
   - `20260224120001_create_vehicles_table.sql`
   - `20260224120002_create_equipment_table.sql`
   - `20260224120003_migrate_data_to_dedicated_tables.sql`
   - `20260224120004_fix_handle_new_user_upsert.sql`
3. Futtasd egyenként, várj a RAISE NOTICE üzenetekre

- [ ] Personnel tábla létrehozva
- [ ] Vehicles tábla létrehozva
- [ ] Equipment tábla létrehozva
- [ ] Adatmigráció sikeres
- [ ] handle_new_user() trigger fixed (ON CONFLICT)

### Step 3: Verify Migration

```sql
-- 1. Check tables
SELECT * FROM information_schema.tables
WHERE table_name IN ('personnel', 'vehicles', 'equipment');

-- 2. Check RLS policies
SELECT * FROM pg_policies
WHERE tablename IN ('personnel', 'vehicles', 'equipment');

-- 3. Verify row counts MATCH
SELECT
  'entities' as source, module, COUNT(*)
FROM entities
WHERE module IN ('personnel', 'vehicles', 'equipment')
GROUP BY module
UNION ALL
SELECT 'personnel', 'personnel', COUNT(*) FROM personnel
UNION ALL
SELECT 'vehicles', 'vehicles', COUNT(*) FROM vehicles
UNION ALL
SELECT 'equipment', 'equipment', COUNT(*) FROM equipment;

-- 4. Sample data check
SELECT id, display_name, field_values FROM personnel LIMIT 5;
SELECT id, display_name, field_values FROM vehicles LIMIT 5;
SELECT id, display_name, field_values FROM equipment LIMIT 5;
```

- [ ] Tables léteznek
- [ ] RLS policies aktívak (12+ policy mindhárom táblán)
- [ ] Row counts match (entities vs dedikált táblák)
- [ ] field_values JSONB formátum helyes

---

## 🌐 Deployment - Frontend

### Step 1: Install Dependencies

```bash
npm install
```

- [ ] react-day-picker telepítve
- [ ] date-fns telepítve
- [ ] No vulnerabilities (vagy elfogadható szint)

### Step 2: Build & Test

```bash
# Local build test
npm run build

# Verify build success
ls -la dist/
```

- [ ] Build sikeres (nincs TypeScript error)
- [ ] Dist mappa létezik

### Step 3: Git Commit & Push

```bash
git add .
git commit -m "feat: Refactor to dedicated tables with permissive RLS

BREAKING CHANGE:
- Personnel/vehicles/equipment moved from entities to dedicated tables
- Field_values EAV replaced with JSONB
- Custom date picker replaces native HTML input
- Glass effect contrast improved
- User list display fallback for MagicLink users

Closes #2 (Permission/Role System)
Closes #5 (Reader/Editor Save Issues)

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"

git push origin main
```

- [ ] Git commit sikeres
- [ ] Git push sikeres
- [ ] Netlify deploy triggered

### Step 4: Monitor Netlify Deploy

1. Nyisd meg: https://app.netlify.com/sites/dunaialapp/deploys
2. Várj a deploy completion-re (~2-3 perc)
3. Ellenőrizd: "Published" státusz

- [ ] Netlify deploy sikeres
- [ ] Production URL elérhető: https://dunaialapp.netlify.app

---

## 🧪 Post-Deployment Testing

### Database Verification

```sql
-- Check no data loss
SELECT
  (SELECT COUNT(*) FROM entities WHERE module = 'personnel') as old_count,
  (SELECT COUNT(*) FROM personnel) as new_count,
  (SELECT COUNT(*) FROM personnel) - (SELECT COUNT(*) FROM entities WHERE module = 'personnel') as diff;

-- If diff != 0, INVESTIGATE IMMEDIATELY!
```

- [ ] Personnel: no data loss
- [ ] Vehicles: no data loss
- [ ] Equipment: no data loss

### Role-Based Testing Matrix

**Admin User Testing:**
- [ ] Create personnel → ✅ Sikeres
- [ ] Create vehicle → ✅ Sikeres
- [ ] Create equipment → ✅ Sikeres
- [ ] Update any entity → ✅ Sikeres
- [ ] Delete any entity → ✅ Sikeres

**Reader User Testing:**
- [ ] Create personnel → ✅ Sikeres (KRITIKUS: ez volt a fő bug!)
- [ ] Create vehicle → ✅ Sikeres
- [ ] Create equipment → ✅ Sikeres
- [ ] Update own entity → ✅ Sikeres
- [ ] Update other's entity → ❌ Blokkolt
- [ ] Delete any entity → ❌ Blokkolt

**User Role Testing:**
- [ ] Create personnel → ✅ Sikeres
- [ ] Create vehicle → ✅ Sikeres
- [ ] Create equipment → ✅ Sikeres
- [ ] View only own entities → ✅ Csak saját látható
- [ ] Update own entity → ✅ Sikeres
- [ ] Update other's entity → ❌ Blokkolt

### UI/UX Verification

**Glass Effect:**
- [ ] Dialog háttér kontrasztja jobb (sötétebb oldal háttér)
- [ ] Dialógusok jól láthatók

**Date Picker:**
- [ ] Custom calendar popup megjelenik (nem native)
- [ ] Magyar formátum: "2024. 02. 24."
- [ ] ESC bezárja a popup-ot
- [ ] Dátum kiválasztása működik

**Personnel Form:**
- [ ] "Felelős felhasználó" mező NINCS jelen
- [ ] Minden más mező működik

**Vehicle/Equipment Form:**
- [ ] "Felelős felhasználó" mező MEGVAN
- [ ] Működik helyesen

**User Lista (Admin):**
- [ ] MagicLink user: email prefix megjelenik display name-ként
- [ ] Email megjelenik alatta
- [ ] Normal user: full_name megjelenik

### Existing Functionality Verification

- [ ] Vízi létesítmények modul változatlanul működik
- [ ] Karbantartások modul változatlanul működik
- [ ] Fotók feltöltése működik
- [ ] Audit log működik
- [ ] Dashboard widgets működnek

---

## 🐛 Ha Probléma Merül Fel

### Database Issues

**症状:** Personnel/vehicles/equipment táblák nem léteznek
**Megoldás:**
```bash
# Re-run migrations manually via Dashboard SQL Editor
```

**症状:** RLS blokkolja reader user-t
**Megoldás:**
```sql
-- Check RLS policies exist
SELECT * FROM pg_policies WHERE tablename = 'personnel';

-- If missing, re-run the create_personnel_table.sql
```

**症状:** Row count mismatch (adatvesztés)
**Megoldás:**
```bash
# ROLLBACK IMMEDIATELY
# Restore from backup
psql -h your-db-host -U postgres -d postgres < backup_pre_refactor_YYYYMMDD_HHMMSS.sql
```

### Frontend Issues

**症状:** TypeScript errors
**Megoldás:**
```bash
# Check imports
# Re-install dependencies
npm ci
npm run build
```

**症状:** Date picker nem jelenik meg
**Megoldás:**
```bash
# Check dependencies installed
npm list react-day-picker date-fns
# If missing: npm install react-day-picker date-fns
```

**症状:** User lista crash (cannot read full_name)
**Megoldás:**
- Check UsersPage.tsx line 291-299
- Verify fallback logic: `user.full_name || user.email.split('@')[0]`

---

## 🎉 Deployment Complete Checklist

### Final Verification

- [ ] All database migrations applied successfully
- [ ] No data loss (row counts match)
- [ ] RLS policies active (reader/user can CREATE)
- [ ] Frontend deployed to production
- [ ] Admin user can CRUD all modules
- [ ] Reader user can CREATE in all modules (KRITIKUS!)
- [ ] User role can CREATE own entities
- [ ] UI/UX improvements visible:
  - [ ] Glass effect contrast improved
  - [ ] Custom date picker working
  - [ ] Personnel form no "Felelős" field
  - [ ] User lista fallback working
- [ ] No breaking changes to existing functionality
- [ ] Performance improvement noticeable (~50%+ faster queries)

### Documentation

- [ ] IMPLEMENTATION_SUMMARY.md létezik
- [ ] DEPLOYMENT_CHECKLIST.md létezik (this file)
- [ ] Memory files updated (MEMORY.md, patterns.md)

### Communication

- [ ] Stakeholders értesítve deployment-ről
- [ ] User testing session scheduled (24h után)
- [ ] Monitoring setup (query performance, error rate)

---

## 📊 Success Metrics (7 days post-deployment)

Monitor these metrics after 7 days:

- [ ] Personnel creation success rate (reader/user): >95%
- [ ] Vehicles creation success rate (reader/user): >95%
- [ ] Equipment creation success rate (reader/user): >95%
- [ ] Query response time: <200ms (50%+ improvement)
- [ ] No critical bugs reported
- [ ] User satisfaction: positive feedback

---

**Deployment Date:** _________________
**Deployed By:** _________________
**Verified By:** _________________

**Status:** ⏳ Pending → ✅ Deployed → 🎉 Verified

---

**Next Review:** 7 days post-deployment
