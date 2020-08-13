// Connection
// The individual connection to a remote peer
// Provides an API to communicate with the remote peer
// Connection instance handles the establishment, persistence and closing of the connection to the remote peer

class Connection{
    constructor(){
        this.pc
        
        this.setup()
    }

    setup(){
        this.pc = new RTCPeerConnection()
    }
}