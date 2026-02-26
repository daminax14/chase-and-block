import { Node } from './Node';
import { Level } from './Level';

export class LevelFactory {

  static create({ pattern = 'funnel', difficulty = 1, biome = 'default' }) {

    let level;

    switch (pattern) {
      case 'funnel':
        level = this.generateFunnel(difficulty);
        break;
      default:
        level = this.generateFunnel(difficulty);
    }

    level.config.biome = biome;

    return level;
  }

  static generateFunnel(difficulty = 1) {

    const width = 2 + difficulty;
    const depth = 3 + difficulty;

    const nodes = [];
    const connections = [];

    let idCounter = 0;

    for (let z = 0; z < depth; z++) {
      for (let x = -width; x <= width; x += 2) {

        const id = `N${idCounter++}`;
        const node = new Node(id, x, z * 3);

        nodes.push(node);

        if (z > 0) {
          const prevRow = nodes.filter(n => n.z === (z - 1) * 3);

          prevRow.forEach(prev => {
            if (Math.abs(prev.x - x) <= 2) {
              connections.push([prev.id, id]);
            }
          });
        }
      }
    }

    const lastZ = (depth - 1) * 3;

    nodes.forEach(n => {
      if (n.z === lastZ) {
        n.type = 'exit';
      }
    });

    return new Level(nodes, connections, { difficulty });
  }
}
