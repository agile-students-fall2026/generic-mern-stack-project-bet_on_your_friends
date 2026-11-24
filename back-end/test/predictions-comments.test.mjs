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
  it('rejects a comment containing only spaces', async () => {
    // arrange -> spaces alone should not count as a comment
    const body = { userId: 'u1', text: '   ' }

    // act -> try to post the comment
    const res = await request.execute(app)
      .post('/api/predictions/p1/comments')
      .send(body)

    // assert -> the request fails and no comment is saved
    expect(res).to.have.status(400)
    expect(res.body.error).to.equal(
      'Write at least one character before sending.'
    )
    expect(db.predictions.find((item) => item.id === 'p1').comments)
      .to.be.empty
  })

  it('rejects a comment longer than 500 characters', async () => {
    // arrange -> the comment is one character over the limit
    const body = { userId: 'u1', text: 'a'.repeat(501) }

    // act -> try to post the comment
    const res = await request.execute(app)
      .post('/api/predictions/p1/comments')
      .send(body)

    // assert -> the request fails and no comment is saved
    expect(res).to.have.status(400)
    expect(res.body.error).to.equal(
      'Keep your comment within 500 characters.'
    )
    expect(db.predictions.find((item) => item.id === 'p1').comments)
      .to.be.empty
  })

  it('rejects a comment from someone outside the group', async () => {
    // arrange -> u5 does not belong to the group containing p1
    const body = { userId: 'u5', text: 'Hello!' }

    // act -> u5 tries to comment on p1
    const res = await request.execute(app)
      .post('/api/predictions/p1/comments')
      .send(body)

    // assert -> a nonmember cannot add a comment
    expect(res).to.have.status(403)
    expect(res.body.error).to.equal('You must belong to this group.')
    expect(db.predictions.find((item) => item.id === 'p1').comments)
      .to.be.empty
  })

  it('returns a 404 when the prediction does not exist', async () => {
    // arrange -> this prediction ID is not in the mock data
    const body = { userId: 'u1', text: 'Hello!' }

    // act -> try to comment on the missing prediction
    const res = await request.execute(app)
      .post('/api/predictions/not-a-prediction/comments')
      .send(body)

    // assert -> the route reports that the prediction was not found
    expect(res).to.have.status(404)
    expect(res.body.error).to.equal('Prediction not found.')
  })
    it('keeps the discussion available after a prediction is resolved', async () => {
    // arrange -> u1 posts a comment on p1 before it has a final outcome
    const before = await request.execute(app)
      .post('/api/predictions/p1/comments')
      .send({ userId: 'u1', text: 'I think the answer is Yes.' })
    expect(before).to.have.status(201)

    // u2 created p1 and resolves it with Yes as the final outcome.
    const resolved = await request.execute(app)
      .post('/api/predictions/p1/resolve')
      .send({ userId: 'u2', outcome: 'Yes' })
    expect(resolved).to.have.status(200)

    // act -> u3 posts another comment on p1 after it is resolved
    const after = await request.execute(app)
      .post('/api/predictions/p1/comments')
      .send({ userId: 'u3', text: 'Good call!' })

    // u4 opens p1 to read the result and the discussion.
    const loaded = await request.execute(app)
      .get('/api/predictions/p1?userId=u4')

    // assert -> p1 accepts the new comment and keeps its final outcome
    expect(after).to.have.status(201)
    expect(loaded).to.have.status(200)
    expect(loaded.body.result).to.equal('Yes')

    // Both comments are returned in posting order.
    expect(loaded.body.comments).to.deep.equal([before.body, after.body])
  })
})