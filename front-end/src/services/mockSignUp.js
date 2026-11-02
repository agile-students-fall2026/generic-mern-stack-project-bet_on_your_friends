// mock sign up here for registering a new account to Bet on Your Friends
// includes emails that are already registered, creates account with 1,000 coins,
// a new user id, and stores their info in-session, rather than on a database

// keep track of registered accounts
// looked up by their email
const storageKey = 'betOnYourFriendsAccounts'
const savedAccounts = JSON.parse(sessionStorage.getItem(storageKey) || '[]')
const registeredMockAccounts = new Map(savedAccounts.map((user) => [user.email.toLowerCase(), user]))

// check whether an email is already registered
export function isEmailRegistered(email) {
  return registeredMockAccounts.has(email.trim().toLowerCase())
}

// get a registered account by email
export function getRegisteredMockAccount(email) {
  return registeredMockAccounts.get(email.trim().toLowerCase()) ?? null
}

export function getMockAccounts() {
  return [...registeredMockAccounts.values()]
}

// save an account for rest of session
export function saveMockAccount(user) {
  registeredMockAccounts.set(user.email.trim().toLowerCase(), user)
  sessionStorage.setItem(storageKey, JSON.stringify([...registeredMockAccounts.values()]))
}

// simulate creating an account
export async function registerMockAccount({ name, email }) {
  const normalizedEmail = email.trim().toLowerCase()

  // prevent users from registering with an existing email
  if (isEmailRegistered(normalizedEmail)) {
    throw new Error('This email is already associated with an account.')
  }

  // mock user
  const user = {
    id: crypto.randomUUID(),
    name: name.trim(),
    email: normalizedEmail,
    coinBalance: 1000 // give users 1000 coins upon signing up, good baseline until 
    // we determine what users can actually redeem or use these coins for besides gambling
  }

  // save account
  saveMockAccount(user)

  return user
}
