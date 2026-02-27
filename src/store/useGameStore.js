import { create } from 'zustand';
import { generateLevel } from '../engine/LevelFactory';

/**
 * BFS per trovare il percorso più breve tra due nodi ignorando quelli bloccati.
 * Restituisce l'array dei nodi del percorso o null se non esiste.
 */
const getShortestPath = (start, target, connections, blocked = []) => {
  if (start === target) return [start];
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
  // --- STATO GENERALE ---
  view: 'MENU',
  coins: 50,
  ownedSkins: ['default'],
  selectedSkin: 'default',
  unlockedLevels: 1,
  currentLevelNumber: 1,
  currentLevel: null,
  gameState: 'PLAYING',
  
  // --- STATO DEL LIVELLO (MULTI-CHARACTER) ---
  guardPositions: [], 
  thiefPositions: [],
  prevThiefPositions: new Map(), // Memoria anti-loop per ogni ladro {index: lastPos}
  blockedNodes: new Set(),

  /**
   * Avvia un livello caricando i dati dalla Factory.
   */
  startLevel: (levelNumber) => {
    console.log(`%c 🚀 AVVIO LIVELLO: ${levelNumber} `, 'background: #222; color: #bada55');
    
    try {
      const level = generateLevel(levelNumber);

      set({
        view: 'GAME',
        currentLevel: level,
        currentLevelNumber: levelNumber,
        guardPositions: level.guardStarts, 
        thiefPositions: level.thiefStarts, 
        blockedNodes: new Set(),
        prevThiefPositions: new Map(),
        gameState: 'PLAYING'
      });

    } catch (err) {
      console.error("❌ CRASH durante startLevel:", err);
    }
  },

  /**
   * Gestisce il passaggio al livello successivo.
   */
  nextLevel: () => {
    const { currentLevelNumber } = get();
    console.log("⏭️ Passaggio al livello successivo...");
    get().startLevel(currentLevelNumber + 1);
  },

  /**
   * Muove la guardia selezionata cliccando su un nodo adiacente.
   */
  moveGuard: (targetNodeId) => {
    const { guardPositions, thiefPositions, currentLevel, gameState, blockedNodes } = get();
    if (gameState !== 'PLAYING' || !currentLevel) return;

    // 1. Identifica quale guardia può muoversi verso il nodo cliccato (vicinanza)
    const guardIndex = guardPositions.findIndex(gPos => {
      const neighbors = currentLevel.connections
        .filter(conn => conn.includes(gPos))
        .map(conn => conn[0] === gPos ? conn[1] : conn[0]);
      return neighbors.includes(targetNodeId);
    });

    if (guardIndex === -1) {
      console.warn("🚫 Mossa non valida: nessuna guardia può raggiungere quel nodo.");
      return;
    }

    if (blockedNodes.has(targetNodeId)) {
       console.warn("🚫 Nodo bloccato.");
       return;
    }

    // 2. Aggiorna posizione della guardia selezionata
    const newGuards = [...guardPositions];
    newGuards[guardIndex] = targetNodeId;
    set({ guardPositions: newGuards });

    // 3. Controllo cattura immediata (guardia sopra ladro)
    if (thiefPositions.includes(targetNodeId)) {
      console.log("🎯 LADRO CATTURATO!");
      const remainingThieves = thiefPositions.filter(p => p !== targetNodeId);
      set({ thiefPositions: remainingThieves });
      
      if (remainingThieves.length === 0) {
        get().winGame();
        return;
      }
    }

    // 4. Turno dei Ladri (dopo un breve delay per l'animazione)
    setTimeout(() => get().moveThieves(), 400);
  },

  /**
   * Gestisce l'IA di movimento per tutti i ladri presenti.
   */
  moveThieves: () => {
    const { thiefPositions, currentLevel, blockedNodes, guardPositions, prevThiefPositions } = get();
    if (!currentLevel || get().gameState !== 'PLAYING') return;

    const exitNodes = currentLevel.nodes.filter(n => n.type === 'exit').map(n => n.id);
    const exitId = exitNodes[0];

    const updatedThieves = thiefPositions.map((tPos, index) => {
      const neighbors = currentLevel.connections
        .filter(conn => conn.includes(tPos))
        .map(conn => (conn[0] === tPos ? conn[1] : conn[0]))
        .filter(n => !blockedNodes.has(n) && !guardPositions.includes(n));

      if (neighbors.length === 0) return tPos; // Il ladro è circondato o bloccato

      let bestMove = null;
      let bestScore = -Infinity;

      neighbors.forEach(move => {
        // Distanza dall'uscita più vicina
        const pathToExit = getShortestPath(move, exitId, currentLevel.connections, Array.from(blockedNodes));
        const distToExit = pathToExit ? pathToExit.length : 99;

        // Distanza dalla GUARDIA PIÙ VICINA (Logica multi-guardia)
        let minDistToGuard = 99;
        guardPositions.forEach(gPos => {
          const pathToG = getShortestPath(move, gPos, currentLevel.connections, Array.from(blockedNodes));
          if (pathToG && pathToG.length < minDistToGuard) {
            minDistToGuard = pathToG.length;
          }
        });

        // CALCOLO SCORE STRATEGICO
        // + Punti per vicinanza uscita, + Punti per lontananza guardie
        let score = (100 - distToExit * 10) + (minDistToGuard * 5);
        
        // Penalità backtracking (Anti-Loop)
        if (move === prevThiefPositions.get(index)) {
          score -= 50;
        }

        if (score > bestScore) {
          bestScore = score;
          bestMove = move;
        } else if (score === bestScore && bestMove !== null) {
          // Rompe il determinismo se due mosse sono identiche
          if (Math.random() > 0.5) bestMove = move;
        }
      });

      // Salva la posizione attuale per il prossimo turno (anti-loop)
      prevThiefPositions.set(index, tPos);
      return bestMove || neighbors[0];
    });

    set({ thiefPositions: updatedThieves });

    // --- CONTROLLO CONDIZIONI DI FINE TURNO ---
    
    // 1. Il ladro è scappato?
    if (updatedThieves.some(p => exitNodes.includes(p))) {
      console.log("💀 Un ladro è scappato!");
      set({ gameState: 'LOST' });
      return;
    }

    // 2. Cattura passiva (il ladro si muove sopra una guardia)
    const survivors = updatedThieves.filter(tp => !guardPositions.includes(tp));
    if (survivors.length !== updatedThieves.length) {
       console.log("🎯 LADRO CATTURATO (Mossa errata del ladro)!");
       set({ thiefPositions: survivors });
       if (survivors.length === 0) {
         get().winGame();
       }
    }
  },

  /**
   * Gestisce la vittoria e l'assegnazione dei premi.
   */
  winGame: () => {
    console.log("%c 🏆 VITTORIA! ", 'background: #222; color: #FFD700; font-size: 20px');
    const { currentLevelNumber, unlockedLevels, coins } = get();
    set({
      gameState: 'WON',
      coins: coins + 25,
      unlockedLevels: Math.max(unlockedLevels, currentLevelNumber + 1)
    });
  },

  /**
   * Cambia la vista dell'applicazione (MENU, GAME, etc.).
   */
  setView: (v) => set({ view: v })
}));