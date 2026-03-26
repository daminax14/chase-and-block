# Guardie & Ladri — Note Architetturali

## Struttura file

```
engine/
  Graph.js           — Struttura dati del grafo (nodi + archi tipizzati)
  DifficultyScaler.js — Config difficoltà + sistema biomi
  PatternLibrary.js  — Livelli manuali 1-15 + generazione procedurale
  LevelFactory.js    — Pipeline di generazione + BFS engine + layout
store/
  useGameStore.js    — Zustand: logica di gioco, IA ladro, meccaniche
```

---

## Cosa è cambiato rispetto all'originale

### Graph.js (nuovo)
- Ogni arco è un oggetto `Edge` con `type`, `uses`, `directed`
- `canTraverse()` e `consume()` centralizzano la logica di consumo
- `clone()` per generazione sicura senza mutare lo stato originale
- `isConnected()` per scartare grafi sconnessi in generazione

### DifficultyScaler.js
- 5 biomi con range di livello, colori, nome narrativo
- Ogni bioma sblocca meccaniche progressivamente
- Scaling di guardie, ladri, nodi, soglie di distanza

### PatternLibrary.js
- 15 livelli manuali completamente ridisegnati (tranne LV1)
- Ogni livello insegna UNA meccanica o strategia specifica
- LV 11-15 introducono bridge, chiavi, porte
- Generazione procedurale con mutazioni tipizzate per bioma

### LevelFactory.js
- `getDistances()` e `getPath()` come funzioni esportabili (usabili anche dall'UI)
- `selectExit()` basato su centralità periferica, non solo grado minimo
- `findValidSpawns()` con logica multi-ladro distanziati tra loro
- Layout con metadati arco (`type`, `uses`, `directed`) per il renderer

### useGameStore.js
- BFS pre-calcolata per turno con cache (da O(N²) a O(N))
- Anti-loop su 3 turni di storia per ogni ladro
- Swap trap detection (incrocio di posizioni)
- Meccanica chiavi: raccolta automatica + sblocco porte
- Consumo bridge anche per le guardie
- Sistema stelle (1-3) basato sul numero di turni
- `getNeighbors()` e `getGuardReachable()` per highlight UI

---

## Lore dei biomi

| Bioma  | Livelli | Ambientazione | Guardia | Ladro |
|--------|---------|---------------|---------|-------|
| OCEAN  | 1-15    | Isole Pacifico | Ranger costiero | Contrabbandiere |
| DESERT | 16-30   | Rovine Sahara | Archeologo armato | Tombarolo |
| CITY   | 31-50   | Metropoli notturna | Drone di sicurezza | Hacker parkourista |
| SPACE  | 51-70   | Stazione orbitale | Androide da combattimento | Fuggiasco galattico |
| ALIEN  | 71+     | Pianeta X | Entità aliena | Ultimo umano libero |

---

## Meccaniche per bioma

| Meccanica | OCEAN | DESERT | CITY | SPACE | ALIEN |
|-----------|-------|--------|------|-------|-------|
| Ponti normali | ✓ | ✓ | ✓ | ✓ | ✓ |
| Bridge fragili | — | ✓ | ✓ | ✓ | ✓ |
| Chiavi + Porte | — | ✓ | ✓ | ✓ | ✓ |
| Portali | — | — | ✓ | ✓ | ✓ |
| Senso unico | — | — | ✓ | ✓ | ✓ |
| Multi-ladro | — | — | — | ✓ | ✓ |

---

## Prossimi step suggeriti

### Meccaniche immediate
- **Trappole** (`trap`): il ladro che ci passa salta un turno
- **Visibilità limitata** (fog of war): la guardia non vede i nodi oltre distanza 2
- **Turbo** (power-up): una guardia può muoversi 2 nodi in un turno (una volta per livello)
- **Teletrasporto bidirezionale**: coppia di portali `A↔B` invece che solo `A→B`

### Monetizzazione casual
- Skin guardia/ladro per bioma (sbloccabili con monete)
- "Suggerimento" a pagamento (mostra il percorso ottimale del ladro)
- Level pack aggiuntivi per bioma ALIEN

### Ottimizzazioni renderer
- Usa `type` e `uses` dagli archi nelle connections per:
  - Bridge fragili: colore degradante (verde → giallo → rosso in base agli usi rimasti)
  - Portali: animazione particellare
  - Senso unico: freccia direzionale sull'arco
  - Nodi chiave: icona lucchetto/chiave

### Testing consigliato
- Stress test generazione: `for (let i = 1; i <= 100; i++) generateLevel(i)`
  verifica che nessun livello superi i 300 tentativi o usi il fallback
- Playtesting manuale livelli 11-15 (meccaniche nuove)
- Verifica che `graph.isConnected()` scartino abbastanza grafi (dovrebbe essere <10% sui biomi alti)
