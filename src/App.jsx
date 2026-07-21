import { useEffect, useRef, useState } from 'react'
import './App.css'
import {
  repository as defaultRepository,
  DEFAULT_LIST_ID,
} from './db/repository.js'

// Führt den initialen Persistenz-Load mit dem aktuellen UI-State zusammen, ohne
// bereits getätigte User-Aktionen zu überschreiben: Löst der Load (z.B. auf
// langsamen Geräten oder unter Last) erst auf, nachdem der Nutzer schon Items
// angelegt/getoggelt oder eine Liste angelegt hat, würde ein direktes Ersetzen
// diesen optimistischen State verwerfen. Deshalb: vorhandenen State behalten,
// nur noch nicht gezeigte persistierte Einträge ergänzen. Gilt gleichermaßen
// für Items und Listen (beide haben eine stabile `id`).
function mergeLoaded(prev, loaded) {
  if (prev.length === 0) return loaded
  const prevIds = new Set(prev.map((entry) => entry.id))
  const extra = loaded.filter((entry) => !prevIds.has(entry.id))
  return [...extra, ...prev]
}

// Persistenz läuft ausschließlich über das Repository (IndexedDB via Dexie).
// Die Komponente kennt weder Dexie noch IndexedDB direkt.
export default function App({ repository = defaultRepository }) {
  const [items, setItems] = useState([])
  const [lists, setLists] = useState([])
  // Bis repository.init() aufgelöst hat, gilt optimistisch die Standardliste als
  // aktiv — spiegelt das bisherige Verhalten (addItem lief immer gegen
  // DEFAULT_LIST_ID), falls der Nutzer vor Abschluss des Bootstraps schon tippt.
  const [activeListId, setActiveListId] = useState(DEFAULT_LIST_ID)
  const [ready, setReady] = useState(false)
  const [draft, setDraft] = useState('')
  const [listDraft, setListDraft] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [editDraft, setEditDraft] = useState('')
  // Hat der Nutzer die aktive Liste bereits selbst gewechselt/angelegt, bevor
  // der (asynchrone) Bootstrap-Load aufgelöst hat, ist dessen Ergebnis für
  // Aktiv-Liste + Items veraltet — es darf die Nutzeraktion dann nicht mehr
  // überschreiben. `lists` bleibt davon unberührt (rein additiv über mergeLoaded).
  const userSwitchedListRef = useRef(false)

  useEffect(() => {
    let active = true
    ;(async () => {
      try {
        const activeId = await repository.init()
        const [loadedLists, loadedItems] = await Promise.all([
          repository.loadLists(),
          repository.loadItems(activeId),
        ])
        if (active) {
          setLists((prev) => mergeLoaded(prev, loadedLists))
          if (!userSwitchedListRef.current) {
            setActiveListId(activeId)
            setItems((prev) => mergeLoaded(prev, loadedItems))
          }
        }
      } catch {
        // Store nicht lesbar → robust mit leerer Liste weitermachen (kein Crash).
        if (active) setItems([])
      } finally {
        if (active) setReady(true)
      }
    })()
    return () => {
      active = false
    }
  }, [repository])

  // Übernimmt eine (bereits persistierte) aktive Liste + ihre Items in den
  // State. Rein synchron, damit sie sich in switchList/handleCreateList an
  // exakt der Stelle einfügen lässt, an der bisher die beiden setState-Aufrufe
  // standen — ohne einen zusätzlichen await-Tick einzuschieben.
  function applyActiveList(id, items) {
    setActiveListId(id)
    setItems(items)
  }

  async function switchList(id) {
    userSwitchedListRef.current = true
    if (id === activeListId) return
    await repository.setActiveListId(id)
    applyActiveList(id, await repository.loadItems(id))
  }

  async function handleCreateList(event) {
    event.preventDefault()
    const submitted = listDraft
    const name = submitted.trim()
    if (!name) return
    userSwitchedListRef.current = true
    const list = await repository.createList(name)
    await repository.setActiveListId(list.id)
    // Idempotent statt blindem Append: Löst der parallele Bootstrap-Load (siehe
    // mergeLoaded) erst zwischen dem Persistieren und diesem State-Update auf,
    // enthält `prev` die neue Liste bereits — ein zweites Mal anhängen würde sie
    // duplizieren.
    setLists((prev) =>
      prev.some((l) => l.id === list.id) ? prev : [...prev, list],
    )
    applyActiveList(list.id, [])
    setListDraft((current) => (current === submitted ? '' : current))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    const submitted = draft
    const name = submitted.trim()
    if (!name) return
    const item = await repository.addItem(name, activeListId)
    setItems((prev) => [...prev, item])
    // Nur leeren, wenn im Feld noch der abgeschickte Text steht. Beim schnellen
    // Anlegen mehrerer Items löst der async-Write erst auf, nachdem der Nutzer
    // das nächste Item bereits getippt hat — ein bedingungsloses setDraft('')
    // würde diesen neuen Entwurf verschlucken.
    setDraft((current) => (current === submitted ? '' : current))
  }

  // Abhaken verschiebt ein Item nach „Zuletzt verwendet" statt es nur
  // durchzustreichen (Issue #46) — die aktive Liste zeigt ausschließlich
  // offene Items, daher gibt es hier kein Zurück-Toggeln mehr über dieselbe
  // Checkbox; das übernimmt reactivateItem.
  async function archiveItem(id) {
    const current = items.find((item) => item.id === id)
    if (!current) return
    // UI synchron aktualisieren: eine kontrollierte Checkbox, deren onChange den
    // State erst nach einem await ändert, würde von React sofort zurückgesetzt.
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, done: true } : item)),
    )
    await repository.setDone(id, true)
    if (editingId === id) setEditingId(null)
  }

  // Reaktivieren holt ein archiviertes Item zurück auf die aktive Liste.
  // Dedup (steht bereits ein offenes Item gleichen Namens da?) läuft im
  // Repository gegen den echten DB-Stand, nicht gegen den lokalen State.
  async function reactivateItem(id) {
    const updated = await repository.reactivateItem(id)
    if (!updated) return
    setItems((prev) => prev.map((item) => (item.id === id ? updated : item)))
  }

  async function permanentlyRemoveItem(id) {
    await repository.removeItem(id)
    setItems((prev) => prev.filter((item) => item.id !== id))
  }

  function startEdit(item) {
    setEditingId(item.id)
    setEditDraft(item.name)
  }

  function cancelEdit() {
    setEditingId(null)
    setEditDraft('')
  }

  async function handleRenameSubmit(event) {
    event.preventDefault()
    const name = editDraft.trim()
    if (!name) {
      cancelEdit()
      return
    }
    await repository.renameItem(editingId, name)
    setItems((prev) =>
      prev.map((item) =>
        item.id === editingId ? { ...item, name } : item,
      ),
    )
    setEditingId(null)
    setEditDraft('')
  }

  // Aktive Liste zeigt nur offene Items; erledigte/entfernte landen in
  // „Zuletzt verwendet" statt zu verschwinden (Issue #46).
  const openItems = items.filter((item) => !item.done)
  const recentlyUsedItems = items.filter((item) => item.done)

  return (
    <main className="app">
      <header className="app__header">
        <h1>Einkaufsliste</h1>
        <label className="app__list-select-label" htmlFor="list-select">
          Liste
        </label>
        <select
          id="list-select"
          className="app__list-select"
          value={activeListId ?? ''}
          onChange={(event) => switchList(event.target.value)}
        >
          {lists.map((list) => (
            <option key={list.id} value={list.id}>
              {list.name}
            </option>
          ))}
        </select>
        <form className="app__list-form" onSubmit={handleCreateList}>
          <input
            className="app__input"
            type="text"
            value={listDraft}
            onChange={(event) => setListDraft(event.target.value)}
            placeholder="Neue Liste"
            aria-label="Neue Liste"
          />
          <button className="app__add-list" type="submit">
            Liste anlegen
          </button>
        </form>
      </header>

      <form className="app__form" onSubmit={handleSubmit}>
        <input
          className="app__input"
          type="text"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Was brauchst du?"
          aria-label="Neues Item"
        />
        <button className="app__add" type="submit">
          Hinzufügen
        </button>
      </form>

      {ready && openItems.length === 0 ? (
        <p className="app__empty">Deine Liste ist leer.</p>
      ) : (
        <ul className="app__list">
          {openItems.map((item) => (
            <li key={item.id} className="app__item">
              {editingId === item.id ? (
                <form className="app__edit" onSubmit={handleRenameSubmit}>
                  <input
                    className="app__input"
                    type="text"
                    value={editDraft}
                    onChange={(event) => setEditDraft(event.target.value)}
                    aria-label="Item-Name bearbeiten"
                    autoFocus
                  />
                  <button className="app__save" type="submit">
                    Speichern
                  </button>
                  <button
                    className="app__cancel"
                    type="button"
                    onClick={cancelEdit}
                  >
                    Abbrechen
                  </button>
                </form>
              ) : (
                <>
                  <label className="app__item-label">
                    <input
                      className="app__check"
                      type="checkbox"
                      checked={false}
                      onChange={() => archiveItem(item.id)}
                    />
                    <span className="app__item-name">{item.name}</span>
                  </label>
                  <button
                    className="app__edit-btn"
                    type="button"
                    onClick={() => startEdit(item)}
                    aria-label={`${item.name} bearbeiten`}
                  >
                    Bearbeiten
                  </button>
                  <button
                    className="app__delete"
                    type="button"
                    onClick={() => archiveItem(item.id)}
                    aria-label={`${item.name} entfernen`}
                  >
                    Entfernen
                  </button>
                </>
              )}
            </li>
          ))}
        </ul>
      )}

      {recentlyUsedItems.length > 0 && (
        <section className="app__recently-used">
          <h2>Zuletzt verwendet</h2>
          <ul className="app__recently-used-list">
            {recentlyUsedItems.map((item) => (
              <li key={item.id} className="app__recently-used-item">
                <span className="app__item-name">{item.name}</span>
                <button
                  type="button"
                  onClick={() => reactivateItem(item.id)}
                  aria-label={`${item.name} reaktivieren`}
                >
                  Reaktivieren
                </button>
                <button
                  type="button"
                  onClick={() => permanentlyRemoveItem(item.id)}
                  aria-label={`${item.name} endgültig entfernen`}
                >
                  Endgültig entfernen
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  )
}
