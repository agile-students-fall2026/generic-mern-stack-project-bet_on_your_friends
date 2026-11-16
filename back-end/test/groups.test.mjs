// tests for the group details and members routes
import { use, expect } from 'chai'
import { default as chaiHttp, request } from 'chai-http'
import app from '../app.js'
import data from '../data/index.js'

use(chaiHttp)

const { resetData } = data

describe('GET /api/groups/:groupId', () => {
  // start every test with the same mock data
  beforeEach(() => {
    resetData()
  })

  it('sends back the group details', async () => {
    const res = await request.execute(app).get('/api/groups/g1')

    expect(res).to.have.status(200)
    expect(res.body).to.include({
      inviteCode: 'ROOM26',
      whoCanInvite: 'all',
      memberLimit: null
    })
    expect(res.body.memberIds).to.have.lengthOf(4)
    expect(res.body.adminIds).to.deep.equal(['u1'])
  })

  it('returns a 404 error when the group does not exist', async () => {
    const res = await request.execute(app).get('/api/groups/not-a-group')

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
    const res = await request.execute(app).get('/api/groups/g1/members')

    expect(res).to.have.status(200)
    expect(res.body).to.have.lengthOf(4)
    expect(res.body[0]).to.deep.equal({ id: 'u1', name: 'Maya Chen', isAdmin: true })
    expect(res.body[1]).to.deep.equal({ id: 'u2', name: 'Jordan Lee', isAdmin: false })
  })

  it('returns a 404 error when the group does not exist', async () => {
    const res = await request.execute(app).get('/api/groups/not-a-group/members')

    expect(res).to.have.status(404)
  })
})
