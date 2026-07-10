import { db as defaultDb, openDb } from './database.js'

// Repository-Grenze: Die UI spricht ausschließlich mit diesem Modul, nie direkt
// mit Dexie/IndexedDB. Alle Methoden sind async und geben fachliche Objekte
// zurück (ohne internen `seq`-Schlüssel).

export const DEFAULT_LIST_ID = 'default'
export const DEFAULT_LIST_NAME = 'Einkaufsliste'
export const LEGACY_STORAGE_KEY = 'einkaufsliste:items'

function newId() {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : // eslint-disable-next-line sonarjs/pseudo-random -- reine Fallback-ID (kein Sicherheitskontext), nur wenn crypto.randomUUID fehlt
      String(Date.now()) + Math.random().toString(16).slice(2)
}

function now() {
  return Date.now()
}

// Nur gültige Item-Datensätze in die UI lassen (robust gegen beschädigte Records).
function isValidItem(record) {
  return (
    record &&
    typeof record.id === 'string' &&
    typeof record.name === 'string'
  )
}

function toItem(record) {
  return {
    id: record.id,
    listId: record.listId,
    name: record.name,
    done: record.done === true,
    category: record.category ?? null,
    updatedAt: record.updatedAt ?? null,
  }
}

export function createRepository(db = defaultDb) {
  // Einmalige Aufräum-Aktion: alter localStorage-Key wird NICHT übernommen,
  // sondern nur entfernt (kein Migrationspfad, siehe Issue #42).
  function cleanupLegacyStorage() {
    try {
      globalThis.localStorage?.removeItem(LEGACY_STORAGE_KEY)
    } catch {
      // localStorage nicht verfügbar / gesperrt — ignorieren.
    }
  }

  async function ensureDefaultList() {
    const existing = await db.lists.get(DEFAULT_LIST_ID)
    if (existing) return existing
    const list = {
      id: DEFAULT_LIST_ID,
      name: DEFAULT_LIST_NAME,
      createdAt: now(),
    }
    await db.lists.put(list)
    return list
  }

  // Bootstrap: robustes Öffnen, Standardliste sicherstellen, Legacy aufräumen.
  async function init() {
    cleanupLegacyStorage()
    await openDb(db)
    await ensureDefaultList()
    return DEFAULT_LIST_ID
  }

  async function loadItems(listId = DEFAULT_LIST_ID) {
    const records = await db.items.where('listId').equals(listId).toArray()
    return records
      .filter(isValidItem)
      .sort((a, b) => a.seq - b.seq)
      .map(toItem)
  }

  async function addItem(name, listId = DEFAULT_LIST_ID) {
    const item = {
      id: newId(),
      listId,
      name,
      done: false,
      category: null,
      updatedAt: now(),
    }
    await db.items.add(item)
    return toItem(item)
  }

  async function setDone(id, done) {
    await db.items
      .where('id')
      .equals(id)
      .modify({ done: done === true, updatedAt: now() })
  }

  async function renameItem(id, name) {
    await db.items
      .where('id')
      .equals(id)
      .modify({ name, updatedAt: now() })
  }

  async function removeItem(id) {
    await db.items.where('id').equals(id).delete()
  }

  return {
    init,
    loadItems,
    addItem,
    setDone,
    renameItem,
    removeItem,
  }
}

export const repository = createRepository()
