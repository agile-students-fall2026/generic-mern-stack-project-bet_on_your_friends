// routes for /api/auth -> logging in and logging out
const express = require('express')
const { randomUUID } = require('crypto')
const { db, isGroupFull, toPublicUser } = require('../data')

const router = express.Router()

// same email check as the Login page on the front-end
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// new accounts start with 1000 coins
const startingCoins = 1000

// how many groups a brand new mock account is put in
const starterGroupCount = 2

// make a name from the email for new mock accounts
function nameFromEmail(email) {
  const name = email
    .split('@')[0]
    .split(/[._-]+/)
    .filter((part) => part !== '')
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(' ')

  return name || 'New Member'
}

// make a mock account for an email we haven't seen before
function createMockAccount(email, password) {
  const user = {
    id: randomUUID(),
    name: nameFromEmail(email),
    email: email,
    password: password,
    coinBalance: startingCoins
  }

  db.users.push(user)

  // add new user to the first groups that aren't full
  const openGroups = db.groups.filter((group) => !isGroupFull(group))

  for (const group of openGroups.slice(0, starterGroupCount)) {
    group.memberIds.push(user.id)
  }

  return user
}

// log in -> POST /api/auth/login with { email, password }
router.post('/login', (req, res) => {
  const { email, password } = req.body ?? {}

  // email and password must both be filled in
  if (
    typeof email !== 'string' ||
    typeof password !== 'string' ||
    email.trim() === '' ||
    password === ''
  ) {
    return res
      .status(400)
      .json({ error: 'Please enter your email and password.' })
  }

  const normalizedEmail = email.trim().toLowerCase()

  if (!emailPattern.test(normalizedEmail)) {
    return res.status(400).json({ error: 'Please enter a valid email address.' })
  }

  let user = db.users.find((account) => account.email === normalizedEmail)

  // existing account means password has to match
  if (user && user.password !== password) {
    return res.status(401).json({ error: 'Incorrect email or password.' })
  }

  // if new email, then make a mock account for it
  if (!user) {
    user = createMockAccount(normalizedEmail, password)
  }

  res.json(toPublicUser(user))
})

// log out -> POST /api/auth/logout
router.post('/logout', (req, res) => {
  res.json({ message: 'You have been logged out.' })
})

module.exports = router
