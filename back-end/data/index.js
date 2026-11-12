// in-memory mock data that every route reads from and changes
const { seedUsers, toPublicUser } = require('./users')
const { seedGroups, isGroupFull } = require('./groups')
const { seedPredictions } = require('./predictions')

// routes always use db.users and db.groups so resetData() can swap in fresh copies
const db = {
  users: [],
  groups: [],
  predictions: []
}

// runs once when the server starts and tests run it to ensure they don't affect each other
function resetData() {
  db.users = structuredClone(seedUsers)
  db.groups = structuredClone(seedGroups)
  db.predictions = structuredClone(seedPredictions)
}

resetData()

module.exports = { db, resetData, toPublicUser, isGroupFull }
