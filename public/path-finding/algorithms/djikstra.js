import { PriorityQueue } from './priority-queue.js';

export default async function* djikstra() {
    yield 'Building neighbor graph...';
    const neighbourGraph = buildNeighbourGraph();
    const priorityQueue = new PriorityQueue();

    yield 'Searching...';

    const frontier = ['0,0'];
    const cameFrom = new Map(Object.entries({'0,0': null}));

    while (frontier.length) {
        if (earlyStop) return 'Aborted by user';
        let currentPosStr = frontier.shift();
        const [currentX, currentY] = currentPosStr.split(',').map(s => parseInt(s, 10));

        // Check goal condition
        if (currentPosStr === `${x-1},${y-1}`) {
            yield 'Goal found';
            // Trace path from breadcrumbs
            while(currentPosStr !== '0,0') {
                const [currentX, currentY] = currentPosStr.split(',').map(s => parseInt(s, 10));
                document.getElementById(`tile-x${currentX}-y${currentY}`).classList.add('path');
                currentPosStr = cameFrom.get(currentPosStr);
            }
            return 'Path found';
        }

        document.getElementById(`tile-x${currentX}-y${currentY}`).classList.add('searched');
        for (const nextPosStr of neighbourGraph[currentX][currentY]) {
            if (!cameFrom.has(nextPosStr)) {
                frontier.push(nextPosStr);
                cameFrom.set(nextPosStr, currentPosStr)
            }
        }
        yield 'Searching...';
    }
    return 'No path found';
}