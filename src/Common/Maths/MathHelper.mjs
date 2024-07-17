export default class MathHelper {
    /**
     * Clamps a value between the specified min and max values (inclusive).
     * @param {Number} value 
     * @param {Number} min 
     * @param {Number} max 
     * @returns The clamped value.
     */
    static clamp(value, min, max) {
        if (value < min) {
            value = min;
        }

        if (value > max) {
            value = max;
        }

        return value;
    }

    /**
     * Linearly interpolates between two values.
     * @param {Number} a 
     * @param {Number} b 
     * @param {Number} amount Should be a value between 0.0 and 1.0
     * @returns The lerped value.
     */
    static lerp(a, b, amount) {
        return a + amount * (b - a);
    }
}
