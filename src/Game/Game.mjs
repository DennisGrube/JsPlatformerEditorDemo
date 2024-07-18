import Canvas from "/src/Common/Canvas.mjs";
import Texture from "/src/Common/Texture.mjs";
import SpriteBatch from "/src/Common/SpriteBatch.mjs";
import Vector2 from "/src/Common/Maths/Vector2.mjs";
import Camera from "/src/Common/Camera.mjs";
import Fox from "/src/Common/Entities/Fox.mjs";
import Input from "/src/Common/Input.mjs";
import MathHelper from "/src/Common/Maths/MathHelper.mjs";
import { designRes } from "/src/Common/Canvas.mjs";

import EntityInspector from "./EntityInspector.mjs";

// The rate at which the game will update. Frames will still be rendered
// according to the monitor's refresh rate and be interpolated between.
const updateRate = 60;

export default class Game {
    // This approach, instead of making all the classes' fields and methods static,
    // allows for easily creating a fresh instance if needed, e.g. for a total reset.
    static instance;
    canvas = new Canvas(`game_canvas`);

    autoScaleCheckbox = document.getElementById(`scale_auto`);
    scaleInputField = document.getElementById(`scale`);

    cursorBitmap = new Texture(`cursor.png`);
    cursorPosition = new Vector2(0, 0);

    startTime = 0;
    previousTime = 0;
    ticks = 0;
    fixedDt = (1000 / updateRate) / 1000; // fixed delta time, in seconds
    accumulatedDt = 0;
    hasLostFocus = false;
    exit = false;

    entities = [];
    camera;
    fox;

    constructor() {
        Game.instance = this;
        this.camera = new Camera(this.canvas);
        this.fox = new Fox(new Vector2(180, 120), this.camera)
        this.#initialize();
    }

    static start() {
        console.log(`Game started`);
        new Game();
    }


    // TODO: move to canvas
    changeScale() {
        if (!this.autoScaleCheckbox.checked) {
            let newScale = parseInt(this.scaleInputField.value);
            newScale = MathHelper.clamp(newScale, 1, 20);
            Game.instance.canvas.scale = newScale;
            Game.instance.canvas.element.width = designRes.width * newScale;
            Game.instance.canvas.element.height = designRes.height * newScale;

            // Needs to be set to `false` again for crisp pixels because resizing the canvas resets the value.
            Game.instance.canvas.ctx.imageSmoothingEnabled = false;
            EntityInspector.updateInspectorWidth();
        } else if (this.scaleInputField) {
            this.scaleInputField.value = Game.instance.canvas.scale;
        }
    }

    onResize() {
        if (this.autoScaleCheckbox.checked) {
            // The canvas should resize based on whether its bottom edge is visible or not,
            // so its displacement from the top of the browser window will have to be kept in mind.
            // TODO: Always keep Entity Inspector within view as well
            let canvasRect = Game.instance.canvas.element.getBoundingClientRect();
            let canvasScaleW = Math.max(1, parseInt(window.innerWidth / designRes.width));
            let canvasScaleH = Math.max(1, parseInt((window.innerHeight - canvasRect.y) / designRes.height));
            let scale = Math.min(canvasScaleW, canvasScaleH);
            Game.instance.canvas.setScale(scale);
            Game.instance.canvas.resize(designRes.width * scale, designRes.height * scale);

            this.scaleInputField.value = Game.instance.canvas.scale;

            // Setting this again is necessary because resizing the canvas seems to reset this value.
            Game.instance.canvas.ctx.imageSmoothingEnabled = false;
        } else {
            this.scaleInputField.value = Game.instance.canvas.scale;
            this.changeScale();
        }

        EntityInspector.updateInspectorWidth();
    }


    #initialize() {
        document.onmousemove = this.handleMouseMove.bind(this);
        this.autoScaleCheckbox.addEventListener(`click`, this.onResize.bind(this));
        this.scaleInputField.addEventListener(`change`, this.changeScale.bind(this));

        this.entities.push(this.fox);
        EntityInspector.initialize();
        EntityInspector.inspectEntity(this.fox);

        window.addEventListener(`resize`, this.onResize.bind(this));
        this.onResize();

        // Without binding `this` to this.tick, `this` refers to the caller and thus returns undefined.
        // The caller in this case is requestAnimationFrame and *not* Game. Game.instance could be used in tick(),
        // but this approach is nicer.
        requestAnimationFrame(this.#tick.bind(this));
    }

    #tick(timeStamp) {
        if (this.startTime === 0) {
            this.startTime = timeStamp;
        }

        const elapsed = timeStamp - this.previousTime;
        let dt = elapsed / 1000;
        this.accumulatedDt += dt;

        this.#update(dt);

        // This gets called ${updateRate} times per second.
        // The update rate is fixed to allow for consistent physics.
        // Any potential jitter due to this not updating *exactly* every 16.667 milliseconds
        // is being smoothed out by the render loop lerping between frames.
        // TODO: escape potential spiral of death
        while (this.accumulatedDt >= this.fixedDt) {
            this.#fixedUpdate(this.fixedDt);
            this.accumulatedDt -= this.fixedDt;
        }

        // The amount of lerp between the last and the current frame.
        const alpha = this.accumulatedDt / this.fixedDt;
        this.#draw(dt, alpha);
        this.previousTime = timeStamp;
        this.ticks++;

        if (!this.exit) {
            requestAnimationFrame(this.#tick.bind(this));
        }
    }

    #fixedUpdate(fixedDt) {
        if (!document.hasFocus()) {
            this.hasLostFocus = true;
            return;
        }

        Input.update();

        for (let i = this.entities.length - 1; i >= 0; i--) {
            this.entities[i].fixedUpdate(fixedDt);
        }

        for (let i = this.entities.length - 1; i >= this.entities.length / 2; i--) {
            for (let k = 0; k < this.entities.length / 2; k++) {
                if (i === k) {
                    continue;
                }

                if (this.entities[i].checkCollision(this.entities[k])) {
                    this.entities[i].onCollision(this.entities[k]);
                }
            }
        }

        for (let i = this.entities.length - 1; i >= 0; i--) {
            this.entities[i].afterUpdate(fixedDt);
        }

        if (this.hasLostFocus) {
            Input.afterFocusLoss();
            this.hasLostFocus = false;
        }
    }

    #update(dt) {
        EntityInspector.update();
        for (let i = this.entities.length - 1; i >= 0; i--) {
            this.entities[i].update(dt);
        }
    }

    #draw(dt, alpha) {
        Game.instance.canvas.ctx.clearRect(0, 0, Game.instance.canvas.element.width, Game.instance.canvas.element.height);
        for (let i = this.entities.length - 1; i >= 0; i--) {
            this.entities[i].draw(Game.instance.canvas, dt, alpha);
        }

        let pos = this.camera.toWorld(this.cursorPosition);
        SpriteBatch.draw(Game.instance.canvas, this.cursorBitmap, pos, null, null, 1, false, false, this.camera, 1);
    }

    handleMouseMove(event) {
        this.cursorPosition.set(event.pageX - window.scrollX, event.pageY - window.scrollY);
    }
}