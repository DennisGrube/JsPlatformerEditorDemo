export default class DrawHelper {
    static drawStroke(canvas, width, color, alpha) {
        canvas.ctx.strokeStyle = color;
        canvas.ctx.lineWidth = width;
        let oldAlpha = canvas.ctx.globalAlpha;
        canvas.ctx.globalAlpha = alpha;
        canvas.ctx.stroke();
        canvas.ctx.globalAlpha = oldAlpha;
    }
}
