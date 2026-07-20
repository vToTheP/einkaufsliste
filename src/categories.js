// Lokales, deterministisches Mapping (Issue #45): Artikel → Kategorie. Keine
// externe Datenquelle. Reihenfolge der Schlüssel = Standard-Supermarkt-Sektionen
// und legt zugleich die feste Anzeige-Reihenfolge fest.
const CATEGORY_WORDS = {
  'Obst & Gemüse': [
    'apfel', 'äpfel', 'banane', 'bananen', 'tomate', 'tomaten', 'gurke',
    'gurken', 'kartoffel', 'kartoffeln', 'zwiebel', 'zwiebeln', 'karotte',
    'karotten', 'möhre', 'möhren', 'salat', 'paprika', 'zitrone', 'zitronen',
    'knoblauch', 'orange', 'orangen', 'birne', 'birnen',
  ],
  'Brot & Backwaren': ['brot', 'brote', 'brötchen', 'toast', 'baguette', 'croissant', 'croissants'],
  'Milchprodukte & Eier': ['milch', 'käse', 'joghurt', 'butter', 'quark', 'sahne', 'ei', 'eier'],
  'Fleisch & Fisch': [
    'fleisch', 'wurst', 'würstchen', 'hähnchen', 'huhn', 'rind', 'schwein',
    'lachs', 'fisch', 'speck', 'salami',
  ],
  Tiefkühl: ['pizza', 'eis', 'pommes'],
  'Vorräte & Konserven': ['reis', 'nudeln', 'pasta', 'mehl', 'zucker', 'salz', 'öl', 'essig', 'müsli'],
  Getränke: ['wasser', 'saft', 'bier', 'wein', 'cola', 'kaffee', 'tee', 'limonade'],
  'Süßes & Snacks': ['schokolade', 'chips', 'keks', 'kekse', 'bonbons', 'gummibärchen'],
  'Drogerie & Haushalt': [
    'seife', 'shampoo', 'zahnpasta', 'toilettenpapier', 'spülmittel',
    'waschmittel', 'küchenrolle', 'müllbeutel',
  ],
}

export const DEFAULT_CATEGORY = 'Sonstiges'

export const CATEGORY_ORDER = [...Object.keys(CATEGORY_WORDS), DEFAULT_CATEGORY]

const CATEGORY_BY_WORD = Object.fromEntries(
  Object.entries(CATEGORY_WORDS).flatMap(([category, words]) =>
    words.map((word) => [word, category]),
  ),
)

// Wort-genauer Treffer statt Substring-Suche: "Reis" enthält "eis" als
// Substring, darf aber nicht in Tiefkühl landen — nur ganze Wörter zählen.
export function categorize(name) {
  const words = name.toLowerCase().match(/[a-zäöüß]+/g) ?? []
  for (const word of words) {
    const category = CATEGORY_BY_WORD[word]
    if (category) return category
  }
  return DEFAULT_CATEGORY
}

// Gruppiert Items nach Kategorie in der festen Standard-Reihenfolge
// (`CATEGORY_ORDER`). Kategorien ohne Items werden nicht ausgegeben. Items
// ohne Kategorie (z.B. vor Issue #45 angelegt) landen in `DEFAULT_CATEGORY`,
// statt beim Rendern zu verschwinden.
export function groupByCategory(items) {
  const byCategory = new Map(CATEGORY_ORDER.map((category) => [category, []]))
  for (const item of items) {
    byCategory.get(item.category ?? DEFAULT_CATEGORY)?.push(item)
  }
  return [...byCategory].filter(([, groupItems]) => groupItems.length)
}
