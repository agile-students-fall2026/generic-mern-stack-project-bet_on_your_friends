// tests for the change password and my groups routes
import { use, expect } from 'chai'
import { default as chaiHttp, request } from 'chai-http'
import app from '../app.js'
import data from '../data/index.js'

use(chaiHttp)

const { resetData } = data

// send a change password request for Maya (u1)
function changePassword(body) {
  return request.execute(app).patch('/api/users/u1/password').send(body)
}

describe('PATCH /api/users/:userId/password', () => {
  // start every test with the same mock data
  beforeEach(() => {
    resetData()
  })

  it('changes the password when all fields are valid', async () => {
    const res = await changePassword({
      currentPassword: 'Password@123',
      newPassword: 'NewPassword@456',
      confirmPassword: 'NewPassword@456'
    })

    expect(res).to.have.status(200)
    expect(res.body.message).to.equal('Password updated.')
  })

  it('returns a 400 error when the new password does not meet the rules', async () => {
    const res = await changePassword({
      currentPassword: 'Password@123',
      newPassword: 'pass',
      confirmPassword: 'pass'
    })

    expect(res).to.have.status(400)
  })

  it('returns a 400 error when the new passwords do not match', async () => {
    const res = await changePassword({
      currentPassword: 'Password@123',
      newPassword: 'NewPassword@456',
      confirmPassword: 'Different@789'
    })

    expect(res).to.have.status(400)
    expect(res.body.error).to.equal('New passwords do not match.')
  })
})

describe('GET /api/users/:userId/groups', () => {
  // start every test with the same mock data
  beforeEach(() => {
    resetData()
  })

  it('sends back every group the user is a member of', async () => {
    const res = await request.execute(app).get('/api/users/u1/groups')

    expect(res).to.have.status(200)
    expect(res.body.map((group) => group.id)).to.deep.equal(['g1', 'g2'])
    expect(res.body[0]).to.include({
      name: 'Roommate Rivals',
      photoSeed: 'roommate-rivals',
      openPredictions: 3
    })
  })

  it('returns a 404 error when the user does not exist', async () => {
    const res = await request.execute(app).get('/api/users/not-a-user/groups')

    expect(res).to.have.status(404)
    expect(res.body.error).to.equal('This account does not exist.')
  })
})
