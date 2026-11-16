import { use, expect } from 'chai'
import { default as chaiHttp, request } from 'chai-http'
import app from '../app.js'
import data from '../data/index.js'

use(chaiHttp)
const { resetData } = data
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
    expect(res.body.group.openPredictions).to.equal(3)
    expect(res.body.users.every((user) => !('password' in user))).to.equal(true)
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
