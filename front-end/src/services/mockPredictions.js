import { fakerEN as faker } from '@faker-js/faker'
import { getMockAccounts, getRegisteredMockAccount, saveMockAccount } from './mockSignUp.js'
import { getMockGroupById, updateMockPredictionCount } from './mockGroups.js'

const storageKey = 'betOnYourFriendsPredictions'
const groupPredictions = JSON.parse(sessionStorage.getItem(storageKey) || '{}')
export const maxOutcomes = 5
export const maxOutcomeLength = 250
// Same limits in the comment form and when saving a comment.
export const minCommentLength = 1
export const maxCommentLength = 500

export async function getMockPredictionData(groupId, user) {
  const group = await getMockGroupById(groupId)
  const account = getRegisteredMockAccount(user.email) || user
  if (!group || !group.memberIds.includes(account.id)) throw new Error('Group not found.')
  saveMockAccount(account)
  for (const id of group.memberIds) {
    if (!getMockAccounts().some((member) => member.id === id)) {
      saveMockAccount({ id, name: faker.person.fullName(), email: `${id}@example.test`, coinBalance: faker.number.int({ min: 100, max: 1000 }) })
    }
  }
  const members = getMockAccounts().filter((member) => group.memberIds.includes(member.id))
  if (!groupPredictions[groupId]) {
    groupPredictions[groupId] = Array.from({ length: group.openPredictions }, (_value, index) => {
      const creator = members[index % members.length]
      const deadline = faker.date.soon({ days: 14 })
      deadline.setMinutes(deadline.getMinutes() - deadline.getTimezoneOffset())
      return {
        id: crypto.randomUUID(),
        creatorId: creator.id,
        question: `Which city will ${creator.displayName || creator.name} visit next?`,
        outcomes: faker.helpers.uniqueArray(() => faker.location.city(), 2),
        deadline: deadline.toISOString().slice(0, 16),
        bets: [],
        result: null,
      }
    })
  }
  const data = { group, users: getMockAccounts(), currentUserId: account.id, predictions: groupPredictions[groupId] }
  for (const prediction of data.predictions) {
    // Older saved predictions might not have comments yet.
    // Only add an empty list if one does not already exist.
    if (!prediction.comments) {
      prediction.comments = []
    }

    prediction.bettingClosed = new Date(prediction.deadline) <= new Date()
  }
  await savePredictionData(data)
  return data
}

async function savePredictionData(data) {
  groupPredictions[data.group.id] = data.predictions
  sessionStorage.setItem(storageKey, JSON.stringify(groupPredictions))
  const count = data.predictions.filter((prediction) => !prediction.result && new Date(prediction.deadline) > new Date()).length
  await updateMockPredictionCount(data.group.id, count)
}

function findPrediction(data, id) {
  const prediction = data.predictions.find((item) => item.id === id)
  if (!prediction) throw new Error('Prediction not found.')
  return prediction
}

export function getPredictionErrors({ question, outcomes, deadline, stake }) {
  const errors = {}
  const cleanOutcomes = outcomes.map((outcome) => outcome.trim())
  if (!question.trim()) errors.question = 'Enter a question.'
  if (!Number.isSafeInteger(Number(stake)) || Number(stake) < 1) {
    errors.stake = 'Enter a positive whole number of coins.'
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

function checkForm(values) {
  const errors = getPredictionErrors(values)
  if (Object.keys(errors).length > 0) throw new Error(Object.values(errors)[0])
  return { question: values.question.trim(), outcomes: values.outcomes.map((outcome) => outcome.trim()), deadline: values.deadline, stake: Number(values.stake) }
}

function checkEditable(data, prediction) {
  if (prediction.creatorId !== data.currentUserId) throw new Error('Only the creator can change this prediction.')
  if (prediction.result) throw new Error('Resolved predictions cannot be changed.')
  if (prediction.bets.length > 0) throw new Error('This prediction cannot be changed after someone bets.')
}

export async function createMockPrediction(data, values) {
  const fields = checkForm(values)
  const prediction = { id: crypto.randomUUID(), creatorId: data.currentUserId, ...fields, bets: [], result: null }

  // New prediction starts with no comments.
  prediction.comments = []

  data.predictions.push(prediction)
  await savePredictionData(data)
  return prediction
}

export async function editMockPrediction(data, id, values) {
  const prediction = findPrediction(data, id)
  checkEditable(data, prediction)
  const fields = checkForm(values)
  prediction.question = fields.question
  prediction.outcomes = fields.outcomes
  prediction.deadline = fields.deadline
  prediction.stake = fields.stake
  await savePredictionData(data)
}

export async function deleteMockPrediction(data, id) {
  checkEditable(data, findPrediction(data, id))
  data.predictions = data.predictions.filter((prediction) => prediction.id !== id)
  await savePredictionData(data)
}

export async function placeMockBet(data, id, outcome, amount) {
  const prediction = findPrediction(data, id)
  const user = getMockAccounts().find((item) => item.id === data.currentUserId)
  if (prediction.result || new Date(prediction.deadline) <= new Date()) throw new Error('Betting is closed.')
  if (prediction.creatorId === user.id) throw new Error('You cannot bet on your own prediction.')
  if (prediction.bets.some((bet) => bet.userId === user.id)) throw new Error('You can only bet once on each prediction.')
  if (!prediction.outcomes.includes(outcome)) throw new Error('Choose an outcome.')
  const coins = Number(amount)
  if (!Number.isSafeInteger(coins) || coins < 1) throw new Error('Bet at least one whole coin.')
  if (prediction.stake !== undefined && coins !== prediction.stake) {
    throw new Error(`This prediction requires a bet of ${prediction.stake} coins.`)
  }
  if (coins > user.coinBalance) throw new Error('You do not have enough coins.')
  user.coinBalance -= coins
  prediction.bets.push({ userId: user.id, outcome, amount: coins })
  saveMockAccount(user)
  await savePredictionData(data)
}

export async function resolveMockPrediction(data, id, outcome) {
  const prediction = findPrediction(data, id)
  if (prediction.creatorId !== data.currentUserId) throw new Error('Only the creator can resolve this prediction.')
  if (prediction.result) throw new Error('This prediction has already been resolved.')
  if (!prediction.outcomes.includes(outcome)) throw new Error('Choose the final outcome.')

  let pool = 0
  let winningPool = 0
  for (const bet of prediction.bets) {
    pool += bet.amount
    if (bet.outcome === outcome) winningPool += bet.amount
  }
  if (winningPool === 0) {
    for (const bet of prediction.bets) {
      const user = getMockAccounts().find((item) => item.id === bet.userId)
      user.coinBalance += bet.amount
      saveMockAccount(user)
    }
    prediction.refunded = pool > 0
  } else {
    const winners = prediction.bets.filter((bet) => bet.outcome === outcome)
    let remaining = pool
    winners.forEach((bet, index) => {
      let payout = Math.floor(pool * bet.amount / winningPool)
      if (index === winners.length - 1) payout = remaining
      const user = getMockAccounts().find((item) => item.id === bet.userId)
      user.coinBalance += payout
      saveMockAccount(user)
      remaining -= payout
    })
  }
  prediction.result = outcome
  await savePredictionData(data)
}

// Called when someone presses Send comment.
export async function addMockComment(data, predictionId, text) {
  // Check that the person still belongs to this group.
  const group = await getMockGroupById(data.group.id)

  if (!group || !group.memberIds.includes(data.currentUserId)) {
    throw new Error('You must belong to this group to comment.')
  }

  // Spaces by themselves should not count as a comment.
  if (text.trim().length < minCommentLength) {
    throw new Error('Write at least one character before sending.')
  }

  // Check the length here too, so an overlong comment cannot be saved.
  if (text.length > maxCommentLength) {
    throw new Error('Keep your comment within 500 characters.')
  }

  // Find the prediction the person is commenting on.
  const prediction = findPrediction(data, predictionId)

  if (!prediction.comments) {
    prediction.comments = []
  }

  // Save who posted it, what they wrote, and when they posted it.
  prediction.comments.push({
    id: crypto.randomUUID(),
    userId: data.currentUserId,
    text: text.trim(),
    createdAt: new Date().toISOString()
  })

  // Reuse the existing save function so comments stay after refreshing.
  await savePredictionData(data)
}