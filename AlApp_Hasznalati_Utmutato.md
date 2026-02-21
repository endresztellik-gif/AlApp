# AlApp - Használati Útmutató

## 1. Bevezető
Jelen dokumentum az **AlApp** Dunai Osztály nyilvántartási rendszere hivatalos használati útmutatója. A rendszer célja, hogy naprakészen tartsa a szervezet eszközeinek állapotát, okmányainak érvényességét, és egyszerűsítse a terepi munkatársak számára a kötelező ellenőrzések és hibabejelentések folyamatát.

---

## 2. Jogosultsági Szintek

A rendszer biztonságos és átlátható működése érdekében kétféle jogosultsági szintet különböztet meg:

### 2.1. Adminisztrátor (Rendszergazda)
Az adminisztrátorok teljes körű hozzáféréssel rendelkeznek a rendszer minden funkciójához.
- **Létrehozás és Törlés:** Új járműveket, eszközöket és felhasználókat rögzíthetnek, valamint véglegesen törölhetik azokat.
- **Adatkezelés:** Minden adatlapot szabadon szerkeszthetnek.
- **Riasztások:** Automatikus e-mail értesítést kapnak az ellenőrzések során jelentett "Hibás" állapotokról, valamint a rendszer két hetente biztonsági mentést is küld számukra.

### 2.2. Normál Felhasználó (Munkatárs)
A terepi munkatársak biztonságosan és célirányosan férnek hozzá az adatokhoz.
- **Olvasás:** Megtekinthetik az eszközök és járművek adatait, lejáratait.
- **Rögzítés:** Új eszközt vagy járművet **nem hozhatnak létre**, de a meglévő adatlapokon **szerkeszthetik** a változó paramétereket (pl. aktuális kilométeróra állás, okmányok megújított érvényessége).
- **Bejelentés:** Bármely eszközhöz rögzíthetnek Káreseményt, Karbantartási Naplót és elvégezhetik a kötelező kétheti ellenőrzéseket. Törlésre nincs jogosultságuk.

---

## 3. A Rendszer Használata

### 3.1. Bejelentkezés
A rendszer használata bejelentkezéshez kötött. A kezdőoldalon adja meg e-mail címét és jelszavát.

![Bejelentkezés Főképernyő](/Users/endremek/.gemini/antigravity/brain/8d50eefb-3971-4bc9-bc0c-adbeb4107d9c/.system_generated/click_feedback/click_feedback_1771586631572.png)

### 3.2. Vezérlőpult és Navigáció
Sikeres bejelentkezés után a Vezérlőpult (Dashboard) fogadja a felhasználót. A bal oldali menüsorban érhetőek el a modulok (Személyek, Járművek, Eszközök, Naptár, Káresemények).

**Kötelező Ellenőrzés Figyelmeztető:**
Amennyiben egy olyan járműért felel, amelynél több mint 14 napja nem történt állapotfelmérés, a rendszer a belépés pillanatában egy felugró ablakban (Modalban) kötelezi az ellenőrzés elvégzésére.

### 3.3. Járművek és Eszközök
A Járművek vagy Eszközök menüpontra kattintva egy áttekinthető listát kapunk az állományról.

**Érvényesség Kijelzők (Lejárati figyelmeztetések):**
Az okmányok lejárata mellett a rendszer színkódokkal segíti a tájékozódást:
- Nincs szín: Több mint 90 nap van hátra.
- 🟠 **Narancssárga**: 30 és 90 nap között esedékes.
- 🔴 **Piros**: Kevesebb mint 30 nap maradt.
- ⚫ **Fekete/Szürke**: A dokumentum lejárt.

*(Kizárólag Adminisztrátorok számára jobb oldalt felül látható lesz az "Új Jármű/Eszköz" gomb.)*

![Járművek Lista](/Users/endremek/.gemini/antigravity/brain/8d50eefb-3971-4bc9-bc0c-adbeb4107d9c/.system_generated/click_feedback/click_feedback_1771586704800.png)

---

## 4. Karbantartás és Hibabejelentés

Bármely jármű vagy eszköz kártyájára kattintva megnyílik a részletes adatlap.

### 4.1. Karbantartási Napló
Itt vezethető az olajcsere, műszaki vizsga, vagy szervizelés története. Új "Műszaki Vizsga" rögzítésekor megadható a következő lejárati dátum, amit a rendszer automatikusan frissít a jármű fő adatlapján is.

### 4.2. Gyors Bejelentő (QR Kód) és Offline Működés
A járművek adatlapjának jobb alsó sarkában található egy **QR Kód Generátor**.
Az adminisztrátorok ezt a kódot kinyomtatva ráragaszthatják a gépekre.

**A folyamat menete:**
1. A munkatárs a mobiltelefonjával beolvassa a matricát.
2. A rendszer automatikusan megnyitja a **Gyors Bejelentő** felületet.
3. Elvégezhető a 4 pontos ellenőrzés (Motorolaj, Hűtővíz, Világítás, Karosszéria állapota).
4. Karosszéria hiba esetén a rendszer szöveges leírást ír elő. Ilyenkor a háttérben azonnal egy e-mailes riasztás indul az Adminisztrátorok felé.

**🔌 Offline Működés:**
Ha a terepen, pincében, vagy erdőben nincs internetkapcsolat, a rendszer akkor is engedi a rögzítést! Az adatok biztonságban eltárolódnak a telefon memóriájában, és amint a készülék újra internethez jut, a háttérben észrevétlenül felszinkronizálja azokat a központba.

---

## 5. Káresemények Menedzselése
A bal oldali menü "Káresemények" pontjában egy összesített lista látható az összes valaha bejelentett hibáról (legyen az defekt, törés vagy kopás). Az Adminisztrátorok ezen a felületen tudják nyomon követni az ügyeket és szükség esetén "Lezárt" státuszba helyezni a javításokat.

---
*- A dokumentumot készítette: AlApp Rendszer - 2026.*
