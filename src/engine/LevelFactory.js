import { getPattern, mutateGraph } from './PatternLibrary';
import { getDifficultyConfig } from './DifficultyScaler';
import { randomNode } from './SpawnManager';
import { calculateMinMoves, canForceCapture, hasLeafNode } from './Solver';

// Helper: BFS per distanze esatte
const getDistances = (startId, graph) => {
  const distances = { [startId]: 0 };
  const queue = [startId];
  
  while (queue.length > 0) {
    const current = queue.shift();
    const node = graph.nodes instanceof Map ? graph.nodes.get(current) : graph.nodes.find(n => n.id === current);
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

// --- NUOVO LAYOUT A ISOLE ORGANICHE ---
function generateOrganicLayout(graph, levelNumber) {
  const ids = graph.getAllNodeIds();
  const nodes = [];
  const connections = [];

  // Calcoliamo le dimensioni della griglia in base al numero di nodi
  const gridSize = Math.ceil(Math.sqrt(ids.length));
  const spacing = 8; // Distanza tra le celle
  const jitter = 2.5; // Quanto "disordine" vogliamo (mantiene l'aspetto a isole)

  ids.forEach((id, index) => {
    const row = Math.floor(index / gridSize);
    const col = index % gridSize;

    // Posizione base sulla griglia + spostamento casuale
    const x = col * spacing + (Math.random() - 0.5) * jitter;
    const z = row * spacing + (Math.random() - 0.5) * jitter;

    nodes.push({ id, x, z, type: 'normal' });
  });

  // Estrazione connessioni
  graph.nodes.forEach((node) => {
    const fromId = node.id;
    const neighbors = node.connections?.map(c => (typeof c === 'object' ? c.to : c)) || [];
    neighbors.forEach(toId => {
      if (fromId < toId) {
        // Opzionale: Filtro per evitare ponti troppo lunghi che attraversano tutta la mappa
        connections.push([fromId, toId]);
      }
    });
  });

  return { nodes, connections };
}

export function generateLevel(levelNumber) {
  const config = getDifficultyConfig(levelNumber);
  let graph, guardStart, thiefStart, exitId, minMoves;

  console.log(`%c 🏗️ Generando livello Isole ${levelNumber}...`, 'color: #3498db;');

  if (levelNumber === 1) {
    graph = getPattern(1);
    guardStart = 0; thiefStart = 2; exitId = 3; minMoves = 1;
  } else {
    let attempts = 0;
    let isValidMap = false;

    do {
      attempts++;
      graph = getPattern(levelNumber);
      mutateGraph(graph, levelNumber);

      // 1. Piazziamo l'uscita
      exitId = randomNode(graph);
      const distsFromExit = getDistances(exitId, graph);

      // 2. Piazziamo il ladro il più lontano possibile
      const validThiefNodes = Object.keys(distsFromExit)
        .filter(id => distsFromExit[id] >= config.minDistanceFromExit)
        .sort((a, b) => distsFromExit[b] - distsFromExit[a]); // Ordina per lontananza

      thiefStart = validThiefNodes.length > 0 
        ? parseInt(validThiefNodes[Math.floor(Math.random() * Math.min(3, validThiefNodes.length))]) 
        : parseInt(randomNode(graph));

      // 3. Piazziamo la guardia in modo STRATEGICO (deve poter intercettare)
      const distsFromThief = getDistances(thiefStart, graph);
      const validGuardNodes = Object.keys(distsFromExit).filter(id => {
        const dExit = distsFromExit[id];
        const dThief = distsFromThief[id];
        // La guardia deve essere più vicina (o uguale) all'uscita rispetto al ladro,
        // e non deve spawnare in faccia al ladro
        return dExit < distsFromExit[thiefStart] && dThief >= 2; 
      });

      guardStart = validGuardNodes.length > 0 
        ? parseInt(validGuardNodes[Math.floor(Math.random() * validGuardNodes.length)])
        : parseInt(randomNode(graph));

      minMoves = calculateMinMoves(graph, guardStart, thiefStart);

      // 4. Validazione severa
      isValidMap = 
        thiefStart !== guardStart && 
        thiefStart !== exitId && 
        guardStart !== exitId &&
        distsFromExit[thiefStart] > 2 && // Minimo vitale per non vincere istant
        canForceCapture(graph, guardStart, thiefStart, exitId) &&
        !hasLeafNode(graph);

    } while (!isValidMap && attempts < 100);
    
    if (attempts >= 100) console.warn("⚠️ Mappa generata con fallback dopo 100 tentativi.");
  }

  const layout = generateOrganicLayout(graph, levelNumber);

  return {
    nodes: layout.nodes.map(n => ({ ...n, type: n.id === exitId ? 'exit' : 'normal' })),
    connections: layout.connections,
    guardStart,
    thiefStart,
    exitId,
    minMoves,
    biome: levelNumber < 15 ? 'OCEAN' : 'SPACE'
  };
}