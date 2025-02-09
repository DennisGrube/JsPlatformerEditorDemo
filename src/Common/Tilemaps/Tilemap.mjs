import Vector2 from "../Maths/Vector2.mjs";
import Editor from "../../Editor/Editor.mjs";
import { Rectangle } from "../Maths/Shapes.mjs";

import { TILE_SIZE } from "./Tile.mjs";
import TileLayer from "./TileLayer.mjs";

export default class Tilemap {
    texture;
    layers;
    width;
    height;
    #hasFinishedLoading = false;
    #hasFinishedLoadingThisFrame = false;
    layerButtons = new Map();

    get bounds() {
        return new Rectangle(0, 0, this.width * TILE_SIZE, this.height * TILE_SIZE);
    }

    constructor(w, h, initialLayersAmount) {
        this.width = w;
        this.height = h;
        this.layers = new Array(initialLayersAmount);
        let initialSource = new Rectangle(0, 0, TILE_SIZE, TILE_SIZE);
        for (let i = 0; i < initialLayersAmount; i++) {
            this.layers[i] = new TileLayer(w, h);
            this.layers[i].clear(initialSource);
        }

        this.layerButtons.set(`add`, document.getElementById(`add_layer`));
        this.layerButtons.set(`remove`, document.getElementById(`remove_layer`));
        this.layerButtons.set(`shiftUp`, document.getElementById(`shift_layer_up`));
        this.layerButtons.set(`shiftDown`, document.getElementById(`shift_layer_down`));

        this.layerButtons.get(`add`).addEventListener(`click`, () => {
            this.layers.splice(Editor.selectedLayerId + 1, 0, new TileLayer(this.width, this.height));
            Editor.instance.setLayerId(Editor.selectedLayerId + 1);
        });

        this.layerButtons.get(`remove`).addEventListener(`click`, () => {
            if (this.layers.length > 1) {
                this.layers.splice(Editor.selectedLayerId, 1);
                Editor.instance.setLayerId(Editor.selectedLayerId - 1);
            }
        });

        this.layerButtons.get(`shiftUp`).addEventListener(`click`, () => {
            let nextLayerId = Editor.selectedLayerId + 1 < this.layers.length ? Editor.selectedLayerId + 1 : 0;
            const layerTemp = this.layers.splice(Editor.selectedLayerId, 1)[0];

            this.layers.splice(nextLayerId, 0, layerTemp);
            Editor.instance.setLayerId(nextLayerId);
        })

        this.layerButtons.get(`shiftDown`).addEventListener(`click`, () => {
            let nextLayerId = Editor.selectedLayerId - 1 >= 0 ? Editor.selectedLayerId - 1 : this.layers.length - 1;
            const layerTemp = this.layers.splice(Editor.selectedLayerId, 1)[0];

            this.layers.splice(nextLayerId, 0, layerTemp);
            Editor.instance.setLayerId(nextLayerId);
        })
    }

    resize(width, height) {
        this.width = width;
        this.height = height;

        for (let layer of this.layers) {
            layer.setSize(this.width, this.height);
        }
    }

    /**
     * If src is null, clears with empty tile
     * @param {Rectangle|null} src 
     */
    clear(src) {
        if (src === null) {
            src = new Rectangle(0, 0, 0, 0);
        }

        for (let layer of this.layers) {
            layer.clear(src);
        }
    }

    clearLayer(layerId, src) {
        this.layers[layerId].clear(src);
    }

    pushLayer() {
        const layer = new TileLayer(this.width, this.height);
        this.layers.push(layer);
    }

    addLayer(index) {
        const layer = new TileLayer(this.width, this.height);
        let layers = [...this.layers.slice(0, index), layer, ...this.layers.slice(index)];
        this.layers = layers;
    }

    popLayer() {
        if (this.layers.length > 1) {
            this.layers.pop();
        } else {
            console.log(`Cannot delete last layer!`);
        }
    }

    removeLayer(index) {

    }

    /**
     * Use -1 to repaint all 
    */
    forceRepaint(layerId) {
        if (layerId === -1) {
            for (let i = 0; i < this.layers.length; i++) {
                this.layers[i].updateCanvasOnNextRepaint();
            }
        } else {
            this.layers[layerId].updateCanvasOnNextRepaint();
        }
    }

    clipTiles() {
        for (let i = 0; i < this.layers.length; i++) {
            this.layers[i].updateCanvasOnNextRepaint();
            this.layers[i].clipInvalidTilesOnNextRepaint();
        }
    }

    fixedUpdate(fixedDt) {

    }

    update(dt) {
        if (this.#hasFinishedLoadingThisFrame && !this.#hasFinishedLoading) {
            this.#hasFinishedLoading = true;
            this.#hasFinishedLoadingThisFrame = false;
        }

        if (!this.#hasFinishedLoading && this.texture.isLoaded()) {
            this.#hasFinishedLoadingThisFrame = true;
        }
    }

    hasFinishedLoadingThisFrame() {
        return this.#hasFinishedLoadingThisFrame;
    }

    setTile(layerId, x, y, src) {
        if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
            return;
        }

        this.layers[layerId].setTile(x, y, src);
    }

    setTexture(texture) {
        this.texture = texture;
    }

    draw(canvas, cam) {
        // TODO: base this on camera
        let start = new Vector2(0, 0);
        let end = new Vector2(this.width, this.height);

        for (let i = 0; i < this.layers.length; i++) {
            let layerAlpha = i <= Editor.selectedLayerId ? 1 : 0.33;
            let darkenAmount = i < Editor.selectedLayerId ? 0.5 : 0;
            this.layers[i].draw(canvas, this.texture, cam, start, end, layerAlpha, darkenAmount);
        }
    }
}