import { Rectangle } from "../Maths/Shapes.mjs";
import Size from "../Maths/Size.mjs";
import Frame from "./Frame.mjs";
import Vector2 from "../Maths/Vector2.mjs";

export default class Animation {
    /** @param { Frame } */
    #frames = [];
    #frameIndex = 0;
    #timer = 0;
    #firstFrame = 0;
    #hasFinished = false;
    #isLooped = true;

    setFirstFrame(index) {
        this.#firstFrame = index;
        this.#frameIndex = index;
    }

    constructor() {
    }

    reset() {
        this.#frameIndex = this.#firstFrame;
        this.#timer = 0;
        this.#hasFinished = false;
    }

    setLooping(looping) {
        this.#isLooped = looping;
    }

    hasFinished() {
        return this.#hasFinished;
    }

    fixedUpdate(fixedDt){
        if (this.#frames.length === 0 || this.#hasFinished) {
            return;
        }

        this.#timer += fixedDt;
        while (this.#timer >= this.#frames[this.#frameIndex].duration) {
            this.#timer -= this.#frames[this.#frameIndex].duration;
            this.#frameIndex++;

            if (this.#frameIndex >= this.#frames.length) {
                if (this.#isLooped) {
                    this.#frameIndex = 0;
                } else {
                    this.#frameIndex--;
                    this.#hasFinished = true;
                    break;
                }
            }
        }
    }

    update(dt) {
    }

    static generateFramesFromStrip(duration, xCellStart, yCellStart, cellWidth, cellHeight, totalCells) {
        let animation = new Animation();
        for (let i = 0; i < totalCells; i++) {
            let size = new Size(cellWidth, cellHeight);
            let pos = new Vector2(xCellStart * size.width + (size.width * i), yCellStart * size.height);
            let source = new Rectangle(pos.x, pos.y, size.width, size.height);
            animation.#frames.push(new Frame(duration, source));
        }

        return animation;
    }

    addFrame(frame) {
        this.#frames.push(frame);
    }

    getCurrentFrame() {
        return this.#frames[this.#frameIndex];
    }
}