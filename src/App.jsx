import { useEffect, useState } from 'react'
import './App.css'

// Häppchen 2: Items hinzufügen + anzeigen, Persistenz via localStorage.
const STORAGE_KEY = 'einkaufsliste:items'

function loadItems() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed
      .filter(
        (item) => item && typeof item.id === 'string' && typeof item.name === 'string',
      )
      .map((item) => ({ ...item, done: item.done === true }))
  } catch {
    return []
  }
}

export default function App() {
  const [items, setItems] = useState(loadItems)
  const [draft, setDraft] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [editDraft, setEditDraft] = useState('')

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  }, [items])

  function handleSubmit(event) {
    event.preventDefault()
    const name = draft.trim()
    if (!name) return
    const id =
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : // eslint-disable-next-line sonarjs/pseudo-random -- reine Fallback-ID (kein Sicherheitskontext), nur wenn crypto.randomUUID fehlt
          String(Date.now()) + Math.random().toString(16).slice(2)
    setItems((prev) => [...prev, { id, name, done: false }])
    setDraft('')
  }

  function toggleDone(id) {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, done: !item.done } : item,
      ),
    )
  }

  function deleteItem(id) {
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

  function handleRenameSubmit(event) {
    event.preventDefault()
    const name = editDraft.trim()
    if (!name) {
      cancelEdit()
      return
    }
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

      {items.length === 0 ? (
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
