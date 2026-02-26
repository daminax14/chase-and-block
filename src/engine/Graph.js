export class Node {
  constructor(id) {
    this.id = id
    this.connections = [] // { to: nodeId }
  }
}

export class Graph {
  constructor() {
    this.nodes = new Map()
  }

  addNode(id) {
    this.nodes.set(id, new Node(id))
  }

  connect(a, b, oneWay = false) {
    this.nodes.get(a).connections.push({ to: b })
    if (!oneWay) {
      this.nodes.get(b).connections.push({ to: a })
    }
  }

  getNode(id) {
    return this.nodes.get(id)
  }

  getAllNodeIds() {
    return Array.from(this.nodes.keys())
  }
}
