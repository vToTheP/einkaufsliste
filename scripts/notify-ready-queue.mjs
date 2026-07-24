// Dünne I/O-Hülle für den Ready-Queue-Reminder: liest die Queue-Größe und
// die ntfy-Konfiguration aus der Umgebung, entscheidet über
// src/factory/readyQueueReminder.js (dort getestet) und postet ggf. an ntfy.
// Aufruf aus .github/workflows/ready-queue-reminder.yml.
import { buildReminderMessage } from '../src/factory/readyQueueReminder.js'

const count = Number(process.env.READY_QUEUE_COUNT)
if (!Number.isFinite(count)) {
  console.error(`READY_QUEUE_COUNT ist keine Zahl: "${process.env.READY_QUEUE_COUNT}"`)
  process.exit(1)
}

const threshold = process.env.READY_QUEUE_THRESHOLD
  ? Number(process.env.READY_QUEUE_THRESHOLD)
  : undefined

const message = buildReminderMessage(count, threshold)

if (!message) {
  console.log(`Ready-Queue ausreichend gefüllt (${count}) — keine Benachrichtigung.`)
  process.exit(0)
}

const topicUrl = process.env.NTFY_TOPIC_URL
if (!topicUrl) {
  console.warn(`NTFY_TOPIC_URL nicht gesetzt — würde senden: "${message}"`)
  process.exit(0)
}

const response = await fetch(topicUrl, { method: 'POST', body: message })
if (!response.ok) {
  console.error(`ntfy-Push fehlgeschlagen: ${response.status} ${response.statusText}`)
  process.exit(1)
}

console.log(`ntfy-Push gesendet: "${message}"`)
