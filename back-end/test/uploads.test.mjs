// tests for image upload route and serving uploaded images
import fs from 'fs'
import { use, expect } from 'chai'
import { default as chaiHttp, request } from 'chai-http'
import app from '../app.js'

use(chaiHttp)

describe('POST /api/uploads', () => {
  // one server per upload test
  let requester

  // URL of image uploaded during test
  let uploadedUrl

  before(() => {
    requester = request.execute(app).keepOpen()
  })

  // delete any test image from the uploads folder
  afterEach(() => {
    if (uploadedUrl) fs.rmSync(new URL(`..${uploadedUrl}`, import.meta.url), { force: true })
    uploadedUrl = null
  })

  after((done) => {
    requester.close(done)
  })

  it('saves an image and serves it from its URL', async () => {
    // arrange -> a small file sent as png image
    const image = Buffer.from('fake image data')

    // act -> upload image, then request it from URL that came back
    const res = await requester
      .post('/api/uploads')
      .attach('image', image, { filename: 'photo.png', contentType: 'image/png' })
    uploadedUrl = res.body.url
    const served = await requester.get(uploadedUrl)

    // assert -> image was saved under /uploads and express.static serves it
    expect(res).to.have.status(201)
    expect(uploadedUrl).to.match(/^\/uploads\/[\w-]+\.png$/)
    expect(served).to.have.status(200)
  })

  // one test per rejected file types
  const rejectedFiles = [
    {
      problem: 'the file is not an image',
      file: Buffer.from('not an image'),
      options: { filename: 'notes.txt', contentType: 'text/plain' },
      error: 'Please choose a PNG or JPEG image.'
    },
    {
      problem: 'the image is larger than 5 MB',
      file: Buffer.alloc(5 * 1024 * 1024 + 1),
      options: { filename: 'huge.png', contentType: 'image/png' },
      error: 'Images must be 5 MB or smaller.'
    },
    {
      problem: 'the file is a gif image',
      file: Buffer.from('GIF89a'),
      options: { filename: 'photo.gif', contentType: 'image/gif' },
      error: 'Please choose a PNG or JPEG image.'
    },
    {
      problem: 'the file is an svg image',
      file: Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"></svg>'),
      options: { filename: 'photo.svg', contentType: 'image/svg+xml' },
      error: 'Please choose a PNG or JPEG image.'
    },

  ]

  for (const { problem, file, options, error } of rejectedFiles) {
    it(`returns a 400 error when ${problem}`, async () => {
      // arrange -> a file that breaks one upload rule

      // act -> try to upload the file
      const res = await requester.post('/api/uploads').attach('image', file, options)
      uploadedUrl = res.body.url

      // assert -> error names the rule and no image URL comes back
      expect(res).to.have.status(400)
      expect(res.body.error).to.equal(error)
      expect(uploadedUrl).to.equal(undefined)
    })
  }
})
