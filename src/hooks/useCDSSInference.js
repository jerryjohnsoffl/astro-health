import { useCallback, useState } from 'react'
import { predictCDSS } from '../ml/workerApi.js'

export function useCDSSInference() {
  const [predictions, setPredictions] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const runDiagnosis = useCallback(async (record) => {
    setLoading(true)
    setError(null)
    try {
      const result = await predictCDSS(record)
      setPredictions(result)
      return result
    } catch (inferenceError) {
      setError(inferenceError.message)
      setPredictions(null)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  return { runDiagnosis, predictions, loading, error }
}
