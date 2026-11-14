import { useSyncExternalStore } from 'react'
import { readPersisted, writePersisted } from './persist.js'

const STORAGE_KEY = 'astro-health-settings'
const DEFAULT_SETTINGS = Object.freeze({
  environment: 'mars-transit',
  units: 'metric',
  crewProfile: Object.freeze({
    crewId: '',
    displayName: '',
  }),
})

function isRecord(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function normalizeSettings(value) {
  if (!isRecord(value)) {
    throw new TypeError('Settings must be an object.')
  }

  const candidate = value
  const crewProfile = candidate.crewProfile

  if (typeof candidate.environment !== 'string' || candidate.environment.trim() === '') {
    throw new TypeError('Settings environment must be a non-empty string.')
  }

  if (candidate.units !== 'metric' && candidate.units !== 'imperial') {
    throw new TypeError('Settings units must be "metric" or "imperial".')
  }

  if (!isRecord(crewProfile)) {
    throw new TypeError('Crew profile must be an object.')
  }

  if (
    (crewProfile.crewId !== undefined && typeof crewProfile.crewId !== 'string') ||
    (crewProfile.displayName !== undefined && typeof crewProfile.displayName !== 'string')
  ) {
    throw new TypeError('Crew ID and display name must be strings.')
  }

  return {
    environment: candidate.environment.trim(),
    units: candidate.units,
    crewProfile: {
      ...crewProfile,
      crewId: crewProfile.crewId ?? DEFAULT_SETTINGS.crewProfile.crewId,
      displayName: crewProfile.displayName ?? DEFAULT_SETTINGS.crewProfile.displayName,
    },
  }
}

function restoreSettings() {
  const persisted = readPersisted(STORAGE_KEY)
  if (persisted === null) {
    return normalizeSettings(DEFAULT_SETTINGS)
  }

  try {
    return normalizeSettings(persisted)
  } catch (error) {
    console.error('Saved AstroHealth settings are invalid; using defaults.', error)
    return normalizeSettings(DEFAULT_SETTINGS)
  }
}

let settingsSnapshot = restoreSettings()
const subscribers = new Set()

function subscribe(callback) {
  subscribers.add(callback)
  return () => subscribers.delete(callback)
}

function getSnapshot() {
  return settingsSnapshot
}

function commitSettings(nextSettings) {
  const normalized = normalizeSettings(nextSettings)
  writePersisted(STORAGE_KEY, normalized)
  settingsSnapshot = normalized
  subscribers.forEach((callback) => callback())
  return settingsSnapshot
}

export function updateSettings(updates) {
  if (!isRecord(updates)) {
    throw new TypeError('Settings updates must be an object.')
  }

  if (updates.crewProfile !== undefined && !isRecord(updates.crewProfile)) {
    throw new TypeError('Crew profile updates must be an object.')
  }

  return commitSettings({
    ...settingsSnapshot,
    ...updates,
    crewProfile: {
      ...settingsSnapshot.crewProfile,
      ...(isRecord(updates.crewProfile) ? updates.crewProfile : {}),
    },
  })
}

export function setEnvironment(environment) {
  if (typeof environment !== 'string' || environment.trim() === '') {
    throw new TypeError('Environment must be a non-empty string.')
  }
  return updateSettings({ environment })
}

export function setUnits(units) {
  if (units !== 'metric' && units !== 'imperial') {
    throw new TypeError('Units must be "metric" or "imperial".')
  }
  return updateSettings({ units })
}

export function setCrewProfile(crewProfile) {
  if (!isRecord(crewProfile)) {
    throw new TypeError('Crew profile must be an object.')
  }
  return updateSettings({ crewProfile })
}

export function resetSettings() {
  return commitSettings(DEFAULT_SETTINGS)
}

export function useSettingsStore() {
  const settings = useSyncExternalStore(subscribe, getSnapshot, getSnapshot)

  return {
    settings,
    setEnvironment,
    setUnits,
    setCrewProfile,
    updateSettings,
    resetSettings,
  }
}
