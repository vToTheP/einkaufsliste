import { useEffect, useState } from 'react'
import './App.css'
import { repository as defaultRepository } from './db/repository.js'

// Persistenz läuft ausschließlich über das Repository (IndexedDB via Dexie).
// Die Komponente kennt weder Dexie noch IndexedDB direkt.
export default function App({ repository = defaultRepository }) {
  const [items, setItems] = useState([])
  const [ready, setReady] = useState(false)
  const [draft, setDraft] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [editDraft, setEditDraft] = useState('')

  useEffect(() => {
    let active = true
    ;(async () => {
      try {
        await repository.init()
        const loaded = await repository.loadItems()
        // Der initiale Load darf bereits getätigte User-Aktionen nicht
        // überschreiben: Löst er (z.B. auf langsamen Geräten oder unter Last)
        // erst auf, nachdem der Nutzer schon Items angelegt/getoggelt hat, würde
        // ein direktes setItems(loaded) diesen optimistischen State verwerfen.
        // Deshalb: vorhandenen State behalten, nur noch nicht gezeigte
        // persistierte Items ergänzen.
        if (active)
          setItems((prev) => {
            if (prev.length === 0) return loaded
            const prevIds = new Set(prev.map((item) => item.id))
            const extra = loaded.filter((item) => !prevIds.has(item.id))
            return [...extra, ...prev]
          })
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

  async function handleSubmit(event) {
    event.preventDefault()
    const submitted = draft
    const name = submitted.trim()
    if (!name) return
    const item = await repository.addItem(name)
    setItems((prev) => [...prev, item])
    // Nur leeren, wenn im Feld noch der abgeschickte Text steht. Beim schnellen
    // Anlegen mehrerer Items löst der async-Write erst auf, nachdem der Nutzer
    // das nächste Item bereits getippt hat — ein bedingungsloses setDraft('')
    // würde diesen neuen Entwurf verschlucken.
    setDraft((current) => (current === submitted ? '' : current))
  }

  async function toggleDone(id) {
    const current = items.find((item) => item.id === id)
    if (!current) return
    const done = !current.done
    // UI synchron aktualisieren: eine kontrollierte Checkbox, deren onChange den
    // State erst nach einem await ändert, würde von React sofort zurückgesetzt.
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, done } : item)),
    )
    await repository.setDone(id, done)
  }

  async function deleteItem(id) {
    await repository.removeItem(id)
    setItems((prev) => prev.filter((item) => item.id !== id))
    if (editingId === id) setEditingId(null)
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

  return (
    <main className="app">
      <header className="app__header">
        <h1>Einkaufsliste</h1>
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

      {ready && items.length === 0 ? (
        <p className="app__empty">Deine Liste ist leer.</p>
      ) : (
        <ul className="app__list">
          {items.map((item) => (
            <li
              key={item.id}
              className={`app__item${item.done ? ' app__item--done' : ''}`}
            >
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
                      checked={item.done}
                      onChange={() => toggleDone(item.id)}
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
                    onClick={() => deleteItem(item.id)}
                    aria-label={`${item.name} löschen`}
                  >
                    Löschen
                  </button>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}
