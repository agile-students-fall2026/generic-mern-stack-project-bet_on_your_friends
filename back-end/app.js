// import and instantiate express
const express = require("express") // CommonJS import style!
const app = express() // instantiate an Express object

// some starter logic just so that localhost can boot up for now
app.get('/', (req, res) => {
  res.send('hello world!')
})

// export the express app we created to make it available to other modules
module.exports = app