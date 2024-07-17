import Size from "./Maths/Size.mjs";

export const designRes = new Size(360, 240);

export default class Canvas {
    #_id = ``;
    get id() {
        return this.#_id;
    }

    get width() {
        return parseInt(this.element.width);
    }

    get height() {
        return parseInt(this.element.height);
    }

    scale = 3;
    container;
    element;
    ctx;

    constructor(id, width, height) {
        // TODO: determine scale before creating the canvas
        this.container = this.#create(id, document.body, width, height);
        this.element = this.container.canvas;
        this.ctx = this.container.ctx;
        this.#_id = id;
    }

    /**
     * Creates a canvas. Most of this code is courtesy of Mozilla.
     * @param {String} id 
     * @param {HTMLElement} parent 
     * @param {Number} width 
     * @param {Number} height 
     * @returns 
     */
    #create(id, parent, width, height) {
        let canvasElement = document.getElementById(id);
        if(!canvasElement){
            canvasElement = document.createElement(`canvas`);
        }

        if (width) {
            canvasElement.width = width;
        }

        if (height) {
            canvasElement.height = height;
        }

        let ctx = canvasElement.getContext(`2d`);
        ctx.imageSmoothingEnabled = false;

        return {
            canvas: canvasElement,
            ctx: ctx,
            id: id,
        };
    }

    setScale(scale) {
        this.scale = scale;
    }

    resize(width, height) {
        this.element.width = width;
        this.element.height = height;
        this.ctx.imageSmoothingEnabled = false;
    }
}