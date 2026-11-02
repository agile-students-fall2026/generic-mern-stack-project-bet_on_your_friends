// mock log in for returning users on Bet on Your Friends
import { faker } from '@faker-js/faker'
import { addMockMemberships } from './mockGroups'
import { getRegisteredMockAccount, saveMockAccount } from './mockSignUp'

// generates the same mock account always
function seedFromEmail(email) {
  let seed = 0

  for (const character of email) {
    seed = (seed * 31 + character.charCodeAt(0)) % 2147483647
  }

  return seed
}

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

  // else generate the returning account
  faker.seed(seedFromEmail(normalizedEmail))

  const user = {
    id: faker.string.uuid(),
    name: faker.person.fullName(),
    email: normalizedEmail,
    coinBalance: faker.number.int({ min: 100, max: 3000 })
  }

  await addMockMemberships(user.id)

  saveMockAccount(user)

  return user
}
