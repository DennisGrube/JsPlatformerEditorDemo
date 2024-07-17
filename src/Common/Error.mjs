export default class NotImplementedError extends Error {
    constructor(message = ``) {
        super(message);
        this.name = `[Not Implemented Exception]`;
        this.message = message;
    }
}
