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

// submit the final outcome
export function resolvePrediction(data, id, outcome) {
  return apiRequest(`/api/predictions/${id}/resolve`, {
    method: 'POST', body: { userId: data.currentUserId, outcome }
  })
}

// submit the chosen outcome and coins
export function placeBet(data, id, outcome, amount) {
  return apiRequest(`/api/predictions/${id}/bets`, {
    method: 'POST', body: { userId: data.currentUserId, outcome, amount }
  })
}

// Send a comment to the backend for the selected prediction.
export function addComment(data, predictionId, text) {
  return apiRequest(`/api/predictions/${predictionId}/comments`, {
    method: 'POST',
    body: {
      userId: data.currentUserId,
      text
    }
  })
}
// Load the bets saved for this account.
export function getMyBets(userId) {
  return apiRequest(`/api/users/${encodeURIComponent(userId)}/bets`)
}

export const maxOutcomes = 5
export const maxOutcomeLength = 250
export const maxQuestionLength = 250
export const maxStake = 1000

export function getPredictionErrors({ question, outcomes, deadline, stake }) {
  const errors = {}
  const cleanOutcomes = outcomes.map((outcome) => outcome.trim())
  if (!question.trim()) errors.question = 'Enter a question.'
  else if (question.length > maxQuestionLength) errors.question = 'Keep the question within 250 characters.'
  if (!Number.isSafeInteger(Number(stake)) || Number(stake) < 1 || Number(stake) > maxStake) {
    errors.stake = 'Enter a whole number of coins from 1 to 1,000.'
  }
  if (cleanOutcomes.length < 2 || cleanOutcomes.length > maxOutcomes || cleanOutcomes.some((outcome) => !outcome)) {
    errors.outcomes = 'Enter between two and five outcomes.'
  } else if (outcomes.some((outcome) => outcome.length > maxOutcomeLength)) {
    errors.outcomes = 'Keep each outcome within 250 characters.'
  } else if (new Set(cleanOutcomes.map((outcome) => outcome.toLowerCase())).size !== cleanOutcomes.length) {
    errors.outcomes = 'Each outcome must be different.'
  }
  const latestDeadline = new Date()
  latestDeadline.setFullYear(latestDeadline.getFullYear() + 1)
  const chosenDeadline = new Date(deadline)
  if (!deadline || Number.isNaN(chosenDeadline.getTime()) || chosenDeadline <= new Date() || chosenDeadline > latestDeadline) {
    errors.deadline = 'Choose a future deadline within the next year.'
  }
  return errors
}

// Use the saved result and payout to build the badge text.
export function getBetResult(prediction, userId) {
  const bet = prediction.bets.find((item) => item.userId === userId)

  if (!bet) {
    return { label: 'No bet', net: null }
  }

  if (!prediction.result) {
    return { label: 'Pending', net: null }
  }

  let label = 'Lost'

  if (prediction.refunded) {
    label = 'Refunded'
  } else if (bet.outcome === prediction.result) {
    label = 'Won'
  }

  // Subtract the original stake from the payout saved by the backend.
  const net = Number.isFinite(bet.payout) ? bet.payout - bet.amount : null
  return { label, net }
}