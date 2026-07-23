# PRD — Design-Foundation: Visuelle Sprache & Smartphone-Ergonomie

> **Status:** Entwurf für die nächste Ausbaustufe (eigener Milestone, backendlos). Nachfolger
> von [`prd-epic-0-1a.md`](./prd-epic-0-1a.md) (SHIPPED). Diese Stufe ist ein **neues Epic**,
> das die Feature-Landkarte in [`research/bring-feature-analyse.md`](./research/bring-feature-analyse.md)
> nie benannt hat: eine reine **Design- & Ergonomie-Schicht**. Sie sitzt bewusst **vor
> Epic 1b** (Produkt-Katalog/Kacheln), weil 1b eine visuelle Sprache voraussetzt, die es
> heute nicht gibt.
>
> Design-Grundsatz-Entscheidungen sind in [`adr/0001-design-language.md`](./adr/0001-design-language.md)
> festgehalten. Nächster Schritt nach Freigabe: `/to-issues` schneidet die Slices.

## Problem Statement

Die App ist funktional vollständig (mehrere Listen, Kategorien, „Zuletzt verwendet"), aber
**praktisch ungestaltet**: ein blau-akzentuiertes Formular-und-Listen-Layout ohne
Design-System, ohne Dark Mode, mit nur vier CSS-Variablen. Für die **Zielplattform iPhone**
ist das Layout zudem **ergonomisch schlecht**:

- Die Eingabe für neue Artikel sitzt **oben**, außerhalb der Daumen-Reichweite.
- Der Kopfbereich **stapelt** Listen-`<select>`, „Umbenennen", „Löschen" und ein
  „Neue Liste"-Formular übereinander — eine Wand aus Bedienelementen über der eigentlichen
  Liste.
- Jede Artikelzeile trägt eine Checkbox **plus zwei Text-Buttons** („Bearbeiten",
  „Entfernen") — auf schmalen Displays wortlastig und gedrängt.

Kurz: Die App **funktioniert** wie eine App, **fühlt sich aber an wie ein Formular**. Sie soll
sich smartphone-tauglich und wertig anfühlen — an der beobachtbaren UX von Bring! orientiert —
ohne dabei ihren Funktionsumfang zu ändern.

## Solution

Eine in sich geschlossene **Design- & Ergonomie-Schicht** auf dem **bestehenden
Funktionsumfang**, rein lokal, ohne Backend, ohne neue Features:

1. **Design-Token-System.** Eine semantische Token-Ebene (CSS Custom Properties) für Farbe,
   Abstände, Radien und Typo-Skala, abgeleitet aus der Erd-Palette (siehe ADR 0001), inklusive
   **Light- und Dark-Mode** (automatisch via `prefers-color-scheme`).
2. **Reskin.** Alle bestehenden Komponenten werden gegen die Tokens neu gestaltet — kein
   CSS-Framework, keine Komponenten-Bibliothek.
3. **Icon-Sprache.** Ein kleines, handverlesenes **Inline-SVG-Set** für UI-Steuerelemente
   (Menü, Plus, Bearbeiten, Löschen, Zurück, Reaktivieren); Text-Buttons werden zu
   Icon-Buttons mit `aria-label`.
4. **Smartphone-Layout.** Die Artikel-Eingabe wandert in eine **unten verankerte Leiste**
   (Daumen-Reichweite). Die Listen-Verwaltung wird aus dem überladenen Kopf in eine
   **Top-Bar (aktiver Listenname) + ein Sheet/Drawer** verlagert (Wechseln/Anlegen/
   Umbenennen/Löschen — alles bereits vorhanden, nur umverortet).

**Ausdrücklich kein neues Verhalten:** Das Interaktionsmodell bleibt **unverändert** — die
sichtbaren Buttons (Checkbox archiviert, Bearbeiten, Entfernen, Reaktivieren, endgültig
Entfernen) behalten ihr heutiges Verhalten. Gesten, Ganzzeilen-Tap und das Umdenken des
Erledigt-Zustands sind **bewusst dem späteren Kachel-Epic (1b)** vorbehalten, wo sich das
Interaktionsmodell als Ganzes ändert.

## User Stories

**Visuelle Sprache & Dark Mode**

1. Als Nutzerin möchte ich, dass die App ein stimmiges, wertiges Farb- und Typo-Design hat,
   damit sie sich wie eine gepflegte App anfühlt statt wie ein Formular.
2. Als Nutzerin möchte ich, dass die App automatisch dem Hell-/Dunkel-Modus meines Systems
   folgt, damit sie sich abends und morgens angenehm liest.
3. Als Nutzerin möchte ich, dass Farben konsistent eine Bedeutung tragen (Aktion, Gefahr,
   Erledigt, gedämpft), damit ich Bedienelemente auf einen Blick einordne.

**Smartphone-Ergonomie**

4. Als iPhone-Nutzerin möchte ich neue Artikel über eine **unten verankerte Eingabeleiste**
   eintippen, damit ich sie einhändig mit dem Daumen erreiche.
5. Als Nutzerin möchte ich einen **aufgeräumten Kopfbereich** sehen, der nur den aktiven
   Listennamen zeigt, damit die eigentliche Liste im Fokus steht.
6. Als Nutzerin möchte ich Listen **über ein Sheet/Drawer** wechseln, anlegen, umbenennen und
   löschen, damit die Listen-Verwaltung nicht dauerhaft Platz über meiner Liste belegt.
7. Als Nutzerin möchte ich **größere Tap-Ziele** und mehr Luft zwischen den Zeilen, damit ich
   Artikel unterwegs zuverlässig treffe.

**Icon-Sprache**

8. Als Nutzerin möchte ich, dass häufige Aktionen als klare Icons erscheinen, damit die
   Zeilen nicht wortlastig sind und auf schmalen Displays Platz sparen.
9. Als Nutzerin mit Screenreader / ohne Touch möchte ich, dass jedes Icon-Steuerelement
   weiterhin eine beschriftete, per Tastatur und Maus bedienbare Schaltfläche ist, damit die
   App auch am PC und assistiv voll nutzbar bleibt.

## Implementation Decisions

**Design-Token-System (die eine neue Grundlage)**
- Eine **semantische Token-Ebene** als CSS Custom Properties: Farb-Tokens (`--surface`,
  `--surface-raised`, `--text`, `--text-muted`, `--accent`, `--danger`, `--success`,
  `--border` …), Abstands-Skala, Radius-Skala, Typo-Skala (Größen/Gewichte/Zeilenhöhen).
  Tokens sind die **einzige** Stelle, die Rohfarben kennt; Komponenten referenzieren nur
  semantische Tokens.
- **Palette** (siehe ADR 0001): Erd-Basis `#606c38` (Olive), `#283618` (Dunkelgrün),
  `#fefae0` (Creme), `#dda15e` (Sand), `#bc6c25` (Rost) + wenige **warm-harmonisierte
  Extras** für Semantik, die die Basis nicht abdeckt: **Danger ≈ Koralle** (Richtwert
  `#ff6f59`), **Success ≈ aufgehelltes Grün** aus dem Oliv-Ende. Exakte Werte werden beim
  Bau des Token-Blatts fixiert; das **Prinzip** — warm harmonisiert, kein Standard-Rot/Grün
  von der Stange — ist bindend.
- **Dark Mode: automatisch** via `prefers-color-scheme` (Light- und Dark-Token-Satz). **Kein
  manueller Umschalter** in dieser Runde (spätere kleine Slice im Sheet).

**Reskin (ohne Framework)**
- Bestehende Komponenten werden gegen die Tokens neu gestaltet. **Keine** Komponenten-
  Bibliothek, **kein** CSS-Framework — passend zur Tiny-PWA-Haltung.
- **Typografie: verfeinerter System-Font-Stack** (`system-ui`/`-apple-system` …) mit echter
  Typo-Skala. **Kein gebündelter Web-Font** in dieser Runde (offline-/Bundle-Kosten; ein
  selbst-gehosteter Display-Font nur für Titel bleibt eine mögliche spätere Slice).

**Icon-Sprache**
- **Kleines, inline eingebettetes SVG-Set** (~6–8 Glyphen), **keine Icon-Library-Dependency**;
  über `currentColor` theme-fähig, offline-sicher, von Natur aus tree-shaked.
- Text-Buttons werden zu **Icon-Buttons**, die **reale `<button>` mit `aria-label`** bleiben.
  Text wird **nur dort** behalten, wo ein Glyph mehrdeutig wäre (z.B. „Reaktivieren" /
  „Endgültig entfernen" in „Zuletzt verwendet").

**Smartphone-Layout**
- **Unten verankerte Add-Leiste:** Das Artikel-Eingabeformular wird eine sticky Bottom-Bar
  oberhalb der Safe-Area-Inset. Am PC ist es schlicht eine Fußleiste.
- **Top-Bar + Sheet/Drawer:** Der Kopf zeigt nur den **aktiven Listennamen**; ein Tap öffnet
  ein **Sheet/Drawer** mit Wechseln/Anlegen/Umbenennen/Löschen. **Dieselben Funktionen wie
  heute** (nichts Neues), nur umverortet. Der Lösch-Guard (letzte Liste bleibt) bleibt
  unverändert.

**Interaktionsmodell (unverändert)**
- Checkbox archiviert (→ „Zuletzt verwendet"), Bearbeiten, Entfernen, Reaktivieren, endgültig
  Entfernen behalten ihr **heutiges Verhalten**. Nur Optik/Verortung/Tap-Größe ändern sich.
- Gesten (Swipe/Long-Press), Ganzzeilen-Tap und der Wegfall der Checkbox sind **Out of Scope**
  → Kachel-Epic 1b.

**Komponenten-Struktur**
- `App.jsx` ist heute eine Einzelkomponente. Komponenten werden **nur dort extrahiert, wo eine
  Slice es für Lesbarkeit erzwingt** (v.a. Sheet/Drawer, Top-Bar, Add-Bar, Item-Zeile) — **kein
  spekulativer Umbau vorab**, analog zur Bauweise von Epic 0/1a.

**PC-Tauglichkeit (Nebenbedingung)**
- Smartphone ist die Design-Priorität, aber **jede** Aktion bleibt per **Maus und Tastatur**
  bedienbar (reale beschriftete Buttons, fokussierbar). Das Bottom-Layout und das Sheet
  funktionieren auch mit Zeiger.

## Slices (Schnittvorschlag für `/to-issues`)

In Abhängigkeitsreihenfolge, jede eine eigene ≤~200-Zeilen-Slice mit eigenem Issue:

1. **Design-Tokens + Reskin-Baseline** — semantische Token-Ebene (Light/Dark-Farbe, Abstände,
   Radien, Typo-Skala); bestehendes Layout gegen Tokens neu gestalten, **noch keine
   Layout-Änderung**. Liefert neue Palette + Dark Mode sofort. *(Gate für alles Weitere.)*
2. **Inline-SVG-Icon-Set + Icon-Buttons** — Text-Steuerelemente werden beschriftete
   Icon-Buttons.
3. **Unten verankerte Add-Leiste** — Artikel-Eingabe in sticky Bottom-Bar verlagern.
4. **Top-Bar + Listen-Sheet/Drawer** — Kopf zu Top-Bar (aktiver Name) + Sheet mit
   Wechseln/Anlegen/Umbenennen/Löschen. *(Größte Slice; extrahiert Komponenten.)*
5. **Listen-Körper-Politur** — Kategorie-Sektionen, „Zuletzt verwendet", Empty-State als
   finaler visueller Durchgang.

Reihenfolge-Begründung: Tokens müssen zuerst; Icons vor dem Drawer, damit der Drawer sie schon
nutzt; Add-Leiste und Drawer sind die beiden Shell-Umbauten; Politur zuletzt.

## Testing Decisions

- **Verhalten bleibt konstant → bestehende Tests bleiben der Maßstab.** Da sich kein Verhalten
  ändert, müssen die vorhandenen Testing-Library-Tests (`src/App.test.jsx`) und E2E-Smokes
  **grün bleiben**. Weil Icon-Buttons **reale `<button>` mit `aria-label`** bleiben, findet
  `getByLabelText('… entfernen')` sie weiterhin — die Suite wird durch den Reskin **nicht**
  entwertet.
- **Neue Tests nur, wo neues beobachtbares UI-Verhalten entsteht:** Sheet/Drawer öffnen &
  schließen, Fokus-Verhalten, Erreichbarkeit der umverorteten Listen-Aktionen per Label.
- **Visuelle Playwright-Baselines werden pro Slice neu erzeugt** — ein Redesign entwertet die
  Baselines per Definition. Neu-Generierung via `workflow_dispatch` (bestehendes Muster, siehe
  Git-Historie „visuelle Baselines aktualisiert").
- **Kein neuer Persistenz-/Repository-Test** — diese Schicht berührt Storage nicht.
- **A11y-Prüfpunkte je Slice:** fokussierbare Buttons, `aria-label` an Icon-Buttons,
  Kontrast der Token-Paare in Light **und** Dark, Tastatur-Bedienbarkeit von Sheet & Add-Bar.
- **Qualitäts-Gates:** `npm run lint`, `npm test`, `npm run build` grün vor jedem Push
  (CLAUDE.md).

## Out of Scope

- **Alle neuen Bring!-Features** (Produkt-Katalog, Kachel-Raster, Autocomplete, Mengen-Parsing,
  Produkt-/Food-Icons, Item-Fotos) → **Epic 1b**.
- **Gesten** (Swipe-to-Delete, Long-Press-Details), **Ganzzeilen-Tap**, Wegfall der Checkbox →
  Kachel-Epic 1b (dort ändert sich das Interaktionsmodell als Ganzes).
- **Manueller Dark-/Light-Umschalter** und jede Theme-Auswahl → spätere kleine Slice im Sheet.
- **Gebündelter Web-/Brand-Font** → mögliche spätere Slice (nur Titel, selbst-gehostet).
- **Listen-Themes/Hintergründe** (Bring!-Feature) → spätere Slice von Epic 1a/1b.
- **CSS-Framework / Komponenten-Bibliothek** — bewusst nicht.
- **Backend, Accounts, Sync, Sharing, Push** → Epics B/2/3+4.

## Further Notes

- **Vertikale-Slice-Regel bewusst gedehnt:** Diese Schicht ist ihrer Natur nach
  präsentationsseitig; mehrere Slices sind Anzeige-/Layout-Änderungen ohne
  State-/Persistenz-Anteil. Das ist für ein Design-Epic in Ordnung, solange jede Slice eine
  **beobachtbare End-to-End-Verbesserung** liefert und ≤~200 Zeilen bleibt.
- **Positionierung im Epic-Fahrplan:** Diese Design-Foundation sitzt **zwischen 1a (fertig) und
  1b**. Sie ist die visuelle Sprache, auf der 1b (Kacheln, Produkt-Icons, Autocomplete)
  aufsetzt.
- **Herkunft der UX-Anmutung:** Die Bring!-Orientierung (Bottom-Input, Listen-Menü oben,
  Icon-Sprache, Light/Dark) stammt aus `research/bring-feature-analyse.md`; die mit **[B]**
  markierten Bring!-Details sind sekundär belegt und prägen hier nur die **Anmutung**, keine
  harte technische Zusage.
