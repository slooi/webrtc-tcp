
// Handles all dataChannel related stuff.
// Handles: OPENING, CLOSING, MESSAGES,
class DataChannelHandler{
    constructor(dataChannel,parent){
        this.dataChannel = dataChannel
        this.parent = parent
        
        // TCP variables
        this.mCounterLocal = 0   // Variable which increments everytime is sends a message
        this.mCounterRemoteHighest = 0   // The HIGHEST mCounter we've RECEIVED from remote peer
        this.mCounterRemoteExe = 0   // The highest mCounter we've EXECUTED from remote peer

        this.mCounterReceived = {}  // Message with mCounter has been received ACK. {0:false,1:true}    <= message with mCounter of 0 not received ACK
        this.timeBeforeResend = 1000

        this.mCounterToBlock = {}   // mCounter : {data,time}      // key - mCounter of the message, data - corresponding data of said message, time - time when received data  // Managed by exeTCP

        this.setup()
    }
    setup(){
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
                case MESSAGE:{
                    console.log('MESSAGE received')
                    const mCounterRemote = payload[1]
                    const data = payload[2]

                    // Update this.mCounterRemoteHighest
                    if(mCounterRemote>this.mCounterRemoteHighest){
                        this.mCounterRemoteHighest = mCounterRemote
                    }

                    // Reply with ACK
                    this.sendStr(ACK,mCounterRemote)
    
                    // EXECUTE DATA !@#!@#!@#
                    this.exeTCP(mCounterRemote,data)

                    break;}
                case ACK: {
                    console.log('ACK received')
                    const mCounterForAck = payload[1]

                    // Tell message is received
                    this.mCounterReceived[mCounterForAck] = true
                    break;}
                case RESENDREQ:{
                    console.log('RESENDREQ received')
                    const mCountersForResend = payload[1]
    
                    break;}
                case MESSAGEUDP:{
                    //state === 5
                    console.log('MESSAGEUDP received')
                    const data = payload[1]
    
                    break;}
                default:
                    throw new Error('NANI!? state',state,' should not exist')
            }
        }catch(err){
            // Can't be parsed
            throw err
        }
    }
    sendMessage(data){
        // Sends a regular normal message to other remote using "TCP"
        this.sendStr(MESSAGE,data)
        this.mCounterLocal++
    }
    sendStr(state,data){
        switch(state){
            case MESSAGE:
                this.tcpSendProtocol(JSON.stringify([state,this.mCounterLocal,data]))
                break;

            case ACK:
                // Reply with acknowledge
                const mCounterForAck = data
                this.dataChannel.send(JSON.stringify([state,mCounterForAck]))
                break;

            case RESENDREQ:
                const mCountersForResend = data
                this.dataChannel.send(JSON.stringify([state,mCountersForResend]))
                break;

            case MESSAGEUDP:
                //state === 5
                console.log('MESSAGEUDP')
                data = payload[1]
                this.dataChannel.send(JSON.stringify([state,data]))
                break;

            default:
                throw new Error('NANI!? state',state,' should not exist. sendStr()')
        }
    }
    tcpSendProtocol(payloadStr){
        // Run my "TCP" send protocol
        // Keeps sending message until remote user replies or max number of sends reached
        const maxSends = 10
        let sendCounter = 0

        const mCounterLocal = this.mCounterLocal
        this.mCounterReceived[mCounterLocal] = false
        
        const loop = () => {
            // Keep sending if sendCounter less than max sends, AND message has not been received
            if(sendCounter<maxSends && this.mCounterReceived[mCounterLocal] === false){
                console.log('TCP SENDING! payloadStr',payloadStr)
                this.dataChannel.send(payloadStr)
                sendCounter++
                
                setTimeout(loop,this.timeBeforeResend)
            }else{
                if(this.mCounterReceived[mCounterLocal] === true){
                    // Message was successfully ACKnowledged
                }else{
                    // No ACKnowledgement from remote peer
                    // LOG !@#!@#!@#
                }
                delete this.mCounterReceived[mCounterLocal]
            }
        }
        loop()
    }
    exeTCP(mCounterRemote,data){
        // Manages the execution of received "TCP" messages
        // Only executes "TCP" messages in ascending mCounter order. UNLESS too much time has elapsed.
        this.mCounterToBlock[mCounterRemote] = {data,time:new Date()}
        console.log('this.mCounterToBlock',this.mCounterToBlock)
    }

}