// routes for /api/auth -> logging in and logging out
const { randomUUID } = require('crypto')
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
  // convert email to lowercase 
  const normalizedEmail = email.trim().toLowerCase()

  // invalid email check 
  if (!emailPattern.test(normalizedEmail)) {
    return res.status(400).json({ error: 'Please enter a valid email address.' })
  }

  // only accounts the back-end already knows about can log in
  const user = db.users.find((account) => account.email === normalizedEmail)

  // same error for unknown email and wrong password
  if (!user || user.password !== password) {
    return res.status(401).json({ error: 'Incorrect email or password.' })
  }

  res.json(toPublicUser(user))
})

// log out -> POST /api/auth/logout
router.post('/logout', (req, res) => {
  res.json({ message: 'You have been logged out.' })
})

 // check whether the user is at least 21 years old or not
 // same validation logic as the Create Account page on the front-end
function isOldEnough(dateOfBirth) {
  // first make sure the input is a date in YYYY-MM-DD format
  if ( typeof dateOfBirth !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(dateOfBirth)) {
    return false
  }

  // input is valid so we continue
  const [year, month, day] = dateOfBirth.split('-').map(Number)
  const birthDate = new Date(`${dateOfBirth}T00:00:00`)
  const today = new Date()

  // prevent user from inputting a non-date date of birth or a date in the future
  // e.g. putting in "hello world" or 11/01/3005 as your DOB will not go through
  if (
    Number.isNaN(birthDate.getTime()) ||
    birthDate.getFullYear() !== year ||
    birthDate.getMonth() + 1 !== month ||
    birthDate.getDate() !== day ||
    birthDate > today
  ) {
    return false
  }

  // calculate how old the user currently is
  let age = today.getFullYear() - year

  // subtract one if the user has not had their birthday this year
  // e.g. someone turning 21 tomorrow is still 20 today
  if (
    today.getMonth() + 1 < month ||
    (today.getMonth() + 1 === month && today.getDate() < day)
  ) {
    age--
  }

  return age >= 21
}

// create account -> POST /api/auth/signup
// sends back the newly created user without their password
router.post('/signup', (req, res) => {
  const {
    name,
    email,
    dateOfBirth,
    password,
    confirmPassword
  } = req.body ?? {}

  // all fields must have values before the account can be created
  // req.body may be undefined if the client did not send JSON
  if (
    [name, email, dateOfBirth, password, confirmPassword].some(
      (value) => typeof value !== 'string' || value.trim() === ''
    )
  ) {
    return res.status(400).json({
      error: 'Please fill in every field.'
    })
  }

  // name must be 3-30 characters, not counting spaces
  const nameLength = name.replace(/\s/g, '').length

  if (nameLength < 3 || nameLength > 30) {
    return res.status(400).json({
      error: 'Please enter your full name.'
    })
  }

  // convert email to lowercase + remove spaces around it
  const normalizedEmail = email.trim().toLowerCase()

  // invalid email check
  // reuse emailPattern already defined above Login route
  if (!emailPattern.test(normalizedEmail)) {
    return res.status(400).json({
      error: 'Please enter a valid email address.'
    })
  }

  // check whether email is already registered with back-end
  // this replaces old front-end-only check in mockSignUp.js
  const emailAlreadyRegistered = db.users.some(
    (account) => account.email.toLowerCase() === normalizedEmail
  )

  if (emailAlreadyRegistered) {
    return res.status(409).json({
      error: 'This email is already associated with an account.'
    })
  }

  // user must be at least 21 years old
  // we can't just rely on front-end because someone can send a POST request directly
  if (!isOldEnough(dateOfBirth)) {
    return res.status(400).json({
      error: 'You must be at least 21 years old.'
    })
  }

  // password requirements: 8-64 characters, uppercase, lowercase, & a number
  // same requirements as existing Create Account page
  const passwordValid =
    password.length >= 8 &&
    password.length <= 64 &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /[0-9]/.test(password)

  if (!passwordValid) {
    return res.status(400).json({
      error: 'Password does not meet the requirements.'
    })
  }

  // check whether both passwords match
  if (password !== confirmPassword) {
    return res.status(400).json({
      error: 'Passwords do not match.'
    })
  }

  // all requirements were met, so create new account
  // randomUUID gives each user a unique ID, including newly registered users
  const newUser = {
    id: randomUUID(),
    name: name.trim(),
    email: normalizedEmail,
    password,
    coinBalance: 1000
  }

  // save account to shared in-memory data
  // other back-end routes can now find user through db.users
  // this is temporary for sprint 2 until a real database is setup
  db.users.push(newUser)

  // HTTP 201 means a new account was successfully created
  // toPublicUser removes password before sending JSON to React
  res.status(201).json(toPublicUser(newUser))
})

module.exports = router