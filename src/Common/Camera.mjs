import Vector2 from "./Maths/Vector2.mjs";
import { Rectangle } from "./Maths/Shapes.mjs";

export default class Camera {
    canvas;
    position = new Vector2(0, 0);
    zoom = 1;

    constructor(canvas) {
        this.canvas = canvas;
    }

    get boundsWorld() {
        return new Rectangle(this.position.x, this.position.y, this.canvas.element.width / this.zoom, this.canvas.element.height / this.zoom);
    }

    get center() {
        return this.toScreen(new Vector2(this.position.x + this.boundsWorld.width / 2, this.position.y + this.boundsWorld.height / 2));
    }

    lookAt(position) {
        this.position = position;
    }

    toScreen(position) {
        let canvasOffset = new Vector2(this.canvas.element.getBoundingClientRect().left, this.canvas.element.getBoundingClientRect().top);
        let vec = new Vector2(
            canvasOffset.x + (position.x - this.position.x) * this.zoom,
            canvasOffset.y + (position.y - this.position.y) * this.zoom);

        return vec;
    }

    toWorld(position) {
        let canvasOffset = new Vector2(this.canvas.element.getBoundingClientRect().left, this.canvas.element.getBoundingClientRect().top);
        let vec = new Vector2(
            (-canvasOffset.x + position.x) / ((this.zoom - 1) + this.canvas.scale) + this.position.x,
            (-canvasOffset.y + position.y) / ((this.zoom - 1) + this.canvas.scale) + this.position.y);

        return vec;
    }
}