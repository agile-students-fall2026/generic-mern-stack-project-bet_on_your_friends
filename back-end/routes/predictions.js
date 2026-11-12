const express = require('express')
const { randomUUID } = require('crypto')
const { db, toPublicUser } = require('../data')

const router = express.Router()

function getMemberData(req, res) {
  const prediction = db.predictions.find((item) => item.id === req.params.predictionId)
  if (req.params.predictionId && !prediction) {
    res.status(404).json({ error: 'Prediction not found.' })
    return null
  }

  const groupId = prediction ? prediction.groupId : req.params.groupId
  const group = db.groups.find((item) => item.id === groupId)
  if (!group) {
    res.status(404).json({ error: 'Group not found.' })
    return null
  }

  const userId = req.body?.userId ?? req.query.userId
  const user = db.users.find((account) => account.id === userId)
  if (!user) {
    res.status(404).json({ error: 'This account does not exist.' })
    return null
  }
  if (!group.memberIds.includes(user.id)) {
    res.status(403).json({ error: 'You must belong to this group.' })
    return null
  }

  return { group, user, prediction }
}

function predictionError(values) {
  const { question, outcomes, deadline, stake } = values ?? {}
  if (typeof question !== 'string' || !question.trim()) return 'Enter a question.'
  if (!Array.isArray(outcomes) || outcomes.length < 2 || outcomes.length > 5 ||
      outcomes.some((outcome) => typeof outcome !== 'string' || !outcome.trim())) {
    return 'Enter between two and five outcomes.'
  }
  if (outcomes.some((outcome) => outcome.length > 250)) return 'Keep each outcome within 250 characters.'
  const cleanOutcomes = outcomes.map((outcome) => outcome.trim().toLowerCase())
  if (new Set(cleanOutcomes).size !== cleanOutcomes.length) return 'Each outcome must be different.'
  if (!Number.isSafeInteger(stake) || stake < 1) return 'Enter a positive whole number of coins.'

  const chosenDeadline = new Date(deadline)
  const latestDeadline = new Date()
  latestDeadline.setFullYear(latestDeadline.getFullYear() + 1)
  if (typeof deadline !== 'string' || !deadline || Number.isNaN(chosenDeadline.getTime()) ||
      chosenDeadline <= new Date() || chosenDeadline > latestDeadline) {
    return 'Choose a future deadline within the next year.'
  }
  return ''
}

function editError(prediction, user) {
  if (prediction.creatorId !== user.id) return 'Only the creator can change this prediction.'
  if (prediction.result) return 'Resolved predictions cannot be changed.'
  if (prediction.bets.length > 0) return 'This prediction cannot be changed after someone bets.'
  return ''
}

function updateCount(group) {
  group.openPredictions = db.predictions.filter((prediction) =>
    prediction.groupId === group.id && !prediction.result && new Date(prediction.deadline) > new Date()
  ).length
}

function publicPrediction(prediction) {
  return { ...prediction, bettingClosed: new Date(prediction.deadline) <= new Date() }
}

router.get('/groups/:groupId/predictions', (req, res) => {
  const data = getMemberData(req, res)
  if (!data) return
  const { group, user } = data
  const predictions = db.predictions.filter((prediction) => prediction.groupId === group.id)
  const users = db.users.filter((person) => group.memberIds.includes(person.id) ||
    predictions.some((prediction) => prediction.creatorId === person.id ||
      prediction.bets.some((bet) => bet.userId === person.id)))
  updateCount(group)
  res.json({ group, currentUserId: user.id, users: users.map(toPublicUser), predictions: predictions.map(publicPrediction) })
})

router.get('/predictions/:predictionId', (req, res) => {
  const data = getMemberData(req, res)
  if (!data) return
  res.json(publicPrediction(data.prediction))
})

router.post('/groups/:groupId/predictions', (req, res) => {
  const data = getMemberData(req, res)
  if (!data) return
  const error = predictionError(req.body)
  if (error) return res.status(400).json({ error })
  const { question, outcomes, deadline, stake } = req.body
  const prediction = {
    id: randomUUID(),
    groupId: data.group.id,
    creatorId: data.user.id,
    question: question.trim(),
    outcomes: outcomes.map((outcome) => outcome.trim()),
    deadline: new Date(deadline).toISOString(),
    stake,
    bets: [],
    comments: [],
    result: null
  }
  db.predictions.push(prediction)
  updateCount(data.group)
  res.status(201).json(publicPrediction(prediction))
})

router.patch('/predictions/:predictionId', (req, res) => {
  const data = getMemberData(req, res)
  if (!data) return
  const error = editError(data.prediction, data.user)
  if (error) return res.status(403).json({ error })
  const formError = predictionError(req.body)
  if (formError) return res.status(400).json({ error: formError })
  const { question, outcomes, deadline, stake } = req.body
  data.prediction.question = question.trim()
  data.prediction.outcomes = outcomes.map((outcome) => outcome.trim())
  data.prediction.deadline = new Date(deadline).toISOString()
  data.prediction.stake = stake
  updateCount(data.group)
  res.json(publicPrediction(data.prediction))
})

router.delete('/predictions/:predictionId', (req, res) => {
  const data = getMemberData(req, res)
  if (!data) return
  const error = editError(data.prediction, data.user)
  if (error) return res.status(403).json({ error })
  db.predictions = db.predictions.filter((prediction) => prediction.id !== data.prediction.id)
  updateCount(data.group)
  res.json({ message: 'Prediction deleted.' })
})

router.post('/predictions/:predictionId/bets', (req, res) => {
  const data = getMemberData(req, res)
  if (!data) return
  const { prediction, user } = data
  const { outcome, amount } = req.body ?? {}
  if (prediction.result || new Date(prediction.deadline) <= new Date()) {
    return res.status(400).json({ error: 'Betting is closed.' })
  }
  if (prediction.creatorId === user.id) {
    return res.status(403).json({ error: 'You cannot bet on your own prediction.' })
  }
  if (prediction.bets.some((bet) => bet.userId === user.id)) {
    return res.status(400).json({ error: 'You can only bet once on each prediction.' })
  }
  if (!prediction.outcomes.includes(outcome)) {
    return res.status(400).json({ error: 'Choose an outcome.' })
  }
  if (!Number.isSafeInteger(amount) || amount < 1) {
    return res.status(400).json({ error: 'Bet at least one whole coin.' })
  }
  if (amount !== prediction.stake) {
    return res.status(400).json({ error: `This prediction requires a bet of ${prediction.stake} coins.` })
  }
  if (amount > user.coinBalance) {
    return res.status(400).json({ error: 'You do not have enough coins.' })
  }
  user.coinBalance -= amount
  prediction.bets.push({ userId: user.id, outcome, amount, placedAt: new Date().toISOString() })
  res.json({ prediction: publicPrediction(prediction), user: toPublicUser(user) })
})

router.post('/predictions/:predictionId/resolve', (req, res) => {
  const data = getMemberData(req, res)
  if (!data) return
  const { prediction, user } = data
  const { outcome } = req.body ?? {}
  if (prediction.creatorId !== user.id) {
    return res.status(403).json({ error: 'Only the creator can resolve this prediction.' })
  }
  if (prediction.result) return res.status(400).json({ error: 'This prediction has already been resolved.' })
  if (!prediction.outcomes.includes(outcome)) return res.status(400).json({ error: 'Choose the final outcome.' })

  let pool = 0
  let winningPool = 0
  for (const bet of prediction.bets) {
    pool += bet.amount
    if (bet.outcome === outcome) winningPool += bet.amount
  }
  if (winningPool === 0) {
    for (const bet of prediction.bets) {
      db.users.find((person) => person.id === bet.userId).coinBalance += bet.amount
      bet.payout = bet.amount
    }
    prediction.refunded = pool > 0
  } else {
    const winners = prediction.bets.filter((bet) => bet.outcome === outcome)
    let remaining = pool
    winners.forEach((bet, index) => {
      let payout = Math.floor(pool * bet.amount / winningPool)
      if (index === winners.length - 1) payout = remaining
      db.users.find((person) => person.id === bet.userId).coinBalance += payout
      bet.payout = payout
      remaining -= payout
    })
  }
  for (const bet of prediction.bets) {
    if (bet.payout === undefined) bet.payout = 0
  }
  prediction.result = outcome
  updateCount(data.group)
  res.json({ prediction: publicPrediction(prediction), user: toPublicUser(user) })
})

module.exports = router
