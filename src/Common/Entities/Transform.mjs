import Vector2 from "../Maths/Vector2.mjs";

export default class Transform {
    position = new Vector2(0, 0);
    scale = new Vector2(1, 1);

    constructor() { }

    /**
     * To reduce garbage generation, this function *does not* return a new Transform object.
     * This is probably overkill, but as it does not increase code complexity in a meaningful manner it
     * is also a low hanging fruit in terms of optimization.
     * @param {Transform} transform The Transform object that will be written into
     * @param {Transform} a Transform from
     * @param {Transform} b Transform to
     * @param {Number} amount Should be between 0.0 and 1.0
     */
    static lerp(transform, a, b, amount) {
        transform.position = Vector2.lerp(a.position, b.position, amount);
        transform.scale = Vector2.lerp(a.scale, b.scale, amount);
    }

    static copyInto(from, to) {
        to.position.set(from.position.x, from.position.y);
        to.scale.set(from.scale.x, from.scale.y);
    }

    copyFrom(other) {
        this.position.set(other.position.x, other.position.y);
        this.scale.set(other.scale.x, other.scale.y);
    }
}