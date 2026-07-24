import { describe, expect, it } from 'vitest'
import { buildReminderMessage, DEFAULT_READY_QUEUE_THRESHOLD } from './readyQueueReminder.js'

describe('buildReminderMessage', () => {
  it('liefert eine Nachricht, wenn die Queue unter der Schwelle liegt', () => {
    expect(buildReminderMessage(2)).toBe('Ready-Queue niedrig: 2 Issues — Nachschub anlegen')
  })

  it('liefert null, wenn die Queue die Schwelle erreicht', () => {
    expect(buildReminderMessage(DEFAULT_READY_QUEUE_THRESHOLD)).toBeNull()
  })

  it('liefert null, wenn die Queue über der Schwelle liegt', () => {
    expect(buildReminderMessage(10)).toBeNull()
  })

  it('respektiert eine übergebene Schwelle', () => {
    expect(buildReminderMessage(5, 6)).toBe('Ready-Queue niedrig: 5 Issues — Nachschub anlegen')
    expect(buildReminderMessage(5, 5)).toBeNull()
  })

  it('funktioniert auch bei einer leeren Queue', () => {
    expect(buildReminderMessage(0)).toBe('Ready-Queue niedrig: 0 Issues — Nachschub anlegen')
  })
})
