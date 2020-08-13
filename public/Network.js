// Network
// Manages all the connection instances
// Provides an API to communicate with a specified remote peer or all remote peers

class Network{
    constructor(){
        this.ws

        this.setup()
    }
    setup(){
        this.ws = new WebSocket(location.origin.replace(/http/,'ws'))

        this.ws.onmessage = this.onSignallingServer
    }
    onSignallingServer(e){
        // Handles message from signalling server
        
        const data = JSON.parse(e.data)
        console.log('signalling server data:',data)

    }
}