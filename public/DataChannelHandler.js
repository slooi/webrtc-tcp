
// Handles all dataChannel related stuff.
// Handles: OPENING, CLOSING, MESSAGES,
class DataChannelHandler{
    constructor(dataChannel,parent){
        this.dataChannel = dataChannel
        this.parent = parent
        
        // TCP variables
        this.mCounterLocal = 0   // Variable which increments everytime is sends a message
        this.mCounterRemoteHighest = 0   // The HIGHEST mCounter we've RECEIVED from remote peer. Used for debugging
        this.mCounterRemoteExe = 0   // The mCounter of the message we're waiting to EXECUTE from remote peer

        this.mCounterReceived = {}  // Message with mCounter has been received ACK. {0:false,1:true}    <= message with mCounter of 0 not received ACK
        this.timeBeforeResend = 1000

        this.mCounterToBlock = {}   // mCounter : {data,time}      // key - mCounter of the message, data - corresponding data of said message, time - time when received data  // Managed by exeOrderedTCP
        this.maxTCPWaitTime = 15 * 1000


        // Exposed callbacks
        this.gotData = (data) => {      // !@#!@#!@# 
            console.log(data)
        }

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
    
                    // Why are we adding if statement?
                    // Because we don't want already executed OR skipped scripts to run
                    if(mCounterRemote>=this.mCounterRemoteExe){
                        // Store all info into a block
                        this.mCounterToBlock[mCounterRemote] = {data,date:new Date()}

                        // EXECUTE DATA !@#!@#!@#
                        this.exeOrderedTCP()
                    }
                    
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
        const maxSends = 10 //!@#!@#!@# maybe change later
        let sendCounter = 0

        const mCounterLocal = this.mCounterLocal
        this.mCounterLocal++

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
    exeOrderedTCP(){
        // Manages the execution of received "TCP" messages
        // Only executes "TCP" messages in ascending mCounter order. UNLESS too much time has elapsed.
        // Purpose of this is to make sure data is executed IN ORDER unless too much time has elapsed

        console.log('this.mCounterToBlock',this.mCounterToBlock)

        // Get next object to execute
        let block = this.mCounterToBlock[this.mCounterRemoteExe]
        
        if(block === undefined){
            // If there's a missing block

            // Get first block on list
            const keys = Object.keys(this.mCounterToBlock)  // STRING
            console.log('UNDEFINED!!!! keys',keys)
            console.log('UNDEFINED!!!! this.mCounterToBlock',this.mCounterToBlock)
            const block = this.mCounterToBlock[keys[0]]

            if(new Date()-block.date>this.maxTCPWaitTime){
                // If waited for missing message too long
                // Pretend that it was executed
                this.mCounterRemoteExe++
                this.exeOrderedTCP()
            }
        }else{
            // Execute if message is in order
            do{
                const data = block.data
                console.log('Execute callback gotData')
                this.gotData(data)  // Callback set by user
    
                delete this.mCounterToBlock[this.mCounterRemoteExe]
    
                // Increment mCounterRemote of executed 
                this.mCounterRemoteExe++

                // Update block
                block = this.mCounterToBlock[this.mCounterRemoteExe]
            }while(block !== undefined)
        }
    }

}


/* 
Features:
 - this.timeElapsedBeforeNext       // How long you will wait for an ordered "TCP" messages to arrive
    // I want to have this per message, but to implement this I'd have to have seperate multiple datachannel
    // To prevent data being bottle necked. I think it would be good to implement one TCP channel and one UDP channel
    => Lets plan what type of data I will be sending:
    => Lets break down what they will need as well:

    0) Group chat messages <= ordered group TCP (require all messages to go through a single person. How do we make this person?)
    1) Chat messages (from 1 remote client)   <= ordered TCP
    2) Creation of rooms inside lobby   <= TCP    
    3) Moving ships <= ordered TCP (only if you change the action of the ship(s). If they're completely different ships it doesn't matter)
    4) Ships attacking  <= ordered TCP (only if you change the action of the ship(s). If they're completely different ships it doesn't matter)
    5) ships being destroyed???   <= TCP
    6) Game state (0-lobby, 1-started, 2-end)       <= TCP
    7) Who won? <= TCP
    8) Positions of ships   <= UDP
    9) Health of ships (s->c) <= ordered TCP / UDP
    10) Host assignment?  <= Ordered TCP
    11) Relay??????? but  whether it would be unordered TCP, orded TCP or UDP would depend on the data being sent...... 
    => create dataChannels in groups.
    Let -1 => normal
    let num:num => relay
    this.dataChannels = {
        -1:{0:dataChannel,1:dataChannel,2:dataChannel}
        [id:id2]:{0:dataChannel,1:dataChannel,2:dataChannel}
    }


 - NETWORK LAYER
 - A way of getting topology of the entire network

 - A way finding the number of nodes in the network which don't have full connection ()
*/

//bufferedAmountLowThreshold 
//bufferedAmount
/* 

pc.sctp.maxMessageSize 
MAX_CHUNK_SIZE

262144
*/


const MESSAGE = 0
const ACK = 1
const RESENDREQ = 2
const MESSAGEUDP = 5
