import { fakerEN as faker } from '@faker-js/faker'
import { getCurrentMockAccount } from './mockSignUp.js'

let mockData

export async function getMockPredictionData() {
  const account = getCurrentMockAccount()
  if (!account) throw new Error('Create an account to view predictions.')
  if (!mockData) {
    const users = [account, ...Array.from({ length: 2 }, () => ({
      id: faker.string.uuid(),
      name: faker.person.fullName(),
      coinBalance: faker.number.int({ min: 100, max: 1000 }),
    }))]
    const predictions = users.map((user, index) => {
      const deadline = index === 2 ? faker.date.recent({ days: 7 }) : faker.date.soon({ days: 14 })
      deadline.setMinutes(deadline.getMinutes() - deadline.getTimezoneOffset())
      return {
        id: faker.string.uuid(),
        creatorId: index === 1 ? user.id : users[0].id,
        question: `Which city will ${user.name} visit next?`,
        outcomes: faker.helpers.uniqueArray(() => faker.location.city(), 2),
        deadline: deadline.toISOString().slice(0, 16),
        bets: [],
        result: null,
      }
    })
    for (let index = 1; index < users.length; index++) {
      const amount = faker.number.int({ min: 1, max: 50 })
      users[index].coinBalance -= amount
      predictions[2].bets.push({ userId: users[index].id, outcome: predictions[2].outcomes[index - 1], amount })
    }
    mockData = { groupName: faker.company.name(), currentUserId: users[0].id, users, predictions }
  }
  if (!mockData.users.includes(account)) mockData.users.push(account)
  mockData.currentUserId = account.id
  for (const prediction of mockData.predictions) {
    prediction.bettingClosed = new Date(prediction.deadline) <= new Date()
  }
  return mockData
}

function findPrediction(data, id) {
  const prediction = data.predictions.find((item) => item.id === id)
  if (!prediction) throw new Error('Prediction not found.')
  return prediction
}

function checkForm({ question, outcomes, deadline }) {
  const cleanOutcomes = outcomes.map((outcome) => outcome.trim())
  if (!question.trim() || cleanOutcomes.length < 2 || cleanOutcomes.some((outcome) => !outcome)) {
    throw new Error('Enter a question and at least two outcomes.')
  }
  if (new Set(cleanOutcomes.map((outcome) => outcome.toLowerCase())).size !== cleanOutcomes.length) {
    throw new Error('Each outcome must be different.')
  }
  if (!deadline || Number.isNaN(new Date(deadline).getTime()) || new Date(deadline) <= new Date()) {
    throw new Error('Choose a betting deadline in the future.')
  }
  return { question: question.trim(), outcomes: cleanOutcomes, deadline }
}

function checkEditable(data, prediction) {
  if (prediction.creatorId !== data.currentUserId) throw new Error('Only the creator can change this prediction.')
  if (prediction.result) throw new Error('Resolved predictions cannot be changed.')
  if (prediction.bets.length > 0) throw new Error('This prediction cannot be changed after someone bets.')
}

export async function createMockPrediction(values) {
  const data = await getMockPredictionData()
  const fields = checkForm(values)
  const prediction = { id: faker.string.uuid(), creatorId: data.currentUserId, ...fields, bets: [], result: null }
  data.predictions.push(prediction)
  return prediction
}

export async function editMockPrediction(id, values) {
  const data = await getMockPredictionData()
  const prediction = findPrediction(data, id)
  checkEditable(data, prediction)
  const fields = checkForm(values)
  prediction.question = fields.question
  prediction.outcomes = fields.outcomes
  prediction.deadline = fields.deadline
}

export async function deleteMockPrediction(id) {
  const data = await getMockPredictionData()
  checkEditable(data, findPrediction(data, id))
  data.predictions = data.predictions.filter((prediction) => prediction.id !== id)
}

export async function placeMockBet(id, outcome, amount) {
  const data = await getMockPredictionData()
  const prediction = findPrediction(data, id)
  const user = data.users.find((item) => item.id === data.currentUserId)
  if (prediction.result || new Date(prediction.deadline) <= new Date()) throw new Error('Betting is closed.')
  if (prediction.creatorId === user.id) throw new Error('You cannot bet on your own prediction.')
  if (prediction.bets.some((bet) => bet.userId === user.id)) throw new Error('You can only bet once on each prediction.')
  if (!prediction.outcomes.includes(outcome)) throw new Error('Choose an outcome.')
  const coins = Number(amount)
  if (!Number.isInteger(coins) || coins < 1) throw new Error('Bet at least one whole coin.')
  if (coins > user.coinBalance) throw new Error('You do not have enough coins.')
  user.coinBalance -= coins
  prediction.bets.push({ userId: user.id, outcome, amount: coins })
}

export async function resolveMockPrediction(id, outcome) {
  const data = await getMockPredictionData()
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
      const user = data.users.find((item) => item.id === bet.userId)
      user.coinBalance += bet.amount
    }
    prediction.refunded = pool > 0
  } else {
    const winners = prediction.bets.filter((bet) => bet.outcome === outcome)
    let remaining = pool
    winners.forEach((bet, index) => {
      let payout = Math.floor(pool * bet.amount / winningPool)
      if (index === winners.length - 1) payout = remaining
      const user = data.users.find((item) => item.id === bet.userId)
      user.coinBalance += payout
      remaining -= payout
    })
  }
  prediction.result = outcome
}
