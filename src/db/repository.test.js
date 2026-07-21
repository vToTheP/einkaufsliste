import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { createDb, openDb } from './database.js'
import {
  createRepository,
  DEFAULT_LIST_ID,
  DEFAULT_LIST_NAME,
  LEGACY_STORAGE_KEY,
} from './repository.js'

// Jeder Test bekommt eine frisch benannte DB → volle Isolation.
let counter = 0
let db
let repo

beforeEach(async () => {
  counter += 1
  db = createDb(`einkaufsliste-test-${counter}`)
  repo = createRepository(db)
})

afterEach(async () => {
  await db.delete()
})

// Für Tests, die (anders als `db`/`repo` oben) eine zweite, unabhängige DB
// brauchen, z.B. um zwei nebenläufige Repository-Instanzen zu simulieren.
function freshRepo(suffix) {
  return createRepository(createDb(`einkaufsliste-${suffix}-${counter}`))
}

describe('repository – Bootstrap', () => {
  it('legt auf leerem Store eine leere Standardliste an', async () => {
    await repo.init()

    const list = await db.lists.get(DEFAULT_LIST_ID)
    expect(list).toMatchObject({ id: DEFAULT_LIST_ID, name: DEFAULT_LIST_NAME })
    expect(typeof list.createdAt).toBe('number')
    expect(await repo.loadItems()).toEqual([])
  })

  it('legt die Standardliste bei erneutem init nicht doppelt an', async () => {
    await repo.init()
    const first = await db.lists.get(DEFAULT_LIST_ID)
    await repo.init()

    expect(await db.lists.count()).toBe(1)
    expect((await db.lists.get(DEFAULT_LIST_ID)).createdAt).toBe(first.createdAt)
  })
})

describe('repository – CRUD', () => {
  beforeEach(async () => {
    await repo.init()
  })

  it('fügt ein Item hinzu und gibt ein fachliches Objekt zurück', async () => {
    const item = await repo.addItem('Milch')

    expect(item).toMatchObject({
      name: 'Milch',
      done: false,
      listId: DEFAULT_LIST_ID,
      category: 'Milchprodukte & Eier',
    })
    expect(typeof item.id).toBe('string')
    expect(item).not.toHaveProperty('seq')

    const items = await repo.loadItems()
    expect(items).toHaveLength(1)
    expect(items[0]).toMatchObject({ name: 'Milch', done: false })
  })

  it('ordnet ein neues Item automatisch einer Kategorie zu', async () => {
    const item = await repo.addItem('Brot')

    expect(item.category).toBe('Brot & Backwaren')
  })

  it('ordnet ein Item ohne Treffer der Kategorie Sonstiges zu', async () => {
    const item = await repo.addItem('Glühbirne')

    expect(item.category).toBe('Sonstiges')
  })

  it('übersteht die Kategorie einen simulierten Reload (neues Repository, gleiche DB)', async () => {
    await repo.addItem('Milch')

    const reopened = createRepository(db)
    await reopened.init()

    expect((await reopened.loadItems())[0]).toMatchObject({
      category: 'Milchprodukte & Eier',
    })
  })

  it('bewahrt die Einfüge-Reihenfolge', async () => {
    await repo.addItem('Milch')
    await repo.addItem('Brot')
    await repo.addItem('Butter')

    expect((await repo.loadItems()).map((i) => i.name)).toEqual([
      'Milch',
      'Brot',
      'Butter',
    ])
  })

  it('schaltet den erledigt-Zustand um', async () => {
    const item = await repo.addItem('Brot')

    await repo.setDone(item.id, true)
    expect((await repo.loadItems())[0]).toMatchObject({ done: true })

    await repo.setDone(item.id, false)
    expect((await repo.loadItems())[0]).toMatchObject({ done: false })
  })

  it('benennt ein Item um und behält den erledigt-Zustand', async () => {
    const item = await repo.addItem('Milch')
    await repo.setDone(item.id, true)

    await repo.renameItem(item.id, 'Hafermilch')

    expect((await repo.loadItems())[0]).toMatchObject({
      name: 'Hafermilch',
      done: true,
    })
  })

  it('entfernt ein Item dauerhaft', async () => {
    const item = await repo.addItem('Milch')

    await repo.removeItem(item.id)

    expect(await repo.loadItems()).toEqual([])
  })

  it('überdauert einen simulierten Reload (neues Repository, gleiche DB)', async () => {
    await repo.addItem('Milch')
    await repo.addItem('Brot')

    // Frisches Repository auf derselben DB = Reload.
    const reopened = createRepository(db)
    await reopened.init()

    expect((await reopened.loadItems()).map((i) => i.name)).toEqual([
      'Milch',
      'Brot',
    ])
  })
})

describe('repository – mehrere Listen', () => {
  beforeEach(async () => {
    await repo.init()
  })

  it('legt eine neue Liste an und listet sie', async () => {
    const list = await repo.createList('Wocheneinkauf')

    expect(list).toMatchObject({ name: 'Wocheneinkauf' })
    expect(typeof list.id).toBe('string')
    expect(typeof list.createdAt).toBe('number')

    const lists = await repo.loadLists()
    expect(lists.map((l) => l.name)).toEqual([DEFAULT_LIST_NAME, 'Wocheneinkauf'])
  })

  it('aktiviert die Standardliste beim ersten Bootstrap', async () => {
    expect(await repo.getActiveListId()).toBe(DEFAULT_LIST_ID)
  })

  it('wechselt die aktive Liste und übersteht einen Reload (neues Repository, gleiche DB)', async () => {
    const list = await repo.createList('Wocheneinkauf')
    await repo.setActiveListId(list.id)

    const reopened = createRepository(db)
    const activeId = await reopened.init()

    expect(activeId).toBe(list.id)
    expect(await reopened.getActiveListId()).toBe(list.id)
  })

  it('Bootstrap überschreibt eine parallel gesetzte aktive Liste nicht (Race)', async () => {
    // Simuliert: init() (App-Mount) läuft noch, während der Nutzer bereits eine
    // neue Liste anlegt und aktiviert — die spätere Bootstrap-Antwort darf den
    // Nutzer-State nicht zurück auf die Standardliste kippen.
    const fresh = freshRepo('race')
    const [, created] = await Promise.all([
      fresh.init(),
      (async () => {
        const list = await fresh.createList('Wocheneinkauf')
        await fresh.setActiveListId(list.id)
        return list
      })(),
    ])

    expect(await fresh.getActiveListId()).toBe(created.id)
  })

  it('Bootstrap aktiviert eine parallel angelegte Liste statt einer nie existierenden Standardliste', async () => {
    // Noch enger als die Race oben: Hier ist zum Zeitpunkt des Bootstraps schon
    // eine Liste angelegt (db.lists nicht mehr leer), aber `setActiveListId`
    // ist noch nicht gelaufen. Der Bootstrap darf dann nicht eine `default`-ID
    // aktivieren, die es in `lists` gar nicht gibt.
    const fresh = freshRepo('race2')
    const created = await fresh.createList('Wocheneinkauf')

    const activeId = await fresh.init()

    expect(activeId).toBe(created.id)
    expect(await fresh.loadLists()).toEqual([
      { id: created.id, name: created.name, createdAt: created.createdAt },
    ])
  })

  it('ordnet Items der jeweiligen Liste zu', async () => {
    const list = await repo.createList('Wocheneinkauf')
    await repo.addItem('Milch', DEFAULT_LIST_ID)
    await repo.addItem('Bier', list.id)

    expect((await repo.loadItems(DEFAULT_LIST_ID)).map((i) => i.name)).toEqual([
      'Milch',
    ])
    expect((await repo.loadItems(list.id)).map((i) => i.name)).toEqual(['Bier'])
  })

  it('benennt eine Liste um', async () => {
    const list = await repo.createList('Wocheneinkauf')

    await repo.renameList(list.id, 'Grillfest')

    const lists = await repo.loadLists()
    expect(lists.find((l) => l.id === list.id)).toMatchObject({
      name: 'Grillfest',
      createdAt: list.createdAt,
    })
  })

  it('entfernt eine Liste dauerhaft samt ihrer Items', async () => {
    const list = await repo.createList('Wocheneinkauf')
    await repo.addItem('Bier', list.id)

    await repo.removeList(list.id)

    expect((await repo.loadLists()).map((l) => l.id)).toEqual([DEFAULT_LIST_ID])
    expect(await repo.loadItems(list.id)).toEqual([])
  })

  it('Guard: die letzte verbliebene Liste kann nicht gelöscht werden', async () => {
    await repo.addItem('Milch', DEFAULT_LIST_ID)

    await repo.removeList(DEFAULT_LIST_ID)

    expect((await repo.loadLists()).map((l) => l.id)).toEqual([DEFAULT_LIST_ID])
    expect(await repo.loadItems(DEFAULT_LIST_ID)).toHaveLength(1)
  })

  it('Löschen der aktiven Liste setzt automatisch eine andere Liste aktiv', async () => {
    const list = await repo.createList('Wocheneinkauf')
    await repo.setActiveListId(list.id)

    const newActiveId = await repo.removeList(list.id)

    expect(newActiveId).toBe(DEFAULT_LIST_ID)
    expect(await repo.getActiveListId()).toBe(DEFAULT_LIST_ID)
  })

  it('Löschen einer inaktiven Liste lässt die aktive Liste unverändert', async () => {
    const list = await repo.createList('Wocheneinkauf')

    const newActiveId = await repo.removeList(list.id)

    expect(newActiveId).toBe(DEFAULT_LIST_ID)
    expect(await repo.getActiveListId()).toBe(DEFAULT_LIST_ID)
  })

  it('Umbenennung und Löschung überstehen einen Reload (neues Repository, gleiche DB)', async () => {
    const keep = await repo.createList('Wocheneinkauf')
    const gone = await repo.createList('Grillfest')
    await repo.renameList(keep.id, 'Wochenendeinkauf')
    await repo.removeList(gone.id)

    const reopened = createRepository(db)
    await reopened.init()

    expect((await reopened.loadLists()).map((l) => l.name)).toEqual([
      DEFAULT_LIST_NAME,
      'Wochenendeinkauf',
    ])
  })
})

describe('repository – Robustheit', () => {
  it('filtert beschädigte Item-Records beim Laden heraus (kein Crash)', async () => {
    await repo.init()
    await repo.addItem('Milch')
    // Beschädigter Datensatz direkt in den Store geschrieben.
    await db.items.add({ id: undefined, listId: DEFAULT_LIST_ID, name: null })

    const items = await repo.loadItems()
    expect(items.map((i) => i.name)).toEqual(['Milch'])
  })

  it('startet mit leerer Standardliste auf beschädigtem Store', async () => {
    // openDb verwirft einen nicht öffenbaren Store und legt ihn neu an.
    const brokenDb = {
      open: vi
        .fn()
        .mockRejectedValueOnce(new Error('corrupt'))
        .mockResolvedValue(undefined),
      delete: vi.fn().mockResolvedValue(undefined),
    }

    await expect(openDb(brokenDb)).resolves.toBe(brokenDb)
    expect(brokenDb.delete).toHaveBeenCalledTimes(1)
    expect(brokenDb.open).toHaveBeenCalledTimes(2)
  })
})

describe('repository – kein Legacy-Migrationspfad', () => {
  afterEach(() => {
    localStorage.clear()
  })

  it('räumt den alten localStorage-Key beim init auf und liest ihn nicht', async () => {
    localStorage.setItem(
      LEGACY_STORAGE_KEY,
      JSON.stringify([{ id: '1', name: 'Alt-Item', done: false }]),
    )

    await repo.init()

    expect(localStorage.getItem(LEGACY_STORAGE_KEY)).toBeNull()
    expect(await repo.loadItems()).toEqual([])
  })
})
