// Network
// Manages all the connection instances
// Provides an API to communicate with a specified remote peer or all remote peers

class Network{
    constructor(){
        this.ws
        this.connections = {} // id to connection
        this.userIdList   // List of user ids from signalling server. That's all it is. A list of ids from server
        this.localId
        this.setup()
    }
    setup(){
        this.ws = new WebSocket(location.origin.replace(/http/,'ws'))

        this.ws.onmessage = this.onSignallingServer
    }
    onSignallingServer = (e)=>{
        // Handles message from signalling server

        const payload = JSON.parse(e.data)
        
        if(this.userIdList){
            // If already have userlist
            // Relay it to appropriate connection instance

            const senderId = payload[0]
            const data = payload[1]

            if(this.connections[senderId] !== undefined){
                // If you knew this remote peer existed
                console.log('I knew you existed')
            }else{
                // If you didn't know this remote peer existed create a connection for them! :D
                this.createConnection(senderId)
            }
            this.connections[senderId].onSignallingServer(data)  
        }else{
            // Just connected to server, just got localId and userIdList
            this.localId = payload[0]
            this.userIdList = payload[1]

            console.log('Your id is: '+this.localId)
        }
        console.log('NETWORK signalling server payload:',payload)
    }
    createConnection(remoteId){
        // Run ONLY AFTER onSignallingServer has given us the userIdList, unless another peer
        const connection = new Connection(remoteId,this.localId,this.ws)
        this.connections[remoteId]=(connection)
    }
}

/* 
STEPS:
1) Connect to signalling server
2) Receive userIdList from signalling server
3) Generate offers
4) Send offers to remote peer by signalling server
5?) Receive answer from remote peer by signalling server. And loop
6) Receive ice candidates
7) Send ice candidates
*/

/* 
Future ideas and future proofing:
1) Allow users to disconnect to signalling server
1a) How much data does websockets take up?  2332 bytes ish to setup a webrtc connection => 27665 connections per day on average
b) How much does it take up to just keep alive <= not a lot can have 
=> Doesn't seems like it's necessary.
=> But just in case...

2) Logging:
=> Already implemented. -1 when sent to server

3) Restablishing connection 
- Just delete self then create another connection?


*/


/*
#############################
SIGNALLING SERVER ###########

// When user connects. RECEIVING
[userId,userIdList]

// After user connects. RECEIVING
[senderId,sdpOrIceData]

// After user connects. SENDING
[destId,sdpOrIceData]

// After user connects. SENDING logging information to server only
[-1,data]

######################
CONNECTION ###########
Peer data, 3 payloads
[state(0-isMessage),mCounter(number of messages sender has sent),data]

[state(1-isAck),mCounterForAck(the mCounter of the payload the replier received)]

[state(2-resend),mCountersForResend(a LIST of mCounterSSSSSS not received)]      <= This is so peer can resolve unsent data as quickly as possible 


######################
NETWORK ##############
- This is the DATA package that is wrapped by the connection 
??? MAY NOT IMPLEMENT ???
[netState(0),data]

[netState(1-needPeerIdList)]

[netState(2-isPeerIdList),peerIdList]

*/