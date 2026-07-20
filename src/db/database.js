import Dexie from 'dexie'

// Persistenz-Fundament (Issue #42) + Mehrere Listen (Issue #43): IndexedDB via Dexie.
// Datenmodell:
//   Liste { id, name, createdAt }
//   Item  { id, listId, name, done, category, updatedAt }
//   Meta  { key, value } — u.a. die ID der aktiven Liste (`activeListId`).

export const DB_NAME = 'einkaufsliste'

// Interner Primärschlüssel `seq` (auto-increment) bewahrt die Einfüge-Reihenfolge
// zuverlässig über Reloads hinweg. `id` bleibt der fachliche (UUID-)Schlüssel und
// ist als eindeutiger Index für Lookups deklariert.
export function createDb(name = DB_NAME) {
  const db = new Dexie(name)
  db.version(1).stores({
    lists: 'id',
    items: '++seq, &id, listId',
  })
  // v2: `meta` speichert die ID der aktiven Liste, damit sie einen Reload übersteht.
  db.version(2).stores({
    lists: 'id',
    items: '++seq, &id, listId',
    meta: 'key',
  })
  return db
}

// Öffnet die DB robust: Schlägt das Öffnen fehl (z.B. beschädigter Store oder
// inkompatibles Schema aus einer früheren Version), wird der Store einmalig
// verworfen und frisch geöffnet — die App startet dann mit leerer Standardliste
// statt zu crashen.
export async function openDb(db) {
  try {
    await db.open()
  } catch {
    await db.delete()
    await db.open()
  }
  return db
}

export const db = createDb()
