import Canvas from "../Common/Canvas.mjs";
import Texture from "../Common/Texture.mjs";
import SpriteBatch from "../Common/SpriteBatch.mjs";
import Vector2 from "../Common/Maths/Vector2.mjs";
import Camera from "../Common/Camera.mjs";
import Input from "../Common/Input.mjs";
import MathHelper from "../Common/Maths/MathHelper.mjs";
import { Rectangle } from "../Common/Maths/Shapes.mjs";
import Size from "../Common/Maths/Size.mjs";
import Tilemap from "../Common/Tilemaps/Tilemap.mjs";
import { TILE_SIZE } from "../Common/Tilemaps/Tile.mjs";
import TilesetPicker from "./TilesetPicker.mjs";

const updateRate = 60;

export const editorState = {
    indeterminate: `indeterminate`,
    hoveringTilesetCanvas: `hoveringTilesetCanvas`, // hovering the canvas is less specific than hovering the tileset, 
    hoveringTileset: `hoveringTileset`,             // and hovering the tileset implies hovering the canvas
    movingTileset: `movingTileset`,
    hoveringMapCanvas: `hoveringMapCanvas`,
    hoveringMap: `hoveringMap`,
    movingMap: `movingMap`,
    hoveringSeparator: `hoveringSeparator`,
    movingSeparator: `movingSeparator`,
    selectingTiles: `selectingTiles`,
    paintingTiles: `paintingTiles`,
    hoveringToolbar: `hoveringToolbar`,
}

export const tileCoords = {
    world: `worldCoords`,
    grid: `gridCoords`,
}

const cameraScrollStep = 64;

export default class Editor {
    static instance;
    static selectedLayerId = 0;
    mapCanvas;
    tileset = new Texture(`forest.png`);
    tilesets = [`forest.png`, `inner.png`, `cave.png`, `overworld.png`];
    tilesetsAmount = this.tilesets.length;
    currentTilesetId = 0;
    state = ``;
    stateIfIndeterminate = editorState.indeterminate;

    startTime = 0;
    accumulatedDt = 0;
    fixedDt = (1000 / updateRate) / 1000; // fixed delta time, in seconds
    previousTime = 0;
    ticks = 0;

    get zoomMin() { return 1; }
    get zoomMax() { return 8; }
    tileSelectionColor = `#2288FF`;
    tileHoverColor = `#DDDDDD`;

    selectedTilesMax = 16;

    selectedTiles = new Array(this.selectedTilesMax * this.selectedTilesMax);
    selectedTilesStart = new Rectangle(0, 0, TILE_SIZE, TILE_SIZE);
    selectedTilesEnd = new Rectangle(0, 0, TILE_SIZE, TILE_SIZE);

    mapDiv = document.getElementById(`map_container`);
    mapCamera;
    mapPaneWidth = 0;
    mapPaneHeight = 0;
    mapSize = new Size(40, 35);
    tilemap = new Tilemap(this.mapSize.width, this.mapSize.height, 3);
    tilePaintStart = new Vector2(0, 0);

    exit = false;
    navHeight = document.getElementById(`switch`).offsetHeight;
    canvasContainer = document.getElementById(`container`);
    stateLabel = document.getElementById(`d_state`);
    navWrapperDiv = document.getElementById(`nav_wrapper`);

    mousePos = new Vector2(0, 0);
    mousePosDelta = new Vector2(0, 0);
    oldMousePos = new Vector2(0, 0);

    separator = document.getElementById(`tileset_map_separator`);
    debugLayerLabel = document.getElementById(`d_selected_layer`);
    layerSelect = document.getElementById(`layer_select`);
    layersText = document.getElementById(`layers_amount`);
    stats = new Map();
    tilesetPicker;

    tilemapZoomButtons = new Map();

    canResize = true;
    isInitialized = false;

    constructor() {
        Editor.instance = this; // not quite a singleton, but close enough

        this.stats.set(`mapSize`, document.getElementById(`stats_map_size`));
        this.stats.set(`cursorPos`, document.getElementById(`stats_cursor_pos`));
        this.stats.get(`mapSize`).innerHTML = `Map Size: ${this.mapSize.width} x ${this.mapSize.height}`;

        this.tilemapZoomButtons.set(`-`, document.getElementById(`map_zoom_-`));
        this.tilemapZoomButtons.set(`o`, document.getElementById(`map_zoom_o`));
        this.tilemapZoomButtons.set(`+`, document.getElementById(`map_zoom_+`));
        this.tilemapZoomButtons.set(`text`, document.getElementById(`map_zoom_text`));

        this.tilemapZoomButtons.get(`-`).addEventListener(`click`, () => { Editor.instance.setZoom(this.mapCanvas, this.mapCamera, this.mapCamera.zoom - 1); });
        this.tilemapZoomButtons.get(`o`).addEventListener(`click`, () => { Editor.instance.setZoom(this.mapCanvas, this.mapCamera, 1); });
        this.tilemapZoomButtons.get(`+`).addEventListener(`click`, () => { Editor.instance.setZoom(this.mapCanvas, this.mapCamera, this.mapCamera.zoom + 1); });

        this.tilesetPicker = new TilesetPicker();
        this.mapCanvas = new Canvas(`map_canvas`);
        this.mapCamera = new Camera(Editor.instance.mapCanvas);
        this.mapCanvas.setScale(1);

        this.tilemap.setTexture(this.tileset);

        for (let y = 0; y < this.selectedTilesMax; y++) {
            for (let x = 0; x < this.selectedTilesMax; x++) {
                this.selectedTiles[this.selectedTilesMax * y + x] = new Rectangle(0, 0, 0, 0);
            }
        }

        this.selectedTiles[0].setSize(16, 16);

        this.onResize();

        document.onmousemove = this.handleMouseMove.bind(this);
        window.addEventListener(`resize`, this.onResize.bind(this));

        this.#initializeMouseoverAndOutEvents();

        // Layer select
        document.addEventListener(`keydown`, (id) => {
            let _id = 0;

            if (id instanceof KeyboardEvent) {
                let key = parseInt(id.key);
                if (key < 1 || key > this.tilemap.layers.length || isNaN(key)) {
                    return;
                }
                _id = key - 1; // When 1 is pressed, Layer[0] should be selected
            } else {
                _id = id;
            }

            Editor.selectedLayerId = _id;
            this.layerSelect.value = Editor.selectedLayerId + 1; // However, display should be adjusted to be 1-based
        });

        // Disable browser zoom via Ctrl+Mouse Wheel (can still zoom via Ctrl + + / Ctrl + -)
        document.addEventListener(
            'wheel',
            (event) => {
                if (event.ctrlKey == true) {
                    event.preventDefault();
                }
            },
            { passive: false }
        );

        // min and max values don't work properly when inputting numbers via keyboard, this is a workaround
        this.layerSelect.addEventListener(`blur`, () => {
            this.layerSelect.value = MathHelper.clamp(parseInt(this.layerSelect.value), parseInt(this.layerSelect.min), parseInt(this.layerSelect.max));
            if (this.layerSelect.value === ``) {
                this.layerSelect.value = this.layerSelect.previousValue;
            }
        })

        // in case the user inputs a non-numeric character
        this.layerSelect.addEventListener(`change`, () => {
            if (parseInt(this.layerSelect.value)) {
                this.layerSelect.previousValue = this.layerSelect.value;
            }
        })

        // to restore the previous value on erroneous input if needed
        this.layerSelect.addEventListener(`focus`, () => {
            this.layerSelect.previousValue = this.layerSelect.value;
        });

        // Disable context menu for specific states where RMB has other functions
        document.oncontextmenu = document.body.oncontextmenu = () => {
            return !(
                this.state === editorState.hoveringMapCanvas ||
                this.state === editorState.hoveringMap ||
                this.state === editorState.hoveringTilesetCanvas ||
                this.state === editorState.hoveringTileset);
        }

        let clearRect = new Rectangle(0, 0, 0, 0);
        this.tilemap.clear(clearRect);
        this.layerSelect.value = 1;

        requestAnimationFrame(this.#tick.bind(this));
    }

    static start() {
        new Editor();
    }

    #selectLayer() {
        if (Input.isKeyHeld(`shift`)) {
            if (Input.isNewKeyPress(`scrolldown`)) {
                Editor.selectedLayerId--;
                if (Editor.selectedLayerId < 0) {
                    Editor.selectedLayerId = this.tilemap.layers.length - 1;
                }

                this.layerSelect.value = Editor.selectedLayerId + 1;
            }

            if (Input.isNewKeyPress(`scrollup`)) {
                Editor.selectedLayerId++;
                if (Editor.selectedLayerId >= this.tilemap.layers.length) {
                    Editor.selectedLayerId = 0;
                }

                this.layerSelect.value = Editor.selectedLayerId + 1;
            }
        } else {
            Editor.selectedLayerId = parseInt(this.layerSelect.value) - 1;
        }

        this.layerSelect.max = this.tilemap.layers.length;
    }

    setTileset(id) {
        this.currentTilesetId = id;
        this.tileset = new Texture(this.tilesets[this.currentTilesetId]);
        this.tilemap.setTexture(this.tileset);
        this.tilemap.forceRepaint(-1);
        this.tilemap.clipTiles();
    }

    #initializeMouseoverAndOutEvents() {
        this.separator.onmouseover = () => {
            this.stateIfIndeterminate = editorState.hoveringSeparator;
            if (this.state !== editorState.selectingTiles &&
                this.state !== editorState.movingSeparator &&
                this.state !== editorState.selectingTiles &&
                this.state !== editorState.movingTileset &&
                this.state !== editorState.movingMap &&
                this.state !== editorState.paintingTiles) {
                this.state = editorState.hoveringSeparator;
            }
        }

        this.separator.onmouseout = () => {
            if (this.state !== editorState.movingSeparator &&
                this.state !== editorState.selectingTiles &&
                this.state !== editorState.movingTileset &&
                this.state !== editorState.movingMap &&
                this.state !== editorState.paintingTiles) {
                this.state = editorState.indeterminate;
            }
        }

        this.tilesetPicker.div.onmouseover = () => {
            this.stateIfIndeterminate = editorState.hoveringTilesetCanvas;
            if (this.state !== editorState.movingSeparator &&
                this.state !== editorState.selectingTiles &&
                this.state !== editorState.hoveringTileset &&
                this.state !== editorState.movingTileset &&
                this.state !== editorState.movingMap &&
                this.state !== editorState.paintingTiles) {
                this.state = editorState.hoveringTilesetCanvas;
            }
        }

        this.tilesetPicker.div.onmouseout = () => {
            if (this.state !== editorState.selectingTiles &&
                this.state !== editorState.movingTileset &&
                this.state !== editorState.movingSeparator &&
                this.state !== editorState.movingTileset &&
                this.state !== editorState.movingMap &&
                this.state !== editorState.paintingTiles) {
                this.state = editorState.indeterminate;
            }
        }

        this.mapDiv.onmouseover = () => {
            this.stateIfIndeterminate = editorState.hoveringMapCanvas;
            if (this.state !== editorState.movingSeparator &&
                this.state !== editorState.movingTileset &&
                this.state !== editorState.selectingTiles &&
                this.state !== editorState.movingMap &&
                this.state !== editorState.paintingTiles) {
                this.state = editorState.hoveringMapCanvas;
            }
        }

        this.navWrapperDiv.onmouseover = () => {
            this.stateIfIndeterminate = editorState.hoveringToolbar;
            if (this.state !== editorState.movingSeparator &&
                this.state !== editorState.movingTileset &&
                this.state !== editorState.selectingTiles &&
                this.state !== editorState.movingMap &&
                this.state !== editorState.paintingTiles) {
                this.state = editorState.hoveringToolbar;
            }
        }
    }

    #fixedUpdate(dt) {

    }

    scrollCamera(canvas, cam, wasdScrollSpeed = 0.05) {
        if (Input.isKeyHeld(`control`) || Input.isKeyHeld(`shift`)) {
            return false;
        }

        let resultKeys = false;
        if (Input.isKeyHeld(`a`)) {
            cam.position.x -= cameraScrollStep * wasdScrollSpeed;
            resultKeys = true;
        }

        if (Input.isKeyHeld(`d`)) {
            cam.position.x += cameraScrollStep * wasdScrollSpeed;
            resultKeys = true;
        }

        if (Input.isKeyHeld(`w`)) {
            cam.position.y -= cameraScrollStep * wasdScrollSpeed;
            resultKeys = true;
        }

        if (Input.isKeyHeld(`s`)) {
            cam.position.y += cameraScrollStep * wasdScrollSpeed;
            resultKeys = true;
        }

        if (resultKeys === true) {
            return resultKeys;
        }

        if (Input.isNewKeyPress(`scrolldown`)) {
            cam.position.y += cameraScrollStep / cam.zoom;
            return true;
        }

        if (Input.isNewKeyPress(`scrollup`)) {
            cam.position.y -= cameraScrollStep / cam.zoom;
            return true;
        }

        if (Input.isNewKeyPress(`scrollleft`)) {
            cam.position.x -= cameraScrollStep / cam.zoom;
            return true;
        }

        if (Input.isNewKeyPress(`scrollright`)) {
            cam.position.x += cameraScrollStep / cam.zoom;
            return true;
        }

        return false;
    }

    doZoom(canvas, cam) {
        if (Input.isKeyHeld(`shift`)) {
            return;
        }

        if (Input.isKeyHeld(`control`)) {
            if (Input.isNewKeyPress(`scrollup`)) {
                return this.setZoom(canvas, cam, cam.zoom + 1);
            }

            if (Input.isNewKeyPress(`scrolldown`)) {
                return this.setZoom(canvas, cam, cam.zoom - 1);
            }
        }

        return 0;
    }

    // TODO: do not focus on tile when zooming, but the actual pixel instead
    setZoom(canvas, cam, value) {
        value = MathHelper.clamp(value, Editor.instance.zoomMin, Editor.instance.zoomMax);
        if (value === cam.zoom || !value) {
            return cam.zoom;
        }

        let sign = value > cam.zoom ? 1 : value < cam.zoom ? -1 : 0;
        console.assert(sign, `Sign must not be 0`);

        while (cam.zoom !== value) {
            let currentCenterTile = this.getTileAtPosition(canvas, cam, cam.center, tileCoords.world);
            let nextPos = new Vector2(currentCenterTile.x, currentCenterTile.y);
            cam.zoom += sign;
            cam.position.set(nextPos.x - cam.boundsWorld.width / 2, nextPos.y - cam.boundsWorld.height / 2);
        }

        return cam.zoom;
    }

    clampCamera(canvas, cam, bounds) {
        cam.position.x = MathHelper.clamp(
            cam.position.x,
            - canvas.element.width / cam.zoom + TILE_SIZE,
            bounds.width - TILE_SIZE);

        cam.position.y = MathHelper.clamp(
            cam.position.y,
            -canvas.element.height / cam.zoom + TILE_SIZE,
            bounds.height - TILE_SIZE);
    }

    moveCamera(canvas, cam) {
        if (!Input.isKeyHeld(`lmb`) && !Input.isKeyHeld(`mmb`)) {
            canvas.element.style.cursor = `default`;
            this.state = editorState.indeterminate;
            return;
        }

        canvas.element.style.cursor = `all-scroll`;

        cam.position.x -= this.mousePosDelta.x / cam.zoom;
        cam.position.y -= this.mousePosDelta.y / cam.zoom;
    }

    // TODO: only redraw tileset/map upon detected changes
    // TODO: draw tile stamp tile by tile, to not skip any tiles when mouse movement is too fast
    // TODO: right click on map should absorb the tiles selected on the current layer (like left click on tilemap)
    // TODO: add state when leaving the tilemap/tileset area towards the top
    // FIXME: cursor does not reset to default if LMB is pressed during move release
    #update(dt) {
        this.mousePosDelta.set(this.mousePos.x - this.oldMousePos.x, this.mousePos.y - this.oldMousePos.y);
        this.oldMousePos.set(this.mousePos.x, this.mousePos.y);

        // Center the map on view upon load and shift the tileset a little so that the bounds are visible
        if (!this.isInitialized && this.tileset.isLoaded()) {
            this.mapCamera.position.x -= this.mapCanvas.width / 2 - this.tilemap.bounds.width / 2;
            this.mapCamera.position.y -= this.mapCanvas.height / 2 - this.tilemap.bounds.height / 2;
            this.tilesetPicker.camera.position.x -= 4;
            this.tilesetPicker.camera.position.y -= 4;
            this.isInitialized = true;
        }

        Input.update();

        this.#selectLayer();
        if (document.activeElement === this.layerSelect) {
            Input.clearAll();
        }

        let mousePosMap = this.mapCamera.toWorld(this.mousePos);

        let paintTiles = () => {
            if (Input.isKeyHeld(`lmb`)) {
                let xBudget = Math.abs(this.mousePosDelta.x);
                let yBudget = Math.abs(this.mousePosDelta.y);
                const xDir = Math.sign(this.mousePosDelta.x);
                const yDir = Math.sign(this.mousePosDelta.y);
                const previousMousePos = new Vector2(this.mousePos.x - xBudget * xDir, this.mousePos.y - yBudget * yDir);

                // TODO: make this tile based instead of pixel based
                do {
                    let hoveredTile = this.getTileAtPosition(
                        Editor.instance.mapCanvas,
                        this.mapCamera,
                        new Vector2(previousMousePos.x + xBudget * xDir, previousMousePos.y + yBudget * yDir),
                        tileCoords.grid);

                    let tilesUnion = this.getSelectedTilesUnion();
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
                            let src = this.selectedTiles[this.selectedTilesMax * ((_y + offset.y) % tilesAmount.y) + (_x + offset.x) % tilesAmount.x];
                            this.tilemap.setTile(Editor.selectedLayerId, hoveredTile.x + _x, hoveredTile.y + _y, src);
                        }
                    }

                    xBudget = Math.max(xBudget - 1, 0);
                    yBudget = Math.max(yBudget - 1, 0);
                } while (xBudget > 0 || yBudget > 0);
            }
        }

        if (this.state === editorState.indeterminate) {
            this.state = this.stateIfIndeterminate;
        }

        this.tilesetPicker.update(dt);
        switch (this.state) {
            // ----------------------
            //          MAP
            // ----------------------
            case editorState.hoveringMapCanvas:
                if (this.scrollCamera(this.mapCanvas, this.mapCamera)) {
                    this.clampCamera(this.mapCanvas, this.mapCamera, this.tilemap.bounds);
                }

                if ((Input.isKeyHeld(`space`) && Input.isNewKeyPress(`lmb`)) || Input.isNewKeyPress(`mmb`)) {
                    this.state = editorState.movingMap;
                } else if (Input.isNewKeyPress(`lmb`)) {
                    let start = this.getTileAtPosition(Editor.instance.mapCanvas, this.mapCamera, this.mousePos, tileCoords.grid);
                    this.tilePaintStart.set(start.x, start.y);
                    this.state = editorState.paintingTiles;
                }

                if (this.doZoom(Editor.instance.mapCanvas, this.mapCamera)) {
                    this.clampCamera(this.mapCanvas, this.mapCamera, this.tilemap.bounds);
                }

                if (this.tilemap.bounds.contains(mousePosMap)) {
                    this.state = editorState.hoveringMap;
                }

                break;

            case editorState.hoveringMap:
                if (this.scrollCamera(this.mapCanvas, this.mapCamera)) {
                    this.clampCamera(this.mapCanvas, this.mapCamera, this.tilemap.bounds);
                }

                if ((Input.isKeyHeld(`space`) && Input.isNewKeyPress(`lmb`)) || Input.isNewKeyPress(`mmb`)) {
                    this.state = editorState.movingMap;
                } else if (Input.isNewKeyPress(`lmb`)) {
                    let start = this.getTileAtPosition(Editor.instance.mapCanvas, this.mapCamera, this.mousePos, tileCoords.grid);
                    this.tilePaintStart.set(start.x, start.y);
                    this.state = editorState.paintingTiles;
                }

                if (this.doZoom(Editor.instance.mapCanvas, this.mapCamera)) {
                    this.clampCamera(this.mapCanvas, this.mapCamera, this.tilemap.bounds);
                }

                if (!this.tilemap.bounds.contains(mousePosMap)) {
                    this.state = editorState.hoveringMapCanvas;
                }

                break;

            case editorState.paintingTiles:
                paintTiles();
                if (Input.isNewKeyRelease(`lmb`)) {
                    this.state = editorState.indeterminate;
                }

                break;

            case editorState.movingMap:
                this.moveCamera(Editor.instance.mapCanvas, this.mapCamera);
                this.clampCamera(this.mapCanvas, this.mapCamera, this.tilemap.bounds);

                if (Input.isNewKeyRelease(`space`) || Input.isNewKeyRelease(`mmb`)) {
                    this.state = editorState.indeterminate;
                }

                break;

            // -----------------------
            //       SEPARATOR
            // -----------------------
            case editorState.hoveringSeparator:
                if (Input.isNewKeyPress(`lmb`)) {
                    this.state = editorState.movingSeparator;
                }

                break;

            case editorState.movingSeparator:
                if (this.mousePos.x >= this.tilesetPicker.paneWidthMin && this.mousePos.x <= this.tilesetPicker.paneWidthMax) {
                    this.tilesetPicker.paneWidth = MathHelper.clamp(
                        this.tilesetPicker.paneWidth + this.mousePosDelta.x, this.tilesetPicker.paneWidthMin, this.tilesetPicker.paneWidthMax);
                }

                this.onResize();
                document.body.style.cursor = `ew-resize`; // fixes cursor graphic changing when moving the mouse too fast
                if (Input.isNewKeyRelease(`lmb`)) {
                    document.body.style.cursor = `default`;
                    this.state = editorState.hoveringSeparator;
                }

                break;

            default:
                break;
        }


        this.tilemap.update(dt);
        this.stateLabel.innerText = `State: ${this.state}`;
        this.tilemapZoomButtons.get(`text`).innerText = `Zoom: ${this.mapCamera.zoom}`;

        if (Input.isNewKeyPress(`q`)) {
            for (let y = 0; y < this.mapSize.height; y++) {
                for (let x = 0; x < this.mapSize.width; x++) {
                    console.log(this.tilemap.layers[0].tiles[x][y]);
                }
            }
        }

        Input.afterUpdate();
    }

    getSelectedTilesUnion() {
        let selectedTilesUnion = Rectangle.union(this.selectedTilesStart, this.selectedTilesEnd);
        selectedTilesUnion.width = MathHelper.clamp(selectedTilesUnion.width, TILE_SIZE, this.selectedTilesMax * TILE_SIZE);
        selectedTilesUnion.height = MathHelper.clamp(selectedTilesUnion.height, TILE_SIZE, this.selectedTilesMax * TILE_SIZE);
        return selectedTilesUnion;
    }

    getTileAtPosition(canvas, cam, _pos, coordSystem = tileCoords.world) {
        let rect = new Rectangle(0, 0, 0, 0);
        let pos = cam.toWorld(_pos);
        let offset = new Vector2(pos.x < 0 ? 1 : 0, pos.y < 0 ? 1 : 0);
        rect.set(pos.x, pos.y, TILE_SIZE, TILE_SIZE);
        rect.setPosition(rect.x - rect.x % TILE_SIZE, rect.y - rect.y % TILE_SIZE);
        rect.x -= offset.x * TILE_SIZE;
        rect.y -= offset.y * TILE_SIZE;

        if (coordSystem === tileCoords.grid) {
            rect.x /= TILE_SIZE;
            rect.y /= TILE_SIZE;
        }

        return rect;
    }

    #draw(dt) {
        let drawMap = () => {
            let cam = this.mapCamera;

            let hoveredTileRect = this.getTileAtPosition(this.mapCanvas, this.mapCamera, this.mousePos);
            hoveredTileRect.setSize(0, 0);

            let inflatedBounds = this.tilemap.bounds;
            inflatedBounds.inflate(1, 1);

            for (let x = 0; x < this.selectedTilesMax; x++) {
                hoveredTileRect.width += this.selectedTiles[x].width;
            }

            for (let y = 0; y < this.selectedTilesMax; y++) {
                hoveredTileRect.height += this.selectedTiles[y * this.selectedTilesMax].height;
            }

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

            this.stats.get(`cursorPos`).innerHTML = statsText;

            this.mapCanvas.ctx.clearRect(0, 0, this.mapCanvas.element.width, this.mapCanvas.element.height);

            this.tilemap.draw(this.mapCanvas, cam);
            inflatedBounds.draw(this.mapCanvas, null, `#777`, cam, 1, 1);

            // Draw the current tile selection as a transparent overlay at cursor position
            if (hoveredTileRect.intersects(this.tilemap.bounds) &&
                (this.state === editorState.hoveringMap || this.state === editorState.hoveringMapCanvas)) {
                let pos = new Vector2(0, 0);

                for (let y = 0; y < this.selectedTilesMax; y++) {
                    for (let x = 0; x < this.selectedTilesMax; x++) {
                        pos.set(hoveredTileRect.x + x * TILE_SIZE, hoveredTileRect.y + y * TILE_SIZE);
                        if (pos.x < 0 || pos.x >= this.tilemap.bounds.width || pos.y < 0 || pos.y >= this.tilemap.bounds.height) {
                            continue;
                        }

                        SpriteBatch.draw(
                            this.mapCanvas, this.tilemap.texture, pos, this.selectedTiles[this.selectedTilesMax * y + x], 
                            null, 1, false, false, cam, 0.5);
                    }
                }

                hoveredTileRect.draw(this.mapCanvas, null, this.tileHoverColor, this.mapCamera, 1, 1);
            }
        }

        this.tilesetPicker.draw(dt);
        drawMap();
    }

    #tick(timeStamp) {
        if (this.startTime === 0) {
            this.startTime = timeStamp;
        }

        const elapsed = timeStamp - this.previousTime;
        let dt = elapsed / 1000;

        this.#update(dt);

        this.#draw(dt, 1);
        this.previousTime = timeStamp;
        this.ticks++;

        if (!this.exit) {
            requestAnimationFrame(this.#tick.bind(this));
        }
    }

    handleMouseMove(event) {
        // any necessary further adjustments happen via Camera.toWorld()
        this.mousePos.set(event.pageX - window.scrollX, event.pageY - window.scrollY);
    }

    onResize(event) {
        let tilesetCanvasStyle = getComputedStyle(document.getElementById(`tileset_canvas`));
        let tilesetMarginLeft = parseInt(tilesetCanvasStyle.marginLeft);
        let tilesetMarginRight = parseInt(tilesetCanvasStyle.marginRight);
        let tilesetMarginTop = parseInt(tilesetCanvasStyle.marginTop);
        let tilesetMarginBottom = parseInt(tilesetCanvasStyle.marginBottom);

        let separatorWidth = parseInt(this.separator.offsetWidth);

        let mapCanvasStyle = getComputedStyle(document.getElementById(`map_canvas`));
        let mapMarginLeft = parseInt(mapCanvasStyle.marginLeft);
        let mapMarginRight = parseInt(mapCanvasStyle.marginRight);
        let mapMarginTop = parseInt(mapCanvasStyle.marginTop);
        let mapMarginBottom = parseInt(mapCanvasStyle.marginBottom);

        // Outline width is uniform for canvases
        let outlineWidth = parseInt(mapCanvasStyle.outlineWidth);
        let infoRowHeight = parseInt(document.getElementById(`map_stats`).clientHeight)

        Editor.instance.mapCanvas.resize(
            window.innerWidth - this.tilesetPicker.paneWidth - mapMarginLeft - mapMarginRight - tilesetMarginLeft - tilesetMarginRight - separatorWidth - 2 * outlineWidth,
            window.innerHeight - this.navHeight - mapMarginTop - mapMarginBottom - outlineWidth - infoRowHeight);

        this.tilesetPicker.onResize(this.tilesetPicker.paneWidth,
            window.innerHeight - this.navHeight - tilesetMarginTop - tilesetMarginBottom - outlineWidth - infoRowHeight);

        this.tilesetPicker.paneHeight = this.tilesetPicker.canvas.element.height;
        this.mapPaneHeight = Editor.instance.mapCanvas.element.height;
        this.mapPaneWidth = Editor.instance.mapCanvas.element.width;
    }
}