const tileTypeListRoot = document.getElementById('tiletype-list-root')
const tilemapRoot = document.getElementById('tilemap-root');
const tilemapXInput = document.getElementById('tilemap-x-input');
const tilemapYInput = document.getElementById('tilemap-y-input');
const resetTilesButton = document.getElementById('reset-tiles-button');
const invertAllTilesButton = document.getElementById('invert-all-tiles-button');
const runPathfinderButton = document.getElementById('run-pathfinder-button');
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
handleTileMouseDown = (tile) => {
    isMouseDown = true;
    if (tileDragMode === null)  {
        tileDragMode = Math.abs(tileMapState[tile['data-x']][tile['data-y']] - 1);
        setPassabilityFromTile(tile, tileDragMode);
    }
    return true;
};
handleTileMouseEnter = (tile) => {
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
// Disable drag and drop of tile elements
templateTileNode.ondragstart = () => false;
templateTileNode.ondrop = () => false;

const resetDOMTiles = async () => {
    resetTilesButton.disabled = true;
    earlyStop = true;
    // Clear the existing grid
    tilemapRoot.innerHTML = '';

    // Create all of the tile elements and attach to the DOM
    const [x, y] = [tilemapXInput.value, tilemapYInput.value]
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
    resetTilesButton.disabled = false;
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

resetTilesButton.onclick = () => {
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

runPathfinderButton.onclick = async () => 
{
    earlyStop = false;
    invertAllTilesButton.disabled = true;
    runPathfinderButton.disabled = true;

    // Get a generator function for the algorithm
    const algorithm = {
        'breadth-first': breadthFirstSearch,
        'dijkstra': notImplemented,
        'a-star': notImplemented,
        notImplemented,
    }[document.querySelector('input[name="algorithm"]:checked').value || notImplemented]();

    // Step through the algorithm without blocking the event loop
    let status;
    do {
        status = await algorithm.next();
        console.log(status)
        algorithmStatusP.innerHTML = `Status: ${status.value}`;
        if (showProgressChk.checked) await pause(0);
    } while (!status.done);
}

const buildNeighbourGraph = () => {
    neighbourGraph = new Array(x);
    for (let ix = 0; ix < x; ix++) {
        neighbourGraph[ix] = new Array(y);
        for (let iy = 0; iy < y; iy++) {
            neighbourGraph[ix][iy] = getNeighbours(ix, iy);
        }
    }
    return neighbourGraph;
}

// TODO: Account for diagonals needing pythagorian costs i.e.
const getNeighbours = (posx, posy) => {
    const neighbours = [];
    for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
            if ((posx + dx >= 0 && posx + dx < x) && (posy + dy >= 0 && posy + dy < y) && tileMapState[posx + dx][posy + dy] > 0) {
                // console.log({posx, posy, dx, dy, posxdx: posx + dx, posydy: posy + dy, tms: tileMapState[posx + dx][posy + dy]})
                neighbours.push(`${posx + dx},${posy + dy}`);
            }
        }
    }
    return neighbours;
}

async function* breadthFirstSearch() {
    yield 'Building neighbor graph...';
    const neighbourGraph = buildNeighbourGraph();

    yield 'Searching...';

    const frontier = ['0,0'];
    const cameFrom = new Map(Object.entries({'0,0': null}));

    while (frontier.length) {
        if (earlyStop) return 'Aborted by user';
        let currentPosStr = frontier.shift();
        const [currentX, currentY] = currentPosStr.split(',').map(s => parseInt(s, 10));
        document.getElementById(`tile-x${currentX}-y${currentY}`).classList.add('searched');
        for (const nextPosStr of neighbourGraph[currentX][currentY]) {
            if (!cameFrom.has(nextPosStr)) {
                frontier.push(nextPosStr);
                cameFrom.set(nextPosStr, currentPosStr)
            }
        }
        // Check goal condition
        if (currentPosStr === `${x-1},${y-1}`) {
            yield 'Goal found';
            
            while(currentPosStr !== '0,0') {
                const [currentX, currentY] = currentPosStr.split(',').map(s => parseInt(s, 10));
                document.getElementById(`tile-x${currentX}-y${currentY}`).classList.add('path');
                currentPosStr = cameFrom.get(currentPosStr);
            }
            return 'Path found';
        }
        yield 'Searching...';
    }
    return 'No path found';
}