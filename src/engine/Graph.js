/**
 * GRAPH.JS — Struttura dati del grafo con supporto per meccaniche avanzate.
 *
 * Ogni nodo può avere:
 *   - type: 'normal' | 'exit' | 'portal_in' | 'key' | 'locked'
 *   - data: payload arbitrario (es. keyId per porte/chiavi)
 *
 * Ogni arco (Edge) può avere:
 *   - type: 'normal' | 'bridge' | 'portal' | 'one_way'
 *   - uses: null (infiniti) | number (usi rimanenti, es. 2 per ponti a costo)
 *   - portalTo: nodeId (per portali diretti, archi non reciproci)
 *
 * Il BFS rispetta gli usi rimanenti e le direzioni degli archi.
 */

export class Edge {
  constructor({ to, type = 'normal', uses = null, directed = false }) {
    this.to = to;
    this.type = type;       // 'normal' | 'bridge' | 'portal' | 'one_way'
    this.uses = uses;       // null = infinito, number = usi rimasti
    this.directed = directed; // se true, non è percorribile al contrario
  }

  canTraverse() {
    return this.uses === null || this.uses > 0;
  }

  consume() {
    if (this.uses !== null && this.uses > 0) this.uses--;
  }

  clone() {
    return new Edge({ to: this.to, type: this.type, uses: this.uses, directed: this.directed });
  }
}

export class GraphNode {
  constructor(id, type = 'normal', data = {}) {
    this.id = id;
    this.type = type;   // 'normal' | 'exit' | 'key' | 'locked'
    this.data = data;   // es. { keyId: 'key_1' }
    this.edges = [];    // Array di Edge
  }

  get connections() {
    // Retrocompatibilità: restituisce array di ID degli archi percorribili
    return this.edges.filter(e => e.canTraverse()).map(e => e.to);
  }

  addEdge(edge) {
    this.edges.push(edge);
  }

  hasEdgeTo(targetId) {
    return this.edges.some(e => e.to === targetId);
  }

  getEdgeTo(targetId) {
    return this.edges.find(e => e.to === targetId) || null;
  }
}

export class Graph {
  constructor() {
    this._nodes = new Map(); // id -> GraphNode
  }

  addNode(id, type = 'normal', data = {}) {
    if (!this._nodes.has(id)) {
      this._nodes.set(id, new GraphNode(id, type, data));
    }
    return this;
  }

  getNode(id) {
    return this._nodes.get(id) || null;
  }

  getAllNodeIds() {
    return Array.from(this._nodes.keys());
  }

  get nodes() {
    return Array.from(this._nodes.values());
  }

  /**
   * Connette due nodi con un arco (bidirezionale di default).
   * @param {*} fromId
   * @param {*} toId
   * @param {object} options - { type, uses, directed }
   */
  connect(fromId, toId, options = {}) {
    const from = this._nodes.get(fromId);
    const to = this._nodes.get(toId);
    if (!from || !to || fromId === toId) return this;

    const { type = 'normal', uses = null, directed = false } = options;

    if (!from.hasEdgeTo(toId)) {
      from.addEdge(new Edge({ to: toId, type, uses, directed }));
    }
    if (!directed && !to.hasEdgeTo(fromId)) {
      to.addEdge(new Edge({ to: fromId, type, uses, directed }));
    }
    return this;
  }

  /**
   * Aggiunge un portale direzionato: da A si va in B, ma non viceversa.
   * Visivamente è un "warp" unidirezionale.
   */
  addPortal(fromId, toId) {
    const from = this._nodes.get(fromId);
    if (!from) return this;
    if (!from.hasEdgeTo(toId)) {
      from.addEdge(new Edge({ to: toId, type: 'portal', directed: true }));
    }
    return this;
  }

  /**
   * Consuma un uso dell'arco tra fromId e toId (e il reciproco se bidirezionale).
   */
  consumeEdge(fromId, toId) {
    const from = this._nodes.get(fromId);
    const to = this._nodes.get(toId);
    if (from) {
      const edge = from.getEdgeTo(toId);
      if (edge) edge.consume();
    }
    if (to) {
      const edge = to.getEdgeTo(fromId);
      if (edge && !edge.directed) edge.consume();
    }
  }

  /**
   * Crea una copia profonda del grafo (usato per generazione/mutazione sicura).
   */
  clone() {
    const g = new Graph();
    this._nodes.forEach((node, id) => {
      g.addNode(id, node.type, { ...node.data });
      node.edges.forEach(edge => {
        g.getNode(id)?.addEdge(edge.clone());
      });
    });
    return g;
  }

  /**
   * Verifica se il grafo è connesso (tutti i nodi raggiungibili dal primo).
   */
  isConnected() {
    const ids = this.getAllNodeIds();
    if (ids.length === 0) return true;
    const visited = new Set();
    const queue = [ids[0]];
    while (queue.length > 0) {
      const cur = queue.shift();
      if (visited.has(cur)) continue;
      visited.add(cur);
      const node = this.getNode(cur);
      node?.edges.forEach(e => {
        if (!visited.has(e.to)) queue.push(e.to);
      });
    }
    return visited.size === ids.length;
  }
}
