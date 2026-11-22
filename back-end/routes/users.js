// routes for /api/users -> a user's account settings and groups
const express = require('express')
const { db, toPublicUser, isUploadedImage } = require('../data')

const router = express.Router()

// display name length limits
const minDisplayNameLength = 3
const maxDisplayNameLength = 30

// password requirements: 8-64 characters, uppercase, lowercase, & a number
// returns the first rule the password breaks or null
// TODO: Add comments for each if statement 
function passwordRuleError(password) { 
  // Length check 
  if (password.length < 8 || password.length > 64) { 
    return 'New password must be 8-64 characters.'
  }
  // Uppercase check 
  if (!/[A-Z]/.test(password)) {
    return 'New password must include an uppercase letter.'
  }
  // Lowercase check
  if (!/[a-z]/.test(password)) {
    return 'New password must include a lowercase letter.'
  }
  // Number check 
  if (!/[0-9]/.test(password)) {
    return 'New password must include a number.'
  }
  // all requirements were met 
  return null
}

// profile settings -> PATCH /api/users/:userId with { displayName } and/or { photoUrl }
router.patch('/:userId', (req, res) => {
  const user = db.users.find((account) => account.id === req.params.userId)

  // no account with this id
  if (!user) {
    return res.status(404).json({ error: 'This account does not exist.' })
  }

  // req.body is undefined when nothing was sent so fall back to an empty object
  const { displayName, photoUrl } = req.body ?? {}

  // check every field before saving
  if (displayName !== undefined) {
    // spaces don't count toward minimum
    if (
      typeof displayName !== 'string' ||
      displayName.replace(/\s/g, '').length < minDisplayNameLength
    ) {
      return res.status(400).json({
        error: `Display name must be at least ${minDisplayNameLength} characters.`
      })
    }

    if (displayName.trim().length > maxDisplayNameLength) {
      return res.status(400).json({
        error: `Display name must be ${maxDisplayNameLength} characters or less.`
      })
    }
  }

  // profile picture must be an image uploaded to /api/uploads
  if (photoUrl !== undefined && !isUploadedImage(photoUrl)) {
    return res.status(400).json({ error: 'Please choose an image file.' })
  }

  if (displayName !== undefined) user.displayName = displayName.trim()
  if (photoUrl !== undefined) user.photoUrl = photoUrl

  // send back updated user without their password
  res.json(toPublicUser(user))
})

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

// my groups -> GET /api/users/:userId/groups
router.get('/:userId/groups', (req, res) => {
  const user = db.users.find((account) => account.id === req.params.userId)

  // no account with this id
  if (!user) {
    return res.status(404).json({ error: 'This account does not exist.' })
  }

  const userGroups = db.groups.filter((group) => group.memberIds.includes(user.id))

  res.json(userGroups)
})

module.exports = router
