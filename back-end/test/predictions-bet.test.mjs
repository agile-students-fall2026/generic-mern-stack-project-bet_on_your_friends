import { use, expect } from 'chai'
import { default as chaiHttp, request } from 'chai-http'
import app from '../app.js'
import data from '../data/index.js'

use(chaiHttp)
const { db, resetData } = data
let requester

function bet(userId = 'u1', outcome = 'Yes', amount = 25) {
  return requester.post('/api/predictions/p1/bets').send({ userId, outcome, amount })
}

describe('Placing bets', () => {
  before(() => { requester = request.execute(app).keepOpen() })
  after((done) => requester.close(done))
  beforeEach(() => resetData())

  it('records the bet and updates the account used by login', async () => {
    // Arrange: u1 starts with 1500 coins.
    // Act
    const res = await bet()
    const login = await requester.post('/api/auth/login').send({ email: 'maya@gmail.com', password: 'Password@123' })
    // Assert
    expect(res).to.have.status(200)
    expect(res.body.user.coinBalance).to.equal(1475)
    expect(res.body.prediction.bets[0]).to.include({ userId: 'u1', outcome: 'Yes', amount: 25 })
    expect(res.body.user).to.not.have.property('password')
    expect(login.body.coinBalance).to.equal(1475)
    expect(db.users[1].coinBalance).to.equal(1200)
  })

  it('accepts a bet using the remaining balance', async () => {
    // Arrange
    db.users[0].coinBalance = 25
    // Act
    const res = await bet()
    // Assert
    expect(res).to.have.status(200)
    expect(db.users[0].coinBalance).to.equal(0)
    expect(db.predictions[0].bets).to.have.length(1)
  })

  it('rejects creators, nonmembers, and invalid bets without deducting coins', async () => {
    // Arrange
    const saved = JSON.stringify(db)
    const invalid = [['u2', 'Yes', 25, 403], ['u5', 'Yes', 25, 403],
      ['u1', 'Missing', 25, 400], ['u1', 'Yes', 0, 400],
      ['u1', 'Yes', 1.5, 400], ['u1', 'Yes', '25', 400], ['u1', 'Yes', 50, 400]]
    for (const [userId, outcome, amount, status] of invalid) {
      // Act
      const res = await bet(userId, outcome, amount)
      // Assert
      expect(res).to.have.status(status)
      expect(JSON.stringify(db)).to.equal(saved)
    }
  })

  it('rejects duplicate bets and insufficient coins', async () => {
    // Arrange
    await bet()
    db.users[2].coinBalance = 10
    // Act
    const duplicate = await bet('u1', 'No')
    const insufficient = await bet('u3')
    // Assert
    expect(duplicate).to.have.status(400)
    expect(insufficient).to.have.status(400)
    expect(db.users[0].coinBalance).to.equal(1475)
    expect(db.users[2].coinBalance).to.equal(10)
    expect(db.predictions[0].bets).to.have.length(1)
  })

  it('rejects bets after the deadline or resolution', async () => {
    // Arrange
    const prediction = db.predictions[0]
    const states = [{ deadline: new Date(0).toISOString(), result: null },
      { deadline: new Date(Date.now() + 86400000).toISOString(), result: 'Yes' }]
    for (const state of states) {
      Object.assign(prediction, state)
      const saved = JSON.stringify(db)
      // Act
      const res = await bet()
      // Assert
      expect(res).to.have.status(400)
      expect(JSON.stringify(db)).to.equal(saved)
    }
  })
})
