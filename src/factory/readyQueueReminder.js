export const DEFAULT_READY_QUEUE_THRESHOLD = 3

export function buildReminderMessage(count, threshold = DEFAULT_READY_QUEUE_THRESHOLD) {
  if (!Number.isFinite(threshold)) {
    throw new Error(`READY_QUEUE_THRESHOLD ist keine gültige Zahl: "${threshold}"`)
  }
  if (count >= threshold) return null
  return `Ready-Queue niedrig: ${count} Issues — Nachschub anlegen`
}
