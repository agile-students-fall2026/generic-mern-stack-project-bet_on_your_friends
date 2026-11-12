import { use, expect } from 'chai'
import { default as chaiHttp, request } from 'chai-http'
import app from '../app.js'
import data from '../data/index.js'

use(chaiHttp)

const { db, resetData } = data

function validPrediction() {
  return {
    userId: 'u1',
    question: 'Will our team finish on Friday?',
    outcomes: ['Yes', 'No'],
    deadline: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    stake: 25
  }
}

function bet(userId = 'u1', outcome = 'Yes', amount = 25) {
  return request.execute(app).post('/api/predictions/p1/bets').send({ userId, outcome, amount })
}

function resolve(outcome = 'Yes', userId = 'u2') {
  return request.execute(app).post('/api/predictions/p1/resolve').send({ userId, outcome })
}

describe('Prediction routes', () => {
  beforeEach(() => resetData())

  it('loads only the selected group and hides passwords', async () => {
    const res = await request.execute(app).get('/api/groups/g1/predictions?userId=u1')
    expect(res).to.have.status(200)
    expect(res.body.group.openPredictions).to.equal(3)
    expect(res.body.predictions.map((prediction) => prediction.groupId)).to.deep.equal(['g1', 'g1', 'g1'])
    expect(res.body.users.every((user) => !('password' in user))).to.equal(true)
  })

  it('loads a prediction with its outcomes and betting status', async () => {
    const res = await request.execute(app).get('/api/predictions/p1?userId=u1')
    expect(res).to.have.status(200)
    expect(res.body.outcomes).to.deep.equal(['Yes', 'No'])
    expect(res.body.bettingClosed).to.equal(false)
  })

  it('rejects a missing group, prediction, or account', async () => {
    for (const path of ['/api/groups/missing/predictions?userId=u1', '/api/predictions/missing?userId=u1', '/api/predictions/p1?userId=missing']) {
      const res = await request.execute(app).get(path)
      expect(res).to.have.status(404)
    }
  })

  it('rejects nonmembers for both reading and changing predictions', async () => {
    const list = await request.execute(app).get('/api/groups/g1/predictions?userId=u5')
    const detail = await request.execute(app).get('/api/predictions/p1?userId=u5')
    const create = await request.execute(app).post('/api/groups/g1/predictions').send({ ...validPrediction(), userId: 'u5' })
    const wager = await bet('u5')
    for (const res of [list, detail, create, wager]) expect(res).to.have.status(403)
    expect(db.predictions).to.have.length(6)
    expect(db.users[4].coinBalance).to.equal(1000)
  })

  it('creates a prediction with a unique ID and updates the group count', async () => {
    const res = await request.execute(app).post('/api/groups/g1/predictions').send(validPrediction())
    expect(res).to.have.status(201)
    expect(res.body).to.include({ creatorId: 'u1', groupId: 'g1', stake: 25 })
    expect(res.body.bets).to.deep.equal([])
    expect(db.groups[0].openPredictions).to.equal(4)
    expect(new Set(db.predictions.map((prediction) => prediction.id)).size).to.equal(7)
  })

  it('accepts two to five outcomes and 250 characters', async () => {
    const res = await request.execute(app).post('/api/groups/g1/predictions').send({
      ...validPrediction(), outcomes: ['a'.repeat(250), 'No', 'Maybe', 'Later', 'Never']
    })
    expect(res).to.have.status(201)
    expect(res.body.outcomes).to.have.length(5)
  })

  it('rejects invalid questions, outcomes, stakes, and deadlines without writes', async () => {
    const invalid = [
      { question: '  ' }, { question: 3 }, { outcomes: ['Yes'] },
      { outcomes: ['1', '2', '3', '4', '5', '6'] }, { outcomes: ['Yes', ' yes '] },
      { outcomes: ['Yes', ' '] }, { outcomes: ['Yes', null] }, { outcomes: 'Yes' },
      { outcomes: ['a'.repeat(251), 'No'] }, { stake: 0 }, { stake: -1 },
      { stake: 1.5 }, { stake: '25' }, { stake: null }, { stake: Number.MAX_SAFE_INTEGER + 1 },
      { deadline: '' }, { deadline: 'not a date' }, { deadline: new Date(0).toISOString() },
      { deadline: new Date(Date.now() + 370 * 24 * 60 * 60 * 1000).toISOString() }
    ]
    const saved = JSON.stringify(db)
    for (const fields of invalid) {
      const res = await request.execute(app).post('/api/groups/g1/predictions').send({ ...validPrediction(), ...fields })
      expect(res).to.have.status(400)
      expect(JSON.stringify(db)).to.equal(saved)
    }
  })

  it('edits and deletes an unbet prediction as its creator', async () => {
    const edited = await request.execute(app).patch('/api/predictions/p2').send({ ...validPrediction(), question: 'Updated question?' })
    expect(edited).to.have.status(200)
    expect(edited.body.question).to.equal('Updated question?')
    const deleted = await request.execute(app).delete('/api/predictions/p2').send({ userId: 'u1' })
    expect(deleted).to.have.status(200)
    expect(db.predictions.some((prediction) => prediction.id === 'p2')).to.equal(false)
    expect(db.groups[0].openPredictions).to.equal(2)
  })

  it('rejects invalid edits and another user editing or deleting', async () => {
    const saved = JSON.stringify(db.predictions)
    const invalid = await request.execute(app).patch('/api/predictions/p2').send({ ...validPrediction(), outcomes: ['Yes', 'Yes'] })
    const edit = await request.execute(app).patch('/api/predictions/p1').send(validPrediction())
    const remove = await request.execute(app).delete('/api/predictions/p1').send({ userId: 'u1' })
    expect(invalid).to.have.status(400)
    expect(edit).to.have.status(403)
    expect(remove).to.have.status(403)
    expect(JSON.stringify(db.predictions)).to.equal(saved)
  })

  it('blocks editing and deletion after a bet or resolution', async () => {
    await bet()
    for (const resolved of [false, true]) {
      if (resolved) await resolve()
      const edit = await request.execute(app).patch('/api/predictions/p1').send({ ...validPrediction(), userId: 'u2' })
      const remove = await request.execute(app).delete('/api/predictions/p1').send({ userId: 'u2' })
      expect(edit).to.have.status(403)
      expect(remove).to.have.status(403)
    }
  })

  it('deducts the bet from the same account used by login', async () => {
    const res = await bet()
    expect(res).to.have.status(200)
    expect(res.body.user.coinBalance).to.equal(1475)
    expect(res.body.user).to.not.have.property('password')
    expect(res.body.prediction.bets[0]).to.include({ userId: 'u1', outcome: 'Yes', amount: 25 })
    const login = await request.execute(app).post('/api/auth/login').send({ email: 'maya@gmail.com', password: 'Password@123' })
    expect(login.body.coinBalance).to.equal(1475)
    expect(db.users[1].coinBalance).to.equal(1200)
  })

  it('rejects creators, invalid outcomes, and invalid amounts without deducting coins', async () => {
    const saved = JSON.stringify(db)
    for (const [userId, outcome, amount, status] of [
      ['u2', 'Yes', 25, 403], ['u1', 'Missing', 25, 400],
      ['u1', 'Yes', 0, 400], ['u1', 'Yes', -1, 400], ['u1', 'Yes', 1.5, 400],
      ['u1', 'Yes', '25', 400], ['u1', 'Yes', 50, 400]
    ]) {
      const res = await bet(userId, outcome, amount)
      expect(res).to.have.status(status)
      expect(JSON.stringify(db)).to.equal(saved)
    }
  })

  it('rejects duplicate bets and insufficient coins', async () => {
    await bet()
    const duplicate = await bet('u1', 'No')
    expect(duplicate).to.have.status(400)
    expect(db.users[0].coinBalance).to.equal(1475)
    db.users[2].coinBalance = 10
    const insufficient = await bet('u3')
    expect(insufficient).to.have.status(400)
    expect(db.users[2].coinBalance).to.equal(10)
    expect(db.predictions[0].bets).to.have.length(1)
  })

  it('rejects bets after the deadline or resolution', async () => {
    db.predictions[0].deadline = new Date(0).toISOString()
    expect(await bet()).to.have.status(400)
    const detail = await request.execute(app).get('/api/predictions/p1?userId=u1')
    expect(detail.body.bettingClosed).to.equal(true)
    await resolve()
    expect(await bet()).to.have.status(400)
    expect(db.users[0].coinBalance).to.equal(1500)
  })

  it('pays winners, records losers, and conserves all coins', async () => {
    const total = db.users.reduce((sum, user) => sum + user.coinBalance, 0)
    await bet('u1', 'Yes')
    await bet('u3', 'Yes')
    await bet('u4', 'No')
    const res = await resolve()
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
    await bet()
    const res = await resolve('No')
    expect(res).to.have.status(200)
    expect(res.body.prediction.refunded).to.equal(true)
    expect(res.body.prediction.bets[0].payout).to.equal(25)
    expect(db.users[0].coinBalance).to.equal(1500)
  })

  it('rejects another resolver, an invalid outcome, and repeat resolution', async () => {
    await bet()
    const saved = JSON.stringify(db)
    expect(await resolve('Yes', 'u1')).to.have.status(403)
    expect(await resolve('Missing')).to.have.status(400)
    expect(JSON.stringify(db)).to.equal(saved)
    await resolve()
    const resolved = JSON.stringify(db)
    expect(await resolve()).to.have.status(400)
    expect(JSON.stringify(db)).to.equal(resolved)
  })

  it('allows resolution without bets', async () => {
    const res = await resolve()
    expect(res).to.have.status(200)
    expect(res.body.prediction.bets).to.deep.equal([])
    expect(db.groups[0].openPredictions).to.equal(2)
  })
})
