import { apiRequest } from './api'

// load a group's predictions and the selected prediction
export async function getPredictionData(groupId, userId, predictionId) {
  const query = `?userId=${encodeURIComponent(userId)}`
  const data = await apiRequest(`/api/groups/${encodeURIComponent(groupId)}/predictions${query}`)
  if (predictionId && !data.predictions.some((prediction) => prediction.id === predictionId)) {
    throw new Error('Prediction not found.')
  }
  return data
}
