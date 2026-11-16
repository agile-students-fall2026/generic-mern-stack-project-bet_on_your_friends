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

describe('Editing and deleting predictions', () => {
  before(() => { requester = request.execute(app).keepOpen() })
  after((done) => requester.close(done))
  beforeEach(() => resetData())

  it('lets the creator edit and delete before anyone bets', async () => {
    // Arrange
    const form = { ...validPrediction(), question: 'Updated question?' }
    // Act
    const edited = await requester.post('/api/predictions/p2').send(form)
    const deleted = await requester.delete('/api/predictions/p2').send({ userId: 'u1' })
    // Assert
    expect(edited).to.have.status(200)
    expect(edited.body.question).to.equal('Updated question?')
    expect(deleted).to.have.status(200)
    expect(db.predictions.some((item) => item.id === 'p2')).to.equal(false)
    expect(db.groups[0].openPredictions).to.equal(2)
  })

  it('rejects invalid edits and changes from another user', async () => {
    // Arrange
    const saved = JSON.stringify(db.predictions)
    // Act
    const invalid = await requester.post('/api/predictions/p2').send({ ...validPrediction(), outcomes: ['Yes', 'Yes'] })
    const edit = await requester.post('/api/predictions/p1').send(validPrediction())
    const remove = await requester.delete('/api/predictions/p1').send({ userId: 'u1' })
    // Assert
    expect(invalid).to.have.status(400)
    expect(edit).to.have.status(403)
    expect(remove).to.have.status(403)
    expect(JSON.stringify(db.predictions)).to.equal(saved)
  })

  it('blocks changes after bets or resolution', async () => {
    // Arrange
    const prediction = db.predictions[1]
    const states = [{ bets: [{ userId: 'u2', outcome: 'Yes', amount: 25 }], result: null },
      { bets: [], result: 'Yes' }]
    for (const state of states) {
      Object.assign(prediction, state)
      // Act
      const edit = await requester.post('/api/predictions/p2').send(validPrediction())
      const remove = await requester.delete('/api/predictions/p2').send({ userId: 'u1' })
      // Assert
      expect(edit).to.have.status(403)
      expect(remove).to.have.status(403)
    }
  })
})
