import DrawHelper from "../DrawHelpers.mjs";
import Entity from "../Entities/Entity.mjs";
import Vector2 from "./Vector2.mjs";
import NotImplementedError from "../Error.mjs";

export class Shape {
    static shape_ids = 0; // TODO: move this over to hitboxes when they exist
    id = 0;
    x = 0;
    y = 0;

    constructor(x, y) {
        this.id = Shape.shape_ids++;
        this.x = x;
        this.y = y;
    }

    intersects(other) {
        let otherShape;
        let thisShape = this;

        otherShape = other instanceof Entity ? other.bounds : other;

        if (thisShape instanceof Rectangle) {
            if (otherShape instanceof Rectangle) {
                return Rectangle.intersectsRect(thisShape, otherShape);
            } else if (otherShape instanceof Circle) {
                return Rectangle.intersectsCircle(thisShape, otherShape);
            }
        } else if (thisShape instanceof Circle) {
            if (otherShape instanceof Rectangle) {
                return Circle.intersectsRect(thisShape, otherShape);
            } else if (otherShape instanceof Circle) {
                return Circle.intersectsCircle(thisShape, otherShape);
            }
        }

        return false;
    }
}

export class Rectangle extends Shape {
    width = 0;
    height = 0;

    get top() {
        return this.y;
    }

    get right() {
        return this.x + this.width;
    }

    get bottom() {
        return this.y + this.height;
    }

    get left() {
        return this.x;
    }

    constructor(x, y, w, h) {
        super(x, y);
        this.width = w;
        this.height = h;
    }

    intersects(other) {
        if (other instanceof Rectangle) {
            if (other.x < this.x + this.width &&
                this.x < other.x + other.width &&
                other.y < this.y + this.height &&
                this.y < other.y + other.height) {
                return true;
            }
        } else if (other instanceof Circle) {
            if (other.x - other.radius < this.x + this.width &&
                other.x + other.radius > this.x &&
                other.y + other.radius > this.y &&
                other.y - other.radius < this.y + this.height) {
                return true;
            }
        } else {
            throw new Error(`Unknown shape`);
        }

        return false;
    }

    static union(a, b) {
        let x = Math.min(a.x, b.x);
        let y = Math.min(a.y, b.y);
        return new Rectangle(x, y, Math.max(a.right, b.right) - x, Math.max(a.bottom, b.bottom) - y);
    }

    inflate(w, h) {
        this.x -= w;
        this.width += 2 * w;
        this.y -= h;
        this.height += 2 * h;
    }

    contains(other) {
        if (other instanceof Vector2) {
            if (other.x >= this.x && other.x <= this.x + this.width &&
                other.y >= this.y && other.y <= this.y + this.height) {
                return true;
            }
        } else if (other instanceof Rectangle) {
            throw new NotImplementedError(`Rectangle.contains(rectangle)`);
        } else if (other instanceof Circle) {
            throw new NotImplementedError(`Rectangle.contains(circle)`);
        }

        return false;
    }

    /**
     * 
     * @param {Rectangle|Number} x 
     * @param {Number} y 
     * @param {Number} w 
     * @param {Number} h 
     */
    set(x, y, w, h) {
        if(x instanceof Rectangle){
            this.x = x.x;
            this.y = x.y;
            this.width = x.width;
            this.height = x.height;
        } else {
            this.x = x;
            this.y = y;
            this.width = w;
            this.height = h;
        }
    }

    setPosition(x, y) {
        this.x = x;
        this.y = y;
    }

    setSize(w, h) {
        this.width = w;
        this.height = h;
    }

    copy() {
        let copy = new Rectangle(this.x, this.y, this.width, this.height);
        return copy;
    }

    draw(canvas, fillColor, strokeColor, camera, strokeThickness = 1, strokeAlpha = 1, fillAlpha = 1) {
        canvas.ctx.beginPath();

        canvas.ctx.rect(
            Math.round((-camera.position.x + this.x) * (canvas.scale * camera.zoom)), Math.round((-camera.position.y + this.y) * (canvas.scale * camera.zoom)),
            Math.round(this.width * (canvas.scale * camera.zoom)), Math.round(this.height * (canvas.scale * camera.zoom)));


        if (fillColor) {
            canvas.ctx.fillStyle = fillColor;
            let previousAlpha = canvas.ctx.globalAlpha;
            canvas.ctx.globalAlpha = fillAlpha;
            canvas.ctx.fill();
            canvas.ctx.globalAlpha = previousAlpha;
        }

        if (strokeColor) {
            DrawHelper.drawStroke(canvas, strokeThickness, strokeColor, strokeAlpha);
        }

        canvas.ctx.closePath();
    }
}

export class Circle extends Shape {
    radius = 0;

    constructor(position, radius) {
        super(position);
        this.radius = radius;
    }

    intersectsRect(rect) {
        if (this.x - this.radius < rect.x + rect.width &&
            this.x + this.radius > rect.x &&
            this.y + this.radius > rect.y &&
            this.y - this.radius < rect.y + rect.height) {
            return true;
        }

        return false;
    }

    intersectsCircle(circle, other) {
        throw new NotImplementedError(`Circle.intersects(circleA, circleB)`);
    }

    draw(canvas, fillColor, strokeColor, strokeThickness = 1, strokeAlpha = 1) {
        canvas.ctx.beginPath();
        canvas.ctx.arc(Math.round(this.x), Math.round(this.y), this.radius, 0, Math.PI * 2, false);
        canvas.ctx.fillStyle = fillColor;
        canvas.ctx.fill();
        canvas.drawStroke(strokeThickness, strokeColor, strokeAlpha);
        canvas.ctx.closePath();
    }
}