// Connection
// The individual connection to a remote peer
// Provides an API to communicate with the remote peer
// Connection instance handles the establishment, persistence and closing of the connection to the remote peer

class Connection{
    constructor(remoteId,localId,ws){
        // Remember remoteId is the unique id amongst all your connections' ids
        this.remoteId = remoteId
        this.localId = localId
        this.ws = ws
        this.pc

        this.usingSignallingServer = 1      // ALWAYS SET TO TRUE (for now). Alternative is to use other peers as "signalling server"
        
        this.setup()
    }

    setup(){
        // Create RTCPeerConnection
        this.pc = new RTCPeerConnection()


        // onicecandidate
        this.pc.onicecandidate = this.gotIceCandidate


    }
    establishConnection(){
        // Create datachannel
        

        // Send offer
        this.localDescriptionHandler(true)
        

    }
    sendStr(data){
        this.ws.send(JSON.stringify([this.remoteId,data]))
    }
    async localDescriptionHandler(isOffer){
        try{
            let sessionDescription

            // Generate Local description
            if(isOffer){
                // Create Offer
                sessionDescription = await this.pc.createOffer()
            }else{
                // Create Answer
                sessionDescription = await this.pc.createAnswer()
            }

            // Set Local description
            await this.pc.setLocalDescription(sessionDescription)
            console.log('localDescription to '+this.remoteId+' is ',sessionDescription)

            // Send local description to remote peer a signalling server
            if(this.usingSignallingServer){
                this.sendStr(this.pc.localDescription)
            }
        }catch(err){
            throw err
        }
    }
    async onSignallingServer(sessionDescription){
        console.log('Connection to '+this.remoteId,'received: ',sessionDescription)
        if(sessionDescription.sdp){
            // If sdp session description
            console.log('sdp')
            try{
                // Set remote description
                await this.pc.setRemoteDescription(sessionDescription)
                console.log('remoteDescription to '+this.remoteId+' is ',sessionDescription)

                if(sessionDescription.type === "offer"){
                    // Reply if you're not offerer
                    this.localDescriptionHandler(false)
                }
            }catch(err){
                throw err
            }

        }else if(sessionDescription.ice){
            // ice message
            console.log('ice')
        }else{
            throw new Error('THIS SHOULD NOT BE HAPPENING! Did you send on null ice candidate?')
        }
    }
    gotIceCandidate = e =>{
        console.log('e.candidate',e.candidate)
    }
}

Connection.prototype

/* 
// create rtcpeerconnection
// create datachannel
// sdp offer
// ice




*/