// tests for the change password route
import { use, expect } from 'chai'
import { default as chaiHttp, request } from 'chai-http'
import app from '../app.js'
import data from '../data/index.js'

use(chaiHttp)

const { resetData } = data

// same starting password for every seeded mock user
const seededPassword = 'Password@123'

// send a change password request for Maya (u1)
function changePassword(body) {
  return request.execute(app).patch('/api/users/u1/password').send(body)
}

// try logging in as Maya (u1) with the set password
function logInAsMaya(password) {
  return request
    .execute(app)
    .post('/api/auth/login')
    .send({ email: 'maya@gmail.com', password })
}

describe('PATCH /api/users/:userId/password', () => {
  // start every test with the same mock data
  beforeEach(() => {
    resetData()
  })

  it('saves the new password so only the new one works for logging in', async () => {
    // arrange -> a valid new password typed twice
    const body = {
      currentPassword: seededPassword,
      newPassword: 'NewPassword@456',
      confirmPassword: 'NewPassword@456'
    }

    // act -> change the password, then log in with the new and old passwords
    const res = await changePassword(body)
    const newLogin = await logInAsMaya('NewPassword@456')
    const oldLogin = await logInAsMaya(seededPassword)

    // assert -> the new password was saved
    expect(res).to.have.status(200)
    expect(res.body.message).to.equal('Password updated.')
    expect(newLogin).to.have.status(200)
    expect(oldLogin).to.have.status(401)
  })

  it('returns a 404 error when the account does not exist', async () => {
    // arrange -> valid passwords with a user id that isn't in the mock data
    const body = {
      currentPassword: seededPassword,
      newPassword: 'NewPassword@456',
      confirmPassword: 'NewPassword@456'
    }

    // act -> try to change the password
    const res = await request
      .execute(app)
      .patch('/api/users/not-a-user/password')
      .send(body)

    // assert -> no account found error
    expect(res).to.have.status(404)
    expect(res.body.error).to.equal('This account does not exist.')
  })

  it('returns a 400 error when a password field is empty', async () => {
    // arrange -> new password field left blank
    const body = { currentPassword: seededPassword, newPassword: '', confirmPassword: '' }

    // act -> try to change the password
    const res = await changePassword(body)

    // assert -> asked to fill in the password field
    expect(res).to.have.status(400)
    expect(res.body.error).to.equal('Please fill in every password field.')
  })

  it('returns a 401 error when the current password is wrong', async () => {
    // arrange -> wrong current password with a valid new one
    const body = {
      currentPassword: 'WrongPassword@123',
      newPassword: 'NewPassword@456',
      confirmPassword: 'NewPassword@456'
    }

    // act -> try to change the password
    const res = await changePassword(body)

    // assert -> rejected because the current password is incorrect
    expect(res).to.have.status(401)
    expect(res.body.error).to.equal('Your current password is incorrect.')
  })

  // setup for tests for each password rule
  const brokenRules = [
    {
      rule: 'is shorter than 8 characters',
      newPassword: 'Pass12',
      error: 'New password must be 8-64 characters.'
    },
    {
      rule: 'is longer than 64 characters',
      newPassword: 'Password@1'.repeat(8),
      error: 'New password must be 8-64 characters.'
    },
    {
      rule: 'has no uppercase letter',
      newPassword: 'newpassword456',
      error: 'New password must include an uppercase letter.'
    },
    {
      rule: 'has no lowercase letter',
      newPassword: 'NEWPASSWORD456',
      error: 'New password must include a lowercase letter.'
    },
    {
      rule: 'has no number',
      newPassword: 'NewPassword',
      error: 'New password must include a number.'
    }
  ]

  for (const { rule, newPassword, error } of brokenRules) {
    it(`returns a 400 error when the new password ${rule}`, async () => {
      // arrange -> a new password that breaks any one rule
      const body = { currentPassword: seededPassword, newPassword, confirmPassword: newPassword }

      // act -> try to change the password
      const res = await changePassword(body)

      // assert -> error is the rule that was broken
      expect(res).to.have.status(400)
      expect(res.body.error).to.equal(error)
    })
  }

  it('returns a 400 error when the new passwords do not match', async () => {
    // arrange -> a valid new password but a different confirmation password
    const body = {
      currentPassword: seededPassword,
      newPassword: 'NewPassword@456',
      confirmPassword: 'Different@789'
    }

    // act -> try to change the password
    const res = await changePassword(body)

    // assert -> asked to make both new passwords match
    expect(res).to.have.status(400)
    expect(res.body.error).to.equal('New passwords do not match.')
  })

  it('returns a 400 error when the new password is the same as the current one', async () => {
    // arrange -> current password reused as the new one
    const body = {
      currentPassword: seededPassword,
      newPassword: seededPassword,
      confirmPassword: seededPassword
    }

    // act -> try to change the password
    const res = await changePassword(body)

    // assert -> asked to pick a different password
    expect(res).to.have.status(400)
    expect(res.body.error).to.equal('New password must be different from your current password.')
  })
})
