# Supabase Adatbázis Migrációs Útmutató

A projektben a Supabase CLI-t használjuk a migrációk kezelésére. Mivel a környezeti változók kezelése trükkös lehet (beragadt régi tokenek), a migrációkat **mindig** az alábbi módon futtasd, direktben megadva a helyes Access Tokent.

## Helyes Access Token
`sbp_f0bfa57b8365a3dff0b8dbe54bd06e82d6f88bf2`

## Migráció Futtatása (Push)

A helyi migrációs fájlok (`supabase/migrations/*.sql`) élesítése a távoli adatbázison:

```bash
SUPABASE_ACCESS_TOKEN=sbp_f0bfa57b8365a3dff0b8dbe54bd06e82d6f88bf2 npx supabase db push
```

### Ha "Remote migration versions not found" hiba jön:
Ilyenkor a history tábla nincs szinkronban. Használd a `--include-all` kapcsolót, ami megpróbál mindent beküldeni (a már meglévőket skippeli, az újakat futtatja):

```bash
SUPABASE_ACCESS_TOKEN=sbp_f0bfa57b8365a3dff0b8dbe54bd06e82d6f88bf2 npx supabase db push --include-all
```

## Migrációk Javítása (Repair)

Ha a history tábla sérült vagy "reverted" állapotba kell állítani verziókat:

```bash
SUPABASE_ACCESS_TOKEN=sbp_f0bfa57b8365a3dff0b8dbe54bd06e82d6f88bf2 npx supabase migration repair --status reverted <VERZIÓSZÁM>
```

(Pl. `20260213120000`)
