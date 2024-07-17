
export default class ContentManager {
    static #imagePath = `./img`;
    static #images = new Map();
    constrcutor() { }

    static #getFullString(fileName) {
        return `${ContentManager.#imagePath}/${fileName}`;
    }

    static loadImage(fileName) {
        let image = new Image();
        image.src = ContentManager.#getFullString(fileName);
        ContentManager.#images.set(ContentManager.#getFullString(fileName), image);
        console.log(`loading ` + image.src);
        return image;
    }

    static isImageReady(image) {
        if(!image){
            return false;
        }
        
        if (typeof image === `string`) {
            return ContentManager.#images.get(ContentManager.#getFullString(image)).complete;
        } else if (image instanceof Image) {
            for (let img in ContentManager.#images.values) {
                if (img === image) {
                    return img.complete;
                }
            }

            return false;
        }

        return false;
    }
}