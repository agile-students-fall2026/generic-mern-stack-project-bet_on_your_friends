// in-memory mock data that every route reads from and changes
const { seedUsers, toPublicUser } = require('./users')
const { seedGroups, isGroupFull } = require('./groups')

// routes always use db.users and db.groups so resetData() can swap in fresh copies
const db = {
  users: [],
  groups: []
}

// runs once when the server starts and tests run it to ensure they don't affect each other
function resetData() {
  db.users = structuredClone(seedUsers)
  db.groups = structuredClone(seedGroups)
}

resetData()

module.exports = { db, resetData, toPublicUser, isGroupFull }
