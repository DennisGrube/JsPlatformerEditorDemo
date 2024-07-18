import Canvas from "/src/Common/Canvas.mjs";
import Camera from "/src/Common/Camera.mjs";
import Input from "/src/Common/Input.mjs";
import Vector2 from "/src/Common/Maths/Vector2.mjs";
import SpriteBatch from "/src/Common/SpriteBatch.mjs";
import MathHelper from "/src/Common/Maths/MathHelper.mjs";
import { TILE_SIZE } from "/src/Common/Tilemaps/Tile.mjs";
import Size from "/src/Common/Maths/Size.mjs";

import Editor from "./Editor.mjs";
import { editorState } from "./Editor.mjs";

export default class TilesetPicker {
    canvas;
    camera;
    div = document.getElementById(`tileset_container`);
    zoomButtons = new Map();
    #paneWidth;
    paneWidthMax = 1536; // TODO: limit width to something based on window width
    paneWidthMin = 16;
    paneHeight = 0;
    get mousePos() { return this.camera.toWorld(Editor.instance.mousePos); }
    zoomText = document.getElementById(`tileset_zoom_text`);
    dropdown = document.getElementById(`tileset_picker`);

    get paneWidth() {
        return this.#paneWidth;
    }

    set paneWidth(value) {
        value = MathHelper.clamp(value, this.paneWidthMin, this.paneWidthMax);
        this.#paneWidth = value;
        this.dropdown.style.width = `${value}px`;
    }

    constructor() {
        this.paneWidth = 512;

        this.zoomButtons.set(`-`, document.getElementById(`tileset_zoom_-`));
        this.zoomButtons.set(`o`, document.getElementById(`tileset_zoom_o`));
        this.zoomButtons.set(`+`, document.getElementById(`tileset_zoom_+`));

        this.zoomButtons.get(`-`).addEventListener(`click`, () => { Editor.instance.setZoom(this.canvas, this.camera, this.camera.zoom - 1); });
        this.zoomButtons.get(`o`).addEventListener(`click`, () => { Editor.instance.setZoom(this.canvas, this.camera, 1); });
        this.zoomButtons.get(`+`).addEventListener(`click`, () => { Editor.instance.setZoom(this.canvas, this.camera, this.camera.zoom + 1); });

        this.canvas = new Canvas(`tileset_canvas`)
        this.camera = new Camera(this.canvas)
        this.canvas.setScale(1);

        for (let i = 0; i < Editor.instance.tilesets.length; i++) {
            let tileset = Editor.instance.tilesets[i];
            this.dropdown.add(new Option(tileset));
        }

        this.dropdown.addEventListener(`change`, () => {
            Editor.instance.setTileset(this.dropdown.selectedIndex);
            this.resetTileSelection();
        });
    }


    // TODO: move to TilemapEditor.mjs
    clearTileSelection() {
        for (let y = 0; y < Editor.instance.selectedTilesMax; y++) {
            for (let x = 0; x < Editor.instance.selectedTilesMax; x++) {
                Editor.instance.selectedTiles[Editor.instance.selectedTilesMax * y + x].set(0, 0, 0, 0);
            }
        }
    }

    resetTileSelection() {
        this.clearTileSelection();
        Editor.instance.selectedTilesStart.set(0, 0, TILE_SIZE, TILE_SIZE);
        Editor.instance.selectedTilesEnd.set(0, 0, TILE_SIZE, TILE_SIZE);
        Editor.instance.selectedTiles[0].set(0, 0, TILE_SIZE, TILE_SIZE);
    }

    update(dt, state) {
        switch (state) {
            case editorState.hoveringTilesetCanvas:
                if ((Input.isKeyHeld(`space`) && Input.isNewKeyPress(`lmb`)) || Input.isNewKeyPress(`mmb`)) {
                    state = editorState.movingTileset;
                }

                if (Editor.instance.scrollCamera(this.canvas, this.camera)) {
                    Editor.instance.clampCamera(this.canvas, this.camera, Editor.instance.tileset.bounds);
                }

                if (Editor.instance.doZoom(this.canvas, this.camera)) {
                    Editor.instance.clampCamera(this.canvas, this.camera, Editor.instance.tileset.bounds);
                }

                if (Editor.instance.tileset.bounds.contains(this.mousePos)) {
                    state = editorState.hoveringTileset;
                }
                break;

            case editorState.hoveringTileset:
                if ((Input.isKeyHeld(`space`) && Input.isNewKeyPress(`lmb`)) || Input.isNewKeyPress(`mmb`)) {
                    state = editorState.movingTileset;
                }

                if (Editor.instance.scrollCamera(this.canvas, this.camera)) {
                    Editor.instance.clampCamera(this.canvas, this.camera, Editor.instance.tileset.bounds);
                }

                if (Editor.instance.doZoom(this.canvas, this.camera)) {
                    Editor.instance.clampCamera(this.canvas, this.camera, Editor.instance.tileset.bounds);
                }

                if (!Editor.instance.tileset.bounds.contains(this.mousePos)) {
                    state = editorState.indeterminate;
                }

                if (!Input.isKeyHeld(`space`) && Input.isNewKeyPress(`lmb`)) {
                    Editor.instance.selectedTilesStart = Editor.instance.getTileAtPosition(this.canvas, this.camera, Editor.instance.mousePos);
                    Editor.instance.selectedTilesEnd = Editor.instance.selectedTilesStart.copy();
                    state = editorState.selectingTiles;
                }

                break;

            case editorState.movingTileset:
                Editor.instance.moveCamera(this.canvas, this.camera);
                Editor.instance.clampCamera(this.canvas, this.camera, Editor.instance.tileset.bounds);

                if (Input.isNewKeyRelease(`space`) || Input.isNewKeyRelease(`mmb`)) {
                    state = editorState.indeterminate;
                }

                break;

            case editorState.selectingTiles:
                Editor.instance.selectedTilesEnd = Editor.instance.getTileAtPosition(this.canvas, this.camera, Editor.instance.mousePos);

                // Clamping the selection to avoid the rect being able to travel northwest,
                Editor.instance.selectedTilesEnd.x = MathHelper.clamp(
                    Editor.instance.selectedTilesEnd.x,
                    Editor.instance.selectedTilesStart.x - (Editor.selectedTilesMax - 1) * TILE_SIZE,
                    Editor.instance.selectedTilesStart.x + Editor.selectedTilesMax * TILE_SIZE);

                Editor.instance.selectedTilesEnd.y = MathHelper.clamp(
                    Editor.instance.selectedTilesEnd.y,
                    Editor.instance.selectedTilesStart.y - (Editor.selectedTilesMax - 1) * TILE_SIZE,
                    Editor.instance.selectedTilesStart.y + Editor.selectedTilesMax * TILE_SIZE);

                // and also clamp it to the tileset's bounds
                Editor.instance.selectedTilesEnd.x = MathHelper.clamp(
                    Editor.instance.selectedTilesEnd.x,
                    0,
                    Editor.instance.tileset.width - TILE_SIZE
                )

                Editor.instance.selectedTilesEnd.y = MathHelper.clamp(
                    Editor.instance.selectedTilesEnd.y,
                    0,
                    Editor.instance.tileset.height - TILE_SIZE
                )

                if (Input.isNewKeyRelease(`lmb`)) {
                    state = editorState.indeterminate;
                    this.clearTileSelection();

                    let selectedTilesUnion = Editor.instance.getSelectedTilesUnion();
                    let selectedTilesAmount = new Size(selectedTilesUnion.width / TILE_SIZE, selectedTilesUnion.height / TILE_SIZE);

                    // And writing the new selection into it
                    for (let y = 0; y < selectedTilesAmount.height; y++) {
                        for (let x = 0; x < selectedTilesAmount.width; x++) {
                            Editor.instance.selectedTiles[Editor.instance.selectedTilesMax * y + x].set(selectedTilesUnion.x + x * TILE_SIZE, selectedTilesUnion.y + y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
                        }
                    }
                }
                break;
        }

        this.zoomText.innerHTML = this.camera.zoom;
        return state;
    }

    draw(dt) {
        let hoveredTileRect = Editor.instance.getTileAtPosition(this.canvas, this.camera, Editor.instance.mousePos);
        let tilesUnion = Editor.instance.getSelectedTilesUnion();
        let inflatedBounds = Editor.instance.tileset.bounds.copy();
        inflatedBounds.inflate(1, 1);

        this.canvas.ctx.clearRect(0, 0, this.canvas.element.width, this.canvas.element.height);

        SpriteBatch.draw(this.canvas, Editor.instance.tileset, new Vector2(0, 0), null, null, 1, false, false, this.camera);
        inflatedBounds.draw(this.canvas, null, `#777`, this.camera, 1, 1);
        tilesUnion.draw(this.canvas, null, Editor.instance.tileSelectionColor, this.camera, 1, 1);

        if (Editor.instance.state === editorState.hoveringTileset) {
            hoveredTileRect.draw(this.canvas, null, Editor.instance.tileHoverColor, this.camera, 1, 1);
        }
    }

    onResize(width, height) {
        this.canvas.resize(width, height);
    }

}