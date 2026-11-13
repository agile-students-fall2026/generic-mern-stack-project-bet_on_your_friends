// routes for viewing a group and its members -> /api/groups
const express = require('express')
const { db } = require('../data')

const router = express.Router()

// find a group by its id
function findGroup(groupId) {
  return db.groups.find((group) => group.id === groupId)
}

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

module.exports = router
