import MathHelper from "./MathHelper.mjs";

export default class Vector2 {
    x = 0;
    y = 0;
    
    /**
     * 
     * @param {number} x 
     * @param {number} y 
     */
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }

    set(x, y){
        this.x = x;
        this.y = y;
    }

    copy(){
        return new Vector2(this.x, this.y);
    }

    static lerp(a, b, amount){
        return new Vector2(MathHelper.lerp(a.x, b.x, amount), MathHelper.lerp(a.y, b.y, amount));
    }
}