/**
 * LEVELFACTORY.JS — Genera e valida ogni livello prima di consegnarlo al game store.
 *
 * PIPELINE DI GENERAZIONE:
 *   1. Ottieni il pattern base (fisso o procedurale)
 *   2. Muta il grafo (solo livelli > 15)
 *   3. Inietta meccaniche speciali (portali, chiavi, ponti)
 *   4. Cerca spawn validi con il Filtro Matematico (max 300 tentativi)
 *   5. Genera il layout fisico (Jittered Grid)
 *   6. Ritorna l'oggetto livello completo
 *
 * BFS ENGINE:
 *   - getDistances: BFS da un nodo, restituisce mappa {id: distanza}
 *   - getPath: ricostruisce il percorso tra due nodi
 *   Entrambi rispettano gli archi consumabili (uses > 0) e la direzione (directed).
 */

import { getPattern, mutateGraph } from './PatternLibrary';
import { getDifficultyConfig, getBiome } from './DifficultyScaler';

// ─── BFS ENGINE ───────────────────────────────────────────────────────────────

/**
 * BFS completa dal nodo startId. Restituisce { nodeId: distanza }.
 * Rispetta: archi con uses > 0, portali direzionati, nodi bloccati.
 *
 * @param {string|number} startId - Nodo di partenza
 * @param {Graph} graph
 * @param {Set} blockedNodes - Nodi da ignorare (es. posizioni guardie)
 * @returns {Object} mappa di distanze
 */
export const getDistances = (startId, graph, blockedNodes = new Set()) => {
  const distances = { [startId]: 0 };
  const queue = [startId];

  while (queue.length > 0) {
    const current = queue.shift();
    const node = graph.getNode(current);
    if (!node) continue;

    for (const edge of node.edges) {
      if (!edge.canTraverse()) continue;                  // arco esaurito
      if (distances[edge.to] !== undefined) continue;     // già visitato
      if (blockedNodes.has(edge.to)) continue;            // bloccato

      distances[edge.to] = distances[current] + 1;
      queue.push(edge.to);
    }
  }

  return distances;
};

/**
 * Ricostruisce il percorso più breve tra start e target.
 * Restituisce array di ID o null se non esiste percorso.
 *
 * @param {*} start
 * @param {*} target
 * @param {Graph} graph
 * @param {Set} blockedNodes
 * @returns {Array|null}
 */
export const getPath = (start, target, graph, blockedNodes = new Set()) => {
  if (start === target) return [start];
  const prev = { [start]: null };
  const queue = [start];

  while (queue.length > 0) {
    const current = queue.shift();
    const node = graph.getNode(current);
    if (!node) continue;

    for (const edge of node.edges) {
      if (!edge.canTraverse()) continue;
      if (prev[edge.to] !== undefined) continue;
      if (blockedNodes.has(edge.to)) continue;

      prev[edge.to] = current;
      if (edge.to === target) {
        // Ricostruisci percorso
        const path = [];
        let cur = target;
        while (cur !== null) { path.unshift(cur); cur = prev[cur]; }
        return path;
      }
      queue.push(edge.to);
    }
  }
  return null;
};

// ─── SPAWN VALIDATOR ──────────────────────────────────────────────────────────

/**
 * Cerca posizioni valide per guardie e ladri nel grafo.
 * Rispetta il Filtro Matematico:
 *   - Il ladro deve essere a >= minThiefDistFromExit passi dall'uscita
 *   - La guardia deve avere un vantaggio sull'uscita rispetto al ladro
 *   - La guardia non può spawnare a meno di 2 passi dal ladro (anti-instant-kill)
 *   - Nessun personaggio spawna sull'uscita o su nodi speciali (key/locked)
 *
 * @param {Graph} graph
 * @param {*} exitId
 * @param {object} config - getDifficultyConfig output
 * @returns {{ guardStarts, thiefStarts } | null}
 */
function findValidSpawns(graph, exitId, config) {
  const { guards, thieves, minThiefDistFromExit, guardAdvantage } = config;
  const ids = graph.getAllNodeIds();

  // Candidati: esclude uscita e nodi speciali (key, locked)
  const candidates = ids.filter(id => {
    const n = graph.getNode(id);
    return id !== exitId && n?.type === 'normal';
  });

  if (candidates.length < guards + thieves + 1) return null;

  const distsFromExit = getDistances(exitId, graph);

  // --- LADRI ---
  const validThieves = candidates.filter(id =>
    (distsFromExit[id] ?? 0) >= minThiefDistFromExit
  );
  if (validThieves.length < thieves) return null;

  // Scegli posizioni ladro distanziate tra loro
  const thiefStarts = [];
  const shuffled = [...validThieves].sort(() => Math.random() - 0.5);
  for (const id of shuffled) {
    if (thiefStarts.length >= thieves) break;
    // Assicura che i ladri non siano adiacenti tra loro
    const tooClose = thiefStarts.some(t => {
      const d = getDistances(id, graph);
      return (d[t] ?? 99) < 3;
    });
    if (!tooClose) thiefStarts.push(id);
  }
  if (thiefStarts.length < thieves) return null;

  // Distanze combinate da tutti i ladri (minimo)
  const getMinDistToThieves = (nodeId) => {
    return Math.min(...thiefStarts.map(t => {
      const d = getDistances(t, graph);
      return d[nodeId] ?? 99;
    }));
  };

  // --- GUARDIE ---
  const maxThiefDist = Math.max(...thiefStarts.map(t => distsFromExit[t] ?? 0));

  const validGuards = candidates.filter(id => {
    if (thiefStarts.includes(id)) return false;
    const dExit  = distsFromExit[id] ?? 99;
    const dThief = getMinDistToThieves(id);
    // Vantaggio sull'uscita, ma non instant-kill
    return dExit <= maxThiefDist - guardAdvantage && dThief >= 2;
  });

  if (validGuards.length < guards) return null;

  // Scegli guardie distanziate tra loro
  const guardStarts = [];
  const shuffledG = [...validGuards].sort(() => Math.random() - 0.5);
  for (const id of shuffledG) {
    if (guardStarts.length >= guards) break;
    const tooClose = guardStarts.some(g => {
      const d = getDistances(id, graph);
      return (d[g] ?? 99) < 2;
    });
    if (!tooClose) guardStarts.push(id);
  }
  if (guardStarts.length < guards) return null;

  return { guardStarts, thiefStarts };
}

// ─── EXIT SELECTOR ────────────────────────────────────────────────────────────

/**
 * Seleziona il nodo di uscita ottimale:
 *   1. Preferisce nodi di tipo 'locked' (già designati come uscita bloccata)
 *   2. Altrimenti: nodo "periferico" = alto rapporto (distanza media - connessioni)
 *      così l'uscita è lontana dal centro e non banalmente raggiungibile.
 *
 * @param {Graph} graph
 * @param {Array} excludeIds - Nodi da escludere
 * @returns {*} exitId
 */
function selectExit(graph, excludeIds = []) {
  const ids = graph.getAllNodeIds();

  // Priorità a nodi 'locked'
  const locked = ids.find(id => graph.getNode(id)?.type === 'locked');
  if (locked) return locked;

  // Escludi i nodi speciali e quelli in excludeIds
  const candidates = ids.filter(id => {
    const n = graph.getNode(id);
    return !excludeIds.includes(id) && n?.type === 'normal';
  });

  if (candidates.length === 0) return ids[ids.length - 1];

  // Calcola centralità: usa BFS da ogni nodo e somma distanze
  // Nodo più "periferico" = somma distanze più alta + poche connessioni
  let bestScore = -Infinity;
  let bestId = candidates[0];

  // Per performance, campiona max 8 nodi come "centri" del BFS
  const sample = [...candidates].sort(() => Math.random() - 0.5).slice(0, 8);

  candidates.forEach(id => {
    const dists = getDistances(id, graph);
    const avgDist = sample.reduce((sum, s) => sum + (dists[s] ?? 0), 0) / sample.length;
    const connCount = graph.getNode(id)?.edges.length ?? 0;
    // Score: alta distanza media = periferico; poche connessioni = corner
    const score = avgDist * 2 - connCount;
    if (score > bestScore) { bestScore = score; bestId = id; }
  });

  return bestId;
}

// ─── LAYOUT GENERATOR ─────────────────────────────────────────────────────────

/**
 * Genera il layout fisico (Jittered Grid).
 * I nodi speciali (portali, chiavi) vengono marcati nel layout per il renderer.
 *
 * @param {Graph} graph
 * @param {*} exitId
 * @returns {{ nodes, connections }}
 */
function generateLayout(graph, exitId) {
  const ids = graph.getAllNodeIds();
  const nodes = [];
  const connections = [];

  const gridSize = Math.ceil(Math.sqrt(ids.length));
  const spacing = 10;
  const jitter = 2.5;

  ids.forEach((id, index) => {
    const row = Math.floor(index / gridSize);
    const col = index % gridSize;
    const node = graph.getNode(id);

    nodes.push({
      id,
      x: col * spacing + (Math.random() - 0.5) * jitter,
      z: row * spacing + (Math.random() - 0.5) * jitter,
      type: id === exitId ? 'exit' : (node?.type || 'normal'),
      data: node?.data || {},
    });
  });

  // Centra la mappa per la camera
  const avgX = nodes.reduce((s, n) => s + n.x, 0) / nodes.length;
  const avgZ = nodes.reduce((s, n) => s + n.z, 0) / nodes.length;
  nodes.forEach(n => { n.x -= avgX; n.z -= avgZ; });

  // Estrae connessioni uniche con metadati dell'arco
  graph.nodes.forEach(node => {
    node.edges.forEach(edge => {
      // Evita duplicati per archi bidirezionali
      if (!edge.directed && node.id > edge.to) return;
      connections.push({
        from: node.id,
        to: edge.to,
        type: edge.type,         // 'normal' | 'bridge' | 'portal' | 'one_way'
        uses: edge.uses,          // null o numero
        directed: edge.directed,
      });
    });
  });

  return { nodes, connections };
}

// ─── EXPORT PRINCIPALE ────────────────────────────────────────────────────────

export function generateLevel(levelNumber) {
  const config = getDifficultyConfig(levelNumber);
  const biome = getBiome(levelNumber);

  console.log(`%c⚙️ Generazione Livello ${levelNumber} [${biome.name}]`, 'color:#ff00ff;font-weight:bold');

  let guardStarts = [];
  let thiefStarts = [];
  let exitId = null;
  let finalGraph = null;
  let hint = null;

  // ── LIVELLI FISSI (1–15) ─────────────────────────────────────────────────
  if (levelNumber <= 15) {
    const patternData = getPattern(levelNumber, config);
    finalGraph = patternData.graph;
    guardStarts = patternData.guards;
    thiefStarts = patternData.thieves;
    exitId      = patternData.exit;
    hint        = patternData.hint || null;

    // Sanity check: uscita non deve coincidere con guardia o ladro
    if (guardStarts.includes(exitId)) {
      console.warn(`⚠️ LV${levelNumber}: exit coincide con guardia, correggo.`);
      exitId = selectExit(finalGraph, [...guardStarts, ...thiefStarts]);
    }
  }

  // ── LIVELLI PROCEDURALI (>15) ─────────────────────────────────────────────
  else {
  let attempts = 0;
  let found = false;

  while (!found && attempts < 300) {
    attempts++;

    const patternData = getPattern(levelNumber, config);
    const g = patternData.graph;

    mutateGraph(g, config);

    // 3. Verifica base
    if (!g.isConnected()) continue;

    // 3.5. FILTRO MATEMATICO ANTI-LOOP (Il salvavita)
    // Se c'è una sola guardia, il grafo NON DEVE avere loop larghi indivisibili.
    // (Oppure forziamo che ci siano almeno 2 guardie se il livello è complesso).
    if (config.guards === 1 && hasUncatchableLoops(g)) {
      continue; // Scarta la mappa, è un fottuto loop infinito
    }

    const exit = selectExit(g);
    const spawns = findValidSpawns(g, exit, config);
      if (!spawns) continue;

      // 6. Tutto ok
      finalGraph = g;
      exitId     = exit;
      guardStarts = spawns.guardStarts;
      thiefStarts = spawns.thiefStarts;
      found = true;
    }

    if (!found) {
      console.error(`☠️ Fallback attivato per livello ${levelNumber} dopo 300 tentativi`);
      // Fallback deterministico: griglia minima garantita
      const patternData = getPattern(levelNumber, { ...config, nodesCount: 9 });
      finalGraph = patternData.graph;
      const ids = finalGraph.getAllNodeIds();
      exitId = ids[ids.length - 1];
      guardStarts = [ids[0]];
      thiefStarts = [ids[Math.floor(ids.length / 2)]];
    }
  }

  // ── LAYOUT & OUTPUT ───────────────────────────────────────────────────────
  const layout = generateLayout(finalGraph, exitId);

  // Prepara info meccaniche per l'UI
  const mechanics = {
    hasBridges:  layout.connections.some(c => c.type === 'bridge'),
    hasPortals:  layout.connections.some(c => c.type === 'portal'),
    hasKeys:     layout.nodes.some(n => n.type === 'key'),
    hasOneWay:   layout.connections.some(c => c.type === 'one_way'),
  };

  return {
    levelNumber,
    biome: biome.key,
    biomeName: biome.name,
    biomeColor: biome.color,
    biomeAccent: biome.accent,
    nodes: layout.nodes,
    connections: layout.connections,
    guardStarts,
    thiefStarts,
    guardStart: guardStarts[0],   // retrocompatibilità
    thiefStart: thiefStarts[0],   // retrocompatibilità
    exitId,
    mechanics,
    hint,
    config: {
      guards: config.guards,
      thieves: config.thieves,
    },
  };
}
