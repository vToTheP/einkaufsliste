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
    return parsed.filter(
      (item) => item && typeof item.id === 'string' && typeof item.name === 'string',
    )
  } catch {
    return []
  }
}

export default function App() {
  const [items, setItems] = useState(loadItems)
  const [draft, setDraft] = useState('')

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
        : String(Date.now()) + Math.random().toString(16).slice(2)
    setItems((prev) => [...prev, { id, name }])
    setDraft('')
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
            <li key={item.id} className="app__item">
              {item.name}
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}
