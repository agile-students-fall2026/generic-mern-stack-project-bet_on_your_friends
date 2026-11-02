import { faker } from '@faker-js/faker'
const storageKey = 'betOnYourFriendsGroups'

// same seed/data every time
const mockSeed = 2026

const mockGroupCount = 8

let mockGroupsRequest = null

// capitalize each word
function toTitleCase(text) {
  return text.replace(/\b\w/g, (letter) => letter.toUpperCase())
}

// generate mock groups
function generateMockGroups() {
  faker.seed(mockSeed)

  return faker.helpers.multiple(
    () => {
      const memberIds = faker.helpers.multiple(() => faker.string.uuid(), {
        count: { min: 2, max: 8 }
      })

      return {
        id: faker.string.uuid(),
        name: toTitleCase(`${faker.word.adjective()} ${faker.word.noun()}`),
        description: faker.company.catchPhrase(),
        visibility: 'private',
        whoCanInvite: faker.helpers.arrayElement(['all', 'admins']),
        inviteCode: faker.string.alphanumeric({ length: 6, casing: 'upper' }),
        adminIds: [memberIds[0]],
        memberIds: memberIds,
        openPredictions: faker.number.int({ min: 0, max: 5 })
      }
    },
    { count: mockGroupCount }
  )
}

// load mock groups
function loadMockGroups() {
  if (!mockGroupsRequest) {
    const savedGroups = sessionStorage.getItem(storageKey)

    mockGroupsRequest = Promise.resolve(
      savedGroups ? JSON.parse(savedGroups) : generateMockGroups()
    )
  }

  return mockGroupsRequest
}

// save groups for session
function saveMockGroups(groups) {
  sessionStorage.setItem(storageKey, JSON.stringify(groups))
}

// random, unclaimed 6-alphanumeric invite code
function createInviteCode(groups) {
  const inviteCode = faker.string.alphanumeric({ length: 6, casing: 'upper' })

  if (groups.some((group) => group.inviteCode === inviteCode)) {
    return createInviteCode(groups)
  }

  return inviteCode
}

// get every group the user is a member of
export async function getMockGroupsForUser(userId) {
  const groups = await loadMockGroups()
  return groups.filter((group) => group.memberIds.includes(userId))
}

// return a single group by its id
export async function getMockGroupById(groupId) {
  const groups = await loadMockGroups()
  return groups.find((group) => group.id === groupId) ?? null
}

export async function updateMockPredictionCount(groupId, count) {
  const groups = await loadMockGroups()
  const group = groups.find((item) => item.id === groupId)
  if (group) {
    group.openPredictions = count
    saveMockGroups(groups)
  }
}

// get group invite code
export async function getMockGroupByInviteCode(inviteCode) {
  const groups = await loadMockGroups()
  return (
    groups.find((group) => group.inviteCode === inviteCode.toUpperCase()) ?? null
  )
}

// returning users already belong to some groups
export async function addMockMemberships(userId) {
  const groups = await loadMockGroups()

  if (groups.some((group) => group.memberIds.includes(userId))) return

  const generatedGroups = groups.slice(0, mockGroupCount)

  for (const group of faker.helpers.arrayElements(generatedGroups, 3)) {
    group.memberIds.push(userId)
  }

  saveMockGroups(groups)
}

// simulate creating a group
export async function createMockGroup({ name, description, whoCanInvite, creatorId }) {
  const groups = await loadMockGroups()

  const group = {
    id: `g${Date.now()}`,
    name: name.trim(),
    description: description.trim(),
    visibility: 'private',
    whoCanInvite: whoCanInvite,
    inviteCode: createInviteCode(groups),
    adminIds: [creatorId],
    memberIds: [creatorId],
    openPredictions: 0
  }

  groups.push(group)
  saveMockGroups(groups)

  return group
}

// simulate joining a group via invite
export async function joinMockGroup(groupId, userId) {
  const groups = await loadMockGroups()
  const group = groups.find((group) => group.id === groupId)

  if (!group) {
    throw new Error('This invite is no longer valid.')
  }

  if (!group.memberIds.includes(userId)) {
    group.memberIds.push(userId)
    saveMockGroups(groups)
  }

  return group
}
