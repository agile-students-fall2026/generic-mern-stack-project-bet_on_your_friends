// prediction routes using shared mock data
const express = require('express')
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

module.exports = router
