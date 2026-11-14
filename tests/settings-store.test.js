import assert from 'node:assert/strict'
import test from 'node:test'

const storage = new Map()
globalThis.window = {
  localStorage: {
    getItem(key) {
      return storage.has(key) ? storage.get(key) : null
    },
    setItem(key, value) {
      storage.set(key, value)
    },
    removeItem(key) {
      storage.delete(key)
    },
  },
}

const { completeProfileSetup, resetSettings } = await import('../src/store/useSettingsStore.js')

test('first-use profile setup is required and saved with settings', () => {
  assert.equal(resetSettings().profileSetupComplete, false)
  assert.throws(() => completeProfileSetup({ crewId: 'CREW-7', displayName: ' ' }), /Display name/)

  const settings = completeProfileSetup({ crewId: ' CREW-7 ', displayName: ' Ada ' })

  assert.equal(settings.profileSetupComplete, true)
  assert.deepEqual(settings.crewProfile, { crewId: 'CREW-7', displayName: 'Ada' })
  assert.deepEqual(JSON.parse(storage.get('astro-health-settings')).crewProfile, settings.crewProfile)
  assert.equal(JSON.parse(storage.get('astro-health-settings')).profileSetupComplete, true)
})

test('resetting settings resets the profile setup flag', () => {
  completeProfileSetup({ crewId: 'CREW-7', displayName: 'Ada' })

  const settings = resetSettings()

  assert.equal(settings.profileSetupComplete, false)
  assert.deepEqual(settings.crewProfile, { crewId: '', displayName: '' })
})
