import { create } from 'zustand';
import { generateLevel } from '../engine/LevelFactory';

/**
 * Trova il percorso più breve tra due nodi ignorando quelli bloccati.
 * Restituisce l'array dei nodi del percorso o null se non esiste.
 */
const getShortestPath = (start, target, connections, blocked) => {
  const queue = [[start]];
  const visited = new Set([start, ...blocked]);

  while (queue.length > 0) {
    const path = queue.shift();
    const node = path[path.length - 1];

    if (node === target) return path;

    const neighbors = connections
      .filter(conn => conn.includes(node))
      .map(conn => (conn[0] === node ? conn[1] : conn[0]))
      .filter(n => !visited.has(n));

    for (const neighbor of neighbors) {
      visited.add(neighbor);
      queue.push([...path, neighbor]);
    }
  }
  return null;
};

export const useGameStore = create((set, get) => ({
  view: 'MENU',
  coins: 50,
  ownedSkins: ['default'],
  selectedSkin: 'default',
  unlockedLevels: 1,
  currentLevelNumber: 1,
  currentLevel: null,
  gameState: 'PLAYING',
  thiefPosition: null,
  guardPosition: null,
  blockedNodes: new Set(),
  previousThiefPosition: null,

  startLevel: (levelNumber) => {
    console.log(`%c 🚀 AVVIO LIVELLO: ${levelNumber} `, 'background: #222; color: #bada55');
    
    try {
      const level = generateLevel(levelNumber);

      // Estrazione ID puliti
      let gStart = level.guardStart?.id !== undefined ? level.guardStart.id : level.guardStart;
      let tStart = level.thiefStart?.id !== undefined ? level.thiefStart.id : level.thiefStart;
      const eId = level.exitId?.id !== undefined ? level.exitId.id : level.exitId;

      // Prevenzione sovrapposizione allo spawn
      if (tStart === gStart || tStart === eId) {
        console.warn("⚠️ Spawn Alert: Ladro sovrapposto a Guardia/Uscita. Cerco nuovo nodo...");
        const safeNode = level.nodes.find(n => n.id !== gStart && n.id !== eId);
        if (safeNode) tStart = safeNode.id;
      }

      console.table({
        "Vista": "GAME",
        "Livello": levelNumber,
        "Guardia Pos": gStart,
        "Ladro Pos": tStart,
        "Uscita ID": eId,
        "Nodi Totali": level.nodes.length
      });

      set({
        view: 'GAME',
        currentLevel: level,
        currentLevelNumber: levelNumber,
        guardPosition: gStart,
        thiefPosition: tStart,
        blockedNodes: new Set(),
        previousThiefPosition: null,
        gameState: 'PLAYING'
      });

    } catch (err) {
      console.error("❌ CRASH durante startLevel:", err);
    }
  },

  nextLevel: () => {
    const { currentLevelNumber, startLevel } = get();
    console.log("⏭️ Passaggio al livello successivo...");
    startLevel(currentLevelNumber + 1);
  },

  blockNode: (nodeId) => {
    const { guardPosition, thiefPosition, currentLevel, gameState, blockedNodes } = get();
    if (gameState !== 'PLAYING' || !currentLevel) return;

    const neighbors = currentLevel.connections
      .filter(conn => conn.includes(guardPosition))
      .map(conn => conn[0] === guardPosition ? conn[1] : conn[0]);

    if (!neighbors.includes(nodeId)) {
      console.warn("🚫 Mossa non valida: non è un vicino.");
      return;
    }

    if (blockedNodes.has(nodeId)) {
      console.warn("🚫 Nodo già bloccato.");
      return;
    }

    if (nodeId === thiefPosition) {
      console.log("🎯 PRESO!");
      set({ guardPosition: nodeId });
      get().winGame();
      return;
    }

    set({ guardPosition: nodeId });
    setTimeout(() => get().moveThief(), 400);
  },

  moveThief: () => {
    const { thiefPosition, currentLevel, blockedNodes, guardPosition } = get();
    if (!currentLevel || get().gameState !== 'PLAYING') return;

    // Funzione interna per trovare i vicini calpestabili
    const getNeighbors = (pos) =>
      currentLevel.connections
        .filter(conn => conn.includes(pos))
        .map(conn => (conn[0] === pos ? conn[1] : conn[0]))
        .filter(n => !blockedNodes.has(n) && n !== guardPosition);

    const possibleMoves = getNeighbors(thiefPosition);
    const exits = currentLevel.nodes.filter(n => n.type === 'exit').map(n => n.id);
    const exitId = exits[0]; // Assumiamo una sola uscita principale per livello

    console.log(`🕵️ Ladro in ${thiefPosition}. Valutazione mosse...`);

    if (possibleMoves.length === 0) {
      console.log("🕸️ Ladro intrappolato! Vittoria.");
      get().winGame();
      return;
    }

    // --- LOGICA IA CON PATHFINDING ---
    let bestMoves = [];
    let bestScore = -Infinity;

    possibleMoves.forEach(move => {
      // 1. Distanza dall'uscita
      const pathToExit = getShortestPath(move, exitId, currentLevel.connections, blockedNodes);
      const distToExit = pathToExit ? pathToExit.length : Infinity;

      // 2. Distanza dalla guardia
      const pathToGuard = getShortestPath(move, guardPosition, currentLevel.connections, blockedNodes);
      const distToGuard = pathToGuard ? pathToGuard.length : 0;

      // 3. Calcolo Punteggio (Più alto è meglio)
      let score = 0;
      
      if (distToExit !== Infinity) {
        score -= distToExit * 10; // Penalità per ogni passo lontano dall'uscita
      } else {
        score -= 1000; // Penalità devastante se l'uscita è irraggiungibile da quel nodo
      }

      score += distToGuard * 2; // Bonus per tenersi alla larga dalla guardia

      if (move === get().previousThiefPosition) {
        score -= 50; // Penalità brutale per il backtracking (Risolve i loop)
      }

      // 4. Selezione delle mosse migliori
      if (score > bestScore) {
        bestScore = score;
        bestMoves = [move];
      } else if (score === bestScore) {
        bestMoves.push(move); // In caso di parità di punteggio, salva le alternative
      }
    });

    // Seleziona una mossa a caso tra quelle col punteggio massimo (rompe pattern deterministici)
    const finalMove = bestMoves.length > 0 
      ? bestMoves[Math.floor(Math.random() * bestMoves.length)] 
      : possibleMoves[0];

    set({ 
      previousThiefPosition: thiefPosition, // Memorizza prima di muoversi
      thiefPosition: finalMove 
    });

    if (exits.includes(finalMove)) {
      console.log("💀 Il ladro è scappato!");
      set({ gameState: 'LOST' });
    }
  },

  winGame: () => {
    console.log("%c 🏆 VITTORIA! ", 'background: #222; color: #FFD700; font-size: 20px');
    const { currentLevelNumber, unlockedLevels, coins } = get();
    set({
      gameState: 'WON',
      coins: coins + 25,
      unlockedLevels: Math.max(unlockedLevels, currentLevelNumber + 1)
    });
  },

  setView: (v) => set({ view: v })
}));