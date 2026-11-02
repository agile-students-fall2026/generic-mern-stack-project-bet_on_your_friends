// mock profile updates for in-session updates
import { saveMockAccount } from './mockSignUp'

// simulate changing and saving visible display name for a user
export async function updateMockDisplayName(user, displayName) {
  const updatedUser = { ...user, displayName: displayName.trim() }

  saveMockAccount(updatedUser)

  return updatedUser
}
