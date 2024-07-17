import ContentManager from "./ContentManager.mjs";
import Size from "./Maths/Size.mjs";
import { Rectangle } from "./Maths/Shapes.mjs";

export default class Texture {
    image;
    tag = ``;
    #width = 0;
    #height = 0;

    get width() {
        return this.#width;
    }

    get height() {
        return this.#height;
    }

    get bounds() {
        return new Rectangle(0, 0, this.#width, this.#height);
    }
    #fullyLoaded = false;

    constructor(path) {
        this.tag = path;
        this.image = ContentManager.loadImage(path);
    }

    isLoaded() {
        let loaded = ContentManager.isImageReady(this.tag);

        if (loaded && !this.#fullyLoaded) {
            if (this.image.width === 0) {
                return false;
            }
            this.#width = this.image.width;
            this.#height = this.image.height;
            console.log(`${this.tag} loaded (w: ${this.width} h: ${this.height})`)
            this.#fullyLoaded = true;
        }

        return this.#fullyLoaded;
    }
}