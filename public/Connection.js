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
        this.dataChannel
        this.dataChannelActivated = false

        this.usingSignallingServer = 1      // ALWAYS SET TO TRUE (for now). Alternative is to use other peers as "signalling server"

        // TCP variables
        this.mCounter = 0   // Variable which increments everytime is sends a message
        
        this.setup()
    }

    setup(){
        // Create RTCPeerConnection
        this.pc = new RTCPeerConnection(config)

        this.pc.ondatachannel = e => {
            this.dataChannel = e.channel
            console.log('ondatachannel e',e)
            this.setupDataChannel()
        }


        // onicecandidate
        this.pc.onicecandidate = this.gotIceCandidate


    }
    establishConnection(){
        // Create datachannel
        this.dataChannel = this.pc.createDataChannel('ハルヒ')
        
        this.setupDataChannel()

        // Send offer
        this.localDescriptionHandler(true)
        

    }
    signallingSendStr(data){
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
                this.signallingSendStr(this.pc.localDescription)
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
            console.log('ice sessionDescription.ice:',sessionDescription.ice)
            try{
                await this.pc.addIceCandidate(sessionDescription.ice)
            }catch(err){
                throw err
            }
            
        }else{
            throw new Error('THIS SHOULD NOT BE HAPPENING! Did you send on null ice candidate?')
        }
    }
    gotIceCandidate = e =>{
        const candidate = e.candidate
        if(candidate){
            this.signallingSendStr({ice:e.candidate})
        }
        console.log('e.candidate',e.candidate)
    }
    setupDataChannel = () => {
        console.log('setupDataChannel event')
        this.dataChannel.addEventListener('message',this.onDataChannelMessage)
        this.dataChannel.addEventListener('open',()=>{this.dataChannelActivated=true})
    }
    onDataChannelMessage = (e) => {
        console.log('onDataChannelMessage e',e)
        try{
            const payload = JSON.parse(e.data)
            console.log('payload',payload)
            const state = payload[0]

            switch(state){
                case MESSAGE:
                    console.log('MESSAGE')
                    const mCounter = payload[1]
                    const data = payload[2]
    
                    break;
                case ACK: 
                    console.log('ACK')
                    const mCounterForAck = payload[1]
    
                    break;
                case RESENDREQ:
                    console.log('RESENDREQ')
                    const mCountersForResend = payload[1]
    
                    break;
                default:
                    throw new Error('NANI!? state',state,' should not exist')
            }
        }catch(err){
            // Can't be parsed
            throw err
        }
    }
    sendMessage(data){
        this.sendStr(MESSAGE,data)
        this.mCounter++
    }
    sendStr(state,data){
        switch(state){
            case MESSAGE:
                this.dataChannel.send(JSON.stringify([state,this.mCounter,data]))
                break;
            case ACK:
                const mCounterForAck = data
                this.dataChannel.send(JSON.stringify([state,mCounterForAck]))
                break;
            case RESENDREQ:
                const mCountersForResend = data
                this.dataChannel.send(JSON.stringify([state,mCountersForResend]))
                break;
            default:
                throw new Error('NANI!? state',state,' should not exist. sendStr()')
        }
    }
}

const config = {
    iceServers:[
        {urls:"stun:stun.stunprotocol.org:3478"},
        {urls:"stun:stun.l.google.com:19302"},
        {url:"turn:numb.viagenie.ca",credential:"muazkh",username:"webrtc@live.com"},
        {url:"turn:relay.backups.cz",credential:"webrtc",username:"webrtc"},
        {url:"turn:relay.backups.cz?transport=tcp",credential:"webrtc",username:"webrtc"}
    ],
    iceTransportPolicy:"all"//relay 
}

const MESSAGE = 0
const ACK = 1
const RESENDREQ = 2

/* 
// create rtcpeerconnection
// create datachannel
// sdp offer
// ice




*/
