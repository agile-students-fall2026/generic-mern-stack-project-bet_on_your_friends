import { use, expect } from 'chai'
import { default as chaiHttp, request } from 'chai-http'
import app from '../app.js'
import data from '../data/index.js'

use(chaiHttp)

const { db, resetData } = data

// valid account details to reuse across multiple test cases
// each test can change just one field to verify validation logic
function validAccount() {
  return {
    name: 'Jane Doe',
    email: 'jane@example.com',
    dateOfBirth: '2000-01-01',
    password: 'Password123',
    confirmPassword: 'Password123'
  }
}

describe('POST /api/auth/signup', () => {
  // start every test with same mock data -> ensures 
  // one test doesn't affect another test
  beforeEach(() => {
    resetData()
  })

  it('creates a new account with 1000 coins', async () => {
    // arrange -> prepare valid account information
    const account = validAccount()

    // act -> send account details to back-end
    const res = await request.execute(app)
      .post('/api/auth/signup')
      .send(account)

    // assert -> user was created + received 1000 starting coins
    expect(res).to.have.status(201)
    expect(res.body).to.include({
      name: 'Jane Doe',
      email: 'jane@example.com',
      coinBalance: 1000
    })

    // password must never be included in response
    expect(res.body).to.not.have.property('password')

    // original mock data had five users, so it should now have six
    expect(db.users).to.have.lengthOf(6)
  })

  it('allows the newly created account to log in', async () => {
    // arrange -> create a new account
    const account = validAccount()

    const signup = await request.execute(app)
      .post('/api/auth/signup')
      .send(account)

    // act -> try logging in with exact same credentials
    const login = await request.execute(app)
      .post('/api/auth/login')
      .send({
        email: account.email,
        password: account.password
      })

    // assert -> account is recognized by existing Login route
    expect(login).to.have.status(200)
    expect(login.body.id).to.equal(signup.body.id)
    expect(login.body).to.not.have.property('password')
  })

  it('rejects an email that already belongs to a user', async () => {
    // arrange -> Maya already has an account in seeded mock data
    const account = validAccount()
    account.email = 'MAYA@GMAIL.COM'

    // act -> try creating another account using same email
    const res = await request.execute(app)
      .post('/api/auth/signup')
      .send(account)

    // assert -> duplicate email rejected without saving another user
    expect(res).to.have.status(409)
    expect(db.users).to.have.lengthOf(5)
  })

  it('rejects an invalid password', async () => {
    // arrange -> password does not contain an uppercase letter or number
    const account = validAccount()
    account.password = 'password'
    account.confirmPassword = 'password'

    // act -> try registering with invalid password
    const res = await request.execute(app)
      .post('/api/auth/signup')
      .send(account)

    // assert -> validation fails + no account is created
    expect(res).to.have.status(400)
    expect(db.users).to.have.lengthOf(5)
  })

  it('rejects an invalid date of birth', async () => {
    // arrange -> February 30 is not a real calendar date
    const account = validAccount()
    account.dateOfBirth = '2000-02-30'

    // act -> try registering with an impossible date
    const res = await request.execute(app)
      .post('/api/auth/signup')
      .send(account)

    // assert -> invalid date rejected
    expect(res).to.have.status(400)
    expect(db.users).to.have.lengthOf(5)
  })
})