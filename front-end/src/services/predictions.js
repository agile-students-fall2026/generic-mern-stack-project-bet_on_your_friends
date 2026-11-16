import { apiRequest } from './api'

// load a group's predictions and the selected prediction
export async function getPredictionData(groupId, userId, predictionId) {
  const query = `?userId=${encodeURIComponent(userId)}`
  const data = await apiRequest(`/api/groups/${encodeURIComponent(groupId)}/predictions${query}`)
  if (predictionId) {
    const prediction = await apiRequest(`/api/predictions/${encodeURIComponent(predictionId)}${query}`)
    if (prediction.groupId !== groupId) throw new Error('Prediction not found.')
    data.predictions = data.predictions.map((item) => item.id === prediction.id ? prediction : item)
  }
  return data
}
