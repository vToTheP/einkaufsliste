import { MenuIcon } from './icons/index.jsx'

// Kopf zeigt nur den aktiven Listennamen (Issue #98); Listen-Verwaltung
// (Wechseln/Anlegen/Umbenennen/Löschen) sitzt hinter dem Menü-Button im
// Sheet/Drawer (siehe ListSheet.jsx).
export default function TopBar({ listName, sheetOpen, onOpenMenu, menuButtonRef }) {
  return (
    <header className="app__header">
      <button
        type="button"
        className="app__menu-btn"
        onClick={onOpenMenu}
        aria-label="Listen-Menü öffnen"
        aria-haspopup="dialog"
        aria-expanded={sheetOpen}
        ref={menuButtonRef}
      >
        <MenuIcon />
      </button>
      <h1>{listName}</h1>
    </header>
  )
}
