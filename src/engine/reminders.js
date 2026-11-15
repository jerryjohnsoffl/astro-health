export const defaultReminderTemplates = [
  {
    id: 'hydration-check',
    title: 'Hydration check',
    body: 'Drink 500–750 mL of water and note fluid intake before the next routine check.',
    category: 'hydration',
    priority: 'medium',
    offsetHours: 4,
  },
  {
    id: 'sleep-review',
    title: 'Recovery review',
    body: 'Review sleep quality, rest, and any lingering fatigue before the next shift starts.',
    category: 'wellbeing',
    priority: 'high',
    offsetHours: 8,
  },
  {
    id: 'vitals-check',
    title: 'Vitals check',
    body: 'Log blood pressure, pulse, and temperature to confirm the crew member is within mission baselines.',
    category: 'monitoring',
    priority: 'high',
    offsetHours: 12,
  },
  {
    id: 'air-quality-scan',
    title: 'Cabin air scan',
    body: 'Confirm CO₂ and particulate readings are within the expected mission range.',
    category: 'environment',
    priority: 'medium',
    offsetHours: 24,
  },
]

function normalizeReminderInput(reminder) {
  const now = new Date()
  const dueAt = reminder.dueAt ? new Date(reminder.dueAt) : new Date(now.getTime() + (reminder.offsetHours ?? 0) * 60 * 60 * 1000)

  return {
    id: reminder.id,
    title: reminder.title,
    body: reminder.body,
    category: reminder.category ?? 'general',
    priority: reminder.priority ?? 'medium',
    dueAt: Number.isNaN(dueAt.getTime()) ? now.toISOString() : dueAt.toISOString(),
    completed: Boolean(reminder.completed),
    dismissed: Boolean(reminder.dismissed),
    createdAt: reminder.createdAt ?? now.toISOString(),
  }
}

export function createReminder(reminder = {}) {
  if (!reminder || typeof reminder !== 'object') {
    throw new TypeError('Reminder must be an object.')
  }
  const nextReminder = normalizeReminderInput(reminder)
  if (!nextReminder.id || !nextReminder.title || !nextReminder.body) {
    throw new TypeError('Reminder id, title and body are required.')
  }
  return nextReminder
}

export function generateReminderTemplates({ crewName = 'Crew member', environmentName = 'mission' } = {}) {
  return defaultReminderTemplates.map((template) => ({
    ...template,
    title: template.title,
    body: template.body,
    note: `${crewName} · ${environmentName}`,
  }))
}

export function scheduleReminders({ templates = defaultReminderTemplates, now = new Date() } = {}) {
  return templates.map((template, index) => {
    const offsetHours = Number(template.offsetHours ?? 0)
    const dueAt = new Date(now.getTime() + offsetHours * 60 * 60 * 1000 + index * 60000)

    return createReminder({
      id: template.id ?? `reminder-${index + 1}`,
      title: template.title,
      body: template.body,
      category: template.category ?? 'general',
      priority: template.priority ?? 'medium',
      dueAt: dueAt.toISOString(),
      createdAt: now.toISOString(),
    })
  })
}

export function getDueReminders(reminders = [], now = new Date()) {
  if (!Array.isArray(reminders)) {
    return []
  }

  const currentTime = new Date(now).getTime()
  return reminders
    .filter((reminder) => !reminder.completed && !reminder.dismissed)
    .filter((reminder) => new Date(reminder.dueAt).getTime() <= currentTime)
    .sort((left, right) => new Date(left.dueAt).getTime() - new Date(right.dueAt).getTime())
}

export function snoozeReminder(reminder, hours = 2) {
  const target = reminder && typeof reminder === 'object' ? reminder : createReminder(reminder)
  const nextTime = new Date(target.dueAt)
  nextTime.setHours(nextTime.getHours() + Number(hours || 0))

  return {
    ...target,
    dismissed: false,
    dueAt: nextTime.toISOString(),
  }
}

export function markReminderComplete(reminder) {
  if (!reminder || typeof reminder !== 'object') {
    throw new TypeError('Reminder must be an object.')
  }

  return {
    ...normalizeReminderInput(reminder),
    completed: true,
    dismissed: false,
  }
}
