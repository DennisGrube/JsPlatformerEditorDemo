import Canvas from "../Canvas.mjs";
import Camera from "../Camera.mjs";
import { Rectangle } from "../Maths/Shapes.mjs";
import SpriteBatch from "../SpriteBatch.mjs";
import { TILE_SIZE } from "./Tile.mjs";
import Vector2 from "../Maths/Vector2.mjs";

export default class TileLayer {
    #tiles;
    #width;
    #height;
    #canvas = new Canvas(`RenderTarget`, 256, 256);
    #shouldCanvasUpdate = false;
    #shouldTilesBeClipped = false;

    get width() { return this.#width; }
    get height() { return this.#height; }

    /**
     * 
     * @param {Number} w 
     * @param {Number} h 
     */
    constructor(w, h) {
        this.#width = w;
        this.#height = h;
        this.#tiles = new Array(w * h);
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.#width; x++) {
                this.#tiles[w * y + x] = new Rectangle(0, 0, 0, 0);
            }
        }

        this.#canvas.setScale(1);
        this.#canvas.resize(this.#width * TILE_SIZE, this.height * TILE_SIZE);
        this.#canvas.element.classList.add(`RenderTarget`);
    }

    /**
     * 
     * @param {Number} x 
     * @param {Number} y 
     * @param {Rectangle} src 
     */
    setTile(x, y, src) {
        this.#tiles[this.#width * y + x].set(src);
        this.#shouldCanvasUpdate = true;
    }

    clipInvalidTilesOnNextRepaint() {
        this.#shouldTilesBeClipped = true;
    }

    updateCanvasOnNextRepaint() {
        this.#shouldCanvasUpdate = true;
    }

    clipInvalidTiles() {

    }

    /**
     * Sets all tiles of this layer to the specified tile
     * @param {Rectangle} src 
     */
    clear(src) {
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.#width; x++) {
                this.#tiles[this.#width * y + x].set(src);
            }
        }
    }

    /**
     * @param {Canvas} canvas 
     * @param {Camera} cam 
     * @param {Vector2} start 
     * @param {Vector2} end 
     */
    draw(canvas, texture, cam, start, end, alpha, darkenAmount = 0) {
        if (this.#shouldTilesBeClipped && texture.isLoaded()) {
            for (let y = 0; y < this.height; y++) {
                for (let x = 0; x < this.#width; x++) {
                    if (this.#tiles[this.#width * y + x].x >= texture.width || this.#tiles[this.#width * y + x].y >= texture.height) {
                        this.#tiles[this.#width * y + x].set(0, 0, 0, 0);
                    }
                }
            }

            this.#shouldTilesBeClipped = false;
        }

        if (this.#shouldCanvasUpdate && texture.isLoaded()) {
            this.#canvas.ctx.clearRect(0, 0, this.#canvas.width, this.#canvas.height);
            let pos = new Vector2(0, 0);
            for (let y = start.y; y < end.y; y++) {
                for (let x = start.x; x < end.x; x++) {
                    pos.set(x * TILE_SIZE, y * TILE_SIZE);
                    SpriteBatch.draw(this.#canvas, texture, pos, this.#tiles[this.#width * y + x], null, 1, false, false, null, 1);
                }
            }

            this.#shouldCanvasUpdate = false;
        }

        SpriteBatch.draw(canvas, this.#canvas, new Vector2(0, 0), null, null, 1, false, false, cam, alpha, darkenAmount);
    }
}