import * as tf from '@tensorflow/tfjs'
import { FEATURE_NAMES } from './features.js'
import { encodeCDSSRecord, normalizeEcgWindow, validateSleepWindow } from './preprocessing.js'

const modelIds = new Set(['cdss-mlp', 'ecg_model', 'sleep-cnn'])
const modelAssetDirectories = {
  'cdss-mlp': 'cdss-mlp',
  ecg_model: 'ecg-cnn',
  'sleep-cnn': 'sleep-cnn',
}
const modelPromises = new Map()

function reportModelStatus(modelId, status, error = null) {
  self.postMessage({ type: 'model-status', modelId, status, error })
}

async function loadModel(modelId) {
  if (!modelIds.has(modelId)) {
    throw new TypeError(`Unsupported model "${modelId}".`)
  }

  if (!modelPromises.has(modelId)) {
    const loadPromise = (async () => {
      reportModelStatus(modelId, 'loading')
      try {
        const baseUrl = import.meta.env.BASE_URL.replace(/\/$/, '')
        const modelAssetBase = new URL(
          `${baseUrl}/models/${modelAssetDirectories[modelId]}/`,
          self.location.origin,
        ).toString()
        const metaUrl = `${modelAssetBase}meta.json`
        const metaResponse = await fetch(metaUrl)
        if (!metaResponse.ok) {
          throw new Error(`Could not load ${modelId} metadata (${metaResponse.status}).`)
        }
        let meta
        try {
          meta = JSON.parse(await metaResponse.text())
        } catch {
          throw new Error(`Model metadata at ${metaUrl} was not valid JSON.`)
        }
        if (modelId === 'cdss-mlp' && JSON.stringify(meta.featureNames) !== JSON.stringify(FEATURE_NAMES)) {
          throw new Error('CDSS model feature order does not match the application feature specification.')
        }

        const cacheUrl = meta.modelVersion
          ? `indexeddb://astrohealth-${modelId}-${meta.modelVersion}`
          : null
        let model

        if (cacheUrl && typeof indexedDB !== 'undefined') {
          try {
            model = await tf.loadLayersModel(cacheUrl)
          } catch (error) {
            console.info(`No usable cached ${modelId} model; loading the bundled model.`, error)
          }
        }

        if (!model) {
          model = await tf.loadLayersModel(`${modelAssetBase}model.json`)
          if (cacheUrl && typeof indexedDB !== 'undefined') {
            try {
              await model.save(cacheUrl)
            } catch (error) {
              console.warn(`Could not cache the ${modelId} model in IndexedDB.`, error)
            }
          }
        }

        reportModelStatus(modelId, 'ready')
        return { model, meta }
      } catch (error) {
        reportModelStatus(modelId, 'error', error instanceof Error ? error.message : String(error))
        throw error
      }
    })()
    modelPromises.set(modelId, loadPromise)
    loadPromise.catch(() => modelPromises.delete(modelId))
  }

  return modelPromises.get(modelId)
}

function getClassNames(meta) {
  const classNames = meta.classNames ?? meta.classes
  if (!Array.isArray(classNames) || classNames.length === 0) {
    throw new Error('Model metadata does not contain class names.')
  }
  return classNames
}

function prepareInput(modelId, input) {
  if (modelId === 'cdss-mlp') {
    if (!input || typeof input !== 'object') {
      throw new TypeError('CDSS input is required.')
    }
    return { values: encodeCDSSRecord(input.record), shape: 'vector' }
  }
  if (modelId === 'ecg_model') {
    return { values: normalizeEcgWindow(input?.samples), shape: 'ecg' }
  }
  return { values: validateSleepWindow(input?.samples), shape: 'sleep' }
}

function runPrediction(model, modelId, values, shape) {
  return tf.tidy(() => {
    let tensor
    if (shape === 'vector') tensor = tf.tensor2d([values])
    else if (shape === 'ecg') tensor = tf.tensor3d([values.map((value) => [value])])
    else tensor = tf.tensor3d([values])

    const output = model.predict(tensor)
    if (Array.isArray(output)) {
      throw new Error(`${modelId} returned multiple outputs; a single classification output is required.`)
    }
    return Array.from(output.dataSync())
  })
}

async function predict(modelId, input) {
  const { model, meta } = await loadModel(modelId)
  const { values, shape } = prepareInput(modelId, input)
  const scores = runPrediction(model, modelId, values, shape)
  const classNames = getClassNames(meta)
  if (scores.length !== classNames.length) {
    throw new Error(`${modelId} output count does not match its class metadata.`)
  }

  return classNames
    .map((name, index) => ({
      name,
      description: meta.classDescriptions?.[name],
      probability: scores[index],
    }))
    .sort((a, b) => b.probability - a.probability)
}

self.addEventListener('message', async ({ data }) => {
  const { id, modelId, input } = data
  try {
    await tf.ready()
    const result = await predict(modelId, input)
    self.postMessage({ id, result })
  } catch (error) {
    self.postMessage({
      id,
      error: error instanceof Error ? error.message : String(error),
    })
  }
})