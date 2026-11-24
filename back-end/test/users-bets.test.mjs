import { use, expect } from 'chai'
import { default as chaiHttp, request } from 'chai-http'
import app from '../app.js'
import data from '../data/index.js'

use(chaiHttp)

const { db, resetData } = data

describe('GET /api/users/:userId/bets', () => {
  beforeEach(() => {
    resetData()
  })

  it('returns bets for the requested user, newest first', async () => {
    // arrange -> Maya bet in two groups, and Priya also bet on p1
    const first = db.predictions.find((prediction) => prediction.id === 'p1')
    const second = db.predictions.find((prediction) => prediction.id === 'p4')

    first.bets.push(
      { userId: 'u1', outcome: 'Yes', amount: 25, placedAt: '2026-11-20T12:00:00.000Z' },
      { userId: 'u3', outcome: 'No', amount: 25, placedAt: '2026-11-20T13:00:00.000Z' }
    )
    second.bets.push(
      { userId: 'u1', outcome: 'No', amount: 25, placedAt: '2026-11-21T12:00:00.000Z' }
    )

    // act -> load Maya's bet history
    const res = await request.execute(app).get('/api/users/u1/bets')

    // assert -> only Maya's two bets show, with the newer one first
    expect(res).to.have.status(200)
    expect(res.body.map((row) => row.prediction.id)).to.deep.equal(['p4', 'p1'])
    expect(res.body.map((row) => row.bet.userId)).to.deep.equal(['u1', 'u1'])
    expect(res.body[0].group.name).to.equal('Study Squad')
    expect(res.body[0].canOpen).to.equal(true)
  })

  it('keeps a resolved bet visible after the user leaves the group', async () => {
    // arrange -> Maya won a bet and has since left Roommate Rivals
    const prediction = db.predictions.find((item) => item.id === 'p1')
    const group = db.groups.find((item) => item.id === 'g1')

    prediction.result = 'Yes'
    prediction.bets.push({ userId: 'u1', outcome: 'Yes', amount: 25, payout: 50 })
    group.memberIds = group.memberIds.filter((userId) => userId !== 'u1')

    // act -> load Maya's bet history
    const res = await request.execute(app).get('/api/users/u1/bets')

    // assert -> her result and payout still show, but she can't open the prediction
    expect(res).to.have.status(200)
    expect(res.body).to.have.length(1)
    expect(res.body[0].prediction.result).to.equal('Yes')
    expect(res.body[0].bet.payout).to.equal(50)
    expect(res.body[0].canOpen).to.equal(false)
  })

  it('returns an empty list when the user has no bets', async () => {
    // arrange -> the seeded users start without bets

    // act -> load Maya's bet history
    const res = await request.execute(app).get('/api/users/u1/bets')

    // assert -> the request succeeds with an empty list
    expect(res).to.have.status(200)
    expect(res.body).to.deep.equal([])
  })

  it('returns a 404 when the user does not exist', async () => {
    // arrange -> this ID doesn't belong to a seeded user

    // act -> try to load their bet history
    const res = await request.execute(app).get('/api/users/not-a-user/bets')

    // assert -> the route reports that the account wasn't found
    expect(res).to.have.status(404)
    expect(res.body.error).to.equal('This account does not exist.')
  })
})