import { Shape } from "../Maths/Shapes.mjs";
import Size from "../Maths/Size.mjs";
import Vector2 from "../Maths/Vector2.mjs";
import Transform from "./Transform.mjs";


export default class Entity {
    tag = `(no name given)`; // Shown in the Entity Inspector
    transform = new Transform();
    previousTransform = new Transform();
    lerpedTransform = new Transform();
    speed;
    bounds;
    collisions = [];
    doesGravityApply = true;
    isHovered = false;
    camera;

    /**
     * @param {Vector2} position 
     */
    constructor(position, camera) {
        this.teleport(position.x, position.y);
        this.camera = camera;
    }

    update(dt) {
    }

    fixedUpdate(fixedDt){

    }

    afterUpdate(dt) {
    }

    onCollision() {
    }

    /**
     * Teleports the entity to the specified location.
     * This ignores lerping between frames.
     * @param {Number} x 
     * @param {Number} y 
     */
    teleport(x, y) {
        this.transform.position.set(x, y);
        this.previousTransform.position.set(x, y);
        this.lerpedTransform.position.set(x, y);
    }

    /**
     * If an Entity is provided, extracts the Shape. 
     * If a Shape is provided, just returns the Shape.
     * @param {Entity} other 
     * @returns Shape
     */
    static getShape(other) {
        return other instanceof Entity ? other.bounds : other;
    }

    /**
     * Checks if a collision is already present in the collisions collection,
     * to prevent it from firing every frame.
     * @param {Shape} other 
     * @returns 
     */
    isCollisionAlreadyPresent(other) {
        for (let i = this.collisions.length - 1; i >= 0; i--) {
            if (this.collisions[i].id == other.id) {
                return true;
            }
        }

        return false;
    }

    /**
     * 
     * @param {Entity|Shape} other 
     * @returns Boolean
     */
    checkCollision(other) {
        let otherShape = Entity.getShape(other);
        if (this.bounds.intersects(otherShape)) {
            if (this.isCollisionAlreadyPresent(otherShape)) {
                return false;
            } else {
                this.pushCollision(otherShape);
                return true;
            }
        }

        return false;
    }

    /**
     * 
     * @param {Shape} collision 
     */
    pushCollision(collision) {
        this.collisions.push(collision);
    }

    onCollision(other) {
    }

    /**
     * Checks for collisions that are not valid anymore.
     */
    checkForOutdatedCollisions() {
        if (this.collisions.length == 0) {
            return;
        }

        for (let i = this.collisions.length - 1; i >= 0; i--) {
            if (!this.collisions[i].intersects(this.bounds)) {
                this.removeCollision(i);
            }
        }
    }

    /**
     * Removes a collision from the collisions collection and resizes the array accordingly.
     * @param {Number} id 
     */
    removeCollision(id) {
        this.collisions.splice(id, 1);
    }

    drawBounds(dt, canvas, fillColor, strokeColor, strokeThickness = 1, strokeAlpha = 1) {
        this.bounds?.draw(canvas, fillColor, strokeColor, this.camera, strokeThickness, strokeAlpha);
    }

    draw(canvas, dt, alpha) {
        //this.drawBounds(dt, canvas, null, `#FF0000`);
    }
}