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

// save changes to a prediction
export function editPrediction(data, id, values) {
  return apiRequest(`/api/predictions/${id}`, {
    method: 'POST', body: predictionBody(data, values)
  })
}

// delete a prediction as its creator
export function deletePrediction(data, id) {
  return apiRequest(`/api/predictions/${id}`, {
    method: 'DELETE', body: { userId: data.currentUserId }
  })
}
