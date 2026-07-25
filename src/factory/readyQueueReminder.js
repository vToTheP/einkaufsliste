export const DEFAULT_READY_QUEUE_THRESHOLD = 3

export function buildReminderMessage(count, threshold = DEFAULT_READY_QUEUE_THRESHOLD) {
  if (count >= threshold) return null
  return `Ready-Queue niedrig: ${count} Issues — Nachschub anlegen`
}
