// tests for the log in and log out routes
import { use, expect } from 'chai'
import { default as chaiHttp, request } from 'chai-http'
import app from '../app.js'
import data from '../data/index.js'

use(chaiHttp)

const { resetData } = data

describe('POST /api/auth/login', () => {
  // start every test with the same mock data
  beforeEach(() => {
    resetData()
  })

  it('logs in an existing user and sends back their info without the password', async () => {
    // arrange -> email and password of a seeded user (u1)
    const credentials = { email: 'maya@gmail.com', password: 'Password@123' }

    // act -> try to log in
    const res = await request
      .execute(app)
      .post('/api/auth/login')
      .send(credentials)

    // assert -> logged in as u1 with password is never sent back
    expect(res).to.have.status(200)
    expect(res.body).to.include({ id: 'u1', email: 'maya@gmail.com' })
    expect(res.body).to.not.have.property('password')
  })

  it('returns a 401 error for an email with no account', async () => {
    // arrange -> an email that isn't in the mock data
    const credentials = { email: 'jane.doe@gmail.com', password: 'Password@123' }

    // act -> try to log in
    const res = await request
      .execute(app)
      .post('/api/auth/login')
      .send(credentials)

    // assert -> rejected instead of making a new account
    expect(res).to.have.status(401)
    expect(res.body.error).to.equal('Incorrect email or password.')
  })

  it('returns a 400 error when the email or password is empty', async () => {
    // arrange -> email and password fields left blank
    const credentials = { email: '', password: '' }

    // act -> try to log in
    const res = await request
      .execute(app)
      .post('/api/auth/login')
      .send(credentials)

    // assert -> asked to fill in both fields
    expect(res).to.have.status(400)
    expect(res.body.error).to.equal('Please enter your email and password.')
  })

  it('returns a 401 error when the password is wrong', async () => {
    // arrange -> a seeded user's email with the wrong password
    const credentials = { email: 'maya@gmail.com', password: 'WrongPassword@123' }

    // act -> try to log in
    const res = await request
      .execute(app)
      .post('/api/auth/login')
      .send(credentials)

    // assert -> rejected with the same error as an unknown email
    expect(res).to.have.status(401)
    expect(res.body.error).to.equal('Incorrect email or password.')
  })
})

describe('POST /api/auth/logout', () => {
  it('responds with a success message', async () => {
    // arrange -> nothing to set up for log out

    // act -> log out
    const res = await request.execute(app).post('/api/auth/logout')

    // assert -> confirms log out was successful
    expect(res).to.have.status(200)
    expect(res.body.message).to.equal('You have been logged out.')
  })
})
