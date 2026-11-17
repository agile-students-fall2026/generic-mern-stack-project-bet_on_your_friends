// routes for creating a group and viewing a group and its members -> /api/groups
const express = require('express')
const { randomInt, randomUUID } = require('crypto')
const { db } = require('../data')

const router = express.Router()

// group name and description character limits
const maxNameLength = 40
const maxDescriptionLength = 200

// members per group range
const minMember = 2
const maxMember = 20

// who can invite friends (all or admins only)
const inviteOptions = ['all', 'admins']

// characters for invite codes and length
const inviteCodeCharacters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
const inviteCodeLength = 6

// find a group by its id
function findGroup(groupId) {
  return db.groups.find((group) => group.id === groupId)
}

// randomly generated 6-character available invite code
function createInviteCode() {
  let inviteCode = ''

  for (let i = 0; i < inviteCodeLength; i++) {
    inviteCode += inviteCodeCharacters[randomInt(inviteCodeCharacters.length)]
  }

  // retry if unavailable
  if (db.groups.some((group) => group.inviteCode === inviteCode)) {
    return createInviteCode()
  }

  return inviteCode
}

// create group -> POST /api/groups
router.post('/', (req, res) => {
  const {
    name,
    description = '',
    whoCanInvite,
    memberLimit,
    photoSeed,
    creatorId
  } = req.body ?? {}

  const creator = db.users.find((user) => user.id === creatorId)

  // group creator must have account
  if (!creator) {
    return res.status(404).json({ error: 'This account does not exist.' })
  }

  // group name is required
  if (typeof name !== 'string' || name.trim() === '') {
    return res.status(400).json({ error: 'Enter a group name.' })
  }

  if (name.trim().length > maxNameLength) {
    return res
      .status(400)
      .json({ error: `Group name must be ${maxNameLength} characters or less.` })
  }

  // optional description with character limit
  if (
    typeof description !== 'string' ||
    description.trim().length > maxDescriptionLength
  ) {
    return res
      .status(400)
      .json({ error: `Description must be ${maxDescriptionLength} characters or less.` })
  }

  // member limit must be a whole number in the allowed range
  if (
    !Number.isInteger(memberLimit) ||
    memberLimit < minMember ||
    memberLimit > maxMember
  ) {
    return res.status(400).json({
      error: `Member limit must be a whole number from ${minMember} to ${maxMember}.`
    })
  }

  if (!inviteOptions.includes(whoCanInvite)) {
    return res.status(400).json({ error: 'Choose who can invite friends.' })
  }

  // creator is group's first member and admin
  const group = {
    id: randomUUID(),
    name: name.trim(),
    description: description.trim(),
    visibility: 'private',
    whoCanInvite: whoCanInvite,
    inviteCode: createInviteCode(),
    adminIds: [creator.id],
    memberIds: [creator.id],
    memberLimit: memberLimit,
    // random group picture if none was picked
    photoSeed: typeof photoSeed === 'string' && photoSeed !== '' ? photoSeed : randomUUID(),
    openPredictions: 0
  }

  db.groups.push(group)

  res.status(201).json(group)
})

// group details -> GET /api/groups/:groupId
// includes invite code, who can invite, member limit, and member/admin lists
router.get('/:groupId', (req, res) => {
  const group = findGroup(req.params.groupId)

  if (!group) {
    return res.status(404).json({ error: 'This group could not be found.' })
  }

  res.json(group)
})

// group members -> GET /api/groups/:groupId/members
// each member's id, name, and whether they're an admin
router.get('/:groupId/members', (req, res) => {
  const group = findGroup(req.params.groupId)

  if (!group) {
    return res.status(404).json({ error: 'This group could not be found.' })
  }

  const members = group.memberIds.map((memberId) => {
    const member = db.users.find((user) => user.id === memberId)

    return {
      id: memberId,
      name: member?.displayName || member?.name || 'Unknown member',
      isAdmin: group.adminIds.includes(memberId)
    }
  })

  res.json(members)
})

// leaderboard -> GET /api/groups/:groupId/leaderboard
// Group members ordered by available coin balance. Highest shown first. 
router.get('/:groupId/leaderboard', (req, res) => {
  const group = findGroup(req.params.groupId)

  if (!group) {
    return res.status(404).json({ error: 'This group could not be found.' })
  }

  // Find the users whose IDs are in this group's member list.
  const members = db.users.filter((user) => group.memberIds.includes(user.id))

  // Put higher coin balances first. filter already made a new array.
  const rankedMembers = members.sort((first, second) => {
    return second.coinBalance - first.coinBalance
  })

  // Send only the account details needed on the leaderboard.
  res.json(rankedMembers.map((member) => ({
    id: member.id,
    name: member.name,
    displayName: member.displayName,
    photoUrl: member.photoUrl,
    coinBalance: member.coinBalance
  })))
})


module.exports = router
