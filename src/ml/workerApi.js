let worker
let nextRequestId = 0
const pendingRequests = new Map()
const modelIds = ['cdss-mlp', 'ecg_model', 'sleep-cnn']
const modelListeners = new Set()
let modelStatusSnapshot = Object.fromEntries(
  modelIds.map((modelId) => [modelId, { status: 'not-loaded', error: null }]),
)

function updateModelStatus(modelId, status, error = null) {
  if (!modelIds.includes(modelId)) return
  modelStatusSnapshot = {
    ...modelStatusSnapshot,
    [modelId]: { status, error },
  }
  modelListeners.forEach((listener) => listener())
}

export function subscribeToModelStatus(listener) {
  modelListeners.add(listener)
  return () => modelListeners.delete(listener)
}

export function getModelStatusSnapshot() {
  return modelStatusSnapshot
}

function getWorker() {
  if (typeof Worker === 'undefined') {
    throw new Error('This browser does not support background model inference.')
  }
  if (worker) return worker

  worker = new Worker(new URL('./tf-worker.js', import.meta.url), { type: 'module' })
  worker.addEventListener('message', ({ data }) => {
    if (data.type === 'model-status') {
      updateModelStatus(data.modelId, data.status, data.error)
      return
    }

    const pending = pendingRequests.get(data.id)
    if (!pending) return

    pendingRequests.delete(data.id)
    if (data.error) {
      pending.reject(new Error(data.error))
      return
    }
    pending.resolve(data.result)
  })
  worker.addEventListener('error', (event) => {
    const error = new Error(event.message || 'The model worker failed.')
    pendingRequests.forEach(({ reject }) => reject(error))
    pendingRequests.clear()
    modelIds.forEach((modelId) => updateModelStatus(modelId, 'error', error.message))
    worker = undefined
  })

  return worker
}

export function predictModel(modelId, input) {
  return new Promise((resolve, reject) => {
    let activeWorker
    try {
      activeWorker = getWorker()
    } catch (error) {
      reject(error)
      return
    }

    const id = ++nextRequestId
    pendingRequests.set(id, { resolve, reject })
    activeWorker.postMessage({ id, modelId, input })
  })
}

export function predictCDSS(record) {
  return predictModel('cdss-mlp', { record })
}

export function predictECG(samples) {
  return predictModel('ecg_model', { samples })
}

export function predictSleep(samples) {
  return predictModel('sleep-cnn', { samples })
}
