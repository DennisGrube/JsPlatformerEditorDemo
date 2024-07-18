import { designRes } from "/src/Common/Canvas.mjs";
import Game from "/src/Game/Game.mjs";

export default class EntityInspector {
    static items = new Map();
    static inspectedEntity;

    static initialize() {
        // Caching the relevant elements to not query the document every frame more than necessary.
        EntityInspector.items.set(`state`, document.getElementById(`state`));
        EntityInspector.items.set(`name`, document.getElementById(`name`));
        EntityInspector.items.set(`xPos`, document.getElementById(`position_x`));
        EntityInspector.items.set(`yPos`, document.getElementById(`position_y`));
        EntityInspector.items.set(`velocity`, document.getElementById(`velocity`));
        EntityInspector.items.set(`applyGravity`, document.getElementById(`apply_gravity`));
        EntityInspector.items.set(`uiElements`, document.getElementById(`ui_elements`));
    }

    static update() {
        EntityInspector.updateInspectedEntity();
    }

    /**
     * Sets the Entity to inspect.
     * @param {Entity} entity 
     */
    static inspectEntity(entity) {
        EntityInspector.inspectedEntity = entity;
        EntityInspector.items.get(`applyGravity`).checked = EntityInspector.inspectedEntity.doesGravityApply;
    }

    /**
     * Updates the width of the inspector based on the canvas width.
     * It cannot be smaller than a scale of 2 * Canvas.designRes.width because of overlapping elements.
     */
    static updateInspectorWidth() {
        let newWidth = Math.max(Game.instance.canvas.element.width, designRes.width * 2);
        EntityInspector.items.get(`uiElements`).style.width = `${newWidth}px`;
    }

    /**
     * Updates the EntityInspector's data about the currently inspected entity, and
     * also updates the Entity itself if any variables have been modified via the EntityInspector.
     */
    static updateInspectedEntity() {
        if (!EntityInspector.inspectedEntity) {
            return;
        }

        EntityInspector.items.get(`state`).innerHTML = `State: ` + EntityInspector.inspectedEntity.state;
        EntityInspector.items.get(`name`).innerHTML = `Entity: ` + EntityInspector.inspectedEntity.tag;

        if (document.activeElement.id === `position_x`) {
            EntityInspector.inspectedEntity.transform.position.x = EntityInspector.items.get(`xPos`).valueAsNumber;
        } else {
            EntityInspector.items.get(`xPos`).value = parseFloat(EntityInspector.inspectedEntity.transform.position.x).toFixed(2);
        }

        if (document.activeElement.id === `position_y`) {
            EntityInspector.inspectedEntity.transform.position.y = EntityInspector.items.get(`yPos`).valueAsNumber;
        } else {
            EntityInspector.items.get(`yPos`).value = parseFloat(EntityInspector.inspectedEntity.transform.position.y).toFixed(2);
        }

        // TODO: place X and Y so that Y's position is not influenced by X's number of digits
        EntityInspector.items.get(`velocity`).innerHTML =
            `Velocity X: ${parseInt(EntityInspector.inspectedEntity.velocity.x)} 
                &nbsp;&nbsp;Y: ${parseInt(EntityInspector.inspectedEntity.velocity.y)}`;

        EntityInspector.inspectedEntity.doesGravityApply = EntityInspector.items.get(`applyGravity`).checked;
    }

}