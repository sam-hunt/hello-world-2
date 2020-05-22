import { PriorityQueue } from './priority-queue.js';

const tilemapRoot = document.getElementById('tilemap-root');
const tilemapXInput = document.getElementById('tilemap-x-input');
const tilemapYInput = document.getElementById('tilemap-y-input');
const resizeGridButton = document.getElementById('resize-grid-button');
const invertAllTilesButton = document.getElementById('invert-all-tiles-button');
const runPathfinderButton = document.getElementById('run-pathfinder-button');
const clearPathingButton = document.getElementById('clear-pathing-button');
const algorithmStatusP = document.getElementById('algorithm-status-p');
const showProgressChk = document.getElementById('show-progress-input');

let tileMapState, x, y, isMouseDown = false, tileDragMode = null, earlyStop = false;

const setPassabilityFromTile = (tile, passability) => {
    tileMapState[tile['data-x']][tile['data-y']] = passability;
    tile.classList.add(passability ? 'passable' : 'impassable');
    tile.classList.remove(!passability ? 'passable' : 'impassable');
}

document.body.onmousedown = () => {
    isMouseDown = true;
    return true;
};
document.body.onmouseup = () => {
    isMouseDown = false;
    tileDragMode = null;
    return true;
};
const handleTileMouseDown = (tile) => {
    isMouseDown = true;
    if (tileDragMode === null)  {
        tileDragMode = Math.abs(tileMapState[tile['data-x']][tile['data-y']] - 1);
        setPassabilityFromTile(tile, tileDragMode);
    }
    return true;
};
const handleTileMouseEnter = (tile) => {
    if (isMouseDown && tileDragMode !== null) {
        setPassabilityFromTile(tile, tileDragMode);
    }
    return true;
};

// Create a template tile node we can reuse
const templateTileNode = document.createElement('DIV');
templateTileNode.classList.add('tile');
templateTileNode.setAttribute('grid-area', '')
templateTileNode.classList.add('passable');
// Disable drag and drop of tile elements (does this even work?)
templateTileNode.ondragstart = () => false;
templateTileNode.ondrop = () => false;

const resetDOMTiles = async () => {
    resizeGridButton.disabled = true;
    earlyStop = true;
    // Clear the existing grid
    tilemapRoot.innerHTML = '';

    // Create all of the tile elements and attach to the DOM
    [x, y] = [tilemapXInput.value, tilemapYInput.value]
    tilemapRoot.style.gridTemplateColumns = x;
    tilemapRoot.style.gridTemplateRows = y;
    for (let ix = 0; ix < x; ix++) {
        for (let iy = 0; iy < y; iy++) {
            const newTile = templateTileNode.cloneNode(true);
            newTile.id = `tile-x${ix}-y${iy}`;
            newTile.style.gridArea = `${ix + 1} / ${iy + 1}`;
            [newTile['data-x'], newTile['data-y']] = [ix, iy];
            tilemapRoot.appendChild(newTile);
            newTile.addEventListener('mousedown', () => handleTileMouseDown(newTile), false);
            newTile.addEventListener('mouseenter', () => handleTileMouseEnter(newTile), false);
        }
    }
    resizeGridButton.disabled = false;
};

const resizeMap = (newX, newY) => {
    [x, y] = [newX, newY];
    tileMapState = new Array(x);
    for (let ix = 0; ix < x; ix++) {
        tileMapState[ix] = new Array(y);
        for (let iy = 0; iy < y; iy++) {
            tileMapState[ix][iy] = 1;
        }
    }
    resetDOMTiles();
}

resizeGridButton.onclick = () => {
    resizeMap(tilemapXInput.value, tilemapYInput.value);
    invertAllTilesButton.disabled = false;
    runPathfinderButton.disabled = false;
};

invertAllTilesButton.onclick = () => {
    tileDragMode = null;
    for (let ix = 0; ix < x; ix++) {
        for (let iy = 0; iy < y; iy++) {
            tileMapState[ix][iy] = Math.abs(tileMapState[ix][iy]-1);
            const tile = document.getElementById(`tile-x${ix}-y${iy}`);
            tile.classList.toggle('passable');
            tile.classList.toggle('impassable');
        }
    }
};

resizeMap(30, 40);


// Path finding functionality

const pause = async (ms) => new Promise(resolve => setTimeout(resolve, ms));
function* notImplemented() { return 'Algorithm Not Implemented'; };

runPathfinderButton.onclick = async () => {
    await clearPathing();
    earlyStop = false;
    invertAllTilesButton.disabled = true;
    // runPathfinderButton.disabled = true;

    // Get a generator function for the algorithm
    const algorithm = {
        'breadth-first': breadthFirstSearch,
        'dijkstra': dijkstra,
        'a-star': aStar,
        notImplemented,
    }[document.querySelector('input[name="algorithm"]:checked').value || notImplemented]();

    // Step through the algorithm without blocking the event loop
    let status;
    do {
        status = await algorithm.next();
        algorithmStatusP.innerHTML = `Status: ${status.value}`;
        if (showProgressChk.checked) await pause(0);
    } while (!status.done);
    runPathfinderButton.disabled = false;
};

const clearPathing = async () => {
    earlyStop = true;
    await pause(0);
    for (let ix = 0; ix < x; ix++) {
        for (let iy = 0; iy < y; iy++) {
            const tile = document.getElementById(`tile-x${ix}-y${iy}`);
            tile.classList.remove('path');
            tile.classList.remove('searched');
        }
    }
    runPathfinderButton.disabled = false;
}

clearPathingButton.onclick = clearPathing;

async function* breadthFirstSearch() {
    yield 'Building neighbor graph...';
    const neighbourGraph = new Array(x);
    for (let ix = 0; ix < x; ix++) {
        neighbourGraph[ix] = new Array(y);
        for (let iy = 0; iy < y; iy++) {
            const neighbours = [];
            for (let dx = -1; dx <= 1; dx++) {
                for (let dy = -1; dy <= 1; dy++) {
                    if ((ix + dx >= 0 && ix + dx < x) && (iy + dy >= 0 && iy + dy < y) && tileMapState[ix + dx][iy + dy] > 0) {
                        neighbours.push(`${ix + dx},${iy + dy}`);
                    }
                }
            }
            neighbourGraph[ix][iy] = neighbours;
        }
    }

    yield 'Searching...';
    const frontier = ['0,0'];
    const cameFrom = new Map(Object.entries({'0,0': null}));

    while (frontier.length) {
        if (earlyStop) return 'Aborted by user';
        let currentPos = frontier.shift();
        const [currentX, currentY] = currentPos.split(',').map(s => parseInt(s, 10));
        document.getElementById(`tile-x${currentX}-y${currentY}`).classList.add('searched');

        // Check goal condition
        if (currentPos === `${x - 1},${y - 1}`) {
            yield 'Goal found';

            while (currentPos !== '0,0') {
                const [currentX, currentY] = currentPos.split(',').map(s => parseInt(s, 10));
                document.getElementById(`tile-x${currentX}-y${currentY}`).classList.add('path');
                currentPos = cameFrom.get(currentPos);
            }
            return 'Path found';
        }

        // Expand neighboring nodes
        for (const nextPos of neighbourGraph[currentX][currentY]) {
            if (!cameFrom.has(nextPos)) {
                frontier.push(nextPos);
                cameFrom.set(nextPos, currentPos)
            }
        }
        yield 'Searching...';
    }
    return 'No path found';
}

/**
 * A heuristic for estimating the total traversal cost to reach the goal
 *
 * @param {number} cx X position of the current node
 * @param {number} cy Y position of the current node
 * @param {number} gy Y position of the goal node
 * @param {number} gy Y position of the goal node
 * @param {number} D Orthangonal traversal cost multiplier
 * @param {number} D2 Diagonal traversal cost multiplier
 *
 * @remarks
 *  Chebyshev distance: D = 1 and D2 = 1
 *  Octile distance: D = 1 and D2 = sqrt(2)
 */
const heuristic = (cx, cy, gx, gy, D, D2) => {
    const dx = Math.abs(cx - gx)
    const dy = Math.abs(cy - gy)
    return D * (dx + dy) + (D2 - 2 * D) * Math.min(dx, dy)
};

const SQUARE_ROOT_OF_TWO = 1.41421356237;

const ORTHAGONAL_MULTIPLIER = 1;
const DIAGONAL_MULTIPLIER = SQUARE_ROOT_OF_TWO;

async function* dijkstra() {
    // TODO: Pass the start and end nodes in once the UI supports configuring them
    const [goalX, goalY] = [x - 1, y - 1];

    yield 'Building neighbor graph...';
    // This version stores costs as well rather than just the names of neighboring nodes.
    // This allows the interface to stay the same when we add ui support for setting non - uniform cell - traversal costs
    // Also allows increasing the cost of travelling to diagonal nodes rather
    const neighbourGraph = new Array(x);
    for (let ix = 0; ix < x; ix++) {
        neighbourGraph[ix] = new Array(y);
        for (let iy = 0; iy < y; iy++) {
            const neighbours = [];
            for (let dx = -1; dx <= 1; dx++) {
                for (let dy = -1; dy <= 1; dy++) {
                    if (!dx && !dy) continue;
                    if ((ix + dx >= 0 && ix + dx < x) && (iy + dy >= 0 && iy + dy < y) && tileMapState[ix + dx][iy + dy] > 0) {
                        // x, y, cost
                        const directionMultiplier = (Math.abs(dx) + Math.abs(dy)) === 1 ? ORTHAGONAL_MULTIPLIER : DIAGONAL_MULTIPLIER;
                        neighbours.push([ix + dx, iy + dy, tileMapState[ix + dx][iy + dy] * directionMultiplier]);
                        // neighbours.push(`${ix + dx},${iy + dy},${tileMapState[ix + dx][iy + dy] * directionMultiplier}`);
                        neighbours.sort((a, b) => b[2] - a[2]);
                    }
                }
            }
            neighbourGraph[ix][iy] = neighbours;
        }
    }
    
    yield 'Searching...';
    const frontier = new PriorityQueue((a, b) => a[2] < b[2]);
    // TODO: Make this user-configurable
    const start = [0, 0, 0];
    const startXY = `0,0`;
    frontier.push(start);
    const cameFrom = new Map(Object.entries({ [startXY]: null }));
    const costSoFar = new Map(Object.entries({ [startXY]: 0 }));

    while (frontier.size()) {
        if (earlyStop) return 'Aborted by user';
        let [currentX, currentY, currentCost] = frontier.pop();
        let currentXY = `${currentX},${currentY}`;
        document.getElementById(`tile-x${currentX}-y${currentY}`).classList.add('searched');

        // Check goal condition
        // TODO: Make this user-configurable
        if (currentXY === `${goalX},${goalY}`) {
            yield 'Goal found';

            let totalCost = 0;
            while (currentXY !== '0,0') {
                document.getElementById(`tile-x${currentX}-y${currentY}`).classList.add('path');
                totalCost += currentCost;
                [currentX, currentY, currentCost] = cameFrom.get(currentXY);
                currentXY = `${currentX},${currentY}`;
            }
            return `Path found`;
        }

        // Expand neighboring nodes
        for (const [nextX, nextY, nextCost] of neighbourGraph[currentX][currentY]) {
            // Map keys can be objects but array keys wont return the same value so serialize to strings
            const nextXY = `${nextX},${nextY}`;
            const newCost = (costSoFar.get(currentXY) || 0) + nextCost;

            if (!costSoFar.has(nextXY) || newCost < costSoFar.get(nextXY)) {
                costSoFar.set(nextXY, newCost);
                frontier.push([nextX, nextY, newCost]);
                cameFrom.set(nextXY, [currentX, currentY, newCost])
            }
        }
        yield 'Searching...';
    }
    return 'No path found';
}

async function* aStar() {
    // TODO: Pass the start and end nodes in once the UI supports configuring them
    const [goalX, goalY] = [x - 1, y - 1];

    yield 'Building neighbor graph...';
    // This version stores costs as well rather than just the names of neighboring nodes.
    // This allows the interface to stay the same when we add ui support for setting non - uniform cell - traversal costs
    // Also allows increasing the cost of travelling to diagonal nodes rather
    const neighbourGraph = new Array(x);
    for (let ix = 0; ix < x; ix++) {
        neighbourGraph[ix] = new Array(y);
        for (let iy = 0; iy < y; iy++) {
            const neighbours = [];
            for (let dx = -1; dx <= 1; dx++) {
                for (let dy = -1; dy <= 1; dy++) {
                    if (!dx && !dy) continue;
                    if ((ix + dx >= 0 && ix + dx < x) && (iy + dy >= 0 && iy + dy < y) && tileMapState[ix + dx][iy + dy] > 0) {
                        // x, y, cost
                        const directionMultiplier = (Math.abs(dx) + Math.abs(dy)) === 1 ? ORTHAGONAL_MULTIPLIER : DIAGONAL_MULTIPLIER;
                        neighbours.push([ix + dx, iy + dy, tileMapState[ix + dx][iy + dy] * directionMultiplier]);
                        // neighbours.push(`${ix + dx},${iy + dy},${tileMapState[ix + dx][iy + dy] * directionMultiplier}`);
                        neighbours.sort((a, b) => a[2] - b[2]);
                    }
                }
            }
            neighbourGraph[ix][iy] = neighbours;
        }
    }

    yield 'Searching...';
    const frontier = new PriorityQueue((a, b) => a[2] < b[2]);
    // TODO: Make this user-configurable
    const start = [0, 0, 0];
    const startXY = `0,0`;
    frontier.push(start);
    const cameFrom = new Map(Object.entries({ [startXY]: null }));
    const costSoFar = new Map(Object.entries({ [startXY]: 0 }));

    while (frontier.size()) {
        if (earlyStop) return 'Aborted by user';
        let [currentX, currentY, currentCost] = frontier.pop();
        let currentXY = `${currentX},${currentY}`;
        document.getElementById(`tile-x${currentX}-y${currentY}`).classList.add('searched');

        // Check goal condition
        // TODO: Make this user-configurable
        if (currentXY === `${goalX},${goalY}`) {
            yield 'Goal found';

            let totalCost = 0;
            while (currentXY !== '0,0') {
                document.getElementById(`tile-x${currentX}-y${currentY}`).classList.add('path');
                totalCost += currentCost;
                [currentX, currentY, currentCost] = cameFrom.get(currentXY);
                currentXY = `${currentX},${currentY}`;
            }
            return `Path found`;
        }

        // Expand neighboring nodes
        for (const [nextX, nextY, nextCost] of neighbourGraph[currentX][currentY]) {
            // Map keys can be objects but array keys wont return the same value so serialize to strings
            const nextXY = `${nextX},${nextY}`;
            const newCost = (costSoFar.get(currentXY) || 0) + nextCost;

            if (!costSoFar.has(nextXY) || newCost < costSoFar.get(nextXY)) {
                costSoFar.set(nextXY, newCost);
                const priority = newCost + heuristic(nextX, nextY, goalX, goalY, 1, SQUARE_ROOT_OF_TWO);
                frontier.push([nextX, nextY, priority]);
                cameFrom.set(nextXY, [currentX, currentY, newCost])
            }
        }
        yield 'Searching...';
    }
    return 'No path found';
}