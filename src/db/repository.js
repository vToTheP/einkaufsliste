import { db as defaultDb, openDb } from './database.js'

// Repository-Grenze: Die UI spricht ausschließlich mit diesem Modul, nie direkt
// mit Dexie/IndexedDB. Alle Methoden sind async und geben fachliche Objekte
// zurück (ohne internen `seq`-Schlüssel).

export const DEFAULT_LIST_ID = 'default'
export const DEFAULT_LIST_NAME = 'Einkaufsliste'
export const LEGACY_STORAGE_KEY = 'einkaufsliste:items'
const ACTIVE_LIST_META_KEY = 'activeListId'

function newId() {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : // eslint-disable-next-line sonarjs/pseudo-random -- reine Fallback-ID (kein Sicherheitskontext), nur wenn crypto.randomUUID fehlt
      String(Date.now()) + Math.random().toString(16).slice(2)
}

// Monoton steigend statt reines Date.now(): Listen haben (anders als Items via
// `seq`) keinen Auto-Increment-Schlüssel, der die Einfüge-Reihenfolge bewahrt.
// `createdAt` übernimmt diese Rolle mit als Sortierschlüssel — zwei Aufrufe
// innerhalb derselben Millisekunde dürfen daher nie denselben Wert liefern.
let lastTimestamp = 0
function now() {
  const current = Date.now()
  lastTimestamp = current > lastTimestamp ? current : lastTimestamp + 1
  return lastTimestamp
}

// Nur gültige Item-/Listen-Datensätze in die UI lassen (robust gegen
// beschädigte Records) — beide brauchen mindestens eine `id` und einen `name`.
function hasIdAndName(record) {
  return (
    record &&
    typeof record.id === 'string' &&
    typeof record.name === 'string'
  )
}

function byCreatedAt(a, b) {
  return a.createdAt - b.createdAt
}

function toList(record) {
  return {
    id: record.id,
    name: record.name,
    createdAt: record.createdAt ?? null,
  }
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

  async function getActiveListId() {
    const record = await db.meta.get(ACTIVE_LIST_META_KEY)
    return record?.value ?? null
  }

  async function setActiveListId(id) {
    await db.meta.put({ key: ACTIVE_LIST_META_KEY, value: id })
  }

  // Bootstrap: existiert keine Liste, wird eine leere Standardliste angelegt und
  // aktiviert. Sonst bleibt die zuletzt aktive Liste aktiv (Reload). Gibt die
  // ID der aktiven Liste zurück.
  //
  // Läuft als eine atomare Dexie-Transaktion: Lesen ("gibt es schon eine aktive
  // Liste?") und bedingtes Schreiben dürfen nicht auseinanderfallen. Sonst kann
  // ein paralleler `createList` + `setActiveListId` (z.B. Nutzer legt sofort
  // beim App-Start eine Liste an, während der Bootstrap noch läuft) dazwischen
  // laufen — der Bootstrap würde die frisch aktivierte Liste sonst wieder auf
  // die Standardliste zurücksetzen. Aus demselben Grund zählt "existiert schon
  // eine Liste?" nicht nur die Standardliste, sondern jede Liste: Ist durch so
  // einen parallelen Aufruf bereits eine (andere) Liste entstanden, aktiviert
  // der Bootstrap genau die — statt eine nie angelegte `default`-ID zu setzen.
  async function ensureActiveList() {
    return db.transaction('rw', db.lists, db.meta, async () => {
      const activeId = await getActiveListId()
      if (activeId) return activeId

      const existingLists = await db.lists.toArray()
      const [oldest] = existingLists.sort(byCreatedAt)
      const list = oldest ?? {
        id: DEFAULT_LIST_ID,
        name: DEFAULT_LIST_NAME,
        createdAt: now(),
      }
      if (!oldest) await db.lists.add(list)
      await setActiveListId(list.id)
      return list.id
    })
  }

  // Bootstrap: robustes Öffnen, aktive Liste sicherstellen, Legacy aufräumen.
  async function init() {
    cleanupLegacyStorage()
    await openDb(db)
    return ensureActiveList()
  }

  async function createList(name) {
    const list = { id: newId(), name, createdAt: now() }
    await db.lists.add(list)
    return list
  }

  async function loadLists() {
    const records = await db.lists.toArray()
    return records
      .filter(hasIdAndName)
      .sort(byCreatedAt)
      .map(toList)
  }

  async function loadItems(listId = DEFAULT_LIST_ID) {
    const records = await db.items.where('listId').equals(listId).toArray()
    return records
      .filter(hasIdAndName)
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

  // Zuletzt verwendet (Issue #46): erledigte Items (`done: true`) bleiben in der
  // Liste und gelten als archiviert, statt gelöscht zu werden. `reactivateItem`
  // holt ein archiviertes Item zurück auf `done: false` — außer es steht (pro
  // Liste) bereits ein offenes Item mit demselben Namen da; dann bliebe das
  // Zurückholen ein Duplikat und das archivierte Item bleibt unverändert.
  async function reactivateItem(id) {
    const record = await db.items.where('id').equals(id).first()
    if (!record) return null

    const duplicateOpen = await db.items
      .where('listId')
      .equals(record.listId)
      .filter((entry) => entry.done !== true && entry.name === record.name)
      .count()
    if (duplicateOpen > 0) return toItem(record)

    const updatedAt = now()
    await db.items.where('id').equals(id).modify({ done: false, updatedAt })
    return toItem({ ...record, done: false, updatedAt })
  }

  return {
    init,
    createList,
    loadLists,
    getActiveListId,
    setActiveListId,
    loadItems,
    addItem,
    setDone,
    renameItem,
    removeItem,
    reactivateItem,
  }
}

export const repository = createRepository()
