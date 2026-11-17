// tests for the create group, group details, and members routes
import { use, expect } from 'chai'
import { default as chaiHttp, request } from 'chai-http'
import app from '../app.js'
import data from '../data/index.js'

use(chaiHttp)

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
    expect(res.body[0]).to.deep.equal({ id: 'u1', name: 'Maya Chen', isAdmin: true })
    expect(res.body[1]).to.deep.equal({ id: 'u2', name: 'Jordan Lee', isAdmin: false })
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
