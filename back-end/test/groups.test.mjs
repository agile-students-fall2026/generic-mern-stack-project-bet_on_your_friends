// tests for the create group, group details, members, group picture, join group, and leave group routes
import { use, expect } from 'chai'
import { default as chaiHttp, request } from 'chai-http'
import app from '../app.js'
import data from '../data/index.js'
import fs from 'fs'

use(chaiHttp)

// save test images in uploads folder so picture URLs point to real uploads
const testImages = ['maya.png', 'movie-night.png', 'rivals.png']
const uploadsFolder = new URL('../uploads/', import.meta.url)

before(() => {
  fs.mkdirSync(uploadsFolder, { recursive: true })
  for (const image of testImages) fs.writeFileSync(new URL(image, uploadsFolder), 'test image')
})

// delete test images after all tests
after(() => {
  for (const image of testImages) fs.rmSync(new URL(image, uploadsFolder), { force: true })
})

const { db, resetData } = data

describe('GET /api/groups/:groupId', () => {
  // start every test with the same mock data
  beforeEach(() => {
    resetData()
  })

  it('sends back the group details', async () => {
    // arrange -> Roommate Rivals (g1) with Maya (u1) as its admin

    // act -> get the group's details
  const res = await request.execute(app).get('/api/groups/g1')

    // assert -> invite code, invite setting, member limit, and member/admin lists retrieved
    expect(res).to.have.status(200)
    expect(res.body).to.include({
      inviteCode: 'ROOM26',
      whoCanInvite: 'all',
      memberLimit: 5
    })
    expect(res.body.memberIds).to.have.lengthOf(4)
    expect(res.body.adminIds).to.deep.equal(['u1'])
  })

  it('returns a 404 error when the group does not exist', async () => {
    // arrange -> a group id that isn't in the mock data

    // act -> try to get the group's details
    const res = await request.execute(app).get('/api/groups/not-a-group')

    // assert -> group not found error
    expect(res).to.have.status(404)
    expect(res.body.error).to.equal('This group could not be found.')
  })
})

describe('GET /api/groups/:groupId/members', () => {
  // start every test with the same mock data
  beforeEach(() => {
    resetData()
  })

  it("sends back each member's id, name, and admin status", async () => {
    // arrange -> Roommate Rivals (g1) has 4 members with Maya (u1) as the only admin

    // act -> get the group's members
    const res = await request.execute(app).get('/api/groups/g1/members')

    // assert -> every member comes back with their name and whether they're an admin
    expect(res).to.have.status(200)
    expect(res.body).to.have.lengthOf(4)
    expect(res.body[0]).to.deep.equal({ id: 'u1', name: 'Maya Chen', photoUrl: null, isAdmin: true })
    expect(res.body[1]).to.deep.equal({ id: 'u2', name: 'Jordan Lee', photoUrl: null, isAdmin: false })
  })

  it("sends back a member's uploaded profile picture", async () => {
    // arrange -> Maya (u1) saves an uploaded profile picture
    await request.execute(app).patch('/api/users/u1').send({ photoUrl: '/uploads/maya.png' })

    // act -> get members of Roommate Rivals (g1)
    const res = await request.execute(app).get('/api/groups/g1/members')

    // assert -> other members see Maya's new picture
    expect(res).to.have.status(200)
    expect(res.body[0]).to.include({ id: 'u1', photoUrl: '/uploads/maya.png' })
  })

  it('returns a 404 error when the group and its members do not exist', async () => {
    // arrange -> a group id that isn't in the mock data

    // act -> try to get the group's members
    const res = await request.execute(app).get('/api/groups/not-a-group/members')

    // assert -> group and its members not found error
    expect(res).to.have.status(404)
  })
})

describe('POST /api/groups', () => {
  // start every test with the same mock data
  beforeEach(() => {
    resetData()
  })

  // valid group details from Maya (u1)
  function newGroup(changes = {}) {
    return {
      name: 'Movie Night',
      description: 'Who falls asleep first?',
      whoCanInvite: 'admins',
      memberLimit: 6,
      photoSeed: 'movie-night',
      creatorId: 'u1',
      ...changes
    }
  }

  it('creates the group with an invite code and the creator as its admin', async () => {
    // arrange -> valid group details from Maya (u1)
    const body = newGroup()

    // act -> create the group and get Maya's groups
    const res = await request.execute(app).post('/api/groups').send(body)
    const myGroups = await request.execute(app).get('/api/users/u1/groups')

    // assert -> group was saved with a 6-character code and Maya as its only member and admin
    expect(res).to.have.status(201)
    expect(res.body).to.include({ name: 'Movie Night', memberLimit: 6 })
    expect(res.body.inviteCode).to.match(/^[A-Z0-9]{6}$/)
    expect(res.body.adminIds).to.deep.equal(['u1'])
    expect(res.body.memberIds).to.deep.equal(['u1'])
    expect(myGroups.body.map((group) => group.id)).to.include(res.body.id)
  })

  it('saves an uploaded group picture with new group', async () => {
    // arrange -> valid group details with an uploaded image's URL
    const body = newGroup({ photoUrl: '/uploads/movie-night.png' })

    // act -> create group
    const res = await request.execute(app).post('/api/groups').send(body)

    // assert -> uploaded picture was saved with group
    expect(res).to.have.status(201)
    expect(res.body.photoUrl).to.equal('/uploads/movie-night.png')
  })

  const invalidGroups = [
    // test for group with no name
    {
      problem: 'the name is empty',
      changes: { name: '' },
      error: 'Enter a group name.'
    },
    // test for group name that is too long
    {
      problem: 'the name is longer than 40 characters',
      changes: { name: 'a'.repeat(41) },
      error: 'Group name must be 40 characters or less.'
    },
    // test for group description that is too long
    {
      problem: 'the description is longer than 200 characters',
      changes: { description: 'a'.repeat(201) },
      error: 'Description must be 200 characters or less.'
    },
    // test for group member limit below the range
    {
      problem: 'the member limit is below 2',
      changes: { memberLimit: 1 },
      error: 'Member limit must be a whole number from 2 to 20.'
    },
    // test for group member limit above the range
    {
      problem: 'the member limit is above 20',
      changes: { memberLimit: 21 },
      error: 'Member limit must be a whole number from 2 to 20.'
    },
    // test for group member limit that isn't a whole number
    {
      problem: 'the member limit is not a whole number',
      changes: { memberLimit: 2.5 },
      error: 'Member limit must be a whole number from 2 to 20.'
    }
  ]

  for (const { problem, changes, error } of invalidGroups) {
    it(`returns a 400 error when ${problem}`, async () => {
      // arrange -> valid group details with one invalid field
      const body = newGroup(changes)
      const groupCount = db.groups.length

      // act -> try to create the group
      const res = await request.execute(app).post('/api/groups').send(body)

      // assert -> error explains which field is invalid and no group was saved
      expect(res).to.have.status(400)
      expect(res.body.error).to.equal(error)
      expect(db.groups).to.have.lengthOf(groupCount)
    })
  }
})

describe('GET /api/groups/invite/:inviteCode', () => {
  // start every test with the same mock data
  beforeEach(() => {
    resetData()
  })

  it('sends back the group for a valid invite code', async () => {
    // arrange -> Roommate Rivals (g1) invite code ROOM26

    // act -> look up associated invite code
    const res = await request.execute(app).get('/api/groups/invite/ROOM26')

    // assert -> Roommate Rivals retrieved
    expect(res).to.have.status(200)
    expect(res.body).to.include({ id: 'g1', name: 'Roommate Rivals' })
  })

  it('returns a 404 error for an invalid invite code', async () => {
    // arrange -> an invalid invite code (NOPE00)

    // act -> look up the invite code
    const res = await request.execute(app).get('/api/groups/invite/NOPE00')

    // assert -> invalid invite error
    expect(res).to.have.status(404)
    expect(res.body.error).to.equal('This invite link is invalid or has expired.')
  })
})

describe('POST /api/groups/:groupId/join', () => {
  // start every test with the same mock data
  beforeEach(() => {
    resetData()
  })

  it('adds the user to the group', async () => {
    // arrange -> Alex (u5) isn't in Roommate Rivals (g1)
    const body = { userId: 'u5' }

    // act -> Alex joins the group and gets the group's members
    const res = await request.execute(app).post('/api/groups/g1/join').send(body)
    const members = await request.execute(app).get('/api/groups/g1/members')

    // assert -> Alex was saved as a new non-admin member
    expect(res).to.have.status(200)
    expect(res.body.memberIds).to.include('u5')
    expect(members.body).to.deep.include({ id: 'u5', name: 'Alex Kim', photoUrl: null, isAdmin: false })
  })

  it('does not add the user twice when they join again', async () => {
    // arrange -> Alex (u5) joins Roommate Rivals (g1), which fills its last spot
    const body = { userId: 'u5' }
    await request.execute(app).post('/api/groups/g1/join').send(body)

    // act -> Alex sends the same join request again
    const res = await request.execute(app).post('/api/groups/g1/join').send(body)

    // assert -> still 5 members with Alex only once, not a group full error
    expect(res).to.have.status(200)
    expect(res.body.memberIds).to.have.lengthOf(5)
    expect(res.body.memberIds.filter((id) => id === 'u5')).to.have.lengthOf(1)
  })

  it('returns a 400 error when the group is full', async () => {
    // arrange -> Gym Buddies (g3) is full without Alex (u5) as a member
    const body = { userId: 'u5' }

    // act -> Alex tries to join the group and get the group's members
    const res = await request.execute(app).post('/api/groups/g3/join').send(body)
    const members = await request.execute(app).get('/api/groups/g3/members')

    // assert -> group full error with Alex not added
    expect(res).to.have.status(400)
    expect(res.body.error).to.equal('This group is full and cannot be joined.')
    expect(members.body.map((member) => member.id)).to.deep.equal(['u3', 'u4'])
  })
})

describe('POST /api/groups/:groupId/leave', () => {
  // start every test with the same mock data
  beforeEach(() => {
    resetData()
  })

  // send leave group request for a user
  function leaveGroup(groupId, userId) {
    return request.execute(app).post(`/api/groups/${groupId}/leave`).send({ userId })
  }

  it('removes a member from the group', async () => {
    // arrange -> Jordan (u2) is a member of Roommate Rivals (g1) but not an admin

    // act -> Jordan leaves the group, then get the group's details
    const res = await leaveGroup('g1', 'u2')
    const group = await request.execute(app).get('/api/groups/g1')

    // assert -> Jordan has left and Maya (u1) is still admin
    expect(res).to.have.status(200)
    expect(group.body.memberIds).to.deep.equal(['u1', 'u3', 'u4'])
    expect(group.body.adminIds).to.deep.equal(['u1'])
  })

  it('makes next member admin when last admin leaves', async () => {
    // arrange -> Maya (u1) is the only admin of Roommate Rivals (g1) and Jordan (u2) is next

    // act -> Maya leaves group, then get the group's details
    const res = await leaveGroup('g1', 'u1')
    const group = await request.execute(app).get('/api/groups/g1')

    // assert -> Maya has left and Jordan is now group's admin
    expect(res).to.have.status(200)
    expect(group.body.memberIds).to.deep.equal(['u2', 'u3', 'u4'])
    expect(group.body.adminIds).to.deep.equal(['u2'])
  })

  it('deletes the group when its last member leaves', async () => {
    // arrange -> Sam (u4) leaves Gym Buddies (g3), so Priya (u3) is last member
    await leaveGroup('g3', 'u4')

    // act -> Priya leaves group, then try to get the group's details
    const res = await leaveGroup('g3', 'u3')
    const group = await request.execute(app).get('/api/groups/g3')

    // assert -> group no longer exists
    expect(res).to.have.status(200)
    expect(group).to.have.status(404)
  })

  it('returns a 400 error when the user is not a member', async () => {
    // arrange -> Alex (u5) isn't a member of Roommate Rivals (g1)

    // act -> Alex tries to leave group, then get the group's details
    const res = await leaveGroup('g1', 'u5')
    const group = await request.execute(app).get('/api/groups/g1')

    // assert -> not a member error
    expect(res).to.have.status(400)
    expect(res.body.error).to.equal('You are not a member of this group.')
    expect(group.body.memberIds).to.deep.equal(['u1', 'u2', 'u3', 'u4'])
  })

  it('keeps other admin when one of two admins leaves', async () => {
    // arrange -> Family Group Chat (g4) has two admins: Sam (u4) and Alex (u5)

    // act -> Sam leaves group, then get the group's details
    const res = await leaveGroup('g4', 'u4')
    const group = await request.execute(app).get('/api/groups/g4')

    // assert -> Alex is only member left and is still the only admin
    expect(res).to.have.status(200)
    expect(group.body.memberIds).to.deep.equal(['u5'])
    expect(group.body.adminIds).to.deep.equal(['u5'])
  })

  it('returns a 404 error when the group does not exist', async () => {
    // arrange -> a group id that isn't in the mock data

    // act -> Maya (u1) tries to leave group
    const res = await leaveGroup('not-a-group', 'u1')

    // assert -> group not found error
    expect(res).to.have.status(404)
    expect(res.body.error).to.equal('This group could not be found.')
  })
})

describe('PATCH /api/groups/:groupId', () => {
  // start every test with the same mock data
  beforeEach(() => {
    resetData()
  })

  // send change group picture request
  function changeGroupPhoto(userId, photoUrl) {
    return request.execute(app).patch('/api/groups/g1').send({ userId, photoUrl })
  }

  it('lets an admin change the group picture', async () => {
    // arrange -> Maya (u1) is admin of Roommate Rivals (g1)

    // act -> Maya changes picture, then get the group's details
    const res = await changeGroupPhoto('u1', '/uploads/rivals.png')
    const group = await request.execute(app).get('/api/groups/g1')

    // assert -> new picture was saved
    expect(res).to.have.status(200)
    expect(group.body.photoUrl).to.equal('/uploads/rivals.png')
  })

  it('returns a 400 error when the picture was not uploaded', async () => {
    // arrange -> Maya (u1) is an admin but picture URL is from another site

    // act -> Maya tries to change picture, then get the group's details
    const res = await changeGroupPhoto('u1', 'https://example.com/rivals.png')
    const group = await request.execute(app).get('/api/groups/g1')

    // assert -> image error and picture wasn't changed
    expect(res).to.have.status(400)
    expect(res.body.error).to.equal('Please choose an image file.')
    expect(group.body).to.not.have.property('photoUrl')
  })

  it('returns a 403 error when a member who is not an admin changes the picture', async () => {
    // arrange -> Jordan (u2) is a member of Roommate Rivals (g1) but not an admin

    // act -> Jordan tries to change picture, then get group's details
    const res = await changeGroupPhoto('u2', '/uploads/rivals.png')
    const group = await request.execute(app).get('/api/groups/g1')

    // assert -> admin only error and picture wasn't changed
    expect(res).to.have.status(403)
    expect(res.body.error).to.equal('Only admins can change the group picture.')
    expect(group.body).to.not.have.property('photoUrl')
  })
})

describe('GET /api/groups/:groupId/leaderboard', () => {
  // Start each test with the original balances.
  beforeEach(() => {
    resetData()
  })

  it('returns group members from highest balance to lowest', async () => {
    // arrange -> the group has four members with different coin balances

    // act -> get the group's leaderboard
    const res = await request.execute(app).get('/api/groups/g1/leaderboard')

    // assert -> only the group's members appear, highest balance first
    expect(res).to.have.status(200)
    expect(res.body.map((member) => member.id)).to.deep.equal([
      'u3', 'u1', 'u2', 'u4'
    ])
  })

  it('returns a 404 for a group that does not exist', async () => {
    // arrange -> this group id does not exist

    // act -> request its leaderboard
    const res = await request.execute(app).get(
      '/api/groups/not-a-group/leaderboard'
    )

    // assert -> the route returns a group not found error
    expect(res).to.have.status(404)
    expect(res.body.error).to.equal('This group could not be found.')
  })

  it('keeps members with equal balances together', async () => {
    // arrange -> give u1 and u2 equal balances
    db.users.find((user) => user.id === 'u1').coinBalance = 1200
    db.users.find((user) => user.id === 'u2').coinBalance = 1200

    // act -> get the leaderboard with those balances
    const res = await request.execute(app).get('/api/groups/g1/leaderboard')

    // assert -> equal balances appear together in descending order
    expect(res).to.have.status(200)
    expect(res.body.map((member) => member.coinBalance)).to.deep.equal([
      2300, 1200, 1200, 800
    ])
  })
})