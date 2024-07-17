export default class Input {
    static #newKeyPresses = new Set();
    static #newKeyReleases = new Set();

    static #heldKeys = new Set();
    static #oldHeldKeys = new Set();

    static enumerateMouseButtons(event) {
        if (typeof event.button === `object`) {
            return null;
        }

        let button = null;
        switch (event.button) {
            case 0:
                button = `lmb`;
                break;

            case 1:
                button = `mmb`;
                break;

            case 2:
                button = `rmb`;
                break;

            default:
                break;
        }

        return button;
    }

    static addKey(collection, key) {
        if (typeof key === `object`) {
            return;
        }

        collection.add(key);
    }

    static keyDownHandler(event) {
        if (!document.hasFocus()) {
            return;
        }

        if (event instanceof KeyboardEvent) {
            Input.addKey(Input.#newKeyPresses, Input.#translateKey(event.key.toLowerCase()));
        }

        if (event instanceof MouseEvent && !(event instanceof WheelEvent)) {
            let button = Input.enumerateMouseButtons(event);
            Input.addKey(Input.#newKeyPresses, button);
        }

        if (event instanceof WheelEvent) {
            Input.addKey(Input.#newKeyPresses, event.deltaY < 0 ? `scrollup` : event.deltaY > 0 ? `scrolldown` : null);
            Input.addKey(Input.#newKeyPresses, event.deltaX < 0 ? `scrollleft` : event.deltaX > 0 ? `scrollright` : null);
        }
    }

    static keyUpHandler(event) {
        if (!document.hasFocus()) {
            return;
        }

        if (event instanceof KeyboardEvent) {
            Input.#newKeyReleases.add(Input.#translateKey(event.key.toLowerCase()));
        }

        if (event instanceof MouseEvent && !(event instanceof WheelEvent)) {
            let button = Input.enumerateMouseButtons(event);
            Input.#newKeyReleases.add(button);
        }
    }

    static isKeyHeld(key) {
        let k = Input.#translateKey(key);
        return Input.#heldKeys.has(k);
    }

    static #translateKey(key) {
        switch (key) {
            case ` `:
                return `space`;
        }

        return key.replace(`arrow`, ``);
    }

    static isNewKeyPress(key) {
        let k = Input.#translateKey(key);
        return Input.#heldKeys.has(k) && !Input.#oldHeldKeys.has(k);
    }

    static isNewKeyRelease(key) {
        let k = Input.#translateKey(key);
        return !Input.#heldKeys.has(k) && Input.#oldHeldKeys.has(k);
    }

    static afterFocusLoss() {
        Input.#oldHeldKeys.clear();
        Input.#heldKeys.clear();
        Input.#newKeyPresses.clear();
        Input.#newKeyReleases.clear();
    }

    static update() {
        if (!document.hasFocus()) {
            return;
        }

        Input.#oldHeldKeys.clear();

        for (let key of Input.#heldKeys) {
            Input.#oldHeldKeys.add(key);
        }

        for (let key of Input.#newKeyPresses.values()) {
            Input.#heldKeys.add(key);
        }

        Input.#newKeyPresses.clear();

        for (let key of Input.#newKeyReleases) {
            Input.#heldKeys.delete(key);
        }

        Input.#newKeyReleases.clear();
    }

    static clearAll() {
        Input.#newKeyPresses.clear();
        Input.#newKeyReleases.clear();
        Input.#oldHeldKeys.clear();
        Input.#heldKeys.clear();
    }

    static afterUpdate() {
        Input.#heldKeys.delete(`scrolldown`);
        Input.#heldKeys.delete(`scrollup`);
        Input.#heldKeys.delete(`scrollleft`);
        Input.#heldKeys.delete(`scrollright`);
    }

    static #printSet(set){
        for(let key of set){
            console.log(key);
        }
    }

    static DEBUG_printKeys() {
        console.log(`New Key Presses: `);
        Input.#printSet(this.#newKeyPresses);

        console.log(`\nHeld Keys: `);
        Input.#printSet(this.#heldKeys);

        console.log(`\nNew Key Releases: `);
        Input.#printSet(this.#newKeyReleases);

        console.log(`\nOld Held Keys: `);
        Input.#printSet(this.#oldHeldKeys);

        console.log(`\n-------------\n\n`);
    }
}

document.addEventListener(`keydown`, Input.keyDownHandler, false);
document.addEventListener(`keyup`, Input.keyUpHandler, false);
document.addEventListener(`mousedown`, Input.keyDownHandler, false);
document.addEventListener(`mouseup`, Input.keyUpHandler, false);
document.addEventListener(`wheel`, Input.keyDownHandler, false);