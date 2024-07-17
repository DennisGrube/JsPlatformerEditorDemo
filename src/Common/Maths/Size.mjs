export default class Size {
    width = 0;
    height = 0;
    
    /**
     * 
     * @param {number} width 
     * @param {number} height 
     */
    constructor(width, height){
        this.width = width;
        this.height = height;
    }

    set(width, height){
        this.width = width;
        this.height = height;
    }
}