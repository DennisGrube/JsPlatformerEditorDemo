export default class Frame{
    slice;
    duration;

    constructor(duration, sourceRect){
        this.slice = sourceRect;
        this.duration = duration;
    }
}