// NUOVO PATTERNLIBRARY.JS

import { Graph } from './Graph'
import { getDifficultyConfig } from './DifficultyScaler';

// --- PATTERN 1: TUTORIAL ---
export function createTutorialPattern() {
  const g = new Graph();
  [0, 1, 2, 3].forEach(i => g.addNode(i));
  g.connect(0, 1); g.connect(1, 2); g.connect(1, 3);
  return g;
}

// --- PATTERN 2: RAMIFICATO (Albero con cicli - Ottimo per isole) ---
function createBranchedPattern(nodesCount) {
  const g = new Graph();
  for (let i = 0; i < nodesCount; i++) g.addNode(i);
  
  // Costruisci un albero base
  for (let i = 1; i < nodesCount; i++) {
    const parent = Math.floor(Math.random() * i);
    g.connect(i, parent);
  }

  // Aggiungi cicli extra per non avere solo vicoli ciechi
  const extraEdges = Math.floor(nodesCount * 0.3);
  for (let e = 0; e < extraEdges; e++) {
    const a = Math.floor(Math.random() * nodesCount);
    const b = Math.floor(Math.random() * nodesCount);

    if (a !== b) {
      // FIX: Invece di g.areConnected(a, b), controlliamo i nodi
      const nodeA = g.getNode(a);
      // Verifichiamo se 'b' è già tra le connessioni di 'a'
      const alreadyConnected = nodeA?.connections?.some(c => c.to === b);

      if (!alreadyConnected) {
        g.connect(a, b);
      }
    }
  }
  return g;
}

// --- PATTERN 3: GRIGLIA DEFORMATA (Ottimo per Città/Marte) ---
function createGridPattern(nodesCount) {
  const g = new Graph();
  // Calcola le dimensioni approssimative della griglia
  const side = Math.ceil(Math.sqrt(nodesCount));
  
  for (let i = 0; i < nodesCount; i++) g.addNode(i);

  for (let i = 0; i < nodesCount; i++) {
    const row = Math.floor(i / side);
    const col = i % side;

    // Collega a destra
    if (col < side - 1 && i + 1 < nodesCount) {
      g.connect(i, i + 1);
    }
    // Collega in basso
    if (row < side - 1 && i + side < nodesCount) {
      g.connect(i, i + side);
    }
  }

  // Rimuovi qualche arco a caso per creare labirinti (Choke points)
  const edgesToRemove = Math.floor(nodesCount * 0.4);
  // (Assumendo che il tuo Graph abbia un metodo removeRandomEdge, altrimenti saltalo
  // o implementalo. Deforma la griglia creando percorsi obbligati).

  return g;
}

export function getPattern(levelNumber) {
  const config = getDifficultyConfig(levelNumber);
  const n = config.nodesCount;

  if (levelNumber === 1) return createTutorialPattern();
  
  // LIVELLI 2-10: Solo strutture a Griglia o Branched (niente Mesh caotiche!)
  if (levelNumber <= 10) {
    // La griglia è intrinsecamente ordinata e facile da leggere
    return createGridPattern(n); 
  }

  // LIVELLI 11-20: Introduciamo i ponti sospesi (Bridge) e strutture radiali
  if (levelNumber <= 20) {
    return Math.random() > 0.5 ? createBridgePattern(n) : createRadialPattern(n);
  }

  // Solo alla fine introduciamo il caos controllato
  return createMeshPattern(n);
}

export function mutateGraph(graph, levelNumber) {
  if (levelNumber === 1) return; 
  const config = getDifficultyConfig(levelNumber);
  if (Math.random() > config.mutateChance) return;

  const ids = graph.getAllNodeIds();
  const aId = ids[Math.floor(Math.random() * ids.length)];
  const bId = ids[(ids.indexOf(aId) + 1) % ids.length];

  if (aId !== bId) {
    // Controllo manuale invece di areConnected
    const nodeA = graph.getNode(aId);
    const alreadyConnected = nodeA?.connections?.some(c => c.to === bId);

    if (!alreadyConnected) {
      graph.connect(aId, bId);
    }
  }
}