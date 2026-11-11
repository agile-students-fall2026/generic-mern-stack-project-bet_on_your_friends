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
    const res = await request
      .execute(app)
      .post('/api/auth/login')
      .send({ email: 'maya@gmail.com', password: 'Password@123' })

    expect(res).to.have.status(200)
    expect(res.body).to.include({ id: 'u1', email: 'maya@gmail.com' })
    expect(res.body).to.not.have.property('password')
  })

  it('makes a mock account with 1000 coins for a new email', async () => {
    const res = await request
      .execute(app)
      .post('/api/auth/login')
      .send({ email: 'jane.doe@gmail.com', password: 'Password@123' })

    expect(res).to.have.status(200)
    expect(res.body).to.include({ name: 'Jane Doe', coinBalance: 1000 })
  })

  it('returns a 400 error when the email or password is empty', async () => {
    const res = await request
      .execute(app)
      .post('/api/auth/login')
      .send({ email: '', password: '' })

    expect(res).to.have.status(400)
    expect(res.body.error).to.equal('Please enter your email and password.')
  })

  it('returns a 401 error when the password is wrong', async () => {
    const res = await request
      .execute(app)
      .post('/api/auth/login')
      .send({ email: 'maya@gmail.com', password: 'WrongPassword@123' })

    expect(res).to.have.status(401)
  })
})

describe('POST /api/auth/logout', () => {
  it('responds with a success message', async () => {
    const res = await request.execute(app).post('/api/auth/logout')

    expect(res).to.have.status(200)
    expect(res.body.message).to.equal('You have been logged out.')
  })
})
