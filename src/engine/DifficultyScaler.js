export function getDifficultyConfig(level) {
  // LIVELLO 1: Tutorial ultra-semplice
  if (level === 1) {
    return {
      nodesCount: 4,
      minMovesToWin: 1,
      minDistanceFromExit: 2,
      mutateChance: 0,
      thieves: 1
    };
  }
  
  // LIVELLI 2-5: Difficoltà crescente ma contenuta
  if (level <= 5) {
    return {
      nodesCount: 5 + level, 
      minMovesToWin: 1,
      minDistanceFromExit: 2,
      mutateChance: 0.1,
      thieves: 1
    };
  }

  // LIVELLI AVANZATI
  return {
    nodesCount: Math.min(8 + Math.floor(level / 2), 20),
    minMovesToWin: 3,
    minDistanceFromExit: 3,
    mutateChance: 0.4,
    thieves: 1
  };
}