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

// convert form values for the server
function predictionBody(data, values) {
  return {
    ...values,
    userId: data.currentUserId,
    stake: Number(values.stake),
    deadline: new Date(values.deadline).toISOString()
  }
}

// post a new prediction
export function createPrediction(data, values) {
  return apiRequest(`/api/groups/${data.group.id}/predictions`, {
    method: 'POST', body: predictionBody(data, values)
  })
}
