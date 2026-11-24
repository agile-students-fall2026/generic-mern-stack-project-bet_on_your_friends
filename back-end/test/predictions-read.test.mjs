import { use, expect } from 'chai'
import { default as chaiHttp, request } from 'chai-http'
import app from '../app.js'
import data from '../data/index.js'

use(chaiHttp)
const { db, resetData } = data
let requester

describe('Reading predictions', () => {
  before(() => { requester = request.execute(app).keepOpen() })
  after((done) => requester.close(done))
  beforeEach(() => resetData())

  it('returns only the group predictions and hides passwords', async () => {
    // Arrange: u1 belongs to g1.
    // Act
    const res = await requester.get('/api/groups/g1/predictions?userId=u1')
    // Assert
    expect(res).to.have.status(200)
    expect(res.body.predictions.map((item) => item.groupId)).to.deep.equal(['g1', 'g1', 'g1'])
    expect(res.body.users.every((user) => !('password' in user))).to.equal(true)
  })

  it('excludes resolved predictions from the open count', async () => {
    // Arrange
    db.predictions.find((prediction) => prediction.id === 'p1').result = 'Yes'
    // Act
    const res = await requester.get('/api/groups/g1/predictions?userId=u1')
    // Assert
    expect(res).to.have.status(200)
    expect(res.body.group.openPredictions).to.equal(2)
  })

  it('returns prediction details', async () => {
    // Arrange: p1 has Yes and No outcomes.
    // Act
    const res = await requester.get('/api/predictions/p1?userId=u1')
    // Assert
    expect(res).to.have.status(200)
    expect(res.body.outcomes).to.deep.equal(['Yes', 'No'])
    expect(res.body.bettingClosed).to.equal(false)
  })

  it('returns the bettor names and stakes for each outcome', async () => {
    // arrange -> u1 and u4 pick Yes, and u3 picks No on p1
    const choices = [
      { userId: 'u1', outcome: 'Yes', amount: 25 },
      { userId: 'u4', outcome: 'Yes', amount: 25 },
      { userId: 'u3', outcome: 'No', amount: 25 }
    ]

    // Place all three bets and make sure the backend accepts each one.
    for (const choice of choices) {
      const bet = await requester.post('/api/predictions/p1/bets').send(choice)
      expect(bet).to.have.status(200)
    }

    // act -> u2 loads the predictions for group g1
    const res = await requester.get('/api/groups/g1/predictions?userId=u2')

    // assert -> the group predictions loaded successfully
    expect(res).to.have.status(200)

    // Find p1 and use each bet's user ID to look up the bettor's name.
    const prediction = res.body.predictions.find((item) => item.id === 'p1')
    const bettors = prediction.bets.map((bet) => ({
      name: res.body.users.find((user) => user.id === bet.userId)?.name,
      outcome: bet.outcome,
      amount: bet.amount
    }))

    // Check that each bettor is matched to the right outcome and stake.
    expect(bettors).to.have.deep.members([
      { name: 'Maya Chen', outcome: 'Yes', amount: 25 },
      { name: 'Sam Rivera', outcome: 'Yes', amount: 25 },
      { name: 'Priya Patel', outcome: 'No', amount: 25 }
    ])
  })

  it('rejects missing groups, predictions, and accounts', async () => {
    // Arrange
    const paths = ['/api/groups/missing/predictions?userId=u1',
      '/api/predictions/missing?userId=u1', '/api/predictions/p1?userId=missing']
    for (const path of paths) {
      // Act
      const res = await requester.get(path)
      // Assert
      expect(res).to.have.status(404)
    }
  })

  it('rejects a user outside the group', async () => {
    // Arrange: u5 is not a member of g1.
    // Act
    const list = await requester.get('/api/groups/g1/predictions?userId=u5')
    const detail = await requester.get('/api/predictions/p1?userId=u5')
    // Assert
    expect(list).to.have.status(403)
    expect(detail).to.have.status(403)
  })
})
