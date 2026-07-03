import './App.css'

// Häppchen 1: nur das Gerüst — noch keine Items. Hinzufügen/Persistenz kommt in Häppchen 2.
export default function App() {
  const items = []

  return (
    <main className="app">
      <header className="app__header">
        <h1>Einkaufsliste</h1>
      </header>

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
