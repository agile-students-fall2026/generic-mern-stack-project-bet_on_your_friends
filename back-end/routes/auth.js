// routes for /api/auth -> logging in and logging out
const express = require('express')
const { db, toPublicUser } = require('../data')

const router = express.Router()

// same email check as the Login page on the front-end
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

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

  // only accounts the back-end already knows about can log in
  const user = db.users.find((account) => account.email === normalizedEmail)

  // same error for unknown email (even if account created) and wrong password
  if (!user || user.password !== password) {
    return res.status(401).json({ error: 'Incorrect email or password.' })
  }

  res.json(toPublicUser(user))
})

// log out -> POST /api/auth/logout
router.post('/logout', (req, res) => {
  res.json({ message: 'You have been logged out.' })
})

module.exports = router
