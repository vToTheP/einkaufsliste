import { useEffect, useRef } from 'react'
import { BackIcon, PlusIcon, EditIcon, DeleteIcon } from './icons/index.jsx'

const FOCUSABLE_SELECTOR =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

// Listen-Verwaltung (Wechseln/Anlegen/Umbenennen/Löschen) aus dem
// Kopfbereich in ein Sheet/Drawer verlagert (Issue #98). Verhalten der
// Aktionen selbst ist unverändert — nur die Verortung ändert sich, inklusive
// des bestehenden Lösch-Guards (der Aufrufer deaktiviert den Button, solange
// nur eine Liste existiert).
export default function ListSheet({
  open,
  onClose,
  lists,
  activeListId,
  activeList,
  onSwitchList,
  listDraft,
  onListDraftChange,
  onCreateList,
  editingListId,
  editListDraft,
  onEditListDraftChange,
  onStartEditList,
  onCancelEditList,
  onRenameListSubmit,
  onDeleteList,
}) {
  const panelRef = useRef(null)

  // Fokus wandert beim Öffnen ins Sheet — nur beim Öffnen selbst, nicht bei
  // jedem Re-Render während es offen ist (sonst würde ein unabhängiges
  // App-Update den Nutzer mitten in der Tastatur-Navigation zurückreißen).
  useEffect(() => {
    if (!open) return
    const focusable = panelRef.current?.querySelector(FOCUSABLE_SELECTOR)
    focusable?.focus()
  }, [open])

  useEffect(() => {
    if (!open) return

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
        return
      }
      if (event.key !== 'Tab') return
      const focusables = Array.from(
        panelRef.current?.querySelectorAll(FOCUSABLE_SELECTOR) ?? [],
      )
      if (focusables.length === 0) return
      const first = focusables[0]
      const last = focusables[focusables.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="sheet__backdrop" onClick={onClose}>
      <div
        className="sheet__panel"
        role="dialog"
        aria-modal="true"
        aria-label="Listen-Menü"
        ref={panelRef}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="sheet__header">
          <h2 className="sheet__title">Listen-Menü</h2>
          <button
            type="button"
            className="sheet__close"
            onClick={onClose}
            aria-label="Menü schließen"
          >
            <BackIcon />
          </button>
        </div>

        <label className="app__list-select-label" htmlFor="list-select">
          Liste
        </label>
        <select
          id="list-select"
          className="app__list-select"
          value={activeListId ?? ''}
          onChange={(event) => onSwitchList(event.target.value)}
        >
          {lists.map((list) => (
            <option key={list.id} value={list.id}>
              {list.name}
            </option>
          ))}
        </select>

        {activeList &&
          (editingListId === activeList.id ? (
            <form className="app__edit" onSubmit={onRenameListSubmit}>
              <input
                className="app__input"
                type="text"
                value={editListDraft}
                onChange={(event) => onEditListDraftChange(event.target.value)}
                aria-label="Listenname bearbeiten"
                autoFocus
              />
              <button className="app__save" type="submit">
                Speichern
              </button>
              <button
                className="app__cancel"
                type="button"
                onClick={onCancelEditList}
              >
                Abbrechen
              </button>
            </form>
          ) : (
            <div className="sheet__list-actions">
              <button
                className="app__edit-btn"
                type="button"
                onClick={() => onStartEditList(activeList)}
                aria-label="Liste umbenennen"
              >
                <EditIcon />
              </button>
              <button
                className="app__delete"
                type="button"
                onClick={() => onDeleteList(activeList.id)}
                disabled={lists.length <= 1}
                aria-label="Liste löschen"
              >
                <DeleteIcon />
              </button>
            </div>
          ))}

        <form className="app__list-form" onSubmit={onCreateList}>
          <input
            className="app__input"
            type="text"
            value={listDraft}
            onChange={(event) => onListDraftChange(event.target.value)}
            placeholder="Neue Liste"
            aria-label="Neue Liste"
          />
          <button
            className="app__add-list"
            type="submit"
            aria-label="Liste anlegen"
          >
            <PlusIcon />
          </button>
        </form>
      </div>
    </div>
  )
}
