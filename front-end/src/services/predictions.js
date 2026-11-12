import { apiRequest } from './api'

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

function predictionBody(data, values) {
  return {
    ...values,
    userId: data.currentUserId,
    stake: Number(values.stake),
    deadline: new Date(values.deadline).toISOString()
  }
}

export function createPrediction(data, values) {
  return apiRequest(`/api/groups/${data.group.id}/predictions`, {
    method: 'POST', body: predictionBody(data, values)
  })
}

export function editPrediction(data, id, values) {
  return apiRequest(`/api/predictions/${id}`, {
    method: 'PATCH', body: predictionBody(data, values)
  })
}

export function deletePrediction(data, id) {
  return apiRequest(`/api/predictions/${id}`, {
    method: 'DELETE', body: { userId: data.currentUserId }
  })
}

export function placeBet(data, id, outcome, amount) {
  return apiRequest(`/api/predictions/${id}/bets`, {
    method: 'POST', body: { userId: data.currentUserId, outcome, amount }
  })
}

export function resolvePrediction(data, id, outcome) {
  return apiRequest(`/api/predictions/${id}/resolve`, {
    method: 'POST', body: { userId: data.currentUserId, outcome }
  })
}
