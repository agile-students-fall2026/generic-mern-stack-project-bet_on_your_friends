// mock profile updates for in-session updates
import { faker } from '@faker-js/faker'
import { saveMockAccount } from './mockSignUp'

// simulate changing and saving visible display name for a user
export async function updateMockDisplayName(user, displayName) {
  const updatedUser = { ...user, displayName: displayName.trim() }

  saveMockAccount(updatedUser)

  return updatedUser
}

// simulate uploading and saving profile picture chosen from user's device
export async function updateMockProfilePhoto(user, file) {
  if (!file.type.startsWith('image/')) {
    throw new Error('Please choose an image file.')
  }

  const updatedUser = {
    ...user,
    photoUrl: `https://picsum.photos/seed/${faker.string.uuid()}/192/192`
  }

  saveMockAccount(updatedUser)

  return updatedUser
}
