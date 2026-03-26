/**
 * DIFFICULTYSCALER.JS — Configura la difficoltà e la progressione per bioma.
 *
 * BIOMI E LORE:
 *   OCEAN     (livelli  1-15): Le Isole del Pacifico. Il ladro è un contrabbandiere,
 *                               le guardie sono ranger costieri.
 *   DESERT    (livelli 16-30): Le Rovine del Sahara. Il ladro è un tombarolo,
 *                               le guardie sono archeologi armati.
 *   CITY      (livelli 31-50): La Metropoli Notturna. Il ladro è un hacker parkourista,
 *                               le guardie sono droni di sicurezza.
 *   SPACE     (livelli 51-70): La Stazione Orbitale. Il ladro è un fuggiasco galattico,
 *                               le guardie sono androidi da combattimento.
 *   ALIEN     (livelli 71+):   Il Pianeta X. Regole diverse, gravità assente.
 *                               Il ladro è l'ultimo essere umano libero.
 *
 * MECCANICHE PER BIOMA:
 *   - OCEAN:  Ponti normali, nessuna meccanica speciale
 *   - DESERT: Ponti a sabbia (max 2 passaggi), chiavi e porte
 *   - CITY:   Portali (teletrasporti), ponti direzionali (senso unico)
 *   - SPACE:  Portali + ponti a uso singolo + più guardie
 *   - ALIEN:  Tutto il precedente + ladri multipli + mappe enormi
 */

export const BIOMES = {
  OCEAN:  { name: 'Oceano Pacifico',       range: [1,  15], color: '#1a6b8a', accent: '#7ecfe0' },
  DESERT: { name: 'Rovine del Sahara',      range: [16, 30], color: '#c47a1e', accent: '#f5c842' },
  CITY:   { name: 'Metropoli Notturna',     range: [31, 50], color: '#1c1c3a', accent: '#c040f0' },
  SPACE:  { name: 'Stazione Orbitale',      range: [51, 70], color: '#05010f', accent: '#00fff7' },
  ALIEN:  { name: 'Pianeta X',              range: [71, 999], color: '#0a1f0a', accent: '#39ff14' },
};

export function getBiome(levelNumber) {
  for (const [key, biome] of Object.entries(BIOMES)) {
    if (levelNumber >= biome.range[0] && levelNumber <= biome.range[1]) {
      return { key, ...biome };
    }
  }
  return { key: 'ALIEN', ...BIOMES.ALIEN };
}

export function getDifficultyConfig(levelNumber) {
  const biome = getBiome(levelNumber);

  // Configurazione base scalabile
  const baseNodes = 6;
  const nodesGrowth = Math.floor((levelNumber - 1) * 1.2);
  const nodesCount = Math.min(baseNodes + nodesGrowth, 40);

  // Numero di guardie e ladri
  const guards = levelNumber <= 5  ? 1
               : levelNumber <= 20 ? Math.min(1 + Math.floor((levelNumber - 5) / 5), 3)
               : Math.min(2 + Math.floor((levelNumber - 20) / 10), 5);

  const thieves = levelNumber <= 10 ? 1
                : levelNumber <= 25 ? Math.min(1 + Math.floor((levelNumber - 10) / 8), 2)
                : Math.min(2 + Math.floor((levelNumber - 25) / 15), 3);

  // Meccaniche sbloccate per bioma
  const mechanics = {
    bridges:    biome.key !== 'OCEAN',           // ponti a uso limitato
    keys:       ['DESERT','CITY','SPACE','ALIEN'].includes(biome.key),
    portals:    ['CITY','SPACE','ALIEN'].includes(biome.key),
    oneWay:     ['CITY','SPACE','ALIEN'].includes(biome.key),
    multiThief: ['SPACE','ALIEN'].includes(biome.key),
  };

  // Probabilità e intensità di mutazione del grafo procedurale
  const mutateChance = Math.min(0.3 + levelNumber * 0.015, 0.85);
  const extraEdges = Math.floor(levelNumber / 8);

  // Distanza minima spawn: scala con il livello
  const minThiefDistFromExit  = Math.max(3, Math.min(3 + Math.floor(levelNumber / 5), 8));
  const guardAdvantage        = Math.max(1, Math.min(1 + Math.floor(levelNumber / 10), 3));

  return {
    biome,
    nodesCount,
    guards,
    thieves,
    mechanics,
    mutateChance,
    extraEdges,
    minThiefDistFromExit,
    guardAdvantage,
  };
}
