import { use, expect } from 'chai'
import { default as chaiHttp, request } from 'chai-http'
import app from '../app.js'
import data from '../data/index.js'

use(chaiHttp)
const { db, resetData } = data
let requester

function validPrediction() {
  return {
    userId: 'u1',
    question: 'Will our team finish on Friday?',
    outcomes: ['Yes', 'No'],
    deadline: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    stake: 25
  }
}

describe('Creating predictions', () => {
  before(() => { requester = request.execute(app).keepOpen() })
  after((done) => requester.close(done))
  beforeEach(() => resetData())

  it('creates a prediction and updates the group count', async () => {
    // Arrange
    const form = validPrediction()
    // Act
    const res = await requester.post('/api/groups/g1/predictions').send(form)
    // Assert
    expect(res).to.have.status(201)
    expect(res.body).to.include({ creatorId: 'u1', groupId: 'g1', stake: 25 })
    expect(res.body.bets).to.deep.equal([])
    expect(db.groups[0].openPredictions).to.equal(4)
    expect(new Set(db.predictions.map((item) => item.id)).size).to.equal(7)
  })

  it('accepts five outcomes and the 250-character limit', async () => {
    // Arrange
    const form = { ...validPrediction(), outcomes: ['a'.repeat(250), 'No', 'Maybe', 'Later', 'Never'] }
    // Act
    const res = await requester.post('/api/groups/g1/predictions').send(form)
    // Assert
    expect(res).to.have.status(201)
    expect(res.body.outcomes).to.have.length(5)
  })

  it('rejects invalid fields without saving a prediction', async () => {
    // Arrange
    const invalid = [
      { question: ' ' }, { outcomes: ['Yes'] }, { outcomes: ['Yes', ' yes '] },
      { outcomes: ['1', '2', '3', '4', '5', '6'] }, { outcomes: ['Yes', ''] },
      { outcomes: ['a'.repeat(251), 'No'] }, { stake: 0 }, { stake: 1.5 },
      { deadline: 'not a date' }, { deadline: new Date(0).toISOString() },
      { deadline: new Date(Date.now() + 370 * 24 * 60 * 60 * 1000).toISOString() }
    ]
    for (const fields of invalid) {
      // Act
      const res = await requester.post('/api/groups/g1/predictions').send({ ...validPrediction(), ...fields })
      // Assert
      expect(res).to.have.status(400)
      expect(db.predictions).to.have.length(6)
    }
  })

  it('rejects a nonmember creating a prediction', async () => {
    // Arrange
    const form = { ...validPrediction(), userId: 'u5' }
    // Act
    const res = await requester.post('/api/groups/g1/predictions').send(form)
    // Assert
    expect(res).to.have.status(403)
    expect(db.predictions).to.have.length(6)
  })
})
