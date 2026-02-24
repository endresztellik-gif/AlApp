# AlApp - Felhasználói Útmutató

**Dunai Osztály Állományi Alkalmazás**

Verzió: 1.0.0
Utolsó frissítés: 2026. február 23.

---

## Tartalomjegyzék

1. [Bevezetés](#1-bevezetes)
   - 1.4 [Alkalmazás Telepítése (PWA)](#14-alkalmazas-telepitese-pwa)
2. [Bejelentkezés és Jogosultságok](#2-bejelentkezes-es-jogosultsagok)
3. [Dashboard (Kezdőlap)](#3-dashboard-kezdolap)
4. [Személyzet Kezelése](#4-szemelyzet-kezelese)
5. [Járművek Kezelése](#5-jarmuvek-kezelese)
   - 5.5 [Kéthetenkénti Kötelező Ellenőrzés](#55-kethetenkenti-kotelezo-ellenorzes)
6. [Felszerelések Kezelése](#6-felszerelesek-kezelese)
7. [Vízilétesítmények Kezelése](#7-viziletesitmenyek-kezelese)
8. [Naptár](#8-naptar)
9. [Incidensek](#9-incidensek)
10. [Beállítások](#10-beallitasok)
11. [Offline Mód és Szinkronizálás](#11-offline-mod-es-szinkronizalas)
12. [Gyakran Ismételt Kérdések](#12-gyakran-ismetelt-kerdesek)

---

## 1. Bevezetés

### 1.1 Mi az AlApp?

Az AlApp a Dunai Osztály belső állományi nyilvántartó és menedzsment rendszere. Az alkalmazás célja, hogy központosított helyen kezelje a szervezet:
- Személyi állományát
- Járműparkját
- Felszereléseit
- Vízilétesítményeit
- Eseményeit és incidensjeit

### 1.2 Rendszerkövetelmények

**Böngésző:**
- Google Chrome (ajánlott)
- Mozilla Firefox
- Safari
- Microsoft Edge

**Internetkapcsolat:** Stabil internetkapcsolat szükséges az alkalmazás használatához.

**Képernyőfelbontás:** Minimum 1280x720 pixel (ajánlott: 1920x1080)

### 1.3 Elérés

Az alkalmazás a következő címen érhető el:
```
https://dunaialapp.netlify.app
```

### 1.4 Alkalmazás Telepítése (PWA)

**Az AlApp Progressive Web App (PWA)**, amely telepíthető a készülékére, mint egy natív alkalmazás!

#### 1.4.1 Mi az a PWA?

A Progressive Web App egy modern webalkalmazás, amely:
- ✅ **Telepíthető** a kezdőképernyőre (nincs szükség app store-ra)
- ✅ **Offline is működik** - járműellenőrzés internetkapcsolat nélkül
- ✅ **Gyors és natív élmény** - saját ablakban nyílik meg
- ✅ **Automatikus frissítések** - mindig a legújabb verzió
- ✅ **Push értesítések** - új verziók érkezésekor

#### 1.4.2 Telepítés Android Telefonra (Chrome)

**Automatikus telepítési prompt:**

1. Nyissa meg a **https://dunaialapp.netlify.app** oldalt Chrome böngészőben
2. **3 másodperc után** automatikusan megjelenik egy felugró üzenet:
   ```
   📱 Telepítsd az AlApp-ot!
   ✓ Azonnali indítás a kezdőképernyőről
   ✓ Offline járműellenőrzés mentése
   ✓ Automatikus frissítések
   ```
3. Kattintson a **"Telepítés"** gombra
4. Az alkalmazás ikonja megjelenik a **kezdőképernyőn**

**Manuális telepítés:**

1. Nyissa meg az oldalt Chrome-ban
2. Kattintson a böngésző **három pontos menüjére** (⋮)
3. Válassza: **"Alkalmazás telepítése"** vagy **"Hozzáadás a kezdőképernyőhöz"**
4. Erősítse meg a telepítést

**Telepítés után:**
- Az AlApp ikonja látható a kezdőképernyőn
- Indításkor **saját ablakban** nyílik meg (nincs URL bar)
- Úgy viselkedik, mint egy natív app

#### 1.4.3 Telepítés iPhone/iPad-re (Safari)

**Lépések:**

1. Nyissa meg a **https://dunaialapp.netlify.app** oldalt **Safari** böngészőben
2. Koppintson a **Megosztás** ikonra (□↑) az alsó menüsorban
3. Görgessen lefelé és válassza: **"Hozzáadás a kezdőképernyőhöz"**
4. Adjon nevet az alkalmazásnak: **"AlApp"**
5. Koppintson a **"Hozzáadás"** gombra
6. Az ikon megjelenik a kezdőképernyőn

**Megjegyzés:** iOS-en a telepítési prompt nem jelenik meg automatikusan, mindig manuálisan kell hozzáadni.

#### 1.4.4 Telepítés Számítógépre (Desktop)

**Chrome / Edge böngészőben:**

1. Nyissa meg a **https://dunaialapp.netlify.app** oldalt
2. Keresse a **telepítés ikont** (⊕) a címsor jobb oldalán
3. Kattintson rá és válassza: **"Telepítés"**
4. Az alkalmazás megnyílik egy **önálló ablakban**
5. Hozzáadódik az **alkalmazáslistához** (Start menü / Launchpad)

**Telepítés után:**
- Az AlApp elérhető a Start menüből (Windows) vagy Launchpadről (Mac)
- Saját ablakban fut, taskbar/dock ikonnal
- Gyorsabb indítás és jobb teljesítmény

#### 1.4.5 Telepítési Prompt Elutasítása

Ha elutasította a telepítési promptot:
- A rendszer **30 napig nem mutatja** újra
- **Manuálisan** bármikor telepítheti a fenti módszerekkel
- A telepítés **opcionális**, az alkalmazás böngészőben is tökéletesen működik

#### 1.4.6 Ellenőrzés: Sikeresen Telepítve?

**Mobilon:**
- ✅ Az AlApp ikon látható a kezdőképernyőn
- ✅ Indításkor nincs böngésző UI (címsor, URL bar)
- ✅ Saját splash screen jelenik meg betöltéskor

**Desktopon:**
- ✅ Az AlApp saját ablakban nyílik meg
- ✅ Elérhető az alkalmazáslistából
- ✅ Saját taskbar/dock ikon

#### 1.4.7 Frissítések

**Automatikus frissítés:**

Amikor új verzió jelenik meg:
1. **Banner üzenet** jelenik meg: *"Új verzió elérhető!"*
2. Kattintson a **"Frissítés"** gombra
3. Az alkalmazás **automatikusan frissül** és újraindul

**Manuális frissítés:**
- Zárja be és nyissa meg újra az alkalmazást
- Vagy frissítse a böngésző oldalt (F5 / Cmd+R)

#### 1.4.8 Telepítés Eltávolítása

**Android:**
1. Tartsa nyomva az AlApp ikont a kezdőképernyőn
2. Válassza: **"Eltávolítás"** vagy **"Telepítés törlése"**

**iOS:**
1. Tartsa nyomva az AlApp ikont
2. Válassza: **"Alkalmazás törlése"**

**Desktop (Chrome/Edge):**
1. Nyissa meg az AlApp-ot
2. Kattintson a három pontos menüre (⋮)
3. Válassza: **"AlApp eltávolítása"**

---

## 2. Bejelentkezés és Jogosultságok

### 2.1 Első Bejelentkezés

Ha új felhasználóként meghívást kapott az AlApp-ba:

1. **Email megérkezik** a megadott címére
2. **Kattintson a meghívó linkre** az emailben
3. **Jelszó beállítása:**
   - Adjon meg egy erős jelszót (minimum 8 karakter)
   - A jelszónak tartalmaznia kell:
     - Kisbetűt (a-z)
     - Nagybetűt (A-Z)
     - Számot (0-9)
     - Speciális karaktert (@$!%*?&)
4. **Jelszó megerősítése**
5. **Kattintson a "Jelszó beállítása" gombra**

**Fontos:** A jelszó beállítása kötelező! A rendszer nem engedi tovább anélkül.

### 2.2 Normál Bejelentkezés

1. Nyissa meg a https://dunaialapp.netlify.app oldalt
2. Adja meg az **email címét**
3. Adja meg a **jelszavát**
4. Kattintson a **"Bejelentkezés"** gombra

### 2.3 Jogosultsági Szintek

Az AlApp három jogosultsági szintet támogat:

#### **Admin (Adminisztrátor)**

✅ **Jogosultságok:**
- Teljes hozzáférés minden modulhoz
- Felhasználók meghívása és kezelése
- Rendszerbeállítások módosítása
- Mező sémák szerkesztése
- Audit log megtekintése
- Minden adat létrehozása, szerkesztése, törlése

#### **User (Felhasználó)**

✅ **Jogosultságok:**
- Adatok megtekintése
- Adatok létrehozása és szerkesztése
- Saját profil módosítása
- Naptár események kezelése
- Incidensek rögzítése

❌ **Nincs jogosultsága:**
- Felhasználók meghívása
- Rendszerbeállítások módosítása
- Más felhasználók törlése

#### **Reader (Olvasó)**

✅ **Jogosultságok:**
- Adatok megtekintése
- Riportok generálása
- Exportálás

❌ **Nincs jogosultsága:**
- Adatok módosítása vagy törlése
- Új adatok létrehozása
- Rendszerbeállítások elérése

### 2.4 Jelszó Visszaállítás

Ha elfelejtette a jelszavát:

1. Kattintson az **"Elfelejtett jelszó?"** linkre a bejelentkezési oldalon
2. Adja meg az **email címét**
3. Kattintson a **"Jelszó visszaállítás küldése"** gombra
4. Ellenőrizze az **email fiókját**
5. Kattintson a kapott linkre és **állítson be új jelszót**

---

## 3. Dashboard (Kezdőlap)

### 3.1 Áttekintés

A Dashboard az alkalmazás főoldala, ahol a legfontosabb információk gyors áttekintése található.

### 3.2 Kimutatások

**Bal oldali kártyák:**
- **Személyzet:** Aktív személyzet létszáma
- **Járművek:** Üzemképes járművek száma
- **Felszerelések:** Elérhető felszerelések darabszáma
- **Vízilétesítmények:** Nyilvántartott létesítmények száma

### 3.3 Születésnapok

A Dashboard megjeleníti az **aktuális hónapban született** kollégákat, kronológikus sorrendben.

**Megjelenített információk:**
- Név
- Születési dátum
- Életkor

### 3.4 Navigáció

A bal oldali menüből az alábbi modulok érhetők el:
- 🏠 Dashboard (Kezdőlap)
- 👥 Személyzet
- 🚗 Járművek
- 🧰 Felszerelés
- 💧 Vízilétesítmények
- 📅 Naptár
- ⚠️ Incidensek
- ⚙️ Beállítások (csak adminoknak)

---

## 4. Személyzet Kezelése

### 4.1 Személyzet Lista

**Elérés:** Bal oldali menü → **Személyzet**

**Funkciók:**
- ✅ Teljes személyzeti lista megtekintése
- ✅ Keresés név, email vagy telefonszám alapján
- ✅ Szűrés státusz szerint (Aktív / Inaktív)
- ✅ Rendezés oszlopok szerint

**Megjelenített adatok:**
- Fénykép
- Teljes név
- Beosztás
- Email cím
- Telefonszám
- Státusz (Aktív / Inaktív)

### 4.2 Új Személy Hozzáadása

1. Kattintson a **"+ Személy hozzáadása"** gombra (jobb felső sarok)
2. Töltse ki a kötelező mezőket:
   - **Teljes név** *
   - **Email cím** *
   - **Telefonszám**
   - **Születési dátum**
   - **Beosztás**
   - **Cím**
3. Opcionális mezők:
   - Fénykép feltöltése
   - Megjegyzések
   - Egyéni mezők (ha konfigurálva vannak)
4. Kattintson a **"Mentés"** gombra

\* Kötelező mezők

### 4.3 Személy Adatainak Megtekintése és Szerkesztése

1. Kattintson a **személyre** a listában
2. **Részletes adatlap** nyílik meg:
   - Alapadatok
   - Kapcsolattartási információk
   - Egyéni mezők
   - Kapcsolódó események és incidensek

**Szerkesztés:**
1. Kattintson a **"Szerkesztés"** gombra (jobb felső sarok)
2. Módosítsa a szükséges mezőket
3. Kattintson a **"Mentés"** gombra

### 4.4 Személy Deaktiválása

**Fontos:** A rendszer nem törli a személyeket, csak deaktiválja őket.

1. Nyissa meg a személy adatlapját
2. Kattintson a **"Deaktiválás"** gombra
3. Erősítse meg a műveletet

**Deaktivált személyek:**
- Nem jelennek meg a listában (kivéve ha "Inaktív" szűrőt választ)
- Adataik megmaradnak a rendszerben
- Bármikor újra aktiválhatók

---

## 5. Járművek Kezelése

### 5.1 Járműlista

**Elérés:** Bal oldali menü → **Járművek**

**Funkciók:**
- ✅ Teljes járműlista megtekintése
- ✅ Keresés rendszám, típus vagy modell alapján
- ✅ Szűrés státusz szerint (Üzemképes / Javítás alatt / Selejtezett)
- ✅ Karbantartási előzmények megtekintése

**Megjelenített adatok:**
- Fénykép
- Rendszám
- Típus (pl. Tűzoltóautó, Mentőautó, stb.)
- Modell
- Évjárat
- Státusz
- Következő szerviz időpontja

### 5.2 Új Jármű Hozzáadása

1. Kattintson a **"+ Jármű hozzáadása"** gombra
2. Töltse ki a kötelező mezőket:
   - **Rendszám** *
   - **Típus** *
   - **Modell**
   - **Évjárat**
   - **Státusz** *
3. Opcionális mezők:
   - Fénykép feltöltése
   - Alvázszám
   - Motorszám
   - Kilométeróra állása
   - Következő szerviz időpontja
   - Megjegyzések
4. Kattintson a **"Mentés"** gombra

### 5.3 Gyors Riport Funkció

A járműveknél elérhető egy **gyors riport funkció**, amely lehetővé teszi a műszaki állapot gyors rögzítését.

**Használat:**
1. Kattintson a **"Gyors riport"** gombra a jármű mellett
2. Töltse ki a riportot:
   - Kilométeróra állása
   - Üzemanyag szint
   - Műszaki állapot
   - Problémák (ha vannak)
   - Megjegyzések
3. Kattintson a **"Riport küldése"** gombra

**A riport automatikusan:**
- Rögzíti az aktuális időpontot
- Hozzárendeli az aktuális felhasználót
- Elmentődik a jármű előzményeihez

### 5.4 Karbantartási Napló

Minden járműnél megtekinthető a **karbantartási napló**, amely tartalmazza:
- Szerviz dátumok
- Elvégzett munkák
- Költségek
- Következő szerviz időpontja

### 5.5 Kéthetenkénti Kötelező Ellenőrzés

**Fontos:** Minden jármű esetében kötelező kéthetenkénti műszaki állapot ellenőrzés végzése!

#### 5.5.1 Az ellenőrzés indítása

Ha egy jármű lejárt ellenőrzéssel rendelkezik:
1. A járműnél megjelenik egy **narancssárga figyelmeztető ikon**
2. **Automatikusan felugrik** az ellenőrzési ablak a jármű megnyitásakor
3. Vagy manuálisan is elindítható a **"Kötelező ellenőrzés"** gombbal

#### 5.5.2 Ellenőrzési pontok

Az alábbi négy területet kell ellenőrizni:

1. **Motorolaj szint**
   - ✅ Rendben: Az olajszint megfelelő
   - ❌ Hibás: Alacsony olajszint vagy szivárgás

2. **Hűtőfolyadék**
   - ✅ Rendben: Megfelelő mennyiség
   - ❌ Hibás: Alacsony szint vagy szivárgás

3. **Világítás és Index**
   - ✅ Rendben: Minden lámpa működik
   - ❌ Hibás: Kiégett izzó vagy hibás működés

4. **Karosszéria épsége**
   - ✅ Rendben: Nincs látható sérülés
   - ❌ Hibás: Karcolás, horpadás vagy törés

#### 5.5.3 Ellenőrzés rögzítése

**Ha minden rendben:**
1. Állítsa be mind a négy pontot **"Rendben"** állapotra
2. Kattintson a **"Minden rendben, Beküldés"** gombra
3. Az ellenőrzés azonnal rögzítésre kerül

**Ha hibát észlel:**
1. Állítsa be a hibás pont(ok)at **"Hibás"** állapotra
2. Kattintson a **"Tovább a hibabejelentéshez"** gombra
3. **Részletes leírás megadása kötelező!**
   - Írja le pontosan a problémát (minimum 5 karakter)
   - Például: "Bal első izzó kiégett" vagy "Alacsony olajszint"
4. Opcionálisan **fotó készítése** a hibáról
5. Kattintson a **"Hibabejelentés"** gombra

#### 5.5.4 Offline működés

**Az ellenőrzés offline módban is működik!**

- Ha nincs internetkapcsolat, a rendszer **narancssárga figyelmeztetést** jelenít meg: *"Offline mód: Az adatok a telefonon mentődnek"*
- Az adatok **helyben tárolódnak** a készüléken
- Amikor visszajön az internet, **automatikusan szinkronizálódnak** a szerverrel
- A függőben lévő ellenőrzések száma látható a rendszerben

**Fontos:** Még offline módban is kötelező elvégezni az ellenőrzést! Az adatok nem vesznek el, automatikusan feltöltésre kerülnek.

#### 5.5.5 Ellenőrzési előzmények

- Minden ellenőrzés **rögzítésre kerül** a jármű történetében
- Megtekinthető, ki és mikor végezte az ellenőrzést
- Látható, hogy voltak-e hibák
- A hibabejelentések és fotók archiválásra kerülnek

---

## 6. Felszerelések Kezelése

### 6.1 Felszerelés Lista

**Elérés:** Bal oldali menü → **Felszerelés**

**Kategóriák:**
- Védőfelszerelések
- Kéziszerszámok
- Technikai eszközök
- Egyéb felszerelések

**Funkciók:**
- ✅ Teljes felszerelés lista megtekintése
- ✅ Keresés név vagy sorozatszám alapján
- ✅ Szűrés kategória és státusz szerint
- ✅ Lejárati dátumok követése

**Megjelenített adatok:**
- Fénykép
- Megnevezés
- Kategória
- Sorozatszám
- Darabszám
- Státusz
- Lejárati dátum

### 6.2 Új Felszerelés Hozzáadása

1. Kattintson a **"+ Felszerelés hozzáadása"** gombra
2. Töltse ki a mezőket:
   - **Megnevezés** *
   - **Kategória** *
   - **Sorozatszám**
   - **Darabszám** *
   - **Státusz** *
   - **Lejárati dátum** (ha van)
3. Kattintson a **"Mentés"** gombra

### 6.3 Lejárati Figyelmeztetések

A rendszer automatikusan figyelmeztet, ha egy felszerelés:
- **30 napon belül lejár** - Sárga jelzés
- **Már lejárt** - Piros jelzés

---

## 7. Vízilétesítmények Kezelése

### 7.1 Létesítmények Lista

**Elérés:** Bal oldali menü → **Vízilétesítmények**

**Funkciók:**
- ✅ Teljes létesítmény lista
- ✅ Térkép nézet (GPS koordináták alapján)
- ✅ Keresés név vagy cím alapján
- ✅ Szűrés típus és státusz szerint

**Megjelenített adatok:**
- Név
- Típus (pl. Tűzcsap, Medence, Tó, stb.)
- Cím
- GPS koordináták
- Státusz (Működő / Karbantartás alatt / Nem működik)
- Utolsó ellenőrzés dátuma

### 7.2 Új Létesítmény Hozzáadása

1. Kattintson a **"+ Létesítmény hozzáadása"** gombra
2. Töltse ki a mezőket:
   - **Név** *
   - **Típus** *
   - **Cím** *
   - **GPS koordináták** (szélesség, hosszúság)
   - **Státusz** *
   - **Kapacitás** (ha releváns)
   - **Megjegyzések**
3. Kattintson a **"Mentés"** gombra

### 7.3 Térkép Nézet

A létesítmények megtekinthetők **térképen** is:
1. Kattintson a **"Térkép nézet"** gombra
2. A létesítmények **piros markerekkel** jelennek meg
3. Kattintson egy **markerre** a részletek megtekintéséhez

---

## 8. Naptár

### 8.1 Naptár Nézet

**Elérés:** Bal oldali menü → **Naptár**

**Nézetek:**
- **Hónap nézet** - Teljes hónap áttekintése
- **Hét nézet** - Részletes heti nézet
- **Nap nézet** - Egy nap eseményei óránkénti bontásban

### 8.2 Események Típusai

A naptárban különböző típusú események jelennek meg:
- 🚗 **Járműszerviz** - Tervezett karbantartások
- 📅 **Esemény** - Szervezeti események
- 🎂 **Születésnap** - Kollégák születésnapjai (automatikus)
- 🧰 **Felszerelés karbantartás** - Tervezett felszerelés ellenőrzések

### 8.3 Új Esemény Létrehozása

1. Kattintson a **"+ Esemény hozzáadása"** gombra vagy kattintson a naptár egy napjára
2. Töltse ki az esemény adatait:
   - **Cím** *
   - **Dátum és időpont** *
   - **Típus** *
   - **Leírás**
   - **Helyszín**
   - **Résztvevők** (több személy is kiválasztható)
3. Kattintson a **"Mentés"** gombra

### 8.4 Esemény Szerkesztése vagy Törlése

1. Kattintson az **eseményre** a naptárban
2. **Szerkesztés:** Módosítsa az adatokat és kattintson a **"Mentés"** gombra
3. **Törlés:** Kattintson a **"Törlés"** gombra és erősítse meg

---

## 9. Incidensek

### 9.1 Incidensek Lista

**Elérés:** Bal oldali menü → **Incidensek**

**Funkciók:**
- ✅ Teljes incidens lista
- ✅ Keresés leírás vagy helyszín alapján
- ✅ Szűrés típus, státusz és dátum szerint
- ✅ Részletes incidens riportok

**Megjelenített adatok:**
- Dátum és időpont
- Típus
- Helyszín
- Leírás (rövid)
- Státusz (Aktív / Lezárt)
- Rögzítette (felhasználó neve)

### 9.2 Új Incidens Rögzítése

1. Kattintson a **"+ Incidens rögzítése"** gombra
2. Töltse ki az incidens adatait:
   - **Típus** * (pl. Tűz, Baleset, Műszaki hiba, stb.)
   - **Dátum és időpont** *
   - **Helyszín** *
   - **Részletes leírás** *
   - **Érintett személyek** (ha vannak)
   - **Érintett járművek** (ha vannak)
   - **Érintett felszerelések** (ha vannak)
   - **Fotók feltöltése** (opcionális)
3. Kattintson a **"Mentés"** gombra

### 9.3 Incidens Részletei

Az incidens részletes adatlapján megtekinthető:
- Teljes leírás
- Időbélyegzők
- Érintett erőforrások
- Csatolt fájlok és fotók
- Kapcsolódó jelentések

### 9.4 Incidens Lezárása

1. Nyissa meg az incidens részletes adatlapját
2. Kattintson a **"Lezárás"** gombra
3. Adjon hozzá **záró megjegyzést** (opcionális)
4. Erősítse meg a lezárást

**Lezárt incidensek:**
- Megmaradnak a rendszerben
- Nem szerkeszthetők többé
- Archiválásra kerülnek

---

## 10. Beállítások

**Elérés:** Bal oldali menü → **Beállítások** (csak adminoknak elérhető!)

### 10.1 Felhasználók Kezelése

**Funkció:** Új felhasználók meghívása és meglévő felhasználók kezelése.

#### Új Felhasználó Meghívása

1. Kattintson a **"Felhasználó meghívása"** gombra
2. Töltse ki a mezőket:
   - **Email cím** *
   - **Teljes név** *
   - **Szerepkör** * (Admin / User / Reader)
3. Kattintson a **"Meghívó küldése"** gombra

**Meghívási folyamat:**
1. A rendszer emailt küld a megadott címre
2. A felhasználó megkapja a meghívó linket
3. A link segítségével beállítja a jelszavát
4. Ezután bejelentkezhet a rendszerbe

#### Felhasználó Szerepkör Módosítása

1. Keresse meg a felhasználót a listában
2. Kattintson a **szerepkör** melletti legördülő menüre
3. Válassza ki az új szerepkört
4. A módosítás **automatikusan mentésre** kerül

#### Felhasználó Deaktiválása

1. Keresse meg a felhasználót a listában
2. Kattintson a **"Deaktiválás"** gombra
3. Erősítse meg a műveletet

**Deaktivált felhasználók:**
- Nem tudnak bejelentkezni
- Adataik megmaradnak a rendszerben
- Bármikor újra aktiválhatók

### 10.2 Mező Sémák (Field Schemas)

**Funkció:** Egyéni mezők definiálása az egyes modulokhoz (Személyzet, Járművek, Felszerelés, stb.).

**Példa egyéni mezők:**
- Személyzetnél: "Végtípus", "Lakcím kerület", "Jogosítvány kategóriák"
- Járműveknél: "Utolsó olajcsere", "Gumik állapota"
- Felszerelésekhez: "Tanúsítvány száma", "Gyártó"

**Új mező hozzáadása:**
1. Válassza ki a **modult** (pl. "Personnel")
2. Kattintson a **"+ Új mező"** gombra
3. Adja meg a mező adatait:
   - **Név** * (belső azonosító)
   - **Megjelenítési név** * (magyar nyelvű név)
   - **Típus** * (Szöveg, Szám, Dátum, Legördülő lista, stb.)
   - **Kötelező** (igen/nem)
4. Kattintson a **"Mentés"** gombra

**Az új mező azonnal megjelenik** a modul adatlapjain!

### 10.3 Feature Flags (Funkció Kapcsolók)

**Funkció:** Bizonyos funkciók be- és kikapcsolása a rendszerben.

**Elérhető kapcsolók:**
- **Naptár modul** - Naptár funkció engedélyezése/tiltása
- **Incidensek modul** - Incidens rögzítés engedélyezése/tiltása
- **Térkép nézet** - Térképes megjelenítés engedélyezése/tiltása

**Kapcsoló módosítása:**
1. Keresse meg a funkciót a listában
2. Kattintson a **kapcsolóra** (BE/KI)
3. A módosítás **azonnal életbe lép**

### 10.4 Audit Log (Műveleti Napló)

**Funkció:** A rendszerben végrehajtott műveletek naplózása.

**Naplózott műveletek:**
- Bejelentkezések
- Adatok létrehozása, módosítása, törlése
- Felhasználók meghívása
- Beállítások módosítása

**Megjelenített információk:**
- Időpont
- Művelet típusa
- Felhasználó neve
- Érintett tábla/modul
- Módosított adatok (előző és új érték)

**Szűrés:**
- Dátum szerint
- Felhasználó szerint
- Művelet típus szerint
- Tábla szerint

---

## 11. Offline Mód és Szinkronizálás

### 11.1 Mi az offline mód?

Az AlApp **korlátozott offline funkcionalitással** rendelkezik, amely lehetővé teszi bizonyos műveletek végzését internetkapcsolat nélkül.

**Fontos:** Jelenleg csak a **járművek kéthetenkénti ellenőrzése** támogatott offline módban!

### 11.2 Hogyan működik az offline mód?

#### Automatikus észlelés

Az alkalmazás **automatikusan észleli**, ha nincs internetkapcsolat:
- **Narancssárga figyelmeztetés** jelenik meg az érintett funkcióknál
- Az üzenet: *"Offline mód: Az adatok a telefonon mentődnek"*
- Az adatok **helyben tárolódnak** a készüléken (IndexedDB adatbázisban)

#### Helyi adattárolás

Offline módban rögzített adatok:
- **Biztonságosan mentődnek** a készülék memóriájában
- **Nem vesznek el**, még akkor sem, ha bezárja az alkalmazást
- **Automatikusan szinkronizálódnak** amikor visszajön az internet
- Több adat is tárolható, korlát nélkül

### 11.3 Mit lehet csinálni offline?

**✅ Elérhető offline:**
- Járművek kéthetenkénti kötelező ellenőrzésének rögzítése
- Hibabejelentések készítése
- Fotók készítése és csatolása (helyben tárolódnak)
- Már letöltött adatok megtekintése

**❌ Nem elérhető offline:**
- Bejelentkezés (de ha már be van jelentkezve, marad)
- Új személyzet, jármű, felszerelés hozzáadása
- Incidensek rögzítése
- Vízilétesítmények kezelése
- Naptár események
- Beállítások módosítása

### 11.4 Szinkronizálás

#### Automatikus szinkronizálás

Amikor visszajön az internetkapcsolat:
- Az alkalmazás **automatikusan észleli** a kapcsolatot
- **Azonnal megkezdődik** a szinkronizálás
- A helyben tárolt adatok **feltöltődnek** a szerverre
- Sikeres feltöltés után **törlődnek** a helyi adatok

#### Függőben lévő adatok

A szinkronizálásra váró adatok száma:
- **Látható a rendszerben** (függőben lévő elemek számlálója)
- **Narancssárga badge** jelzi, ha van szinkronizálandó adat
- A **szám mutatja** hány elem vár feltöltésre

#### Manuális szinkronizálás

Ha az automatikus szinkronizálás nem indul el:
1. **Frissítse az oldalt** (F5 vagy Ctrl+R / Cmd+R)
2. **Jelentkezzen ki és be újra**
3. Ha továbbra sem működik, ellenőrizze az internetkapcsolatot

### 11.5 Szinkronizálási állapot ellenőrzése

**Állapot ikonok:**
- 🟢 **Zöld pipa:** Minden adat szinkronizálva
- 🔄 **Forgó nyíl:** Szinkronizálás folyamatban
- 🟠 **Narancssárga háromszög:** Függőben lévő adatok (offline)
- 🔴 **Piros X:** Kapcsolódási hiba

### 11.6 Gyakori problémák

**"Az adatok nem töltődnek fel"**
1. Ellenőrizze az internetkapcsolatot
2. Várjon néhány percet, lehet hogy lasú a kapcsolat
3. Frissítse az oldalt
4. Jelentkezzen ki és be újra

**"Offline mód nem működik"**
1. Ellenőrizze, hogy támogatott funkciót használ-e (jármű ellenőrzés)
2. Törölje a böngésző cache-ét
3. Használjon modern böngészőt (Chrome, Firefox, Safari, Edge)

**"Szinkronizálás közben hiba történt"**
1. Az adat megmarad a helyi tárolóban
2. A rendszer **újra próbálkozik** automatikusan
3. Ha tartósan nem sikerül, lépjen kapcsolatba az adminisztrátorral

### 11.7 Adatbiztonság offline módban

**Fontos tudnivalók:**
- A helyben tárolt adatok **titkosítva** vannak
- Csak a bejelentkezett felhasználó fér hozzá
- Kijelentkezéskor az adatok **megmaradnak** és szinkronizálódnak
- Ha törli a böngésző adatait, a **nem szinkronizált adatok elvesznek**!

**Ajánlások:**
- **Ne törölje** a böngésző cache-ét amíg van függőben lévő adat
- **Ne távolítsa el** az alkalmazást amíg nem szinkronizálódott minden
- **Rendszeresen ellenőrizze** hogy van-e függőben lévő elem

### 11.8 Jövőbeli fejlesztések

Tervezett offline funkciók:
- Incidensek rögzítése offline módban
- Személyzet adatok szerkesztése
- Vízilétesítmények ellenőrzése
- Általános CRUD műveletek minden modulban

---

## 12. Gyakran Ismételt Kérdések

### Általános Kérdések

**K: Hogyan változtathatom meg a jelszavamat?**
**V:** Kattintson a jobb felső sarokban a profil ikonra, majd válassza a "Profil beállítások" menüpontot. Itt módosíthatja a jelszavát.

**K: Elfelejtettém a jelszavamat, mit tegyek?**
**V:** A bejelentkezési oldalon kattintson az "Elfelejtett jelszó?" linkre, adja meg az email címét, és a rendszer küld egy jelszó visszaállítási linket.

**K: Miért nem tudok új felhasználót meghívni?**
**V:** Csak admin jogosultsággal rendelkező felhasználók hívhatnak meg új felhasználókat. Ellenőrizze a jogosultsági szintjét.

**K: Hogyan tudom törölni az adatokat?**
**V:** A rendszer nem törli véglegesen az adatokat, csak deaktiválja őket. Minden deaktivált adat visszaállítható.

### Műszaki Kérdések

**K: Milyen böngészőt használjak?**
**V:** Az alkalmazás a modern böngészők legújabb verzióival működik. Javasolt: Google Chrome, Mozilla Firefox, Safari, Microsoft Edge.

**K: Működik az alkalmazás mobilon?**
**V:** Igen, az alkalmazás reszponzív dizájnnal rendelkezik, így mobilon és tableten is használható.

**K: Offline is használható az alkalmazás?**
**V:** Nem, az alkalmazás használatához stabil internetkapcsolat szükséges.

**K: Biztonságosak az adataim?**
**V:** Igen, az adatok titkosított formában tárolódnak a Supabase felhőben. A kommunikáció HTTPS protokollon keresztül történik.

### Hibaelhárítás

**K: Nem töltődik be az oldal, mit tegyek?**
**V:**
1. Frissítse az oldalt (Ctrl+R vagy Cmd+R)
2. Törölje a böngésző cache-ét
3. Próbáljon meg másik böngészőt használni
4. Ellenőrizze az internetkapcsolatot

**K: A meghívó email nem érkezik meg, mit tegyek?**
**V:**
1. Ellenőrizze a spam/levélszemét mappát
2. Várjon 5-10 percet, lehet hogy késik az email
3. Kérjen új meghívót az adminisztrátortól

**K: "Hozzáférés megtagadva" hibaüzenetet kapok, mit jelent?**
**V:** Nincs megfelelő jogosultsága az adott művelethez. Lépjen kapcsolatba az adminisztrátorral a jogosultságok ellenőrzéséhez.

---

## Kapcsolat és Támogatás

### Technikai Támogatás

Ha technikai problémát tapasztal vagy kérdése van az alkalmazással kapcsolatban:

**Email:** support@dunaiosztaly.hu
**Telefon:** +36 XX XXX XXXX

**Nyitvatartás:**
- Hétfő-Péntek: 8:00 - 16:00
- Hétvégén: Nincs támogatás

### Hibajelentés

Kérjük, hibajelentésnél adja meg:
- A hiba pontos leírását
- Mit csinált amikor a hiba történt
- Milyen böngészőt használ
- Képernyőkép a hibáról (ha lehetséges)

---

## Verzióinformáció

**Aktuális verzió:** 1.0.0
**Kiadás dátuma:** 2026. február 23.

**Főbb funkciók:**
- ✅ Személyzet nyilvántartás
- ✅ Járműkezelés
- ✅ Felszerelés nyilvántartás
- ✅ Vízilétesítmények kezelése
- ✅ Naptár és eseménykezelés
- ✅ Incidens rögzítés
- ✅ Felhasználó kezelés (meghívás, szerepkörök)
- ✅ Egyéni mezők
- ✅ Audit log

---

## Jogi Információk

### Szerzői Jogok

© 2026 Dunai Osztály. Minden jog fenntartva.

Az AlApp alkalmazás és dokumentációja szerzői jogi védelem alatt áll.

### Adatvédelem

Az alkalmazás használata során rögzített adatok kezelése a GDPR (Általános Adatvédelmi Rendelet) előírásainak megfelelően történik.

**Adatkezelő:** Dunai Osztály
**Adatvédelmi tisztviselő:** [Név]
**Email:** privacy@dunaiosztaly.hu

### Felelősség Kizárása

Az AlApp fejlesztői minden tőlük telhetőt megtesznek a rendszer stabilitásáért és az adatok biztonságáért, azonban nem vállalnak felelősséget az esetleges adatvesztésért vagy rendszerhibákért.

**Javasoljuk:**
- Rendszeres adatmentést
- Gondos adatkezelést
- Erős jelszavak használatát

---

**Utolsó frissítés:** 2026. február 23.
**Verzió:** 1.0.0
**Készítette:** Dunai Osztály IT Csapat
