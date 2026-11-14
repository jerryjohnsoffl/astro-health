export function readPersisted(key) {
  if (typeof window === 'undefined') {
    return null
  }

  let serialized
  try {
    serialized = window.localStorage.getItem(key)
  } catch (error) {
    console.error(`Unable to read local storage key "${key}".`, error)
    return null
  }

  if (serialized === null) {
    return null
  }

  try {
    return JSON.parse(serialized)
  } catch (error) {
    console.error(`Unable to parse saved data for "${key}".`, error)
    window.localStorage.removeItem(key)
    return null
  }
}

export function writePersisted(key, value) {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(key, JSON.stringify(value))
}
