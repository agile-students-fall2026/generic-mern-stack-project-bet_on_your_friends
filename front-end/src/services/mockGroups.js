// mock starting groups that keeps any created or joined during session

const storageKey = 'betOnYourFriendsGroups'

let mockGroupsRequest = null

// load mock groups
function loadMockGroups() {
  if (!mockGroupsRequest) {
    const savedGroups = sessionStorage.getItem(storageKey)

    mockGroupsRequest = savedGroups
      ? Promise.resolve(JSON.parse(savedGroups))
      : fetch('/mock-data/groups.json').then((response) => {
          if (!response.ok) {
            throw new Error('Unable to load groups. Please try again.')
          }
          return response.json()
        })

    mockGroupsRequest.catch(() => {
      mockGroupsRequest = null
    })
  }

  return mockGroupsRequest
}

// save groups for the rest of the session
function saveMockGroups(groups) {
  sessionStorage.setItem(storageKey, JSON.stringify(groups))
}

// random, unclaimed 6-alphanumeric invite code
function createInviteCode(groups) {
  const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let inviteCode = ''

  for (let i = 0; i < 6; i++) {
    inviteCode += characters[Math.floor(Math.random() * characters.length)]
  }

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

// get group invite code
export async function getMockGroupByInviteCode(inviteCode) {
  const groups = await loadMockGroups()
  return (
    groups.find((group) => group.inviteCode === inviteCode.toUpperCase()) ?? null
  )
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
