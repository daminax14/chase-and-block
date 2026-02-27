import { getPattern, mutateGraph } from './PatternLibrary';
import { getDifficultyConfig } from './DifficultyScaler';

/**
 * BFS Avanzata: Calcola le distanze tenendo conto di eventuali portali o ostacoli.
 */
const getDistances = (startId, graph) => {
  const distances = { [startId]: 0 };
  const queue = [startId];
  
  while (queue.length > 0) {
    const current = queue.shift();
    const node = graph.getNode(current);
    
    // Supporto per connessioni semplici (ID) o oggetti complessi { to: ID, type: 'portal' }
    const neighbors = node?.connections?.map(c => (typeof c === 'object' ? c.to : c)) || [];
    
    neighbors.forEach(neighbor => {
      if (distances[neighbor] === undefined) {
        distances[neighbor] = distances[current] + 1;
        queue.push(neighbor);
      }
    });
  }
  return distances;
};

/**
 * Funzione per iniettare meccaniche speciali (es. Portali) nel grafo prima di calcolare lo spawn.
 */
const injectSpecialFeatures = (graph, levelNumber) => {
  // Esempio: Dal livello 15 in poi (Spazio), aggiungiamo 1 Portale
  if (levelNumber >= 15) {
    const ids = graph.getAllNodeIds();
    // Prendi due nodi a caso
    const a = ids[Math.floor(Math.random() * ids.length)];
    const b = ids[Math.floor(Math.random() * ids.length)];
    
    // Assicurati che non siano già collegati e non siano lo stesso nodo
    if (a !== b && !graph.getNode(a).connections.includes(b)) {
      // Un portale è solo una connessione tra nodi lontani
      graph.connect(a, b);
      console.log(`🌀 Portale generato tra ${a} e ${b}`);
    }
  }
};

/**
 * Genera il layout fisico (Jittered Grid) per evitare bordelli visivi.
 */
function generateLayout(graph) {
  const ids = graph.getAllNodeIds();
  const nodes = [];
  const connections = [];

  const gridSize = Math.ceil(Math.sqrt(ids.length));
  const spacing = 10; 
  const jitter = 3.0; 

  ids.forEach((id, index) => {
    const row = Math.floor(index / gridSize);
    const col = index % gridSize;

    nodes.push({
      id,
      x: col * spacing + (Math.random() - 0.5) * jitter,
      z: row * spacing + (Math.random() - 0.5) * jitter,
      type: 'normal' // Verrà sovrascritto dall'uscita dopo
    });
  });

  // Centratura perfetta per la camera
  const avgX = nodes.reduce((s, n) => s + n.x, 0) / nodes.length;
  const avgZ = nodes.reduce((s, n) => s + n.z, 0) / nodes.length;
  nodes.forEach(n => { n.x -= avgX; n.z -= avgZ; });

  // Estrazione connessioni
  graph.nodes.forEach(node => {
    node.connections.forEach(c => {
      const toId = typeof c === 'object' ? c.to : c;
      if (node.id < toId) connections.push([node.id, toId]);
    });
  });

  return { nodes, connections };
}

export function generateLevel(levelNumber) {
  const config = getDifficultyConfig(levelNumber);
  const patternData = getPattern(levelNumber, config);
  let graph = patternData.graph;

  let guardStarts = [];
  let thiefStarts = [];
  let exitId = null;

  console.log(`%c ⚙️ CORE: Generazione Livello ${levelNumber}`, 'color: #ff00ff; font-weight: bold;');

  // --- LIVELLI FISSI (1-10) ---
  if (levelNumber <= 10) {
    guardStarts = patternData.guards;
    thiefStarts = patternData.thieves;
    exitId = patternData.exit;
  } 
  // --- LIVELLI PROCEDURALI (>10) CON FILTRO MATEMATICO ---
  else {
    let attempts = 0;
    let validSpawnFound = false;

    do {
      attempts++;
      // 1. Creiamo e mutiamo il grafo base
      graph = getPattern(levelNumber, config).graph;
      mutateGraph(graph, levelNumber);
      
      // 2. INIETTIAMO I PORTALI E LE ANOMALIE
      injectSpecialFeatures(graph, levelNumber);

      const ids = graph.getAllNodeIds();
      
      // 3. Piazziamo l'uscita ai bordi (nodo con meno connessioni)
      // Più una cella ha poche connessioni, più è una buona "fine" del livello.
      exitId = ids.reduce((a, b) => graph.getNode(a).connections.length <= graph.getNode(b).connections.length ? a : b);

      // Calcoliamo la distanza di TUTTO dall'uscita (inclusi i salti dei portali)
      const distsFromExit = getDistances(exitId, graph);

      // 4. LOGICA DI SPAWN LADRO (Deve soffrire)
      // Il ladro deve essere ad almeno X passi dall'uscita.
      const validThieves = ids.filter(id => distsFromExit[id] >= 4); 
      
      if (validThieves.length === 0) continue; // Mappa troppo piccola/collegata male, rigenera.
      
      const tStart = validThieves[Math.floor(Math.random() * validThieves.length)];
      
      // 5. LOGICA DI SPAWN GUARDIA (Filtro Anti-Frustrazione)
      const distsFromThief = getDistances(tStart, graph);
      
      const validGuards = ids.filter(id => {
        const dExit = distsFromExit[id]; // Distanza guardia -> uscita
        const dThief = distsFromThief[id]; // Distanza guardia -> ladro

        // LA REGOLA D'ORO DEL GAME DESIGN:
        // La guardia DEVE avere un vantaggio sull'uscita, ma non deve fare instant-kill.
        return dExit <= distsFromExit[tStart] - 1 && dThief >= 2;
      });

      if (validGuards.length > 0) {
        const gStart = validGuards[Math.floor(Math.random() * validGuards.length)];
        
        guardStarts = [gStart];
        thiefStarts = [tStart];

        // Predisposizione seconda guardia per livelli altissimi
        if (levelNumber >= 20 && validGuards.length > 1) {
           const gStart2 = validGuards.find(id => id !== gStart);
           if (gStart2 !== undefined) guardStarts.push(gStart2);
        }

        validSpawnFound = true;
      }

    } while (!validSpawnFound && attempts < 200);

    if (attempts >= 200) {
      console.error("☠️ Generazione Fallita: Impossibile trovare un bilanciamento matematico per questa mappa.");
      // Fallback estremo per non far crashare il gioco
      exitId = graph.getAllNodeIds()[0];
      guardStarts = [graph.getAllNodeIds()[1]];
      thiefStarts = [graph.getAllNodeIds()[graph.getAllNodeIds().length - 1]];
    }
  }

  // --- RENDERING DEI DATI ---
  const layout = generateLayout(graph);
  
  // Applica il flag 'exit' al nodo giusto
  const finalNodes = layout.nodes.map(n => ({
    ...n,
    type: n.id === exitId ? 'exit' : 'normal'
  }));

  return {
    levelNumber,
    nodes: finalNodes,
    connections: layout.connections,
    guardStarts, 
    thiefStarts, 
    guardStart: guardStarts[0], // Retrocompatibilità UI
    thiefStart: thiefStarts[0], // Retrocompatibilità UI
    exitId,
    biome: levelNumber >= 15 ? 'SPACE' : 'OCEAN'
  };
}