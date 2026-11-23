import { use, expect } from 'chai'
import { default as chaiHttp, request } from 'chai-http'
import app from '../app.js'
import data from '../data/index.js'

use(chaiHttp)
const { db, resetData } = data
let requester

// start with bets already recorded and coins deducted
function addBet(userId = 'u1', outcome = 'Yes', amount = 25) {
  db.predictions[0].bets.push({ userId, outcome, amount })
  db.users.find((user) => user.id === userId).coinBalance -= amount
}

function resolve(outcome = 'Yes', userId = 'u2') {
  return requester.post('/api/predictions/p1/resolve').send({ userId, outcome })
}

describe('Resolving predictions', () => {
  before(() => { requester = request.execute(app).keepOpen() })
  after((done) => requester.close(done))
  beforeEach(() => resetData())

  it('pays winners without losing coins to rounding', async () => {
    // Arrange
    const total = db.users.reduce((sum, user) => sum + user.coinBalance, 0)
    addBet('u1', 'Yes')
    addBet('u3', 'Yes')
    addBet('u4', 'No')
    // Act
    const res = await resolve()
    // Assert
    expect(res).to.have.status(200)
    expect(res.body.prediction.result).to.equal('Yes')
    expect(res.body.prediction.bets.map((item) => item.payout)).to.deep.equal([37, 38, 0])
    expect(db.users[0].coinBalance).to.equal(1512)
    expect(db.users[2].coinBalance).to.equal(2313)
    expect(db.users[3].coinBalance).to.equal(775)
    expect(db.users.reduce((sum, user) => sum + user.coinBalance, 0)).to.equal(total)
    expect(db.groups[0].openPredictions).to.equal(2)
  })

  it('refunds bets when nobody chose the final outcome', async () => {
    // Arrange
    addBet()
    // Act
    const res = await resolve('No')
    // Assert
    expect(res).to.have.status(200)
    expect(res.body.prediction.refunded).to.equal(true)
    expect(res.body.prediction.bets[0].payout).to.equal(25)
    expect(db.users[0].coinBalance).to.equal(1500)
  })

  it('rejects another resolver, invalid outcomes, and repeat resolution', async () => {
    // Arrange
    addBet()
    const saved = JSON.stringify(db)
    // Act
    const otherUser = await resolve('Yes', 'u1')
    const invalid = await resolve('Missing')
    // Assert
    expect(otherUser).to.have.status(403)
    expect(invalid).to.have.status(400)
    expect(JSON.stringify(db)).to.equal(saved)

    // Arrange
    await resolve()
    const resolved = JSON.stringify(db)
    // Act
    const repeated = await resolve()
    // Assert
    expect(repeated).to.have.status(400)
    expect(JSON.stringify(db)).to.equal(resolved)
  })

  it('allows resolution without bets', async () => {
    // Arrange: p1 has no bets.
    // Act
    const res = await resolve()
    // Assert
    expect(res).to.have.status(200)
    expect(res.body.prediction.bets).to.deep.equal([])
    expect(db.groups[0].openPredictions).to.equal(2)
  })
})
