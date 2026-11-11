// hard-coded mock user groups JSON data until actual database is set up and connected
const seedGroups = [
  {
    id: 'g1',
    name: 'Roommate Rivals',
    description: 'Who will finally clean the kitchen first?',
    visibility: 'private',
    whoCanInvite: 'all',
    inviteCode: 'ROOM26',
    adminIds: ['u1'],
    memberIds: ['u1', 'u2', 'u3', 'u4'],
    memberLimit: null, // no limit
    photoSeed: 'roommate-rivals',
    openPredictions: 3
  },
  {
    id: 'g2',
    name: 'Study Squad',
    description: 'Predictions about exams and deadlines.',
    visibility: 'private',
    whoCanInvite: 'admins',
    inviteCode: 'STUDY1',
    adminIds: ['u2'],
    memberIds: ['u2', 'u1', 'u5'],
    memberLimit: 10,
    photoSeed: 'study-squad',
    openPredictions: 1
  },
  {
    // full group to test that nobody else can join
    id: 'g3',
    name: 'Gym Buddies',
    description: 'Who skips leg day first?',
    visibility: 'private',
    whoCanInvite: 'all',
    inviteCode: 'GYM333',
    adminIds: ['u3'],
    memberIds: ['u3', 'u4'],
    memberLimit: 2,
    photoSeed: 'gym-buddies',
    openPredictions: 0
  },
  {
    // group with two admins
    id: 'g4',
    name: 'Family Group Chat',
    description: 'A place to discuss family matters and share updates.',
    visibility: 'private',
    whoCanInvite: 'admins',
    inviteCode: 'FAM444',
    adminIds: ['u4', 'u5'],
    memberIds: ['u4', 'u5'],
    memberLimit: 20,
    photoSeed: 'family-group-chat',
    openPredictions: 2
  }
]

// check if group has reached member limit (if any)
function isGroupFull(group) {
  return group.memberLimit != null && group.memberIds.length >= group.memberLimit
}

module.exports = { seedGroups, isGroupFull }

