import Canvas from "./Canvas.mjs";
import { Rectangle } from "./Maths/Shapes.mjs";
import Vector2 from "./Maths/Vector2.mjs";
import Texture from "./Texture.mjs";
import Input from "./Input.mjs";
import MathHelper from "./Maths/MathHelper.mjs";

export default class SpriteBatch {
    static tintCanvas = new Canvas(`tintCanvas`, 1024, 1024);
    static lastTintAmount = 0;
    /**
     * 
     * @param {Texture} texture 
     * @param {Rectangle} slice 
     * @param {Vector2} position 
     * @param {Vector2} origin 
     * @param {Vector2} scale 
     */
    static draw(canvas, texture, position, slice, origin, scale, hFlip, vFlip, camera, alpha = 1, darkenAmount = 0) {
        if (!texture) {
            return;
        }

        if (Input.isNewKeyPress(`t`))
            console.log(texture);
        if ((texture instanceof Texture && texture.isLoaded()) || texture instanceof Canvas) {
            const tex = texture instanceof Texture ? texture.image : texture.element;
            const totalScale = camera ? canvas.scale * camera.zoom : canvas.scale;
            const _slice = !slice ?
                new Rectangle(0, 0, tex.width, tex.height) : slice;

            const _scale = !scale ?
                new Vector2(1, 1) :
                scale instanceof Vector2 ? new Vector2(totalScale * scale.x, totalScale * scale.y) :
                    new Vector2(totalScale * scale, totalScale * scale);

            const width = _slice.width * _scale.x;
            const height = _slice.height * _scale.y;

            const _origin = !origin ? new Vector2(0, 0) : origin;

            const pos = camera ?
                new Vector2(((-camera.position.x + position.x) * totalScale) - _origin.x, ((-camera.position.y + position.y) * totalScale) - _origin.y) :
                new Vector2(position.x * canvas.scale, position.y * canvas.scale);


            canvas.ctx.save();

            if (hFlip || vFlip) {
                let translateX = hFlip ? -(pos.x * 2 + _slice.width * totalScale) : 0;
                let translateY = vFlip ? -(pos.y * 2 + (_slice.height + _origin.y) * totalScale) : 0;
                canvas.ctx.scale(hFlip ? -1 : 1, vFlip ? - 1 : 1);
                canvas.ctx.translate(translateX, translateY);
            }

            canvas.ctx.globalAlpha = alpha;
            if (darkenAmount !== 0) {
                darkenAmount = MathHelper.lerp(100, 0, darkenAmount);
                canvas.ctx.filter = `brightness(${darkenAmount}%)`;
            }

            canvas.ctx.drawImage(tex,
                _slice.x, _slice.y, _slice.width, _slice.height,
                pos.x, pos.y, width, height);

            canvas.ctx.restore();
            return true;
        }

        return false;
    }
}