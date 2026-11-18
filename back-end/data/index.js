// in-memory mock data that every route reads from and changes
const { seedUsers, toPublicUser } = require('./users')
const { seedGroups, isGroupFull } = require('./groups')
const { seedPredictions } = require('./predictions')

// routes always use db.users, db.groups, and db.predictions so resetData() can swap in fresh copies
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

// check that a picture URL points to an image uploaded to /api/uploads
function isUploadedImage(url) {
  return typeof url === 'string' && /^\/uploads\/[\w-]+(\.[a-z0-9]+)?$/i.test(url)
}

module.exports = { db, resetData, toPublicUser, isGroupFull, isUploadedImage }
