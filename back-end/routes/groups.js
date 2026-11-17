// routes for creating, viewing, and joining groups -> /api/groups
const express = require('express')
const { randomInt, randomUUID } = require('crypto')
const { db, isGroupFull } = require('../data')

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

// find a user by their id
function findUser(userId) {
  return db.users.find((user) => user.id === userId)
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

  const creator = findUser(creatorId)

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

// group from an invite link -> GET /api/groups/invite/:inviteCode
router.get('/invite/:inviteCode', (req, res) => {
  // invite codes are capital letters and numbers so lowercase codes still match
  const inviteCode = req.params.inviteCode.toUpperCase()
  const group = db.groups.find((match) => match.inviteCode === inviteCode)

  // no matching group 404 error
  if (!group) {
    return res
      .status(404)
      .json({ error: 'This invite link is invalid or has expired.' })
  }

  res.json(group)
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
    const member = findUser(memberId)

    return {
      id: memberId,
      name: member?.displayName || member?.name || 'Unknown member',
      isAdmin: group.adminIds.includes(memberId)
    }
  })

  res.json(members)
})

// join group -> POST /api/groups/:groupId/join with { userId }
router.post('/:groupId/join', (req, res) => {
  const group = findGroup(req.params.groupId)

  if (!group) {
    return res.status(404).json({ error: 'This group could not be found.' })
  }

  // req.body is undefined when nothing was sent so fall back to an empty object
  const { userId } = req.body ?? {}
  const user = findUser(userId)

  if (!user) {
    return res.status(404).json({ error: 'This account does not exist.' })
  }

  // nothing to add if already a member
  if (group.memberIds.includes(user.id)) {
    return res.json(group)
  }

  // unable to join if member limit hit
  if (isGroupFull(group)) {
    return res
      .status(400)
      .json({ error: 'This group is full and cannot be joined.' })
  }

  group.memberIds.push(user.id)

  res.json(group)
})

module.exports = router
