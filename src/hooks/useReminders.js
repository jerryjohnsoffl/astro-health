import { useMemo, useState } from 'react'
import {
  createReminder,
  generateReminderTemplates,
  getDueReminders,
  markReminderComplete,
  scheduleReminders,
  snoozeReminder,
} from '../engine/reminders.js'

function buildInitialReminders({ crewName, environmentName } = {}) {
  const templates = generateReminderTemplates({ crewName, environmentName })
  return scheduleReminders({ templates })
}

export function useReminders(options = {}) {
  const [reminders, setReminders] = useState(() => buildInitialReminders(options))

  const dueReminders = useMemo(() => getDueReminders(reminders), [reminders])

  function addReminder(reminderInput) {
    setReminders((current) => [createReminder(reminderInput), ...current])
  }

  function completeReminder(reminderId) {
    setReminders((current) =>
      current.map((reminder) =>
        reminder.id === reminderId ? markReminderComplete(reminder) : reminder,
      ),
    )
  }

  function dismissReminder(reminderId) {
    setReminders((current) =>
      current.map((reminder) =>
        reminder.id === reminderId ? { ...reminder, dismissed: true } : reminder,
      ),
    )
  }

  function snooze(reminderId, hours = 2) {
    setReminders((current) =>
      current.map((reminder) =>
        reminder.id === reminderId ? snoozeReminder(reminder, hours) : reminder,
      ),
    )
  }

  return {
    reminders,
    dueReminders,
    addReminder,
    completeReminder,
    dismissReminder,
    snooze,
    refresh: () => setReminders(buildInitialReminders(options)),
  }
}

export default useReminders
