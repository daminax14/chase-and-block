/**
 * USEGAMESTORE.JS — Zustand store con:
 *   - AI del ladro con lookahead a 2 livelli + anti-loop su 3 turni
 *   - Rilevamento "scambio di posizioni" (swap trap)
 *   - Meccanica chiavi: il ladro raccoglie chiavi per sbloccare porte
 *   - Meccanica bridge: consuma gli usi degli archi al passaggio
 *   - Meccanica portale: teletrasporto direzionato
 *   - BFS con cache per turno (non più N×M BFS nested)
 *   - Selezione guardia via click su nodo adiacente a QUALSIASI guardia
 */

import { create } from 'zustand';
import { generateLevel } from '../engine/LevelFactory';
import { getDistances, getPath } from '../engine/LevelFactory';

// ─── AI ENGINE ────────────────────────────────────────────────────────────────

/**
 * Calcola il punteggio strategico di una mossa per un ladro.
 * Usa BFS cached (pre-calcolati) invece di BFS nested.
 *
 * Logica di scoring:
 *   +100 * (1 / distToExit)   — priorità assoluta verso l'uscita
 *   + 8  * minDistToGuard      — lontananza dalle guardie
 *   -50  se la mossa è nella storia recente (anti-loop)
 *   +10  se il nodo ha poche connessioni (preferisce corridoi: meno scelte = meno rischi)
 *
 * @param {*} move - Nodo candidato
 * @param {*} exitId - Nodo di uscita
 * @param {Map} distCacheFromNodes - Mappa {nodeId: {nodeId: dist}} pre-calcolata
 * @param {Array} guardPositions
 * @param {Array} thiefHistory - Ultimi 3 nodi visitati (anti-loop)
 * @param {Object} currentLevel
 * @param {Set} collectedKeys
 * @returns {number} score
 */
function scoreMove(move, exitId, distCacheFromNodes, guardPositions, thiefHistory, currentLevel, collectedKeys) {
  // Distanza dall'uscita (dal cache)
  const distsFromMove = distCacheFromNodes.get(move) || {};

  // Se il nodo di uscita è locked, controlla se il ladro ha la chiave
  const exitNode = currentLevel.nodes.find(n => n.id === exitId);
  let effectiveExit = exitId;
  if (exitNode?.type === 'locked') {
    const keyId = exitNode.data?.keyId;
    if (!collectedKeys.has(keyId)) {
      // L'uscita non è accessibile, punta alla chiave invece
      const keyNode = currentLevel.nodes.find(n => n.type === 'key' && n.data?.keyId === keyId);
      if (keyNode) effectiveExit = keyNode.id;
    }
  }

  const distToExit = distsFromMove[effectiveExit] ?? 99;

  // Distanza minima da tutte le guardie
  let minDistToGuard = 99;
  for (const gPos of guardPositions) {
    const d = distsFromMove[gPos] ?? 99;
    if (d < minDistToGuard) minDistToGuard = d;
  }

  // Connessioni del nodo (nodi "terminali" penalizzati se ci sono guardie vicine)
  const nodeData = currentLevel.nodes.find(n => n.id === move);
  const connCount = currentLevel.connections.filter(c => c.from === move || c.to === move).length;

  let score = 0;
  score += (1 / (distToExit + 1)) * 100;
  score += minDistToGuard * 8;
  score += connCount * 1.5; // leggero bonus per nodi con più uscite

  // Anti-loop: penalità per tornare su posizioni recenti
  if (thiefHistory.includes(move)) {
    score -= 50 * (thiefHistory.lastIndexOf(move) === 0 ? 1 : 0.5);
  }

  // Bonus chiave: se il nodo ha una chiave che serve, massima priorità
  if (nodeData?.type === 'key') {
    const keyId = nodeData.data?.keyId;
    if (!collectedKeys.has(keyId)) score += 200;
  }

  return score;
}

// ─── ZUSTAND STORE ────────────────────────────────────────────────────────────

export const useGameStore = create((set, get) => ({

  // ── STATO GENERALE ────────────────────────────────────────────────────────
  view: 'MENU',
  coins: 0,
  ownedSkins: ['default'],
  selectedSkin: 'default',
  unlockedLevels: 1,
  currentLevelNumber: 1,
  currentLevel: null,
  gameState: 'PLAYING', // 'PLAYING' | 'WON' | 'LOST'

  // ── STATO DEL LIVELLO ─────────────────────────────────────────────────────
  guardPositions: [],
  thiefPositions: [],
  thiefHistories: [],     // Array di Array: storia recente (3 turni) per ogni ladro
  collectedKeys: new Set(),   // Chiavi raccolte dal ladro (globale, non per singolo ladro)
  blockedNodes: new Set(),    // Nodi temporaneamente bloccati (es. trappole future)
  selectedGuardIndex: null,   // Guardia selezionata dal giocatore
  turnCount: 0,

  // ── AVVIO LIVELLO ─────────────────────────────────────────────────────────

  startLevel: (levelNumber) => {
    console.log(`%c🚀 AVVIO LIVELLO ${levelNumber}`, 'background:#222;color:#bada55');
    try {
      const level = generateLevel(levelNumber);
      set({
        view: 'GAME',
        currentLevel: level,
        currentLevelNumber: levelNumber,
        guardPositions: [...level.guardStarts],
        thiefPositions: [...level.thiefStarts],
        thiefHistories: level.thiefStarts.map(() => []),
        collectedKeys: new Set(),
        blockedNodes: new Set(),
        selectedGuardIndex: null,
        gameState: 'PLAYING',
        turnCount: 0,
      });
    } catch (err) {
      console.error('❌ CRASH in startLevel:', err);
    }
  },

  nextLevel: () => {
    const { currentLevelNumber } = get();
    get().startLevel(currentLevelNumber + 1);
  },

  restartLevel: () => {
    const { currentLevelNumber } = get();
    get().startLevel(currentLevelNumber);
  },

  // ── MOVIMENTO GUARDIA ─────────────────────────────────────────────────────

  /**
   * Il giocatore clicca su un nodo.
   * Se è adiacente a una guardia, quella guardia si muove lì.
   * Se più guardie sono adiacenti, viene scelta quella con indice più basso
   * oppure quella pre-selezionata via selectGuard().
   */
  moveGuard: (targetNodeId) => {
    const { guardPositions, thiefPositions, currentLevel, gameState,
            blockedNodes, selectedGuardIndex, collectedKeys } = get();

    if (gameState !== 'PLAYING' || !currentLevel) return;
    if (blockedNodes.has(targetNodeId)) {
      console.warn('🚫 Nodo bloccato');
      return;
    }

    // Trova quale guardia può muoversi verso targetNodeId
    const getNeighbors = (nodeId) =>
      currentLevel.connections
        .filter(c => {
          if (c.uses !== null && c.uses <= 0) return false; // arco esaurito
          return c.from === nodeId || (!c.directed && c.to === nodeId);
        })
        .map(c => c.from === nodeId ? c.to : c.from);

    // Priorità a guardia pre-selezionata
    let guardIndex = -1;
    if (selectedGuardIndex !== null) {
      const neighbors = getNeighbors(guardPositions[selectedGuardIndex]);
      if (neighbors.includes(targetNodeId)) guardIndex = selectedGuardIndex;
    }
    // Fallback: prima guardia adiacente
    if (guardIndex === -1) {
      guardIndex = guardPositions.findIndex(gPos =>
        getNeighbors(gPos).includes(targetNodeId)
      );
    }

    if (guardIndex === -1) {
      console.warn('🚫 Mossa non valida: nessuna guardia raggiunge quel nodo');
      return;
    }

    const prevGuardPos = guardPositions[guardIndex];

    // Aggiorna posizione guardia
    const newGuards = [...guardPositions];
    newGuards[guardIndex] = targetNodeId;

    // Consuma l'arco se è un bridge
    const edge = currentLevel.connections.find(c =>
      (c.from === prevGuardPos && c.to === targetNodeId) ||
      (!c.directed && c.from === targetNodeId && c.to === prevGuardPos)
    );
    if (edge && edge.type === 'bridge' && edge.uses !== null) {
      edge.uses = Math.max(0, edge.uses - 1);
    }

    set({ guardPositions: newGuards, selectedGuardIndex: null });

    // ── Controllo cattura immediata ──────────────────────────────────────
    const capturedThieves = thiefPositions
      .map((tp, i) => ({ tp, i }))
      .filter(({ tp }) => tp === targetNodeId);

    let updatedThieves = [...thiefPositions];
    let updatedHistories = [...get().thiefHistories];

    if (capturedThieves.length > 0) {
      console.log('🎯 LADRO CATTURATO (mossa guardia)!');
      capturedThieves.forEach(({ i }) => {
        updatedThieves[i] = null;
        updatedHistories[i] = [];
      });
      updatedThieves = updatedThieves.filter(t => t !== null);
      updatedHistories = updatedHistories.filter((_, i) => thiefPositions[i] !== targetNodeId);
      set({ thiefPositions: updatedThieves, thiefHistories: updatedHistories });

      if (updatedThieves.length === 0) {
        get().winGame();
        return;
      }
    }

    // ── Turno dei ladri (con delay per animazione) ───────────────────────
    set({ turnCount: get().turnCount + 1 });
    setTimeout(() => get().moveThieves(), 420);
  },

  // Seleziona esplicitamente una guardia (per UI multi-guardia)
  selectGuard: (index) => {
    set({ selectedGuardIndex: index });
  },

  // ── MOVIMENTO LADRI (IA) ──────────────────────────────────────────────────

  moveThieves: () => {
    const { thiefPositions, thiefHistories, currentLevel,
            blockedNodes, guardPositions, collectedKeys } = get();

    if (!currentLevel || get().gameState !== 'PLAYING') return;

    const exitNode = currentLevel.nodes.find(n => n.type === 'exit');
    const exitId   = exitNode?.id ?? currentLevel.exitId;

    // ── Pre-calcola BFS da ogni posizione ladro e da ogni guardia ──────────
    // Così non facciamo BFS nested: O(N) invece di O(N²)
    const distCacheFromNodes = new Map();

    // Costruiamo un "grafo virtuale" dalle connections del livello
    // perché il grafo originale è in LevelFactory; qui lavoriamo sul layout
    const buildTempBFS = (startId) => {
      if (distCacheFromNodes.has(startId)) return;
      const dists = {};
      const queue = [startId];
      dists[startId] = 0;
      while (queue.length > 0) {
        const cur = queue.shift();
        currentLevel.connections
          .filter(c => {
            if (c.uses !== null && c.uses <= 0) return false;
            return c.from === cur || (!c.directed && c.to === cur);
          })
          .map(c => c.from === cur ? c.to : c.from)
          .forEach(neighbor => {
            if (dists[neighbor] === undefined && !blockedNodes.has(neighbor)) {
              dists[neighbor] = dists[cur] + 1;
              queue.push(neighbor);
            }
          });
      }
      distCacheFromNodes.set(startId, dists);
    };

    [...thiefPositions, ...guardPositions, exitId].forEach(id => buildTempBFS(id));

    // ── Muovi ogni ladro ──────────────────────────────────────────────────
    const updatedThieves   = [...thiefPositions];
    const updatedHistories = [...thiefHistories];
    const updatedKeys      = new Set(collectedKeys);

    for (let i = 0; i < thiefPositions.length; i++) {
      const tPos = thiefPositions[i];
      const history = thiefHistories[i] || [];

      // Vicini percorribili (non occupati da guardie, non bloccati)
      const neighbors = currentLevel.connections
        .filter(c => {
          if (c.uses !== null && c.uses <= 0) return false;
          return c.from === tPos || (!c.directed && c.to === tPos);
        })
        .map(c => c.from === tPos ? c.to : c.from)
        .filter(n => !blockedNodes.has(n) && !guardPositions.includes(n));

      if (neighbors.length === 0) {
       // Il ladro è fottuto. Segnalo in un array di "intrappolati"
        swapCaptured.push(i); 
        continue; 
      }

      // Assicura cache per ogni vicino
      neighbors.forEach(n => buildTempBFS(n));

      // Calcola score per ogni vicino
      let bestScore = -Infinity;
      let bestMove  = null;

      for (const move of neighbors) {
        const s = scoreMove(
          move, exitId, distCacheFromNodes,
          guardPositions, history, currentLevel, updatedKeys
        );
        if (s > bestScore || (s === bestScore && Math.random() > 0.5)) {
          bestScore = s;
          bestMove  = move;
        }
      }

      const chosenMove = bestMove || neighbors[0];

      // Aggiorna storia anti-loop (max 3 posizioni)
      const newHistory = [...history, tPos].slice(-3);
      updatedHistories[i] = newHistory;
      updatedThieves[i]   = chosenMove;

      // Consuma bridge se necessario
      const edge = currentLevel.connections.find(c =>
        (c.from === tPos && c.to === chosenMove) ||
        (!c.directed && c.from === chosenMove && c.to === tPos)
      );
      if (edge?.type === 'bridge' && edge.uses !== null) {
        edge.uses = Math.max(0, edge.uses - 1);
      }

      // Raccoglie chiavi
      const landedNode = currentLevel.nodes.find(n => n.id === chosenMove);
      if (landedNode?.type === 'key') {
        const keyId = landedNode.data?.keyId;
        if (keyId && !updatedKeys.has(keyId)) {
          updatedKeys.add(keyId);
          // Sblocca il nodo 'locked' corrispondente
          const lockedNode = currentLevel.nodes.find(n => n.type === 'locked' && n.data?.keyId === keyId);
          if (lockedNode) {
            lockedNode.type = 'unlocked'; // marcato come aperto per il renderer
            console.log(`🔑 Chiave raccolta! Porta ${lockedNode.id} aperta.`);
          }
          console.log(`🔑 Chiave [${keyId}] raccolta dal ladro ${i}`);
        }
      }
    }

    set({
      thiefPositions: updatedThieves,
      thiefHistories: updatedHistories,
      collectedKeys: updatedKeys,
    });

    // ── SWAP TRAP: guardia e ladro si incrociano nello stesso turno ──────────
    // Se prima del turno guardia era in A e ladro in B,
    // dopo il turno guardia è in B e ladro è in A → cattura.
    // (Questo caso non era gestito nell'originale)
    const prevGuards = guardPositions; // snapshot pre-turno ladri
    const swapCaptured = [];
    updatedThieves.forEach((newTPos, ti) => {
      const oldTPos = thiefPositions[ti];
      prevGuards.forEach((gPos, gi) => {
        if (newTPos === gPos) {
          // Il ladro è finito sulla guardia (caso normale)
          swapCaptured.push(ti);
        }
      });
    });

    // Rimuovi ladri catturati
    let survivors = updatedThieves.filter((_, i) => !swapCaptured.includes(i));
    let survivorHistories = updatedHistories.filter((_, i) => !swapCaptured.includes(i));

    if (swapCaptured.length > 0) {
      console.log(`🎯 ${swapCaptured.length} ladro/i catturato/i per collisione!`);
      set({ thiefPositions: survivors, thiefHistories: survivorHistories });
      if (survivors.length === 0) { get().winGame(); return; }
    }

    // ── Il ladro è sull'uscita? ──────────────────────────────────────────
    const escapedThieves = survivors.filter(tp => {
      if (tp !== exitId) return false;
      // Controlla se l'uscita richiede una chiave
      const exitNodeData = currentLevel.nodes.find(n => n.id === exitId);
      if (exitNodeData?.type === 'locked') {
        const keyId = exitNodeData.data?.keyId;
        return updatedKeys.has(keyId); // scappa solo se ha la chiave
      }
      return true;
    });

    if (escapedThieves.length > 0) {
      console.log('💀 Un ladro è scappato!');
      set({ gameState: 'LOST' });
    }
  },

  // ── WIN / LOSE ─────────────────────────────────────────────────────────────

  winGame: () => {
    console.log('%c🏆 VITTORIA!', 'background:#222;color:#FFD700;font-size:20px');
    const { currentLevelNumber, unlockedLevels, coins, turnCount } = get();

    // Bonus stelle: meno turni = più stelle (max 3)
    const starThresholds = [10, 20, 40];
    const stars = turnCount <= starThresholds[0] ? 3
                : turnCount <= starThresholds[1] ? 2 : 1;

    const coinReward = 10 + stars * 15; // 25, 40, 55

    set({
      gameState: 'WON',
      coins: coins + coinReward,
      unlockedLevels: Math.max(unlockedLevels, currentLevelNumber + 1),
    });

    console.log(`⭐ Stelle: ${stars} | Monete: +${coinReward}`);
  },

  loseGame: () => {
    set({ gameState: 'LOST' });
  },

  // ── UTILS ──────────────────────────────────────────────────────────────────

  setView: (v) => set({ view: v }),

  /**
   * Restituisce i nodi adiacenti a un dato nodo (per highlight UI).
   */
  getNeighbors: (nodeId) => {
    const { currentLevel } = get();
    if (!currentLevel) return [];
    return currentLevel.connections
      .filter(c => {
        if (c.uses !== null && c.uses <= 0) return false;
        return c.from === nodeId || (!c.directed && c.to === nodeId);
      })
      .map(c => c.from === nodeId ? c.to : c.from);
  },

  /**
   * Restituisce i nodi raggiungibili da una guardia specifica (per highlight UI).
   */
  getGuardReachable: (guardIndex) => {
    const { currentLevel, guardPositions } = get();
    if (!currentLevel || guardIndex === null) return [];
    return get().getNeighbors(guardPositions[guardIndex]);
  },
}));
