// signalling server
// Relays sdp descriptions and ice candidates from one peer to the other another during their connection establishment
// Also provides clients a list of active users during conntection

// Require modules
const ws = require('ws')

// Initialisation
const idToWs = {}
let idCounter = 0


module.exports = function(server){
    // Websocket
    const wss = new ws.Server({server})


    // Websocket server
    wss.on('connection',ws=>{
        onConnection.call(ws)
        ws.on('message',onMessage)
        ws.on('close',onClose)
    })
}


//#####################
// FUNCTIONS
//#####################

function onConnection(){
    // New connection
    console.log('new connection',idCounter)

    // Send client id AND client list of all connected remote peers
    this.id = idCounter
    this.send(JSON.stringify([this.id,idToWs.getIdList()]))

    // Update idToWs
    idToWs[this.id] = this

    // Increment counter
    idCounter++
}

function onMessage(unparsedPayload){
    // CLIENT=>SERVER payload format:
    // [destinationId,data]

    try{
        // Extract information
        const payload = JSON.parse(unparsedPayload)
        const [destId, data] =  payload

        if(destId===-1){
            doLoggging(data)
            return
        }
    
        // Destination websocket
        const destWs = idToWs[destId]

        // Generate new payload
        // SERVER=>CLIENT payload format:
        // [senderId,data]
        const payloadReceiver = JSON.stringify([this.id,data])
    
        // Send payload to destination websocket
        destWs.send(payloadReceiver)
    }catch(err){
        // !@#!@#!@#!@#!@#!@#!@# change later in production
        throw err
    }
}

function onClose(){
    console.log('ws '+this.id+' disconnected')
    delete idToWs[this.id]
}


function doLoggging(data){
    console.log(data)
}


idToWs.__proto__.getIdList = function(){
    return Object.keys(idToWs).map(valStr=>Number(valStr))
}


