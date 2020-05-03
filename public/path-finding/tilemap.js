export default class TileMap {
    #x; get x() { return this.#x; }
    #y; get y() { return this.#y; }
    #tiles;

    constructor(x, y) {
        this.#x = x;
        this.#y = y;
        tiles = new Array(x);
        for (let ix = 0; ix < x; ix++) {
            tiles[ix] = new Array(y);
            for (let iy = 0; iy < y; iy++) {
                tiles[ix][iy] = 1;
            }
        }
    }

    getCost = (x, y) => {

    }

    buildNeighbourGraph = () => {
        const [x, y] = [tileMap.length, tileMap[0].length];
        const neighbourGraph = new Array(x);
        for (let ix = 0; ix < x; ix++) {
            neighbourGraph[ix] = new Array(y);
            for (let iy = 0; iy < y; iy++) {
                neighbourGraph[ix][iy] = this.#getNeighbours(ix, iy);
            }
        }
        return neighbourGraph;
    }
    
    // TODO: Account for diagonals needing pythagorian costs i.e.
    #getNeighbours = (tileMap, posx, posy) => {
        const neighbours = [];
        for (let dx = -1; dx <= 1; dx++) {
            for (let dy = -1; dy <= 1; dy++) {
                if ((posx + dx >= 0 && posx + dx < x) && (posy + dy >= 0 && posy + dy < y) && tileMapState[posx + dx][posy + dy] > 0) {
                    neighbours.push(`${posx + dx},${posy + dy}`);
                }
            }
        }
        return neighbours;
    }
};
