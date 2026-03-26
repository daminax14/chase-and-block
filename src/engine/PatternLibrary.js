/**
 * PATTERNLIBRARY.JS — Livelli manuali (1-15) e generazione procedurale (>15).
 *
 * FILOSOFIA DEI LIVELLI MANUALI:
 *   Ogni livello insegna UNA meccanica o UNA strategia nuova.
 *   I primi 5 sono puro tutorial di flusso.
 *   Dal 6 al 10 si introducono scelte tattiche.
 *   Dal 11 al 15 si sbloccano le prime meccaniche speciali (ponti, chiavi).
 *
 * NOMENCLATURA NODI:
 *   I nodi nei livelli manuali hanno ID numerici semplici.
 *   Nei livelli procedurali gli ID sono generati sequenzialmente.
 */

import { Graph } from './Graph';
import { getDifficultyConfig } from './DifficultyScaler';

// ─── HELPERS ──────────────────────────────────────────────────────────────────

const makeGraph = (...ids) => {
  const g = new Graph();
  ids.forEach(id => g.addNode(id));
  return g;
};

// ─── LIVELLI MANUALI ──────────────────────────────────────────────────────────

const FIXED_LEVELS = {

  // LV 1 — Tutorial: La "T" (immutato come da richiesta)
  // Insegna: muoviti, cattura il ladro prima che raggiunga l'uscita.
  // Il ladro ha un solo percorso. La guardia pure. Impossibile sbagliare.
  1: () => {
    const g = makeGraph(0, 1, 2, 3);
    g.connect(0, 1); g.connect(1, 2); g.connect(1, 3);
    // layout fisso per il tutorial: asse orizzontale con biforcazione
    return {
      graph: g, guards: [0], thieves: [2], exit: 3,
      hint: 'Muovi la guardia verso il ladro prima che raggiunga l\'uscita!'
    };
  },

  // LV 2 — Il Ponte Stretto
  // Insegna: collo di bottiglia. Una sola strada, chi arriva prima vince.
  // Il ladro deve attraversare il nodo 2 (ponte). La guardia parte già lì vicino.
  2: () => {
    const g = makeGraph(0, 1, 2, 3, 4, 5);
    // Lato ladro: 0-1-2 | Ponte: 2-3 | Lato uscita: 3-4-5
    g.connect(0, 1); g.connect(1, 2);
    g.connect(2, 3); // il ponte
    g.connect(3, 4); g.connect(4, 5);
    return {
      graph: g, guards: [4], thieves: [0], exit: 5,
      hint: 'Taglia la strada al ladro sul ponte!'
    };
  },

  // LV 3 — Il Bivio
  // Insegna: il ladro può scegliere due percorsi. La guardia deve anticipare.
  3: () => {
    const g = makeGraph(0, 1, 2, 3, 4, 5, 6);
    //      0
    //      |
    //   1--2--3
    //      |
    //      4
    //     / \
    //    5   6 (exit)
    g.connect(0, 2); g.connect(1, 2); g.connect(2, 3); g.connect(2, 4);
    g.connect(4, 5); g.connect(4, 6);
    return { graph: g, guards: [1], thieves: [0], exit: 6 };
  },

  // LV 4 — L'Anello con Scorciatoia
  // Insegna: il ladro può girare in entrambe le direzioni. Blocca la diagonale.
  4: () => {
    const g = makeGraph(0, 1, 2, 3, 4, 5);
    // Cerchio: 0-1-2-3-4-0 + diagonale 1-3 + uscita da 4
    g.connect(0, 1); g.connect(1, 2); g.connect(2, 3);
    g.connect(3, 4); g.connect(4, 0);
    g.connect(1, 3); // scorciatoia
    g.connect(4, 5); // uscita
    return { graph: g, guards: [0], thieves: [2], exit: 5 };
  },

  // LV 5 — La Clessidra
  // Insegna: nodo centrale di convergenza. Chi controlla il centro vince.
  5: () => {
    const g = makeGraph(0, 1, 2, 3, 4, 5, 6);
    // Due triangoli che si toccano al centro (nodo 3)
    g.connect(0, 1); g.connect(1, 2); g.connect(2, 0); // triangolo A
    g.connect(0, 3); // connessione al centro
    g.connect(3, 4); g.connect(4, 5); g.connect(5, 6); g.connect(6, 3); // lato B
    return { graph: g, guards: [2], thieves: [5], exit: 1 };
  },

  // LV 6 — Il Labirinto a Croce
  // Insegna: più percorsi validi, la guardia deve ragionare a 2 turni.
  6: () => {
    const g = makeGraph(0, 1, 2, 3, 4, 5, 6, 7, 8);
    //  0-1-2
    //  |   |
    //  3-4-5
    //  |   |
    //  6-7-8(exit)
    g.connect(0,1); g.connect(1,2);
    g.connect(3,4); g.connect(4,5);
    g.connect(6,7); g.connect(7,8);
    g.connect(0,3); g.connect(3,6);
    g.connect(2,5); g.connect(5,8);
    g.connect(1,4); g.connect(4,7); // colonna centrale
    return { graph: g, guards: [0], thieves: [2], exit: 8 };
  },

 
  // LV 8 — L'Arena (tutti si vedono, massima tensione)
  // Insegna: nessun posto dove nascondersi. La guardia deve tagliare l'angolo.
  7: () => {
    const g = makeGraph(0, 1, 2, 3, 4, 5, 6, 7);
    // Cerchio di 6 + centro connesso a 3 nodi + uscita esterna
    g.connect(0,1); g.connect(1,2); g.connect(2,3);
    g.connect(3,4); g.connect(4,5); g.connect(5,0); // cerchio
    g.connect(0,6); g.connect(2,6); g.connect(4,6); // raggi verso centro
    g.connect(3,7); // uscita
    return { graph: g, guards: [1], thieves: [5], exit: 7 };
  },

  // LV 9 — La Ragnatela (griglia 3×3 con centro)
  // Insegna: il ladro ha molte opzioni, la guardia deve anticipare il percorso ottimale.
  8: () => {
    const g = makeGraph(0,1,2,3,4,5,6,7,8,9);
    // Griglia 3x3: 0-1-2 / 3-4-5 / 6-7-8 + centro (9) raggiungibile da 1,3,5,7
    g.connect(0,1); g.connect(1,2);
    g.connect(3,4); g.connect(4,5);
    g.connect(6,7); g.connect(7,8);
    g.connect(0,3); g.connect(3,6);
    g.connect(1,4); g.connect(4,7);
    g.connect(2,5); g.connect(5,8);
    g.connect(1,9); g.connect(3,9); g.connect(5,9); g.connect(7,9); // centro
    return { graph: g, guards: [0, 2], thieves: [9], exit: 8 };
  },

  // LV 10 — Il Palazzo (grande, 2 guardie, 12 nodi)
  // Boss del bioma OCEAN. Richiede coordinazione avanzata.
  9: () => {
    const g = makeGraph(0,1,2,3,4,5,6,7,8,9,10,11);
    // Due anelli collegati da un corridoio centrale
    // Anello sinistro: 0-1-2-3-0
    g.connect(0,1); g.connect(1,2); g.connect(2,3); g.connect(3,0);
    // Corridoio: 1-4-5-6
    g.connect(1,4); g.connect(4,5); g.connect(5,6);
    // Anello destro: 6-7-8-9-6
    g.connect(6,7); g.connect(7,8); g.connect(8,9); g.connect(9,6);
    // Scorciatoie interne
    g.connect(2,5); g.connect(5,8);
    // Uscita
    g.connect(8,10); g.connect(10,11);
    return { graph: g, guards: [0, 3], thieves: [9], exit: 11 };
  },

  // LV 11 — Primo Ponte Fragile (DESERT, introduce i bridge)
  // Insegna: i ponti a 2 passaggi. Usali con saggezza.
  10: () => {
    const g = makeGraph(0,1,2,3,4,5,6,7);
    g.connect(0,1); g.connect(1,2); g.connect(2,3);
    g.connect(4,5); g.connect(5,6); g.connect(6,7);
    g.connect(1,5); // ponte normale
    g.connect(2,6, { type: 'bridge', uses: 2 }); // PONTE FRAGILE
    g.connect(3,7); // seconda connessione
    return {
      graph: g, guards: [0], thieves: [7], exit: 4,
      hint: 'Il ponte di sabbia può essere attraversato solo 2 volte in totale!'
    };
  },

  // LV 12 — Chiave e Porta (DESERT, introduce keys)
  // Insegna: la chiave sblocca l'uscita. Il ladro deve fare un detour.
  11: () => {
    const g = makeGraph(0,1,2,3,4,5,6,7,8);
    g.addNode(7, 'key',    { keyId: 'gold_key' }); // nodo chiave
    g.addNode(8, 'locked', { keyId: 'gold_key' }); // nodo uscita bloccata
    g.connect(0,1); g.connect(1,2); g.connect(2,3); g.connect(3,4);
    g.connect(1,5); g.connect(5,6); g.connect(6,7); // percorso chiave
    g.connect(4,8); // porta
    g.connect(2,6); // scorciatoia
    return {
      graph: g, guards: [0], thieves: [4], exit: 8,
      hint: 'Il ladro deve prendere la chiave (nodo giallo) per aprire l\'uscita!'
    };
  },

  // LV 13 — Doppia Guardia + Ponti Fragili
  13: () => {
    const g = makeGraph(0,1,2,3,4,5,6,7,8,9,10);
    g.connect(0,1); g.connect(1,2); g.connect(2,3); g.connect(3,4);
    g.connect(5,6); g.connect(6,7); g.connect(7,8); g.connect(8,9);
    g.connect(1,6, { type:'bridge', uses:2 });
    g.connect(3,8, { type:'bridge', uses:2 });
    g.connect(4,9); // connessione bassa
    g.connect(9,10); // uscita
    return { graph: g, guards: [0, 5], thieves: [4], exit: 10 };
  },

  // LV 14 — Il Labirinto dei Deserti (grande, 14 nodi, chiave+ponti)
  14: () => {
    const g = makeGraph(0,1,2,3,4,5,6,7,8,9,10,11,12,13);
    g.addNode(12, 'key',    { keyId: 'silver_key' });
    g.addNode(13, 'locked', { keyId: 'silver_key' });
    // Griglia 4x3 parziale
    g.connect(0,1); g.connect(1,2); g.connect(2,3);
    g.connect(4,5); g.connect(5,6); g.connect(6,7);
    g.connect(8,9); g.connect(9,10); g.connect(10,11);
    g.connect(0,4); g.connect(4,8);
    g.connect(1,5); g.connect(5,9);
    g.connect(3,7); g.connect(7,11);
    g.connect(2,6, { type:'bridge', uses:2 }); // ponte fragile centrale
    g.connect(9,12); // percorso chiave
    g.connect(11,13); // porta bloccata (uscita)
    return { graph: g, guards: [0, 8], thieves: [3], exit: 13 };
  },

  // LV 15 — Boss DESERT: Il Labirinto del Faraone
  // 3 guardie, 16 nodi, chiave, ponti fragili. Mappa non banale.
  15: () => {
    const g = makeGraph(0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15);
    g.addNode(14, 'key',    { keyId: 'pharaoh_key' });
    g.addNode(15, 'locked', { keyId: 'pharaoh_key' });
    // Griglia 4x4
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        const id = r * 4 + c;
        if (c < 3) g.connect(id, id + 1);
        if (r < 3) g.connect(id, id + 4);
      }
    }
    // Rimuovi archi per creare corridoi e labirinto
    // (impostiamo ponti fragili su passaggi chiave)
    g.connect(5, 10, { type:'bridge', uses:2 });
    g.connect(6,  9, { type:'bridge', uses:2 });
    g.connect(3, 14); // percorso chiave
    g.connect(12, 15); // porta
    return { graph: g, guards: [0, 3, 12], thieves: [15], exit: 15 };
    // nota: exit su nodo locked – il ladro deve avere la chiave
    // Il valore corretto di exit verrà ignorato se il nodo è 'locked' senza chiave
  },
};

// ─── GENERAZIONE PROCEDURALE (livelli > 15) ───────────────────────────────────

/**
 * Genera un grafo procedurale a griglia con struttura coerente.
 * La griglia è il punto di partenza: poi viene mutata per aggiungere varietà.
 */
function generateProceduralGraph(config) {
  const g = new Graph();
  const n = config.nodesCount;
  const side = Math.ceil(Math.sqrt(n));

  for (let i = 0; i < n; i++) g.addNode(i);

  // Griglia base
  for (let i = 0; i < n; i++) {
    const row = Math.floor(i / side);
    const col = i % side;
    if (col < side - 1 && i + 1 < n) g.connect(i, i + 1);
    if (row < side - 1 && i + side < n) g.connect(i, i + side);
  }

  return g;
}

/**
 * Muta il grafo aggiungendo archi extra con tipo basato sulla difficoltà e bioma.
 */
export function mutateGraph(graph, config) {
  const ids = graph.getAllNodeIds();
  const { extraEdges, mechanics, biome } = config;

  // Aggiunge archi "diagonali" per rompere la monotonia della griglia
  for (let i = 0; i < extraEdges; i++) {
    const a = ids[Math.floor(Math.random() * ids.length)];
    const b = ids[Math.floor(Math.random() * ids.length)];
    if (a === b || graph.getNode(a).hasEdgeTo(b)) continue;

    // Tipo di arco in base al bioma
    let edgeType = 'normal';
    let uses = null;

    if (mechanics.bridges && Math.random() < 0.3) {
      edgeType = 'bridge';
      uses = 2;
    } else if (mechanics.oneWay && Math.random() < 0.2) {
      edgeType = 'one_way';
    }

    graph.connect(a, b, { type: edgeType, uses });
  }

  // Portali: da CITY in poi, aggiungi 1-2 portali su nodi lontani
  if (mechanics.portals) {
    const numPortals = biome.key === 'ALIEN' ? 3 : biome.key === 'SPACE' ? 2 : 1;
    for (let i = 0; i < numPortals; i++) {
      const candidates = ids.filter(id => graph.getNode(id).edges.length <= 2);
      if (candidates.length < 2) continue;
      const from = candidates[Math.floor(Math.random() * candidates.length)];
      const to   = candidates[Math.floor(Math.random() * candidates.length)];
      if (from !== to) {
        graph.addPortal(from, to);
      }
    }
  }

  // Porte e chiavi: 1 coppia per livelli DESERT+
  if (mechanics.keys && Math.random() < 0.6) {
    // Cerca un nodo con poche connessioni (buon candidato per nodo-chiave isolato)
    const keyNode = ids[Math.floor(Math.random() * Math.floor(ids.length / 3))];
    const doorNode = ids[ids.length - 2]; // vicino all'uscita
    const keyId = `key_${Math.random().toString(36).substr(2,4)}`;

    const kn = graph.getNode(keyNode);
    const dn = graph.getNode(doorNode);
    if (kn && dn && kn.type === 'normal' && dn.type === 'normal') {
      kn.type = 'key';
      kn.data = { keyId };
      dn.type = 'locked';
      dn.data = { keyId };
    }
  }
}

// ─── EXPORT PRINCIPALE ────────────────────────────────────────────────────────

export function getPattern(levelNumber, config) {
  if (FIXED_LEVELS[levelNumber]) {
    return FIXED_LEVELS[levelNumber]();
  }

  // Generazione procedurale per livelli > 15
  const graph = generateProceduralGraph(config);
  return { graph };
}
