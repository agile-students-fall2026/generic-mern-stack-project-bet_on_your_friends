import { Faker, en } from '@faker-js/faker'
import { getMockGroupById } from './mockGroups'
import { getMockAccountById } from './mockSignUp'

export async function getMockMembers(groupId, currentUser) {
  const group = await getMockGroupById(groupId)

  if (!group || !group.memberIds.includes(currentUser.id)) {
    throw new Error(
      'This group is unavailable or you are no longer a member.'
    )
  }

  return group.memberIds.map((id) => {
    // Use the current profile for the person currently logged in.
    if (id === currentUser.id) {
      return currentUser
    }

    // Reuse an existing account's name and balance.
    const existingAccount = getMockAccountById(id)

    if (existingAccount) {
      return existingAccount
    }

    // Generate a profile only when this member has no saved account.
    const generator = new Faker({ locale: [en] })
    const seed = []

    for (const character of String(id)) {
      seed.push(character.charCodeAt(0))
    }

    generator.seed(seed)

    return {
      id,
      displayName: generator.person.fullName(),
      coinBalance: generator.number.int({ min: 100, max: 2500 })
    }
  })
}