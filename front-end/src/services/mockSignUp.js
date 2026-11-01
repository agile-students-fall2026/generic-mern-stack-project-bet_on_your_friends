// mock sign up here for registering a new account to Bet on Your Friends
// includes emails that are already registered, creates account with 1,000 coins,
// a new user id, and stores their info in-session, rather than on a database

// keep track of registered emails
const registeredMockEmails = new Set()

// ID for the next user (e.g. first user to ever sign up is id 1, next is 2, etc.)
let nextUserId = 1

// check whether an email is already registered
export function isEmailRegistered(email) {
  return registeredMockEmails.has(email.trim().toLowerCase())
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
    id: nextUserId++,
    name: name.trim(),
    email: normalizedEmail,
    coinBalance: 1000 // give users 1000 coins upon signing up, good baseline until 
    // we determine what users can actually redeem or use these coins for besides gambling
  }

  // put email onto the list so that it can't be registered twice
  registeredMockEmails.add(normalizedEmail)

  return user
}