import breadthFirstSearch from './algorithms/breadth-first-search.js'
import dijkstra from './algorithms/djikstra.js'
import notImplemented from './algorithms/not-implemented.js'

const tilemapRoot = document.getElementById('tilemap-root');
const tilemapXInput = document.getElementById('tilemap-x-input');
const tilemapYInput = document.getElementById('tilemap-y-input');
const resetTilesButton = document.getElementById('reset-tiles-button');
const invertAllTilesButton = document.getElementById('invert-all-tiles-button');
const runPathfinderButton = document.getElementById('run-pathfinder-button');
const algorithmStatusP = document.getElementById('algorithm-status-p');
const showProgressChk = document.getElementById('show-progress-input');

let tileMapState, x, y, isMouseDown = false, tileDragMode = null, earlyStop = false;

const pause = async (ms) => new Promise(resolve => setTimeout(resolve, ms));

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

runPathfinderButton.onclick = async () => 
{
    earlyStop = false;
    invertAllTilesButton.disabled = true;
    runPathfinderButton.disabled = true;

    // Get a generator function for the algorithm
    const algorithm = {
        'breadth-first': breadthFirstSearch,
        'dijkstra': dijkstra,
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

resizeMap(30, 40);
