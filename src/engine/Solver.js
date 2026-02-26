// NUOVO SOLVER.JS

import { bfsDistances } from './SpawnManager' // Assumo tu abbia questa utility

export function calculateMinMoves(graph, guardStart, thiefStart) {
  const distances = bfsDistances(graph, guardStart);
  return distances[thiefStart] ?? Infinity;
}

/**
 * Valuta se la mappa è giocabile e non vinta a tavolino dal ladro.
 * Controlla che la guardia sia fisicamente più vicina a intercettare i percorsi
 * verso l'uscita rispetto a quanto il ladro sia vicino all'uscita stessa.
 */
export function canForceCapture(graph, guardStart, thiefStart, exitId) {
  const distsFromExit = bfsDistances(graph, exitId);
  const distsFromThief = bfsDistances(graph, thiefStart);

  const dT = distsFromExit[thiefStart];
  const dG = distsFromExit[guardStart];

  if (dT === undefined || dG === undefined) return false; 

  // Il ladro vince se dT è molto piccolo e dG è grande.
  // La guardia vince se può intercettare il ladro prima dell'uscita.
  return dG <= dT; 
}

export function hasLeafNode(graph) {
  // Ignoriamo l'uscita (che può essere una foglia) e la start della guardia nel tutorial
  let leafCount = 0;
  for (let node of graph.nodes.values()) {
    if (node.connections.length <= 1) leafCount++;
  }
  // Se ci sono troppe foglie (vicoli ciechi), la mappa fa schifo.
  // Ne permettiamo 1 o 2 massimo (es. Uscita e uno spawn point).
  return leafCount > 2; 
}