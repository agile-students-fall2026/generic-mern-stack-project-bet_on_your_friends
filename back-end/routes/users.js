// routes for /api/users -> changing a user's account settings
const express = require('express')
const { db } = require('../data')

const router = express.Router()

// password requirements: 8-64 characters, uppercase, lowercase, & a number
// returns the first rule the password breaks or null
function passwordRuleError(password) {
  if (password.length < 8 || password.length > 64) {
    return 'New password must be 8-64 characters.'
  }

  if (!/[A-Z]/.test(password)) {
    return 'New password must include an uppercase letter.'
  }

  if (!/[a-z]/.test(password)) {
    return 'New password must include a lowercase letter.'
  }

  if (!/[0-9]/.test(password)) {
    return 'New password must include a number.'
  }

  return null
}

// change password -> PATCH /api/users/:userId/password
router.patch('/:userId/password', (req, res) => {
  const user = db.users.find((account) => account.id === req.params.userId)

  // no account with this id
  if (!user) {
    return res.status(404).json({ error: 'This account does not exist.' })
  }

  // req.body is undefined when nothing was sent so fall back to an empty object
  const { currentPassword, newPassword, confirmPassword } = req.body ?? {}

  // all three password fields must be filled in
  const passwords = [currentPassword, newPassword, confirmPassword]

  if (passwords.some((password) => typeof password !== 'string' || password === '')) {
    return res.status(400).json({ error: 'Please fill in every password field.' })
  }

  // only the account owner, who knows the current password, can change it
  if (currentPassword !== user.password) {
    return res.status(401).json({ error: 'Your current password is incorrect.' })
  }

  // new password must follow every password rule
  const ruleError = passwordRuleError(newPassword)

  if (ruleError) {
    return res.status(400).json({ error: ruleError })
  }

  if (newPassword !== confirmPassword) {
    return res.status(400).json({ error: 'New passwords do not match.' })
  }

  // new password is same as current password
  if (newPassword === currentPassword) {
    return res
      .status(400)
      .json({ error: 'New password must be different from your current password.' })
  }

  // save the new password in the mock data, so logging in now needs the new one
  user.password = newPassword

  res.json({ message: 'Password updated.' })
})

module.exports = router
