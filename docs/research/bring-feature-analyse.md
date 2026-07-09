# Wissensbasis — Bring!-Feature-Analyse & PWA-Ausbau

> **Zweck:** Input für `/to-prd → /to-issues`, um die nächsten Ausbaustufen der
> Einkaufslisten-PWA entlang von 6 Epics zu planen. **Kein PRD, kein Scope-Commitment.**
> Diese Datei sammelt belegte Fakten und Optionsvergleiche; welche davon in einen
> Milestone gehen, entscheidet Vincent pro Runde (siehe [`../../ROADMAP.md`](../../ROADMAP.md)).
>
> **Methodik & Vertrauensgrad:** Erstellt via `deep-research`-Harness (5 Such-Winkel,
> 23 Quellen, 109 extrahierte Claims). Die **adversariale Kreuz-Verifikation der Claims
> konnte nicht durchlaufen** (Session-Token-Limit in zwei Anläufen, 2026-07-07). Die
> Fakten sind also **quellenbelegt, aber nicht maschinell gegengeprüft**. Gegenmaßnahme:
> Jede Kernaussage ist mit Quelle und Quellenqualität markiert — **[P]** = Primärquelle
> (Hersteller-/Standard-Doku), **[B]** = Blog/Sekundär, **[nicht belegbar]** = Frage
> offen. Vor einer teuren Umsetzungsentscheidung die mit [B] markierten Aussagen kurz
> selbst gegenprüfen.
>
> **Ausgangslage (Ist-Stand):** React 18 + Vite 6, `vite-plugin-pwa`, statisches Hosting
> auf GitHub Pages, Persistenz = `localStorage` (ein Key, flaches Array `{id,name,done}`),
> Single-Komponente `src/App.jsx`, kein Backend. PWA-Hülle (Service Worker, Manifest,
> iPhone-Installation, Offline-Laden) steht bereits (MVP-Slice 5).

---

## Epic-Landkarte & Abhängigkeiten

Die 4 Epics aus dem ursprünglichen Research-Brief wurden auf **6 Epics** umgeschnitten,
weil zwei Vorstufen fehlten und ein Epic bereits halb geliefert ist:

| Epic | Titel | Backend nötig? | Hängt ab von |
|------|-------|:---:|---|
| **0** | Datenmodell & Persistenz-Fundament | nein | — |
| **1a** | Mehrere Listen & Kategorien (lokal) | nein | 0 |
| **1b** | Produkt-Katalog, Kacheln, Autocomplete | nein | 0, 1a |
| **B** | Backend & Identity | — (ist das Backend) | 0 |
| **2** | Sync (erst Single-User/Multi-Device) | ja | B |
| **3+4** | Sharing, Realtime & Push | ja | B, 2 |

Kritischer Pfad: **0 → 1a** ist der nächste sinnvolle Milestone (rein lokal, kein Backend,
deckt sich mit ROADMAP-Punkt 1). Alles ab Epic 2 setzt die Backend-Grundsatzentscheidung
(Epic B) voraus und ist damit bewusst später.

---

## EPIC 0 — Datenmodell & Persistenz-Fundament

### (1) Belegte Fakten

**Lokale Persistenz-Bibliotheken:**
- **Dexie** ist ein framework-agnostischer IndexedDB-Wrapper (React/Vue/Angular/Svelte),
  bietet reaktive Abfragen via `liveQuery` und Schema-Deklaration mit Tabellen/IDs/Indizes
  als Kern-API. Wird in Produktion u.a. von WhatsApp Web, Microsoft To Do, GitHub Desktop
  genutzt; unterstützt aber keine komplexen (MongoDB-artigen) Queries. Spätere Sync-Option
  über kommerzielles Add-on **Dexie Cloud** (Realtime-Multi-Device, „conflict-free"). [P] (dexie.org) [B] (rxdb.info)
- **RxDB** bietet die breiteste spätere Sync-Fähigkeit (>15 Adapter: CouchDB, Supabase,
  Firestore, GraphQL, REST), aber viele Premium-Plugins liegen hinter einer Bezahlschranke
  (~200 USD/Monat) — Kostenrisiko für Hobby-Projekte. [B] (rxdb.info, pkgpulse)
- **TinyBase** hat einen sehr kleinen Footprint, 100 % Testabdeckung, lange aktive
  Historie und legt sich nicht auf ein Sync-System fest (Yjs oder PowerSync anbindbar);
  eigene API (`setRow`/`setTable`) statt SQL. [B] (pkgpulse, tolin.ski)
- **Replicache** ist rein clientseitig, puffert Offline-Writes in einer Queue, **erfordert
  aber zwingend ein eigenes Backend mit Push/Pull-Endpoints** — für die backendlose Phase
  (Epic 0/1) nicht ohne Server nutzbar. Zudem **seit 2025/2026 im Wartungsmodus**; der
  Hersteller empfiehlt Migration zum Nachfolger **Zero**. Für neue Projekte nicht mehr
  zukunftssicher. [P] (replicache.dev)

**Safari/iOS-Persistenz-Spezifika (Zielplattform Nr. 1):**
- **7-Tage-Regel (ITP):** Safari/WebKit löscht **sämtlichen** script-schreibbaren Storage
  einer Website — IndexedDB, localStorage, SessionStorage, Service-Worker-Registrierungen,
  Cache API — nach **7 Tagen Safari-Nutzung ohne Nutzer-Interaktion** mit der Site.
  (Gilt ab Safari 13.1 / iOS 13.4.) [P] (webkit.org/blog/10218)
- **Ausnahme für installierte PWAs:** Zum Homescreen hinzugefügte Web-Apps sind faktisch
  **von der 7-Tage-Löschung ausgenommen** — eigener Nutzungstage-Zähler, und WebKit
  erwartet nicht, dass deren First-Party-Daten gelöscht werden. **Direkt relevant, da die
  iPhone-Homescreen-PWA die Zielplattform ist.** [P] (webkit.org/blog/10218)

### (2) Optionsvergleich (Trade-offs)

| Kandidat | Bundle/Footprint | Spätere Sync-Fähigkeit | Backend nötig? | Reife 2026 | Für kleine React-App |
|---|---|---|---|---|---|
| IndexedDB direkt | 0 (nativ) | selbst bauen | nein | — | roh, viel Boilerplate |
| **Dexie** | klein | Dexie Cloud (kommerziell) | nein | ausgereift | **gut** (liveQuery) |
| RxDB | groß | sehr breit (>15 Adapter) | optional | ausgereift | mächtig, evtl. Overkill |
| TinyBase | sehr klein | flexibel (Yjs/PowerSync) | nein | ausgereift | gut, eigene API |
| Replicache | mittel | server-autoritativ | **ja** | **Wartungsmodus** | nein (Backend-Zwang) |

### (3) Offene Entscheidungen (Mensch)
- **Bleiben bei `localStorage` oder Wechsel auf IndexedDB?** Multi-Listen + Katalog + später
  Sync sprechen für IndexedDB; die 7-Tage-Ausnahme für installierte PWAs entschärft das
  Eviction-Risiko, aber nur für Homescreen-Nutzung (nicht im Safari-Tab).
- **Welche Bibliothek** (falls Wechsel): Dexie (pragmatisch, React-freundlich) vs. TinyBase
  (kleinster Footprint, Sync-offen) vs. RxDB (mächtig, teuer bei Premium-Sync). **Kein Urteil hier.**
- **`navigator.storage.persist()` anfordern?** Wurde im Research nicht mit einer Primärquelle
  zu iOS-Verhalten belegt → vor Nutzung separat prüfen.

### (4) Bausteine für den Issue-Schnitt
- Schema-/Repository-Layer einziehen (State raus aus `App.jsx`), Datenmodell `{listId, items[]}`.
- Einmalige Migration `localStorage:einkaufsliste:items` → neuer Store, mit Schema-Versionsfeld.
- Migrations-Test (Bestandsdaten alt → neu, idempotent, Fallback bei korruptem JSON — Muster
  ist im aktuellen `loadItems()` schon angelegt).

---

## EPIC 1a — Mehrere Listen & Kategorien (beobachtbare Bring!-UX)

### (1) Belegte Fakten (Bring!, beobachtbar)
- **Mehrere Listen** werden unterstützt (z.B. eine pro Geschäft), mit wählbaren
  **Listen-Themes/Hintergründen**. [P] (getbring.com/features/personalized)
- **User Flows** (aus App-Store-Review-Quelle, [B]): Liste erstellen über Listen-Menü oben
  links (Name + Hintergrund wählen); **Umbenennen** über Drei-Punkte-Menü → Settings →
  Stift-Icon; **Löschen** setzt mindestens zwei existierende Listen voraus; **Teilen** wird
  direkt beim Erstellen angeboten bzw. per Long-Press auf die Liste („Invite Friends"). [B] (tapsmart)
- **Kategorie-Gruppierung:** Artikel werden **automatisch nach Kategorien (Supermarkt-
  Sektionen) gruppiert**; die **Reihenfolge der Kategorien ist pro Liste anpassbar**
  (Profile → Settings → List settings), einzelne Kategorien per Augen-Symbol ausblendbar. [P] (getbring.com Help Center)
- **„Zuletzt verwendet":** Erledigte/entfernte Artikel werden **nicht gelöscht**, sondern
  wandern in einen **„Recently Used"-Bereich**, aus dem sie per Tap wieder auf die Liste
  gesetzt oder per Mehrfachauswahl endgültig entfernt werden. **Ein Tap** löst das
  Verschieben von der Liste in „Recently Used" aus. [P] (getbring.com Help Center)

### (2) Optionsvergleich / Designfragen
- **Kategorie-Sortierung fix vs. anpassbar:** Bring! erlaubt Anpassung pro Liste — für einen
  MVP dieser Stufe reicht evtl. eine feste Standard-Sortierung; anpassbare Reihenfolge als
  eigene spätere Slice.

### (3) Offene Entscheidungen (Mensch)
- Umfang „mehrere Listen": nur mehrere lokale Listen + Umschalten? Oder direkt mit Themes,
  Umbenennen, Löschen-Guard (min. 1 Liste bleibt)?
- Kategorien: eigene minimale Taxonomie vs. Übernahme aus Open Food Facts (siehe Epic 1b).

### (4) Bausteine für den Issue-Schnitt
- Datenmodell: `Liste { id, name, theme?, items[] }`, aktive Liste im State/URL.
- Slices: (a) Mehrere Listen anlegen/wechseln, (b) Umbenennen/Löschen, (c) Kategorie-Feld
  pro Item + Gruppierung in der Anzeige, (d) „Zuletzt verwendet"-Bereich (erledigte Items
  behalten statt löschen — **Verhaltensänderung ggü. aktuellem `deleteItem`**).

---

## EPIC 1b — Produkt-Katalog, Kacheln, Autocomplete

### (1) Belegte Fakten
**Bring!-Kachel-/Eingabe-UX (beobachtbar):**
- **Drei Wege, Artikel hinzuzufügen:** (a) freie Texteingabe in Eingabeleiste am unteren
  Rand mit Vorschlags-Auswahl per Tap, (b) Durchblättern des Kategorie-Katalogs, (c) Tap
  auf eine Katalog-Kachel. [P] (getbring.com Help Center)
- **Zwei Darstellungsmodi:** klassisches **Kachel-Raster** (square tiles) und **Listenansicht**
  (macht Mengen/Spezifikationen besser zugänglich); plus verschiedene Designs inkl. Light/Dark Mode. [P] (getbring.com/features/personalized, blog)
- **Mengen & Notizen:** direkt als kombinierter Freitext ins Suchfeld (z.B. „2 kg apples"),
  **oder** unter dem Artikelnamen als Menge/Beschreibung/eigenes Foto. Long-Press auf eine
  Kachel öffnet die Item-Details. [P] (getbring.com Help Center)
- **Auto-Zuordnung:** Bei freier Texteingabe eines nicht im Katalog vorhandenen Artikels
  weist Bring! **automatisch ein passendes Icon und eine Kategorie zu**. [P] (getbring.com Help Center)

**Wichtigste Frage — freie Datenquellen für Katalog/Icons/Kategorien:**
- **Open Food Facts (OFF)** — Produktdaten: >1,7 Mio. Produkte aus 150 Ländern.
  **Lizenzen:** Datenbank **ODbL 1.0**, Inhalte **DbCL**, Produktbilder **CC BY-SA 3.0**
  (Attribution + Share-Alike; es sind **Fotos, keine Icons im Bring!-Stil**). JSON-Read-API
  pro Produkt + SDKs (u.a. JavaScript/React Native). [P] (world.openfoodfacts.org/data, github openfoodfacts-server)
- **OFF Kategorien-Taxonomie** — hierarchisch, mit Stopwords und Synonymen fürs Matching;
  als Klartext **`taxonomies/food/categories.txt`** (~3,6 MB) im Repo
  `openfoodfacts/openfoodfacts-server` frei beziehbar. **Mehrsprachig, inkl. Deutsch**
  (Crowdin-Übersetzung); deutscher Abdeckungsgrad muss separat geprüft werden. Produktiv
  seit Nov 2016. **Sehr gut geeignet als Basis für Supermarkt-Kategorien + Autocomplete-Matching.** [P]
- **Größen-Caveat:** Voll-CSV-Export ~9 GB unkomprimiert → **kein Client-seitiges
  Vollbündeln** in der PWA möglich; es braucht einen **kuratierten Extrakt**. Delta-Dumps
  (letzte 14 Tage), JSONL, Parquet (Hugging Face) verfügbar. [P]
- **KitchenOwl** (Open-Source-Referenz-App, AGPL-3.0): bietet **keinen** wiederverwendbaren
  deutschen Produktkatalog / kein Lebensmittel-Icon-Set (nur App-Icons). Als Asset-Quelle
  ungeeignet; AGPL-Copyleft würde bei Übernahme greifen. [P] (github tombursch/kitchenowl)

### (2) Optionsvergleich (Katalog-Strategie)
| Ansatz | Aufwand | Lizenz-Last | Deutsch | Icons |
|---|---|---|---|---|
| Kein Katalog (nur Freitext, wie heute) | 0 | keine | ja | keine |
| Eigene kleine kuratierte Liste (~200 Items) | mittel | keine | ja | eigene/Emoji |
| OFF-Kategorien-Taxonomie + eigene Item-Liste | mittel | ODbL (Daten) | ja (prüfen) | separat |
| OFF-Voll-Extrakt | hoch | ODbL + CC BY-SA | ja | Fotos, keine Icons |

### (3) Offene Entscheidungen (Mensch)
- **Icons sind das ungelöste Problem:** OFF liefert Fotos, keine Bring!-artigen Icons.
  Optionen (nicht recherchiert, als Folgefrage): Emoji-Mapping, freies Icon-Set (Lizenz
  prüfen), oder ganz ohne Icons starten.
- Katalog-Umfang: klein & kuratiert (schnell, wartbar) vs. datengetrieben aus OFF (groß,
  Lizenz/Update-Pflege).
- **ODbL Share-Alike** akzeptabel? Berührt spätere Weitergabe des abgeleiteten Katalogs.

### (4) Bausteine für den Issue-Schnitt
- Autocomplete-Komponente über lokalem Katalog-Array.
- Kachel-Raster-Ansicht als alternative Darstellung zur aktuellen Listen-Ansicht.
- Freitext-Parsing „2kg Mehl" → Menge + Name (eigene kleine Slice).
- **Separates Vorab-Issue:** „Kuratierten Startkatalog + Kategorien-Taxonomie beschaffen"
  (Daten-/Lizenz-Aufgabe, kein reiner Code) — blockt die Katalog-Slices.

---

## EPIC B — Backend & Identity (Vorstufe für Sync/Sharing/Push)

### (1) Belegte Fakten (Backend-Kandidaten)
- **Supabase:** Free Tier 500 MB DB + 1 GB Storage, Pro 25 USD/Monat. Postgres + eingebaute
  Realtime-Engine (WebSockets). Self-Hosting möglich (Docker/Coolify) → weniger Lock-in.
  **Nicht offline-first** (keine Client-Storage/Replikation) → Offline-Schicht (IndexedDB +
  Outbox) selbst bauen. Kosten steigen mit DB-Größe/API-Calls; Auth/Client-Libs erzeugen
  Kopplung. [B] (supadex, encore.dev) / [B] (rxdb.info)
- **PocketBase:** einzelnes Go-Binary + SQLite, eingebaute Auth/Storage/**Realtime via
  Server-Sent Events**. Minimaler Betriebsaufwand, aber **kein horizontales Skalieren, keine
  Managed Cloud → Self-Hosting zwingend** (beantwortet „wo hosten?": eigener VPS). Für
  Side-Projects/Indie empfohlen. [B] (supadex, encore.dev)
- **Firebase:** großzügiger Free Tier (Spark), 10+ Auth-Provider, Firestore (NoSQL).
  **Kein Self-Hosting → hoher Vendor-Lock-in**; Kosten wachsen mit Reads/Writes; komplexe
  Queries schwierig; **Firestore-Konfliktlösung ist immer Last-Write-Wins**. [B] (supadex)
- **Convex** (nicht im Brief, aufgetaucht): automatische Realtime-Subscriptions, 2024
  open-source, seit Anfang 2025 self-hostbar; eigenes Dokumentenmodell ohne SQL. [B] (encore.dev)
- **Cloudflare Workers + D1/Durable Objects** und **Fly.io**: **[nicht belegbar]** — von den
  gefundenen Quellen **nicht behandelt**. Separat recherchieren, bevor sie in die Abwägung
  einfließen.

**Referenz-Datenpunkt:** KitchenOwl (Flask/Python-Backend + SQLite) belegt, dass ein
**einfaches, server-autoritatives Eigenbau-Backend für Listen-Sync ausreicht** — ohne CRDT. [P]

### (2) Optionsvergleich (Trade-offs)
| Kandidat | Free-Tier / Kosten | Realtime | Self-Host / Lock-in | Betriebsaufwand |
|---|---|---|---|---|
| Supabase | 500 MB, dann 25 $/mo | WebSockets (eingebaut) | ja / mittel | gering (managed) |
| PocketBase | nur VPS-Kosten | SSE (eingebaut) | zwingend / niedrig | gering (1 Binary) |
| Firebase | großzügig, dann call-basiert | Firestore-Listener | nein / hoch | sehr gering |
| Cloudflare/Fly | **nicht belegt** | — | — | — |

### (3) Offene Entscheidungen (Mensch — laut ROADMAP bewusst beim Menschen)
- **Managed (Supabase/Firebase) vs. Self-Host (PocketBase) vs. Eigenbau (Node/Java).**
  Trade-off: Betriebsaufwand vs. Kontrolle/Lock-in.
- **Identitäts-Modell** — hier ist die Quellenlage **dünn** [nicht ausreichend belegbar]:
  Der Research fand nur, dass **Bring! einen Account erzwingt** und Sharing per **E-Mail-
  Einladung** läuft [B]. Zu anonymen Geräte-IDs + Capability-URLs vs. Magic Links vs.
  klassischen Accounts (mit DSGVO-Trade-offs) liefert der Lauf **keine belastbaren
  Vergleichsdaten** → **separater Research-/Entscheidungs-Schritt nötig.**

### (4) Bausteine für den Issue-Schnitt
- **Grundsatz-Issue / ADR:** „Backend-Stack + Auth-Modell festlegen" — blockt alle Epic-2/3-Slices.
- **Grundsatz-Issue:** „Zweiter Deploy-Pfad neben GitHub Pages" (statische PWA + Backend-Dienst).

---

## EPIC 2 — Sync (zunächst Single-User / Multi-Device)

### (1) Belegte Fakten (Sync-Strategien)
- **Last-Write-Wins (LWW):** einfach zu implementieren, führt aber **systematisch zu
  Datenverlust** (spätere Änderung überschreibt frühere konkurrierende). Laut einer Quelle
  „nur für Hobby-Projekte akzeptabel". **Firestore nutzt immer LWW** — Beleg, dass reale
  Listen-Backends mit LWW arbeiten. [B] (medium/engin.bolat)
- **CRDTs** (Yjs/Automerge): Konfliktfreiheit per kommutativer Operationen + Append-Only-Log,
  Reihenfolge mathematisch irrelevant, alle Replikate konvergieren. **Yjs** ist die
  flexibelste, aber aufwändigste Option (höchste Lernkurve) und **keine vollwertige DB**
  (Indexierung/Queries/Persistenz selbst lösen). [B] (medium, tolin.ski)
- **Server-autoritatives Operations-Log:** z.B. **Replicache** („server reconciliation" aus
  Multiplayer-Games, kein CRDT). **KitchenOwl** zeigt real, dass Listen-Apps **ohne
  CRDT-Komplexität** mit server-autoritativem Sync + nur partiellem Offline auskommen. [P]

- **Re-Sync ohne Background Sync API:** **Background Sync API, Periodic Background Sync und
  Background Fetch werden auf iOS/Safari NICHT unterstützt** — bestätigt. Re-Sync muss über
  App-Lifecycle-Events laufen (nicht über Browser-Background-APIs). [B] (magicbell) — deckt
  sich mit fehlender WebKit-Unterstützung.

### (2) Optionsvergleich (angemessene Komplexität für Einkaufsliste)
| Strategie | Komplexität | Datenverlust-Risiko | Beispiel real | Für Einkaufsliste |
|---|---|---|---|---|
| **LWW pro Item** | niedrig | ja, bei echten Race-Conditions | Firestore | oft **ausreichend** (grobkörnige Items) |
| Server-Op-Log | mittel | gering | Replicache, KitchenOwl | solide Mittelklasse |
| CRDT (Yjs) | hoch | keine | kollaborative Editoren | **wahrscheinlich Overkill** |

Einordnung: Für Einkaufslisten-Semantik (add/remove/done-toggle auf grobkörnigen Items) ist
LWW **pro Feld/Item** meist angemessen — die teure CRDT-Maschinerie zahlt sich v.a. bei
Zeichen-genauer Kollaboration aus. **Entscheidung liegt beim Menschen.**

### (3) Offene Entscheidungen (Mensch)
- LWW pro Item vs. Op-Log — abhängig davon, wie oft echte gleichzeitige Offline-Edits am
  selben Item realistisch sind (bei Haushalt: selten).
- Re-Sync-Trigger-Set: `visibilitychange` + `online`-Event + App-Start.

### (4) Bausteine für den Issue-Schnitt
- **Outbox-Queue in IndexedDB** (pending Ops), Retry bei Reconnect.
- Sync-Trigger an Lifecycle-Events statt Background Sync.
- Pro-Item-Zeitstempel/Version für LWW-Auflösung.

---

## EPIC 3+4 — Sharing, Realtime & Push

### (1) Belegte Fakten
**Bring!-Sharing (beobachtbar):**
- Sharing ist offizielles Kern-Feature (Haushalt: Familie/Partner/Mitbewohner). **Einladung
  per E-Mail-Adresse; Account ist zwingend erforderlich**; beide Nutzer können Items
  hinzufügen/abhaken. [B] (App-Store-Review-Quelle)
- **Push-Ereignisse (beobachtbar):** Benachrichtigung, **wenn jemand die geteilte Liste
  ändert** und **wenn jemand einkaufen geht**. [P] (getbring.com/blog)
- **[nicht belegbar]:** Der **exakte Einladungs-Mechanismus** (Link vs. QR-Code), eine
  Teilnehmer-Obergrenze und der Realtime-Mechanismus/Latenz werden von den offiziellen
  Seiten **nicht** spezifiziert. Nicht raten. [P-Negativbefund]

**Realtime-Übertragung:**
- Supabase: WebSockets (eingebaut). PocketBase: **Server-Sent Events**. Firebase:
  Firestore-Listener. [B]

**Web Push auf iOS (Zielplattform — alle mit Version + Quelle):**
- **Web Push wurde mit iOS/iPadOS 16.4 eingeführt** und gilt **ausschließlich für zum
  Homescreen hinzugefügte Web-Apps** (installierte PWAs), **nicht** für Safari-Tabs.
  [P] (webkit.org/blog/13878)
- Basiert auf **W3C-Standards Push API, Notifications API, Service Workers** — identisch zu
  Safari 16.1 (macOS). **Standard-VAPID-Backend funktioniert unverändert für iOS.** [P]
- **Keine Apple-Developer-Program-Mitgliedschaft nötig**; serverseitig nur Traffic zu
  `*.push.apple.com` erlauben. [P]
- **Permission-Prompt erfordert User-Gesture** (z.B. Tap auf Subscribe-Button); kein
  automatischer Prompt beim Seitenaufruf. [P]
- **Declarative Web Push ab iOS/iPadOS 18.4** (+ macOS 15.5 Beta): benötigt **keinen
  installierten Service Worker** — `window.pushManager` wird ohne SW exponiert, Notification
  wird sofort angezeigt; SW kann Inhalt nur optional nachbearbeiten. Apples Begründung:
  weniger Komplexität + weniger Batterie/CPU als klassisches SW-Push. [P] (webkit.org/blog/16535, /16574)
- **Badging API** (Zahl auf dem Homescreen-Icon) funktioniert **auf iOS ab 16.4** für
  installierte PWAs — bereits **bevor** eine Notification-Berechtigung erteilt wurde;
  `setAppBadge`/`clearAppBadge`. Declarative Push kann das Badge per `app_badge`-Feld
  aktualisieren. [P] (webkit.org/blog/13878)

### (2) Optionsvergleich
| Realtime-Weg | Reconnect/Batterie mobil | Backend |
|---|---|---|
| WebSockets | dauerhafte Verbindung, mehr Akku | Supabase, eigen |
| Server-Sent Events | leichter, unidirektional | PocketBase |
| Managed Listener | abstrahiert | Firebase |

**Push-Weg:** klassisches Web Push (SW + VAPID, funktioniert ab iOS 16.4) vs. Declarative
Web Push (ab iOS 18.4, kein SW nötig, aber neuere iOS-Basis erforderlich). Trade-off:
Reichweite (16.4) vs. Einfachheit/Akku (18.4).

**Konfliktlösung bei konkurrierenden Edits — konkrete Regel-Vorschläge (Einkaufslisten-Semantik):**
- **add vs. add** (gleicher Artikel): idempotent zusammenführen (ein Item, Mengen ggf. addieren).
- **done-toggle:** LWW pro Item mit Zeitstempel — der letzte Toggle gewinnt (unkritisch,
  da leicht manuell korrigierbar).
- **delete vs. edit/add:** „add/undelete gewinnt" (Tombstone, aber Re-Add hebt Löschung auf)
  — verhindert, dass ein versehentliches Löschen einen gerade hinzugefügten Artikel schluckt.
  *(Vorschlag aus der Analyse, nicht extern belegt — im Design bestätigen.)*

### (3) Offene Entscheidungen (Mensch)
- Realtime-Transport folgt aus Epic-B-Backendwahl (WebSockets vs. SSE).
- Push: minimale iOS-Version (16.4 klassisch vs. 18.4 declarative).
- Einladungs-Mechanismus (E-Mail wie Bring! vs. Capability-Link/QR) — hängt an Identity (Epic B).

### (4) Bausteine für den Issue-Schnitt
- Web-Push-Subscription-Flow mit User-Gesture-Button; VAPID-Keys im Backend.
- Push-Trigger serverseitig bei Listenänderung (Ereignistyp „geändert" / „einkaufen").
- Optional: Badging bei ungesehenen Änderungen (ab iOS 16.4).
- **Voraussetzung:** installierte Homescreen-PWA (steht bereits) — ohne Installation kein iOS-Push.

---

## Quellen (nach Qualität)

**Primär [P]:** webkit.org/blog/10218, /13878, /16535, /16574 · getbring.com (Help Center,
features/personalized, features/collaborative, blog) · dexie.org · replicache.dev ·
world.openfoodfacts.org/data · github.com/openfoodfacts/openfoodfacts-server ·
github.com/tombursch/kitchenowl · apps.apple.com (Bring!-Listing)

**Sekundär/Blog [B]:** rxdb.info/alternatives · tolin.ski/local-first-options ·
pkgpulse.com (tinybase-vs-watermelondb-vs-rxdb) · docs.bswen.com (indexeddb-libraries) ·
supadex.app (supabase-vs-firebase-vs-pocketbase) · encore.dev (supabase-alternatives) ·
medium/@engin.bolat (CRDTs) · magicbell.com (pwa-ios-limitations) · tapsmart.com (Bring!-Review)

**Nicht/negativ belegt:** Cloudflare Workers/D1/Durable Objects & Fly.io (keine Quelle) ·
Bring! exakter Einladungs-Mechanismus & Realtime-Interna (closed-source, offiziell nicht dokumentiert) ·
Identitäts-Modell-Vergleich (dünne Datenlage) · deutscher Abdeckungsgrad OFF-Produktdaten (separat prüfen).

> **Nächster Schritt (Vorschlag):** `/to-prd` **nur für Epic 0 + 1a** ansetzen (nächster
> Milestone, backendlos). Epics B/2/3+4 bleiben in dieser Wissensbasis als Vorbereitung für
> spätere ROADMAP-Runden liegen. Die drei „nicht belegten" Punkte oben sind Kandidaten für
> einen kurzen Folge-Research, **bevor** Epic B geplant wird.
