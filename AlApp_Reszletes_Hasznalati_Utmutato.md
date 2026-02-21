# AlApp - Részletes Használati Útmutató
**Dunai Osztály nyilvántartási rendszere**

---

## 1. Bevezetés és Alapfogalmak
Jelen dokumentum az AlApp rendszer hivatalos és teljes körű felhasználói kézikönyve. A rendszer célja a Dunai Osztály természetvédelmi eszközeinek, gépjárműveinek, vízi létesítményeinek és az ezekhez kapcsolódó karbantartási és eseménynaplók strukturált, felhőalapú nyilvántartása.

### 1.1 Jogosultsági Szintek (Szerepkörök)
Minden felhasználó a következő két szerepkör egyikébe tartozik. Ez határozza meg, hogy mit láthat, és mit módosíthat a rendszerben:

- **Adminisztrátor (Rendszergazda):** Korlátlan hozzáféréssel rendelkezik. Alapvető feladata a rendszer adatainak (Személyek, Eszközök, Járművek) felvitele, karbantartása, valamint a jogosultságok kezelése. Csak ők tudnak törölni, és adatot exportálni. Automatikus rendszerriasztásokat kapnak (pl. hibás járműellenőrzések esetén).
- **Normál Felhasználó (Munkatárs):** Hozzáférnek az adatokhoz olvasási szinten, és elvégezhetik a napi működéshez szükséges rögzítéseket (pl. kilométeróra állásának frissítése, káresemények felvitele, kötelező kétheti járműellenőrzés elvégzése). **Nem törölhetnek** a rendszerből, és nem hozhatnak létre alap entitásokat.

---

## 2. Rendszerhez való Hozzáférés

### 2.1. Bejelentkezés
A rendszer az e-mail cím és a hozzá tartozó jelszó megadásával használható. A bejelentkezési adatok hitelesítése után a rendszer betölti a munkamenetet, és a memóriában tartja azt a kényelmes munka érdekében.

![Bejelentkezési képernyő](/Users/endremek/.gemini/antigravity/brain/8d50eefb-3971-4bc9-bc0c-adbeb4107d9c/.system_generated/click_feedback/click_feedback_1771586631572.png)

### 2.2. Offline Működés (PWA)
A rendszer támogatja az aktív internetkapcsolat nélküli *(Offline)* munkavégzést a terepen (pl. okostelefonon böngészőből megnyitva). 
Offline állapotban a rendszer eltárolja a beküldött **Káreseményeket** és **Jármű Ellenőrzéseket** a telefon memóriájában, és amint a készülék újra hálózatra csatlakozik, automatikusan szinkronizálja azokat a központi adatbázisba.

---

## 3. Vezérlőpult (Dashboard) és Navigáció

Sikeres belépést követően a **Vezérlőpult** (*Áttekintő*) nyílik meg. Ez a képernyő a legfontosabb riasztásokat és statisztikákat foglalja össze:
- **Kötelező Kétheti Figyelmeztető:** A rendszer beazonosítja a bejelentkezett felhasználót, és leellenőrzi az általa felügyelt járműveket. Amennyiben egy jármű 14 napja nem esett át állapot-ellenőrzésen, egy kötelező felugró ablak akadályozza meg a továbbhaladást, amíg a gyors ellenőrzés (Olaj, Hűtővíz, Lámpa, Karosszéria) meg nem történik.

A képernyő bal oldalán található **főmenü (Sidebar)** biztosítja a navigációt a különböző adatmodulok között.

---

## 4. Modulok Működése

A rendszer az adatokat "Modulokba" szervezi. A fő logikai felépítésük (Lista nézet és Részletes Adatlap) minden modulnál megegyezik.

### 4.1. Járművek és Eszközök
Ez a két modul alkotja a rendszer gerincét. A listanézetben áttekinthető kártyákon jelennek meg az egységek (pl. autók rendszámmal, drónok, fűkaszák azonosítóval).

**Érvényesség, lejárati idők színkódjai:**
Az okmányok lejárata vagy a műszaki vizsgák dátuma mellett a rendszer intelligens vizuális visszajelzést ad:
- **(Nincs szín)**: Több mint 90 nap van hátra.
- 🟠 **Narancs (Figyelmeztetés)**: A lejárat 30-90 nap között esedékes.
- 🔴 **Piros (Sürgős)**: Kevesebb mint 30 nap van hátra.
- ⚫ **Fekete (Lejárt)**: A dokumentum vagy vizsga lejárt (negatív napokat mutat).

![Járművek Lista Nézet](/Users/endremek/.gemini/antigravity/brain/8d50eefb-3971-4bc9-bc0c-adbeb4107d9c/.system_generated/click_feedback/click_feedback_1771586704800.png)

#### Adatlap felépítése
Egy járműre (pl. kisbuszra) rákattintva az eszköz **Adatlapja** nyílik meg.
- **Szerkesztés:** Normál felhasználók a dinamikus mezőket (pl. kilométeróra, tárolási hely) szabadon frissíthetik. Adminisztrátorok minden mezőt módosíthatnak vagy törölhetnek gépeket.
- **Karbantartási Napló:** A középső szekcióban rögzíthetőek a szervizelések, javítások és "Műszaki vizsgák". *Tipp: Ha új "Műszaki vizsga" kerül rögzítésre új lejárati dátummal, a rendszer automatikusan érvényesíti azt a fő adatlapon is!*
- **Fotók és Dokumentumok:** Mind az eszközhöz csatolhatók fájlok, a fájlok feltöltése támogatott az adatlap alján.
- **Káresemények és Hibák:** Automatikus lista az ehhez a géphez kötött összes múltbeli incidensről.

### 4.2. Gyors Bejelentő Kártya és QR Kód
Rendkívül hasznos funkció a Járművek és Eszközök adatlapjának alján található "Gyors Bejelentő (QR)" kártya.
Az **Adminisztrátorok** ezt a képet lementhetik vagy kinyomtathatják.
Amikor egy dolgozó a telephelyen a telefonja kamerájával beolvassa ezt a ráragasztott QR kódot, a rendszer **azonnal egy mobiltelefonra optimalizált bejelentő felületre** navigálja, felesleges keresgélés nélkül, ahol rögzítheti a sérüléseket vagy csekkolhatja a kétheti listát. **Ha a dolgozó a karosszériát "hibásként" jelöli meg egy kötelező ellenőrzésnél és beírja a hiba okát, a háttérben azonnal automatikus E-mail Riasztás indul a Rendszergazdáknak!**

### 4.3. Káresemények Modul (Incidensek)
Ez a lista az összes beküldött hibabejelentést mutatja aggregálva. 
- Egy új Káresemény rögzítésekor *(Új káresemény gomb)* ki kell választani az érintett Eszközt vagy Járművet, a dátumot és le kell írni az esetet.
- Az incidenst a beküldő rögzíti (ezt a rendszer elmenti), és alapértelmezetten "Nyitott" státuszba kerül.
- **Lezárás:** Az Adminisztrátorok ezen a felületen tudják "Megoldott" állapotba helyezni a bejelentéseket, ezzel jelezve, hogy a hiba elhárítása megtörtént.

### 4.4. Személyek Modul
A Személyek modulban tarthatók nyilván a Dunai Osztály munkatársai, beosztásuk, elérhetőségük.
A Járművek esetében ezen lista alapján lehet a járművekhez **Felelős Személyeket** (hozzárendelt felhasználókat) párosítani. Fontos: a rendszer ezen összekapcsolás alapján tudja, hogy kinek mely járműre vonatkozóan van kötelező kétheti feladata.

### 4.5. Naptár (Calendar)
A rendszer tartalmaz egy áttekinthető, havi/heti és napi nézetes naptárat. Ez grafikus, vizuális felületen jeleníti meg az összes eseményt a rendszerben, mint például:
- Lejáró érvényességű okmányok.
- Korábban rögzített Karbantartási szervizek és vizsgák.
- Szabadságolások, ünnepek.
Segítségével egy szempillantás alatt átlátható a jövő havi gépjármű-terhelés (pl. műszakiztatások miatt kieső buszok).

### 4.6. Rendszer Beállítások és Export
Ez a modul kizárólag az **Adminisztrátorok** számára lett kialakítva. A Beállítások (Settings) ikonra kattintva a bal alsó sarokban érhető el.
- **Mezőséma (Dinamikus Adattábla):** Az Adminok határozhatják meg, hogy egy „Jármű” milyen fix adatokkal rendelkezzen (pl. Rendszám, Évjárat, Gumiméret). Később ezek a mezők szabadon bővíthetők!
- **Jogosultságok kezelése (Security):** Lehetőség van a meglévő felhasználók listázására, inaktiválására vagy admin jogok kiosztására.
- **Audit Napló (Audit Log):** Teljes értékű "biztonsági széf", ami a háttérben naplózza a rendszer összes mozgását (ki jelentkezett be, mikor, ki hozott létre új autót, ki törölt adatot).

**Adat Exportálás:**
Az Adminisztrátorok a bal oldali menü "Adat Exportálás" (Download) gombjával bármikor letölthetik a rendszer teljes tartalmát Excel (`.xlsx`) vagy `.CSV` formátumba egyetlen gombnyomással. Ideális havi könyveléshez vagy jelentésekhez az egész Osztály számára.

---

## 5. Automatikus Biztonsági Mentés
Annak érdekében, hogy a Dunai Osztály adatai egy váratlan havária esetén se vesszenek el, a rendszer a felhőben egy automatikus (Cron) folyamatot futtat:
A szerver **kéthetente** a hónap 1. és 15. napján automatikusan lehúzza a Járművek, Személyek, Eszközök, Karbantartási naplók és Incidensek összes adattábláját, becsomagolja azokat egy ZIP fájlba, **és e-mail csatolmányként elküldi a Rendszergazda e-mail címére**. Ezzel biztosítva az üzletmenet-folytonosságot egy esetleges szolgáltatás-kiesés során.

---

*Copyright © 2026 AlApp Természetvédelmi Rendszer. Készítette: Antigravity.*
