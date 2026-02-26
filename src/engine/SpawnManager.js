export function bfsDistances(graph, startId) {
  const visited = new Set()
  const queue = [{ id: startId, dist: 0 }]
  const distances = {}

  while (queue.length) {
    const { id, dist } = queue.shift()
    if (visited.has(id)) continue

    visited.add(id)
    distances[id] = dist

    graph.getNode(id).connections.forEach(c => {
      queue.push({ id: c.to, dist: dist + 1 })
    })
  }

  return distances
}

export function placeThief(graph, exitId, minDistance) {
  const distances = bfsDistances(graph, exitId)

  const candidates = Object.entries(distances)
    .filter(([id, dist]) => dist >= minDistance)
    .map(([id]) => parseInt(id))

  return candidates[Math.floor(Math.random() * candidates.length)]
}

export function randomNode(graph) {
  const ids = graph.getAllNodeIds()
  return ids[Math.floor(Math.random() * ids.length)]
}
