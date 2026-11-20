// import and instantiate express
const express = require("express") // CommonJS import style!
const path = require('path') // handles file and directory paths
const app = express() // instantiate an Express object

// routers that hold each group of api routes
const authRouter = require('./routes/auth')
const usersRouter = require('./routes/users')
const groupsRouter = require('./routes/groups')
const predictionsRouter = require('./routes/predictions')
const uploadsRouter = require('./routes/uploads')

// decode JSON-formatted incoming POST data so routes can read req.body
app.use(express.json())

// serve uploaded images as static files -> /uploads/:filename
app.use('/uploads', express.static(path.join(__dirname, 'uploads')))

// some starter logic just so that localhost can boot up for now
app.get('/', (req, res) => {
  res.send('hello world!')
})

// log in, log out, and settings routes -> /api/auth/login, /api/auth/logout, and /api/users/:userId/
app.use('/api/auth', authRouter)
app.use('/api/users', usersRouter)

// group routes -> /api/groups, /api/groups/:groupId, and /api/groups/:groupId/members
app.use('/api/groups', groupsRouter)
app.use('/api', predictionsRouter)

// image upload route -> /api/uploads
app.use('/api/uploads', uploadsRouter)

// export the express app we created to make it available to other modules
module.exports = app
