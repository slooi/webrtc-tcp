// Pair handler for ids and an item
// Assumes:
//  unique id

// Purpose: Allows me to get either id or item with the other

class PairHandler{
    constructor(){
        this.idToItem = {}  // key is id, value is item
        this.itemIdList = []    // order is: item, id, item, id
    }
    add(id,item){
        this.idToItem[id] = item
    }
    remove
    get
}