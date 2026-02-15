import { create } from 'zustand';

export const useGameStore = create((set, get) => ({
  view: 'GAME',
  currentLevel: 1,
  gameState: 'PLAYING',
  thiefPosition: 'node3',
  guardPosition: 'node1',
  blockedNodes: new Set(),
  
  levels: [
    {
      id: 1, name: "Tutorial Mare",
      nodes: [
        { id: 'node1', x: -4, z: 0, type: 'start' },
        { id: 'node2', x: 0, z: 0, type: 'normal' },
        { id: 'node3', x: 4, z: 0, type: 'normal' },
        { id: 'node_exit', x: 0, z: 4, type: 'exit' },
      ],
      connections: [['node1', 'node2'], ['node2', 'node3'], ['node2', 'node_exit']]
    },
    {
      id: 2, name: "Catch Him!!",
      nodes: [
        { id: 'L2_THIEF_START', x: 0, z: 6, type: 'normal' },
        { id: 'L2_F1_1', x: -4, z: 3, type: 'normal' }, { id: 'L2_F1_2', x: 0, z: 3, type: 'normal' }, { id: 'L2_F1_3', x: 4, z: 3, type: 'normal' },
        { id: 'L2_F2_1', x: -4, z: 0, type: 'normal' }, { id: 'L2_F2_2', x: 0, z: 0, type: 'normal' }, { id: 'L2_F2_3', x: 4, z: 0, type: 'normal' },
        { id: 'L2_EXIT_1', x: -4, z: -3, type: 'exit' }, { id: 'L2_EXIT_2', x: 0, z: -3, type: 'exit' }, { id: 'L2_EXIT_3', x: 4, z: -3, type: 'exit' },
      ],
      connections: [
        ['L2_THIEF_START', 'L2_F1_1'], ['L2_THIEF_START', 'L2_F1_2'], ['L2_THIEF_START', 'L2_F1_3'],
        ['L2_F1_1', 'L2_F1_2'], ['L2_F1_2', 'L2_F1_3'],
        ['L2_F1_1', 'L2_F2_1'], ['L2_F1_1', 'L2_F2_2'],
        ['L2_F1_2', 'L2_F2_1'], ['L2_F1_2', 'L2_F2_2'], ['L2_F1_2', 'L2_F2_3'],
        ['L2_F1_3', 'L2_F2_2'], ['L2_F1_3', 'L2_F2_3'],
        ['L2_F2_1', 'L2_F2_2'], ['L2_F2_2', 'L2_F2_3'],
        ['L2_F2_1', 'L2_EXIT_1'], ['L2_F2_1', 'L2_EXIT_2'],
        ['L2_F2_2', 'L2_EXIT_1'], ['L2_F2_2', 'L2_EXIT_2'], ['L2_F2_2', 'L2_EXIT_3'],
        ['L2_F2_3', 'L2_EXIT_2'], ['L2_F2_3', 'L2_EXIT_3'],
      ]
    },
    {
      id: 3, name: "Il Doppio Imbuto",
      nodes: [
        { id: 'L3_START', x: 0, z: 8, type: 'normal' },
        { id: 'L3_C_1', x: -3, z: 5, type: 'normal' }, { id: 'L3_C_2', x: 3, z: 5, type: 'normal' },
        { id: 'L3_MID', x: 0, z: 2, type: 'normal' },
        { id: 'L3_L_1', x: -6, z: 2, type: 'normal' }, { id: 'L3_R_1', x: 6, z: 2, type: 'normal' },
        { id: 'L3_L_EXIT', x: -6, z: -4, type: 'exit' }, { id: 'L3_R_EXIT', x: 6, z: -4, type: 'exit' },
        { id: 'L3_BLOCK', x: 0, z: 5, type: 'normal' }
      ],
      connections: [
        ['L3_START', 'L3_C_1'], ['L3_START', 'L3_C_2'], ['L3_START', 'L3_BLOCK'],
        ['L3_C_1', 'L3_L_1'], ['L3_C_1', 'L3_MID'], ['L3_BLOCK', 'L3_MID'],
        ['L3_C_2', 'L3_R_1'], ['L3_C_2', 'L3_MID'],
        ['L3_L_1', 'L3_L_EXIT'], ['L3_R_1', 'L3_R_EXIT'],
        ['L3_MID', 'L3_L_1'], ['L3_MID', 'L3_R_1']
      ]
    },
    {
      id: 4, name: "Il Tridente",
      nodes: [
        { id: 'L4_CENTER', x: 0, z: 0, type: 'normal' }, // Partenza Ladro
        { id: 'L4_G_START', x: 0, z: -4, type: 'normal' }, // Partenza Guardia
        // Ramo Sinistro
        { id: 'L4_L1', x: -4, z: 2, type: 'normal' }, { id: 'L4_L2', x: -6, z: 5, type: 'normal' }, { id: 'L4_LEXIT', x: -8, z: 8, type: 'exit' },
        // Ramo Centrale
        { id: 'L4_C1', x: 0, z: 3, type: 'normal' }, { id: 'L4_C2', x: 0, z: 6, type: 'normal' }, { id: 'L4_CEXIT', x: 0, z: 9, type: 'exit' },
        // Ramo Destro
        { id: 'L4_R1', x: 4, z: 2, type: 'normal' }, { id: 'L4_R2', x: 6, z: 5, type: 'normal' }, { id: 'L4_REXIT', x: 8, z: 8, type: 'exit' },
        // Connessioni Trasversali (i blocchi "imboscata")
        { id: 'L4_B1', x: -3, z: 5, type: 'normal' }, { id: 'L4_B2', x: 3, z: 5, type: 'normal' }
      ],
      connections: [
        ['L4_G_START', 'L4_CENTER'],
        ['L4_CENTER', 'L4_L1'], ['L4_CENTER', 'L4_C1'], ['L4_CENTER', 'L4_R1'],
        ['L4_L1', 'L4_L2'], ['L4_L2', 'L4_LEXIT'],
        ['L4_C1', 'L4_C2'], ['L4_C2', 'L4_CEXIT'],
        ['L4_R1', 'L4_R2'], ['L4_R2', 'L4_REXIT'],
        // Trasversali
        ['L4_L2', 'L4_B1'], ['L4_B1', 'L4_C2'],
        ['L4_R2', 'L4_B2'], ['L4_B2', 'L4_C2']
      ]
    }
    ,{
        id: 5, name: "Arcipelago Nebbioso",
        nodes: [
          { id: 'L5_G_START', x: 0, z: -8, type: 'normal' },
          { id: 'L5_T_START', x: 0, z: 8, type: 'normal' },
          // Una griglia disordinata di nodi
          { id: 'N1', x: -5, z: 4, type: 'normal' }, { id: 'N2', x: 0, z: 4, type: 'normal' }, { id: 'N3', x: 5, z: 4, type: 'normal' },
          { id: 'N4', x: -3, z: 0, type: 'normal' }, { id: 'N5', x: 3, z: 0, type: 'normal' },
          { id: 'N6', x: -6, z: -4, type: 'normal' }, { id: 'N7', x: 0, z: -4, type: 'normal' }, { id: 'N8', x: 6, z: -4, type: 'normal' },
          // Uscite nascoste ai lati
          { id: 'L5_EXIT_L', x: -10, z: 0, type: 'exit' },
          { id: 'L5_EXIT_R', x: 10, z: 0, type: 'exit' },
        ],
        connections: [
          ['L5_T_START', 'N1'], ['L5_T_START', 'N2'], ['L5_T_START', 'N3'],
          ['N1', 'N4'], ['N2', 'N4'], ['N2', 'N5'], ['N3', 'N5'],
          ['N4', 'L5_EXIT_L'], ['N5', 'L5_EXIT_R'],
          ['N4', 'N7'], ['N5', 'N7'],
          ['N7', 'N6'], ['N7', 'N8'],
          ['N6', 'L5_G_START'], ['N7', 'L5_G_START'], ['N8', 'L5_G_START'],
          ['N1', 'L5_EXIT_L'], ['N3', 'L5_EXIT_R']
        ]
    }
  ],

  blockNode: (nodeId) => {
    const { guardPosition, levels, currentLevel, gameState, blockedNodes } = get();
    if (gameState !== 'PLAYING') return;
    const level = levels.find(l => l.id === currentLevel);
    const neighbors = level.connections
      .filter(conn => conn.includes(guardPosition))
      .map(conn => conn[0] === guardPosition ? conn[1] : conn[0]);
    if (!neighbors.includes(nodeId) || blockedNodes.has(nodeId)) return;
    set({ guardPosition: nodeId });
    if (nodeId === get().thiefPosition) { set({ gameState: 'WON' }); return; }
    setTimeout(() => get().moveThief(), 400);
  },

  moveThief: () => {
    const { thiefPosition, levels, currentLevel, blockedNodes, guardPosition } = get();
    const level = levels.find(l => l.id === currentLevel);
    const getNeighbors = (pos) => level.connections
      .filter(conn => conn.includes(pos))
      .map(conn => conn[0] === pos ? conn[1] : conn[0])
      .filter(n => !blockedNodes.has(n) && n !== guardPosition);
    const exits = level.nodes.filter(n => n.type === 'exit').map(n => n.id);
    const possibleMoves = getNeighbors(thiefPosition);
    if (possibleMoves.length === 0) { set({ gameState: 'WON' }); return; }
    let bestMove = possibleMoves[0];
    let minDistance = Infinity;
    for (const move of possibleMoves) {
      if (exits.includes(move)) { set({ thiefPosition: move, gameState: 'LOST' }); return; }
      let queue = [{ id: move, dist: 0 }];
      let visited = new Set([move, guardPosition, ...blockedNodes]);
      let distToExit = Infinity;
      while (queue.length > 0) {
        let { id, dist } = queue.shift();
        if (exits.includes(id)) { distToExit = dist; break; }
        for (const neighbor of getNeighbors(id)) {
          if (!visited.has(neighbor)) { visited.add(neighbor); queue.push({ id: neighbor, dist: dist + 1 }); }
        }
      }
      if (distToExit < minDistance) { minDistance = distToExit; bestMove = move; }
    }
    set({ thiefPosition: bestMove });
  },

  setCurrentLevel: (id) => {
    const lvl = get().levels.find(l => l.id === id);
    if (!lvl) { set({ view: 'CAREER' }); return; }
    let gSpawn = lvl.nodes[0].id;
    let tSpawn = lvl.nodes[lvl.nodes.length - 1].id;
    if (id === 2) { gSpawn = 'L2_F2_2'; tSpawn = 'L2_THIEF_START'; }
    if (id === 3) { gSpawn = 'L3_MID'; tSpawn = 'L3_START'; }
    if (id === 4) { gSpawn = 'L4_G_START'; tSpawn = 'L4_CENTER'; }
    if (id === 5) { gSpawn = 'L5_G_START'; tSpawn = 'L5_T_START'; }
    set({ currentLevel: id, blockedNodes: new Set(), gameState: 'PLAYING', guardPosition: gSpawn, thiefPosition: tSpawn });
  },

  nextLevel: () => get().setCurrentLevel(get().currentLevel + 1),
  setView: (view) => set({ view })
}));