# Design-Sprache: Erd-Palette, semantische Tokens, Auto-Dark, System-Font, Inline-SVG-Icons

**Status:** accepted

Für die Design-Foundation-Stufe (siehe [`../prd-design-foundation.md`](../prd-design-foundation.md))
legen wir die visuelle Grundsprache der App fest, bevor darauf ein Reskin und später das
Kachel-Epic (1b) aufsetzen. Fünf Entscheidungen, die zusammen die Sprache bilden — bewusst hier
gebündelt, weil sie voneinander abhängen und gemeinsam schwer zu revidieren sind (sie strahlen
über die Token-Ebene in jede Komponente aus).

## Entscheidung

1. **Erd-Palette als Basis.** `#606c38` (Olive), `#283618` (Dunkelgrün), `#fefae0` (Creme),
   `#dda15e` (Sand), `#bc6c25` (Rost) — vom Nutzer vorgegeben (Coolors).
2. **Warm-harmonisierte semantische Extras statt Standard-Rot/Grün.** Die Basis deckt keine
   klare Gefahr-/Erledigt-Semantik ab. Danger wird eine **Koralle** (Richtwert `#ff6f59`),
   Success ein **aufgehelltes Grün** aus dem Oliv-Ende — beide bleiben in der warmen Familie
   der Palette, statt ein hartes `#e00`/Fremd-Grün zu importieren. Exakte Werte beim Token-Bau.
3. **Semantische Token-Ebene** als CSS Custom Properties (Farbe/Abstand/Radius/Typo). Rohfarben
   leben **nur** in den Tokens; Komponenten referenzieren ausschließlich semantische Namen.
   Kein CSS-Framework, keine Komponenten-Bibliothek.
4. **Dark Mode automatisch** via `prefers-color-scheme` (Light- und Dark-Token-Satz), **kein**
   manueller Umschalter in dieser Runde.
5. **Verfeinerter System-Font-Stack** mit echter Typo-Skala, **kein** gebündelter Web-Font.
6. **Inline-SVG-Icons** (kleines eigenes Set, `currentColor`), **keine** Icon-Library; jedes
   Icon-Steuerelement bleibt ein reales `<button>` mit `aria-label`.

## Betrachtete Alternativen (und warum verworfen)

- **Standard-Rot/Grün für Semantik** — verworfen: bricht die warme Palette; Koralle/Oliv fügt
  sich ein und bleibt als Signal lesbar.
- **Manueller Theme-Umschalter jetzt** — verschoben: zieht eine Settings-Fläche + Persistenz
  nach; `prefers-color-scheme` deckt den Normalfall kostenlos ab. Umschalter ist später im
  Sheet billig nachrüstbar.
- **Gebündelter Brand-Font** — verschoben: Bundle-/Offline-Kosten und FOUT/FOIT für eine App,
  die sofort und offline starten muss; Palette + Spacing + Icons + Hierarchie tragen die
  „deutlich bessere" Optik auch ohne Font-Download.
- **CSS-Framework / Komponenten-Bibliothek** — verworfen: widerspricht der Tiny-PWA-Haltung;
  eine Token-Ebene reicht.

## Konsequenzen

- Der Reskin und **jede** spätere Komponente hängen an dieser Token-Ebene — ein späterer
  Palettenwechsel ist zentral in den Tokens möglich, aber semantisch (Danger/Success) nur mit
  Bedacht, weil die warme Harmonie Teil der Entscheidung ist.
- Weil Icons reale beschriftete Buttons bleiben, überleben die bestehenden
  Testing-Library-Tests den Reskin (`getByLabelText`), und die App bleibt am PC und assistiv
  voll bedienbar.
- Kontrast muss für **beide** Token-Sätze (Light/Dark) geprüft werden — der cremefarbene
  Hintergrund und die warmen Akzente sind nicht automatisch WCAG-konform.
