function UpdateNodes(destroyQueue, nodes, nonVisibleNodes) {
    this.destroyQueue = destroyQueue;
    this.nodes = nodes;
    this.nonVisibleNodes = nonVisibleNodes;
}

module.exports = UpdateNodes;

UpdateNodes.prototype.build = function() {
    // Calculate nodes sub packet size before making the data view
    var nodesLength = 0;
    for (var i = 0; i < this.nodes.length; i++) {
        var node = this.nodes[i];

        if (typeof node == "undefined") {
            continue;
        }

        nodesLength = nodesLength + 26 + (node.getName().length * 2) + (node.getSkin().length * 2);
    }

    var buf = new ArrayBuffer(3 + (this.destroyQueue.length * 12) + (this.nonVisibleNodes.length * 4) + nodesLength + 8);
    var view = new DataView(buf);

    view.setUint8(0, 16, true); // Packet ID
    view.setUint16(1, this.destroyQueue.length, true); // Nodes to be destroyed

    var offset = 3;
    for (var i = 0; i < this.destroyQueue.length; i++) {
        var node = this.destroyQueue[i];

        if (!node) {
            continue;
        }

        var killer = 0;
        if (node.getKiller()) {
            killer = node.getKiller().nodeId;
        }

        view.setUint32(offset, killer, true); // Killer ID
        view.setUint32(offset + 4, node.nodeId, true); // Node ID

        offset += 8;
    }

    for (var i = 0; i < this.nodes.length; i++) {
        var node = this.nodes[i];

        if (typeof node == "undefined") {
            continue;
        }

        view.setUint32(offset, node.nodeId, true); // Node ID
        view.setInt32(offset + 4, node.position.x, true); // X position
        view.setInt32(offset + 8, node.position.y, true); // Y position
        view.setUint16(offset + 12, node.getSize(), true); // Mass formula: Radius (size) = (mass * mass) / 100
        view.setUint8(offset + 14, node.color.r, true); // Color (R)
        view.setUint8(offset + 15, node.color.g, true); // Color (G)
        view.setUint8(offset + 16, node.color.b, true); // Color (B)
		view.setUint8(offset + 17, node.swoosh, true); // Swoosh Sound Activator
		view.setUint8(offset + 18, node.ejected, true); // Ejected Mass Sound Activator
        view.setUint8(offset + 19, node.spiked, true); // Flags
        offset += 20;

        var name = node.getName();
        if (name) {
            for (var j = 0; j < name.length; j++) {
                var c = name.charCodeAt(j);
                if (c){
                    view.setUint16(offset, c, true);
                }
                offset += 2;
            }
        }
        view.setUint16(offset, 0, true); // End of string
        offset += 2;
		
		var skin = node.getSkin();
		//console.log("skinurl verif: " + skin);
		if (skin) {
			for (var j = 0; j < skin.length; j++) {
				var c = skin.charCodeAt(j);
				if (c) {
					view.setUint16(offset, c, true);
				}
				offset += 2;
			}
		}
		view.setUint16(offset, 0, true); // End of skin id string
		offset += 2;
		
		// Reset Sound Activators
		node.swoosh = 0;
		node.ejected = 0;
    }

    var len = this.nonVisibleNodes.length + this.destroyQueue.length;
    view.setUint32(offset, 0, true); // End
    view.setUint32(offset + 4, len, true); // # of non-visible nodes to destroy

    offset += 8;

    // Destroy queue + nonvisible nodes
    for (var i = 0; i < this.destroyQueue.length; i++) {
        var node = this.destroyQueue[i];

        if (!node) {
            continue;
        }

        view.setUint32(offset, node.nodeId, true);
        offset += 4;
    }
    for (var i = 0; i < this.nonVisibleNodes.length; i++) {
        var node = this.nonVisibleNodes[i];

        if (!node) {
            continue;
        }

        view.setUint32(offset, node.nodeId, true);
        offset += 4;
    }

    return buf;
};