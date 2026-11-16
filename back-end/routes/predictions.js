// prediction routes using shared mock data
const express = require('express')
const { randomUUID } = require('crypto')
const { db, toPublicUser } = require('../data')

const router = express.Router()

// find the account and check group membership
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

  // use the mock account id sent by the front end
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

// check the prediction form fields
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

// only the creator can change a prediction before bets are placed
function editError(prediction, user) {
  if (prediction.creatorId !== user.id) return 'Only the creator can change this prediction.'
  if (prediction.result) return 'Resolved predictions cannot be changed.'
  if (prediction.bets.length > 0) return 'This prediction cannot be changed after someone bets.'
  return ''
}

// count unresolved predictions whose deadlines have not passed
function updateCount(group) {
  group.openPredictions = db.predictions.filter((prediction) =>
    prediction.groupId === group.id && !prediction.result && new Date(prediction.deadline) > new Date()
  ).length
}

// include the current deadline status
function publicPrediction(prediction) {
  return { ...prediction, bettingClosed: new Date(prediction.deadline) <= new Date() }
}

// list predictions for a group
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

// get one prediction
router.get('/predictions/:predictionId', (req, res) => {
  const data = getMemberData(req, res)
  if (!data) return
  res.json(publicPrediction(data.prediction))
})

// create a prediction
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

// edit a prediction
router.post('/predictions/:predictionId', (req, res) => {
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

// delete a prediction
router.delete('/predictions/:predictionId', (req, res) => {
  const data = getMemberData(req, res)
  if (!data) return
  const error = editError(data.prediction, data.user)
  if (error) return res.status(403).json({ error })
  db.predictions = db.predictions.filter((prediction) => prediction.id !== data.prediction.id)
  updateCount(data.group)
  res.json({ message: 'Prediction deleted.' })
})

module.exports = router
