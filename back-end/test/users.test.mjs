// tests for the change password route
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
