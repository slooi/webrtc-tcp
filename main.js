// Require modules
const express = require('express')
const http = require('http')
const path = require('path')

const signallingServer = require('./signallingServer')

// Initialise
const app = express()

// ENVIRONMENT VARIABLES
const PORT = process.env.PORT || 3000


// Routes
app.get('/',(req,res)=>{
    console.log('Site hit')
    res.sendFile(path.resolve(__dirname,'public','index.html'))
})

// Middleware
app.use(express.static(path.resolve(__dirname,'public')))



// Server
const server = http.createServer(app)
server.listen(PORT,()=>{
    console.log('Listening on port: '+PORT)
})

// Setup signalling server
signallingServer(server)
