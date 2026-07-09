# PRD — Epic 0 + 1a: Persistenz-Fundament & Mehrere Listen mit Kategorien

> **Status:** Entwurf für die nächste Ausbaustufe (Milestone nach MVP). Backendlos.
> Nachfolger des eingefrorenen [`prd.md`](./prd.md) (MVP, SHIPPED 2026-07-06).
> Quelle der Fakten: [`research/bring-feature-analyse.md`](./research/bring-feature-analyse.md)
> (Epics 0 + 1a). Alles ab Epic B/2/3+4 (Backend, Sync, Sharing, Push) bleibt bewusst
> außerhalb dieses PRD.
>
> Nächster Schritt nach Freigabe: `/to-issues` schneidet die Slices aus diesem Dokument.

## Problem Statement

Als Nutzer führe ich heute genau **eine** flache Einkaufsliste. In der Praxis brauche ich
aber mehrere Listen (z.B. eine pro Geschäft oder Anlass), und innerhalb einer Liste verliere
ich bei mehr als einer Handvoll Artikeln den Überblick, weil alles in einer ununterbrochenen
Reihenfolge steht — Kühlwaren stehen neben Putzmitteln, ich laufe im Laden hin und her.

Zusätzlich ist meine Datenhaltung fragil: alles liegt als ein einziges flaches Array unter
einem `localStorage`-Key. Das trägt kein Mehr-Listen-Modell, und Safari/WebKit löscht
`localStorage` (wie allen script-schreibbaren Storage) nach **7 Tagen ohne Interaktion** —
für die installierte iPhone-PWA ist das zwar entschärft (Homescreen-Web-Apps sind faktisch
von der 7-Tage-Löschung ausgenommen), aber das flache Modell blockiert jede Weiterentwicklung.

Und wenn ich einen Artikel abhake oder entferne, ist er endgültig weg. Beim nächsten
Einkauf tippe ich „Milch", „Brot", „Butter" wieder von Hand — obwohl ich genau diese
Artikel ständig kaufe.

## Solution

Zwei zusammenhängende Ausbaustufen, beide **rein lokal, ohne Backend und ohne Account**:

**Epic 0 — Persistenz-Fundament.** Der App-State zieht aus `App.jsx` in eine dedizierte
Persistenz-Grenze (ein **Repository-Modul**) um. Gespeichert wird künftig in **IndexedDB via
Dexie** statt in `localStorage`. **Kein Migrationspfad:** Bisher hat nur der Entwickler die
PWA ausprobiert; die vorhandenen `localStorage`-Probierdaten sind verzichtbar. Die App
startet auf dem neuen Store frisch (leere Standardliste). Der alte `localStorage`-Key wird
ignoriert bzw. aufgeräumt, nicht übernommen.

**Epic 1a — Mehrere Listen & Kategorien.** Die Nutzerin kann **mehrere Listen** anlegen,
zwischen ihnen wechseln, sie umbenennen und löschen (mit Schutz: mindestens eine Liste
bleibt bestehen). Artikel tragen eine **Kategorie** und werden in der Anzeige nach einer
**festen Standard-Sortierung** gruppiert (Supermarkt-Sektionen), sodass zusammengehörige
Artikel beieinanderstehen. Abgehakte/entfernte Artikel werden **nicht gelöscht**, sondern
wandern in einen **„Zuletzt verwendet"-Bereich**, aus dem sie per Tap wieder auf die Liste
kommen — oder endgültig entfernt werden.

## User Stories

**Persistenz-Fundament (Epic 0)**

> Hinweis: Da bisher nur der Entwickler die PWA getestet hat, gibt es **keinen
> Migrationspfad** aus den alten `localStorage`-Daten — die App startet frisch auf IndexedDB.

1. Als Nutzer möchte ich, dass meine Liste zuverlässig in IndexedDB gespeichert wird, damit
   sie einen Reload und das Schließen der App übersteht.
2. Als Nutzer möchte ich, dass meine Daten auch dann tragfähig gespeichert sind, wenn ich
   viele Artikel und mehrere Listen habe, damit die App nicht an ihre Speichergrenze stößt.
3. Als Nutzer möchte ich, dass die App auch bei leerem oder beschädigtem Store robust mit
   einer funktionierenden leeren Standardliste startet, damit ich immer weiterarbeiten kann.
4. Als Entwickler möchte ich, dass der gesamte Storage-Zugriff hinter einer
   Repository-Grenze liegt, damit die UI nichts über IndexedDB/Dexie weiß und der Store
   später austauschbar/erweiterbar bleibt.
5. Als installierte iPhone-PWA-Nutzerin möchte ich, dass meine Daten über Tage hinweg
   erhalten bleiben, damit ich meine Liste zuverlässig wiederfinde.

**Mehrere Listen (Epic 1a)**

6. Als Nutzer möchte ich eine neue Liste mit einem Namen anlegen, damit ich Einkäufe nach
   Geschäft oder Anlass trennen kann.
7. Als Nutzer möchte ich zwischen meinen Listen wechseln, damit ich immer die passende
   Liste vor mir habe.
8. Als Nutzer möchte ich sehen, welche Liste gerade aktiv ist, damit ich Artikel nicht
   versehentlich in die falsche Liste eintrage.
9. Als Nutzer möchte ich eine Liste umbenennen, damit ich ihren Zweck später anpassen kann.
10. Als Nutzer möchte ich eine Liste löschen, damit ich nicht mehr benötigte Listen
    loswerde.
11. Als Nutzer möchte ich daran gehindert werden, meine letzte verbliebene Liste zu löschen,
    damit die App immer eine nutzbare Liste hat.
12. Als Nutzer möchte ich, dass nach dem Löschen der aktiven Liste automatisch eine andere
    Liste aktiv wird, damit ich sofort weiterarbeiten kann.
13. Als Nutzer möchte ich, dass die zuletzt aktive Liste nach einem Reload wieder geöffnet
    ist, damit ich dort weitermache, wo ich aufgehört habe.
14. Als neue Nutzerin ohne Altdaten möchte ich, dass beim ersten Start automatisch eine
    Standardliste existiert, damit ich sofort loslegen kann.

**Kategorien & Gruppierung (Epic 1a)**

15. Als Nutzer möchte ich, dass meine Artikel nach Kategorien (Supermarkt-Sektionen)
    gruppiert angezeigt werden, damit zusammengehörige Artikel beieinanderstehen.
16. Als Nutzer möchte ich, dass die Kategorien in einer sinnvollen, festen Reihenfolge
    erscheinen (z.B. Obst & Gemüse vor Tiefkühl), damit die Anzeige meinem Einkaufsweg
    ähnelt.
17. Als Nutzer möchte ich, dass ein neu eingegebener Artikel automatisch einer Kategorie
    zugeordnet wird, damit ich Kategorien nicht manuell pflegen muss.
18. Als Nutzer möchte ich, dass ein Artikel ohne erkennbare Kategorie in einer
    „Sonstiges"-Gruppe landet, damit nichts unsichtbar wird.
19. Als Nutzer möchte ich innerhalb einer Kategorie meine Artikel wie gewohnt abhaken und
    bearbeiten, damit die Gruppierung meine bisherigen Aktionen nicht einschränkt.
20. Als Nutzer möchte ich, dass leere Kategorien nicht angezeigt werden, damit die Liste
    aufgeräumt bleibt.

**„Zuletzt verwendet" (Epic 1a)**

21. Als Nutzer möchte ich, dass ein abgehakter/entfernter Artikel nicht endgültig gelöscht
    wird, sondern in einen „Zuletzt verwendet"-Bereich wandert, damit ich ihn wiederfinde.
22. Als Nutzer möchte ich einen Artikel aus „Zuletzt verwendet" per Tap zurück auf die aktive
    Liste setzen, damit ich häufige Einkäufe schnell wieder aufnehme.
23. Als Nutzer möchte ich einen Artikel aus „Zuletzt verwendet" endgültig entfernen, damit
    ich den Bereich sauber halte.
24. Als Nutzer möchte ich, dass „Zuletzt verwendet" pro Liste geführt wird, damit die
    Vorschläge zum Zweck der jeweiligen Liste passen.
25. Als Nutzer möchte ich, dass ein Artikel, den ich aus „Zuletzt verwendet" zurückhole,
    wieder als offen (nicht abgehakt) auf der Liste erscheint, damit ich ihn erneut einkaufen
    kann.
26. Als Nutzer möchte ich, dass ein Artikel nicht doppelt auf der aktiven Liste erscheint,
    wenn ich ihn aus „Zuletzt verwendet" zurückhole und er dort schon steht, damit die Liste
    konsistent bleibt.

## Implementation Decisions

**Persistenz-Grenze / Repository-Modul (der eine neue Seam)**
- Der gesamte State-Zugriff wird aus `App.jsx` in ein dediziertes Persistenz-Modul
  („Repository") verlagert. Dieses Modul ist die **einzige** Stelle, die Storage kennt; die
  UI spricht nur mit dem Repository, nie direkt mit Dexie/IndexedDB.
- **Speicher-Engine: IndexedDB via Dexie.** Dexie ist Open Source (kostenlos), rein
  clientseitig, kein Backend. Der kommerzielle Sync-Zusatz „Dexie Cloud" ist **nicht** Teil
  dieses Scopes. Kosten des Wechsels: ~20–25 KB Bundle, eine neue Dependency, einmaliger
  Migrationsaufwand.
- **Reaktive Anzeige:** Die UI liest Listen/Artikel über Dexies `liveQuery`-Mechanismus
  (bzw. eine dünne Repository-Abstraktion darüber), sodass Änderungen ohne manuelles
  Neu-Laden sichtbar werden.

**Datenmodell**
- `Liste { id, name, createdAt }` und `Item { id, listId, name, done, category, updatedAt }`.
  Items referenzieren ihre Liste über `listId` (indexiert). „Zuletzt verwendet" wird als
  Zustand am Item geführt (siehe unten), nicht als separate Tabelle.
- **Schema-Versionsfeld:** Der Store trägt eine Schema-Version, damit spätere Migrationen
  (inkl. der aus dem MVP) deterministisch greifen. Dexie-Versionsdeklaration ist die
  maßgebliche Stelle.
- **Aktive Liste:** Die ID der aktiven Liste wird persistiert (eigener kleiner
  Settings-/Meta-Eintrag), sodass sie einen Reload überlebt.

**Kein Migrationspfad (bewusste Entscheidung)**
- Bisher hat nur der Entwickler die PWA ausprobiert; die vorhandenen
  `localStorage`-Probierdaten sind verzichtbar. Es wird **kein** Übernahmepfad
  `localStorage → IndexedDB` gebaut.
- Beim ersten Start auf dem neuen Store legt die App eine leere Standardliste an
  (siehe Bootstrap). Der alte Key `einkaufsliste:items` wird ignoriert bzw. einmalig
  aufgeräumt, nicht gelesen.
- **Robustheit bleibt Pflicht:** Bei leerem oder beschädigtem IndexedDB-Store startet die App
  auf einer funktionierenden leeren Standardliste statt zu crashen — dasselbe
  Fallback-Muster wie das bestehende `loadItems()` (defensive Validierung, try/catch).

**Mehrere Listen**
- Neue Liste anlegen (Name Pflicht, leer/nur-Whitespace wird wie im MVP ignoriert),
  umbenennen (leerer Name = Abbruch, wie beim Item-Rename heute), löschen.
- **Lösch-Guard:** Die letzte verbliebene Liste kann nicht gelöscht werden. Wird die aktive
  Liste gelöscht, wird eine andere existierende Liste aktiv.
- **Bootstrap:** Existiert keine Liste (Neu-Nutzer, keine Altdaten), legt die App genau eine
  leere Standardliste an und macht sie aktiv.

**Kategorien**
- Jedes Item hat ein `category`-Feld. Neu eingegebene Artikel werden über ein **lokales,
  deterministisches Mapping** (kleine kuratierte Zuordnungstabelle im Repo, keine externe
  Datenquelle) einer Kategorie zugeordnet; ohne Treffer → Kategorie „Sonstiges".
- **Feste Standard-Sortierung:** Die Kategorie-Reihenfolge ist eine im Code definierte
  Konstante (Supermarkt-Sektionen). Anpassbare Reihenfolge, Ausblenden einzelner Kategorien
  und listen-spezifische Sortierung sind **Out of Scope** (spätere Slice).
- **Anzeige:** Items werden nach Kategorie gruppiert; leere Kategorien werden nicht
  gerendert. Innerhalb einer Kategorie bleiben Abhaken/Bearbeiten unverändert bedienbar.
- Die Kategorien-Taxonomie ist bewusst **klein und kuratiert**; die Open-Food-Facts-Option
  aus dem Research ist Out of Scope (Lizenz-/Umfangsfrage, gehört zu Epic 1b).

**„Zuletzt verwendet"**
- **Verhaltensänderung gegenüber dem MVP:** Das heutige endgültige Löschen (`deleteItem`) und
  das Abhaken führen nicht mehr zum Verschwinden. Stattdessen wird das Item aus der aktiven
  Liste in einen „Zuletzt verwendet"-Zustand überführt (z.B. Flag/Status am Item, pro Liste).
- Aus „Zuletzt verwendet" kann ein Item per Tap **reaktiviert** (erscheint wieder offen,
  `done: false`, auf der aktiven Liste) oder **endgültig entfernt** werden.
- **Dedup-Regel:** Steht der Artikel bereits offen auf der aktiven Liste, erzeugt das
  Zurückholen kein Duplikat.

**UI-Verortung (bestehende `App.jsx`-Struktur)**
- Ein Listen-Auswahl-/Wechsel-Element kommt in den Kopfbereich; die bestehende Eingabeleiste
  und Item-Liste operieren auf der aktiven Liste. Die Umsetzung bleibt in der bestehenden
  Single-Component-Architektur bzw. wird nur so weit aufgeteilt, wie die Lesbarkeit es
  erfordert — kein spekulativer Umbau.

## Testing Decisions

**Was ein guter Test hier ist:** Er prüft **beobachtbares Verhalten** an der höchstmöglichen
Naht, nicht Implementierungsdetails. Konkret heißt das: Persistenz wird **nicht** mehr durch
Peeken auf Storage-Keys (`localStorage.getItem(STORAGE_KEY)`) geprüft — das koppelt an die
Speicher-Implementierung und bricht beim Dexie-Wechsel. Stattdessen wird Persistenz über
**Unmount → Remount („Reload")** verifiziert: Nach dem Neu-Rendern müssen die Daten wieder da
sein.

**Seams (bestätigt):**

1. **Komponenten-Seam (bestehend, bevorzugt)** — `src/App.test.jsx`-Stil mit Testing Library:
   render `<App/>`, treibe über die UI (`getByLabelText`, Buttons, wie das bestehende
   `addItem`-Helfer), prüfe gerendertes Ergebnis. Deckt ab: Item hinzufügen/abhaken/
   umbenennen, Liste anlegen/wechseln/umbenennen/löschen (inkl. Lösch-Guard),
   Kategorie-Gruppierung, „Zuletzt verwendet"-Verschiebung/Reaktivierung/Dedup.
   Persistenz-über-Reload via Remount.
2. **Repository-Seam (ein neuer Seam)** — Vitest mit **`fake-indexeddb`**.
   Exerziert die Persistenz-Grenze direkt: CRUD auf Listen/Items, Bootstrap der
   Standardliste, robuster Start bei leerem/beschädigtem Store, Schema-Version. Prior Art:
   das robuste `loadItems()` im MVP (Filter valider Items, `done`-Normalisierung,
   try/catch-Fallback) ist die Vorlage für die Start-Robustheit. **Kein Migrationstest**, da
   kein Migrationspfad gebaut wird.
3. **E2E-Seam (bestehend, Playwright)** — `e2e/shopping-list.spec.js`: Smoke der Kern-Flows
   im echten Browser mit echtem IndexedDB (Liste anlegen, Item hinzufügen, wechseln,
   Reload). Prior Art sind die bestehenden E2E- und Visual-Specs.

**Zu testende Module:** das neue Repository-Modul (Seam 2) und die App-Komponente (Seam 1).
Bestehende MVP-Tests bleiben grün bzw. werden auf das Reload-über-Remount-Muster umgestellt,
wo sie heute Storage-Keys peeken.

**Qualitäts-Gates:** `npm run lint`, `npm test`, `npm run build` grün vor jedem Push (siehe
CLAUDE.md). Die Dexie-Abhängigkeit ist eine bewusste Dependency-Änderung → das Lockfile-Diff
ist hier legitim und gehört in genau die Slice, die Dexie einführt.

## Out of Scope

- **Jegliches Backend, Accounts, Geräte-Sync, Sharing, Realtime, Push** (Epics B/2/3+4 der
  Wissensbasis) — bleiben spätere ROADMAP-Runden.
- **Anpassbare Kategorie-Reihenfolge, Ausblenden einzelner Kategorien, listen-spezifische
  Sortierung, Listen-Themes/Hintergründe** — spätere Slices von Epic 1a.
- **Produkt-Katalog, Kachel-Raster-Ansicht, Autocomplete, Freitext-Mengen-Parsing
  („2 kg Äpfel"), Item-Fotos, Icons** — das ist Epic 1b.
- **Open Food Facts als Datenquelle** (Taxonomie/Produktdaten, ODbL/CC-BY-SA-Lizenzfragen)
  — Datenaufgabe für Epic 1b, nicht hier.
- **`navigator.storage.persist()`** — im Research nicht mit iOS-Primärquelle belegt; separat
  prüfen, bevor es genutzt wird. Nicht Teil dieses PRD.
- **TinyBase/RxDB/Replicache** — Persistenz-Entscheidung ist zugunsten Dexie getroffen.
- **Undo, Mehrfachauswahl** über das „Zuletzt verwendet"-Verhalten hinaus.

## Further Notes

- **Reihenfolge der Slices:** Epic 0 (Repository + Dexie, ohne Migration) ist die
  Voraussetzung für Epic 1a und sollte zuerst geliefert werden. Innerhalb 1a ist eine
  sinnvolle Reihenfolge:
  (a) mehrere Listen anlegen/wechseln, (b) umbenennen/löschen inkl. Guard, (c) Kategorie-Feld
  + Gruppierung, (d) „Zuletzt verwendet". `/to-issues` schneidet diese als einzelne vertikale
  Slices (Eingabe → State → Persistenz → Anzeige), jede ≤ ~200 Zeilen Richtwert.
- **Dependency-Hinweis:** Das Einführen von Dexie ist eine bewusste Dependency-Änderung und
  fällt unter „Never-auto-merge" (CLAUDE.md) — der PR, der Dexie hinzufügt, braucht manuellen
  Review/Merge durch Vincent.
- **iOS-Kontext:** Die installierte Homescreen-PWA (steht seit MVP-Slice 5) ist faktisch von
  der Safari-7-Tage-Storage-Löschung ausgenommen — die Persistenz-Annahme dieses PRD hält für
  die Zielplattform. Im reinen Safari-Tab gilt die Ausnahme nicht (bekannte, akzeptierte
  Einschränkung).
- **Herkunft der Fakten:** Alle Feature- und Plattform-Aussagen stammen aus
  `research/bring-feature-analyse.md` (Epics 0 + 1a). Die dort mit **[B]** markierten
  Bring!-UX-Details (User-Flows aus App-Store-Reviews) sind sekundär belegt; sie prägen hier
  nur die UX-Anmutung, keine harte technische Zusage.
