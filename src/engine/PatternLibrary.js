import { Graph } from './Graph';
import { getDifficultyConfig } from './DifficultyScaler';

const getFixedPattern = (level) => {
    const g = new Graph();
    
    if (level === 1) { // Tutorial: La "T"
        [0, 1, 2, 3].forEach(i => g.addNode(i));
        g.connect(0, 1); g.connect(1, 2); g.connect(1, 3);
        return { graph: g, guards: [0], thieves: [2], exit: 3 };
    }
    
    if (level === 2) { // Il Quadrato con Coda
        [0, 1, 2, 3, 4].forEach(i => g.addNode(i));
        g.connect(0, 1); g.connect(1, 2); g.connect(2, 3); g.connect(3, 0); g.connect(2, 4);
        return { graph: g, guards: [0], thieves: [1], exit: 4 };
    }
    
    if (level === 3) { // Doppio Triangolo (La Farfalla)
        [0, 1, 2, 3, 4, 5].forEach(i => g.addNode(i));
        g.connect(0, 1); g.connect(1, 2); g.connect(2, 0); // Primo triangolo
        g.connect(2, 3); // Ponte centrale
        g.connect(3, 4); g.connect(4, 5); g.connect(5, 3); // Secondo triangolo
        return { graph: g, guards: [0], thieves: [4], exit: 1 };
    }
    
    if (level === 4) { // La Casetta
        [0, 1, 2, 3, 4, 5].forEach(i => g.addNode(i));
        g.connect(0, 1); g.connect(1, 2); g.connect(2, 3); g.connect(3, 0); // Base
        g.connect(0, 4); g.connect(1, 4); // Tetto
        g.connect(2, 5); // Uscita
        return { graph: g, guards: [4], thieves: [0], exit: 5 };
    }

    if (level === 5) { // La "H" (Il Ponte Stretto)
        [0, 1, 2, 3, 4, 5].forEach(i => g.addNode(i));
        g.connect(0, 1); g.connect(1, 2); // Lato sinistro
        g.connect(3, 4); g.connect(4, 5); // Lato destro
        g.connect(1, 4); // Il ponte
        return { graph: g, guards: [0], thieves: [5], exit: 3 };
    }

    if (level === 6) { // Il Diamante Tagliato
        [0, 1, 2, 3, 4].forEach(i => g.addNode(i));
        g.connect(0, 1); g.connect(1, 2); g.connect(2, 3); g.connect(3, 0); // Perimetro
        g.connect(0, 2); // Taglio centrale
        g.connect(2, 4); // Uscita
        return { graph: g, guards: [1], thieves: [3], exit: 4 };
    }

    if (level === 7) { // La Scala
        [0, 1, 2, 3, 4, 5].forEach(i => g.addNode(i));
        g.connect(0, 1); g.connect(1, 2); // Binario A
        g.connect(3, 4); g.connect(4, 5); // Binario B
        g.connect(0, 3); g.connect(2, 5); // Pioli
        return { graph: g, guards: [0], thieves: [1], exit: 2 };
    }

    if (level === 8) { // La Stella (Collo di bottiglia centrale)
        [0, 1, 2, 3, 4, 5].forEach(i => g.addNode(i));
        g.connect(0, 1); g.connect(0, 2); g.connect(0, 3); g.connect(0, 4); // Centro a punte
        g.connect(4, 5); // Punta con uscita
        return { graph: g, guards: [1], thieves: [3], exit: 5 };
    }

    if (level === 9) { // La Clessidra
        [0, 1, 2, 3, 4, 5, 6].forEach(i => g.addNode(i));
        g.connect(0, 1); g.connect(1, 2); g.connect(2, 0); // Sopra
        g.connect(2, 3); // Nodo centrale
        g.connect(3, 4); g.connect(4, 5); g.connect(5, 3); // Sotto
        g.connect(5, 6); // Uscita
        return { graph: g, guards: [0], thieves: [4], exit: 0 };
    }

    if (level === 10) { // L'Esagono con Centro (La Ragnatela)
        [0, 1, 2, 3, 4, 5, 6, 7].forEach(i => g.addNode(i));
        g.connect(0, 1); g.connect(1, 2); g.connect(2, 3); g.connect(3, 4); g.connect(4, 5); g.connect(5, 0); // Cerchio
        g.connect(0, 6); g.connect(2, 6); g.connect(4, 6); // Raggi verso il centro
        g.connect(3, 7); // Uscita
        return { graph: g, guards: [0], thieves: [6], exit: 7 };
    }

    return null;
};

export function getPattern(levelNumber, config) {
    const fixed = getFixedPattern(levelNumber);
    if (fixed) return fixed;

    // PROCEDURALE PER LIVELLI > 10 (Griglia Labirintica Scalabile)
    const g = new Graph();
    const n = config.nodesCount || 10;
    for (let i = 0; i < n; i++) g.addNode(i);
    
    const side = Math.ceil(Math.sqrt(n));
    for (let i = 0; i < n; i++) {
        const row = Math.floor(i / side);
        const col = i % side;
        // Connessioni a griglia per mantenere ordine visivo
        if (col < side - 1 && i + 1 < n) g.connect(i, i + 1);
        if (row < side - 1 && i + side < n) g.connect(i, i + side);
    }
    return { graph: g };
}

export function mutateGraph(graph, levelNumber) {
    // Non mutiamo i primi 10 livelli per non rompere le forme geometriche
    if (levelNumber <= 10) return; 

    const config = getDifficultyConfig(levelNumber);
    if (Math.random() > config.mutateChance) return;

    const ids = graph.getAllNodeIds();
    const aId = ids[Math.floor(Math.random() * ids.length)];
    // Cerchiamo un bId "vicino" per evitare ponti che attraversano tutta la mappa
    const bId = ids[(ids.indexOf(aId) + 2) % ids.length]; 

    const nodeA = graph.getNode(aId);
    if (nodeA && !nodeA.connections.some(c => c.to === bId)) {
        graph.connect(aId, bId);
    }
}