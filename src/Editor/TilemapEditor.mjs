import Tilemap from "/src/Common/Tilemaps/Tilemap.mjs";
import Size from "/src/Common/Maths/Size.mjs";
import Vector2 from "/src/Common/Maths/Vector2.mjs";
import Canvas from "/src/Common/Canvas.mjs";
import Camera from "/src/Common/Camera.mjs";
import Input from "/src/Common/Input.mjs";
import { TILE_SIZE } from "/src/Common/Tilemaps/Tile.mjs";
import SpriteBatch from "/src/Common/SpriteBatch.mjs";

import Editor from "./Editor.mjs";
import { tileCoords } from "./Editor.mjs";
import { editorState } from "./Editor.mjs";


export default class TilemapEditor {
    zoomButtons = new Map();
    div = document.getElementById(`map_container`);
    tilemap = new Tilemap(60, 40, 3);
    tilePaintStart = new Vector2(0, 0);
    canvas;
    camera;
    mapSizeUiElements = new Map();

    constructor() {
        this.zoomButtons.set(`-`, document.getElementById(`map_zoom_-`));
        this.zoomButtons.set(`o`, document.getElementById(`map_zoom_o`));
        this.zoomButtons.set(`+`, document.getElementById(`map_zoom_+`));
        this.zoomButtons.set(`text`, document.getElementById(`map_zoom_text`));

        this.zoomButtons.get(`-`).addEventListener(`click`, () => { Editor.instance.setZoom(this.canvas, this.camera, this.camera.zoom - 1); });
        this.zoomButtons.get(`o`).addEventListener(`click`, () => { Editor.instance.setZoom(this.canvas, this.camera, 1); });
        this.zoomButtons.get(`+`).addEventListener(`click`, () => { Editor.instance.setZoom(this.canvas, this.camera, this.camera.zoom + 1); });

        this.mapSizeUiElements.set(`apply`, document.getElementById(`map_size_apply`));
        this.mapSizeUiElements.set(`width`, document.getElementById(`map_input_width`));
        this.mapSizeUiElements.set(`height`, document.getElementById(`map_input_height`));

        this.mapSizeUiElements.get(`width`).value = this.tilemap.width;
        this.mapSizeUiElements.get(`height`).value = this.tilemap.height;
        this.mapSizeUiElements.get(`apply`).addEventListener(`click`, () => {
            const min = 1;
            const max = 500;
            const width = this.mapSizeUiElements.get(`width`);
            const height = this.mapSizeUiElements.get(`height`);

            if (width.valueAsNumber >= min && width.valueAsNumber <= max && 
                height.valueAsNumber >= min && height.valueAsNumber <= max) {
                this.tilemap.resize(width.valueAsNumber, height.valueAsNumber);
            } else {
                width.value = previousWidth;
                height.value = previousHeight;
            }
        })

        this.canvas = new Canvas(`map_canvas`);
        this.camera = new Camera(this.canvas);
        this.canvas.setScale(1);
    }

    paintTiles(tilemap, selectedTiles, selectedLayerId) {
        if (Input.isKeyHeld(`lmb`)) {
            let xBudget = Math.abs(Editor.instance.mousePosDelta.x);
            let yBudget = Math.abs(Editor.instance.mousePosDelta.y);
            const xDir = Math.sign(Editor.instance.mousePosDelta.x);
            const yDir = Math.sign(Editor.instance.mousePosDelta.y);
            const previousMousePos = new Vector2(Editor.instance.mousePos.x - xBudget * xDir, Editor.instance.mousePos.y - yBudget * yDir);

            // TODO: make this tile based instead of pixel based
            do {
                let hoveredTile = Editor.instance.getTileAtPosition(
                    this.canvas,
                    this.camera,
                    new Vector2(previousMousePos.x + xBudget * xDir, previousMousePos.y + yBudget * yDir),
                    tileCoords.grid);

                let tilesUnion = Editor.instance.getSelectedTilesUnion();
                let tilesAmount = new Vector2(tilesUnion.width / TILE_SIZE, tilesUnion.height / TILE_SIZE);

                let offset = new Vector2(
                    (hoveredTile.x - this.tilePaintStart.x) % tilesAmount.x,
                    (hoveredTile.y - this.tilePaintStart.y) % tilesAmount.y
                );

                // required for the stamps to work properly when moving west or north of origin
                if (offset.x < 0) {
                    offset.x += tilesAmount.x;
                }

                if (offset.y < 0) {
                    offset.y += tilesAmount.y;
                }

                for (let _y = 0; _y < tilesAmount.y; _y++) {
                    for (let _x = 0; _x < tilesAmount.x; _x++) {
                        let src = selectedTiles[Editor.instance.selectedTilesMax * ((_y + offset.y) % tilesAmount.y) + (_x + offset.x) % tilesAmount.x];
                        tilemap.setTile(selectedLayerId, hoveredTile.x + _x, hoveredTile.y + _y, src);
                    }
                }

                xBudget = Math.max(xBudget - 1, 0);
                yBudget = Math.max(yBudget - 1, 0);
            } while (xBudget > 0 || yBudget > 0);
        }
    }

    update(dt, state) {
        let mousePosMap = this.camera.toWorld(Editor.instance.mousePos);

        switch (state) {
            case editorState.hoveringMapCanvas:
                if (Editor.instance.scrollCamera(this.canvas, this.camera)) {
                    Editor.instance.clampCamera(this.canvas, this.camera, this.tilemap.bounds);
                }

                if ((Input.isKeyHeld(`space`) && Input.isNewKeyPress(`lmb`)) || Input.isNewKeyPress(`mmb`)) {
                    state = editorState.movingMap;
                } else if (Input.isNewKeyPress(`lmb`)) {
                    let start = Editor.instance.getTileAtPosition(this.canvas, this.camera, Editor.instance.mousePos, tileCoords.grid);
                    this.tilePaintStart.set(start.x, start.y);
                    state = editorState.paintingTiles;
                }

                if (Editor.instance.doZoom(this.canvas, this.camera)) {
                    Editor.instance.clampCamera(this.canvas, this.camera, this.tilemap.bounds);
                }

                if (this.tilemap.bounds.contains(mousePosMap)) {
                    state = editorState.hoveringMap;
                }

                break;

            case editorState.hoveringMap:
                if (Editor.instance.scrollCamera(this.canvas, this.camera)) {
                    Editor.instance.clampCamera(this.canvas, this.camera, this.tilemap.bounds);
                }

                if ((Input.isKeyHeld(`space`) && Input.isNewKeyPress(`lmb`)) || Input.isNewKeyPress(`mmb`)) {
                    state = editorState.movingMap;
                } else if (Input.isNewKeyPress(`lmb`)) {
                    let start = Editor.instance.getTileAtPosition(this.canvas, this.camera, Editor.instance.mousePos, tileCoords.grid);
                    this.tilePaintStart.set(start.x, start.y);
                    state = editorState.paintingTiles;
                }

                if (Editor.instance.doZoom(this.canvas, this.camera)) {
                    Editor.instance.clampCamera(this.canvas, this.camera, this.tilemap.bounds);
                }

                if (!this.tilemap.bounds.contains(mousePosMap)) {
                    state = editorState.hoveringMapCanvas;
                }

                break;

            case editorState.paintingTiles:
                this.paintTiles(this.tilemap, Editor.instance.selectedTiles, Editor.selectedLayerId);
                if (Input.isNewKeyRelease(`lmb`)) {
                    state = editorState.indeterminate;
                }

                break;

            case editorState.movingMap:
                Editor.instance.moveCamera(this.canvas, this.camera);
                Editor.instance.clampCamera(this.canvas, this.camera, this.tilemap.bounds);

                if (Input.isNewKeyRelease(`space`) || Input.isNewKeyRelease(`mmb`)) {
                    state = editorState.indeterminate;
                }

                break;
        }

        this.tilemap.update(dt);
        this.zoomButtons.get(`text`).innerText = `Zoom: ${this.camera.zoom}`;

        return state;
    }

    fixedUpdate(fixedDt) {

    }

    draw(dt) {
        this.canvas.ctx.clearRect(0, 0, this.canvas.element.width, this.canvas.element.height);

        let hoveredTileRect = Editor.instance.getTileAtPosition(this.canvas, this.camera, Editor.instance.mousePos);
        hoveredTileRect.setSize(0, 0);

        for (let x = 0; x < Editor.instance.selectedTilesMax; x++) {
            hoveredTileRect.width += Editor.instance.selectedTiles[x].width;
        }

        for (let y = 0; y < Editor.instance.selectedTilesMax; y++) {
            hoveredTileRect.height += Editor.instance.selectedTiles[y * Editor.instance.selectedTilesMax].height;
        }

        let inflatedBounds = this.tilemap.bounds;
        inflatedBounds.inflate(1, 1);

        this.tilemap.draw(this.canvas, this.camera);
        inflatedBounds.draw(this.canvas, null, `#777`, this.camera, 1, 1);

        // TODO: Hack; implement properly. This does not belong into draw()
        let statsText = `-, -`;

        if (hoveredTileRect.intersects(this.tilemap.bounds)) {
            statsText = `${hoveredTileRect.x / TILE_SIZE}, ${hoveredTileRect.y / TILE_SIZE}`;
            if (hoveredTileRect.width > 16 || hoveredTileRect.height > 16) {
                statsText += ` | 
                    ${(hoveredTileRect.x + hoveredTileRect.width) / TILE_SIZE - 1}, 
                    ${(hoveredTileRect.y + hoveredTileRect.height) / TILE_SIZE - 1}`;
            }
        }

        // Draw the current tile selection as a transparent overlay at cursor position
        if (hoveredTileRect.intersects(this.tilemap.bounds) &&
            (Editor.instance.state === editorState.hoveringMap || Editor.instance.state === editorState.hoveringMapCanvas)) {
            let pos = new Vector2(0, 0);

            for (let y = 0; y < Editor.instance.selectedTilesMax; y++) {
                for (let x = 0; x < Editor.instance.selectedTilesMax; x++) {
                    pos.set(hoveredTileRect.x + x * TILE_SIZE, hoveredTileRect.y + y * TILE_SIZE);
                    if (pos.x < 0 || pos.x >= this.tilemap.bounds.width || pos.y < 0 || pos.y >= this.tilemap.bounds.height) {
                        continue;
                    }

                    SpriteBatch.draw(
                        this.canvas, this.tilemap.texture, pos, Editor.instance.selectedTiles[Editor.instance.selectedTilesMax * y + x],
                        null, 1, false, false, this.camera, 0.5);
                }
            }

            hoveredTileRect.draw(this.canvas, null, Editor.instance.tileHoverColor, this.camera, 1, 1);
        }

        Editor.instance.stats.get(`cursorPos`).innerHTML = statsText;
    }

    onResize(width, height) {
        this.canvas.resize(width, height);
    }
}