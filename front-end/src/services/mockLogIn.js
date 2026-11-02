// mock log in for returning users on Bet on Your Friends
// includes emails that are already registered, checks for correct password,
// and stores their info in-session, rather than on a database

import { getRegisteredMockAccount, saveMockAccount } from './mockSignUp'

// simulate logging in
export async function logInMockAccount({ email, password }) {
  const normalizedEmail = email.trim().toLowerCase()

  if (normalizedEmail === '' || password === '') {
    throw new Error('Please enter your email and password.')
  }

  // accounts created during session
  const sessionAccount = getRegisteredMockAccount(normalizedEmail)
  if (sessionAccount) {
    return sessionAccount
  }

  // else search mock users
  const response = await fetch('/mock-data/users.json')
  if (!response.ok) {
    throw new Error('Unable to log in. Please try again.')
  }

  const mockUsers = await response.json()
  const user = mockUsers.find(
    (mockUser) => mockUser.email.toLowerCase() === normalizedEmail
  )

  if (!user) {
    throw new Error('Incorrect email or password.')
  }

  saveMockAccount(user)

  return user
}
