import { use, expect } from 'chai'
import { default as chaiHttp, request } from 'chai-http'
import app from '../app.js'
import data from '../data/index.js'

use(chaiHttp)

const { db, resetData } = data

describe('POST /api/predictions/:predictionId/comments', () => {
  // Start every test with the original users, groups, and predictions.
  beforeEach(() => {
    resetData()
  })

  it('saves a comment that another group member can read', async () => {
    // arrange -> u1 and u2 belong to g1, which contains prediction p1
    const body = {
      userId: 'u1',
      text: '  I think so!  '
    }

    // act -> u1 posts a comment, then u2 loads the group's predictions
    const posted = await request.execute(app)
      .post('/api/predictions/p1/comments')
      .send(body)

    const loaded = await request.execute(app)
      .get('/api/groups/g1/predictions?userId=u2')

    // assert -> the comment was created with trimmed text and an author
    expect(posted).to.have.status(201)
    expect(posted.body).to.include({
      userId: 'u1',
      text: 'I think so!'
    })
    expect(posted.body.id).to.be.a('string')
    expect(posted.body.createdAt).to.be.a('string')

    // assert -> another member receives the same saved comment
    expect(loaded).to.have.status(200)
    const prediction = loaded.body.predictions.find((item) => item.id === 'p1')
    expect(prediction.comments).to.deep.include(posted.body)
    expect(db.predictions.find((item) => item.id === 'p1').comments)
      .to.deep.include(posted.body)
  })
})