import Texture from "../Texture.mjs";
import Animation from "../Sprites/Animation.mjs";
import SpriteBatch from "../SpriteBatch.mjs";
import Input from "../Input.mjs";
import Vector2 from "../Maths/Vector2.mjs";
import { Rectangle } from "../Maths/Shapes.mjs";
import MathHelper from "../Maths/MathHelper.mjs";
import Game from "../Game/Game.mjs";
import EntityInspector from "../Game/EntityInspector.mjs";

import Entity from "./Entity.mjs";
import Transform from "./Transform.mjs";

// This seems to be the closest one can get to an enum without using TypeScript
export const foxState = {
    idle: `idle`,
    look: `look`,
    walk: `walk`,
    startJump: `startJump`,
    ascend: `ascend`,
    inAir: `inAir`,
    descend: `descend`,
    land: `land`
}

export default class Fox extends Entity {
    texture = new Texture(`fox.png`);
    currentAnimation;
    animations = new Map();
    isInitialized = false;
    hFlip = false;
    vFlip = false;
    state = ``;
    velocity = new Vector2(0, 0);
    maxVelocity = new Vector2(120, 1200);
    acceleration = 1200;
    deceleration = 400;
    gravity = 600; // temporary until levels exist
    floor = 120; // temporary until tilemaps exist

    hasLandedThisFrame = false;
    hasJumpedThisFrame = false; // This is one possible method to stop the player from landing during the same frame in which they've initiated a jump.

    // A bunch of variables that tweak jump behavior.
    jumpPower = 220;
    jumpApex = this.jumpPower * 0.33; // The jump apex threshold; the y-velocity range around 0 at which gravity should have less of an impact.
    apexGravityFactor = 0.66; // How strong gravity acts on the player within the jump's apex.
    fallGravityFactor = 0.66; // How strong gravity should be on the player's descent.
    slowDescendFactor = 0.8; // When falling and holding the jump key, this is an *additional* factor that determines the impact of gravity on the player.
    defaultGravityFactor = 1;
    maxFallSpeed = 220;
    currentGravityFactor = this.defaultGravityFactor;

    constructor(position, camera) {
        super(position, camera);
        this.speed = 100;
        this.bounds = new Rectangle(position.x, position.y, 32, 32);
        this.tag = `Fox (Player)`;
    }

    generateAnimations() {
        // Animations cannot be generated if the texture has not been loaded yet.
        if (!this.texture.isLoaded()) {
            return;
        }

        this.animations.set(`idle`, Animation.generateFramesFromStrip(0.15, 0, 0, 32, 32, 5));
        this.animations.set(`look`, Animation.generateFramesFromStrip(0.15, 0, 1, 32, 32, 14));
        this.animations.set(`walk`, Animation.generateFramesFromStrip(0.075, 0, 2, 32, 32, 8));
        this.animations.get(`walk`).setFirstFrame(1);
        this.animations.set(`startJump`, Animation.generateFramesFromStrip(0.033, 0, 3, 32, 32, 3));
        this.animations.get(`startJump`).setLooping(false);
        this.animations.set(`ascend`, Animation.generateFramesFromStrip(0.1, 3, 3, 32, 32, 1));
        this.animations.set(`inAir`, Animation.generateFramesFromStrip(0.1, 4, 3, 32, 32, 1));
        this.animations.set(`descend`, Animation.generateFramesFromStrip(0.05, 5, 3, 32, 32, 1));
        this.animations.set(`land`, Animation.generateFramesFromStrip(0.066, 6, 3, 32, 32, 5));
        this.animations.get(`land`).setLooping(false);

        this.currentAnimation = this.animations.get(foxState.idle);
        this.state = foxState.idle;

        this.isInitialized = true;
    }

    playAnimation(animation) {
        if (this.currentAnimation !== this.animations.get(animation)) {
            this.currentAnimation.reset(); // Without this, the animation would restart from where it left off when it is next needed
            this.currentAnimation = this.animations.get(animation);
        }
    }

    moveHorizontally(fixedDt) {
        let dir = new Vector2(0, 0);

        if (Input.isKeyHeld(`left`)) {
            dir.x -= 1;
        }

        if (Input.isKeyHeld(`right`)) {
            dir.x += 1;
        }

        if (dir.x !== 0) {
            this.velocity.x += dir.x * this.acceleration * fixedDt;
        }

        // This block decelerates the fox when both or no horizontal directions are being pressed.
        if (dir.x === 0) {
            // Keeping track of the velocity's sign is necessary determine when velocity.x should be set to 0.
            let previousSign = Math.sign(this.velocity.x);

            // Uses the negative of the x velocity's sign to decelerate the fox.
            this.velocity.x += (-Math.sign(this.velocity.x) * this.deceleration) * fixedDt;

            // To keep the fox from jittering.
            if (Math.sign(this.velocity.x) !== previousSign) {
                this.velocity.x = 0;
            }
        }

        this.velocity.x = MathHelper.clamp(this.velocity.x, -this.maxVelocity.x, this.maxVelocity.x);
        this.transform.position.x += this.velocity.x * fixedDt;
    }

    initiateJump(fixedDt) {
        if (Input.isNewKeyPress(`space`)) {
            this.state = foxState.startJump;
            this.velocity.y = -this.jumpPower;
            this.startedJumpingThisFrame = true;
        }
    }

    stopJump(fixedDt) {
        // Allows for more precise controls by limiting jump height when the jump key has been released.
        if (Input.isNewKeyRelease(`space`) && this.velocity.y < 0) {
            let jumpDampening = 1 - Math.abs(this.velocity.y / this.jumpPower);
            jumpDampening += 0.33;
            jumpDampening = MathHelper.clamp(jumpDampening, 0.5, 0.8);
            this.velocity.y *= jumpDampening;
        }
    }

    doJumpApex(fixedDt) {
        // Similarly, this allows for more precise controls by reducing the impact of gravity near the jump's apex.
        if (Math.abs(this.velocity.y) < this.jumpApex && Input.isKeyHeld(`space`)) {
            this.currentGravityFactor = this.apexGravityFactor;
        }
    }

    doSlowDescent(fixedDt) {
        // And this allows even more precise controls over the jump by slowing the descent a little, if the jump key is being held.
        if (Input.isKeyHeld(`space`)) {
            this.currentGravityFactor = this.slowDescendFactor;
        }
    }

    handleStates(fixedDt) {
        this.hasJumpedThisFrame = false;

        switch (this.state) {
            case foxState.idle:
                this.playAnimation(foxState.idle);
                this.moveHorizontally(fixedDt);
                if (this.velocity.x !== 0) {
                    this.state = foxState.walk;
                }
                this.initiateJump(fixedDt);
                break;

            case foxState.walk:
                this.playAnimation(foxState.walk);
                this.moveHorizontally(fixedDt);
                if (this.velocity.x === 0) {
                    this.state = foxState.idle;
                }
                this.initiateJump(fixedDt);
                break;

            case foxState.startJump:
                this.playAnimation(foxState.startJump);
                this.moveHorizontally(fixedDt);
                this.stopJump(fixedDt);
                if (this.currentAnimation.hasFinished()) {
                    this.state = foxState.ascend;
                }
                break;

            case foxState.ascend:
                this.playAnimation(foxState.ascend);
                this.moveHorizontally(fixedDt);
                this.doJumpApex(fixedDt);
                this.stopJump(fixedDt);
                if (Math.abs(this.velocity.y) < this.jumpApex) {
                    this.state = foxState.inAir;
                }
                break;

            case foxState.inAir:
                this.playAnimation(foxState.inAir);
                this.moveHorizontally(fixedDt);
                this.doJumpApex(fixedDt);
                this.stopJump(fixedDt);
                if (Math.abs(this.velocity.y > this.jumpApex)) {
                    this.state = foxState.descend;
                }
                break;

            case foxState.descend:
                this.playAnimation(foxState.descend);
                this.moveHorizontally(fixedDt);
                this.doSlowDescent(fixedDt);

                break;

            case foxState.land:
                this.playAnimation(foxState.land);
                this.moveHorizontally(fixedDt);
                if (this.currentAnimation.hasFinished()) {
                    this.state = foxState.idle;
                }
                this.initiateJump(fixedDt);
                break;
        }
    }

    applyGravity(fixedDt) {
        if (!this.doesGravityApply) {
            return;
        }

        if (this.hasLandedThisFrame) {
            this.hasLandedThisFrame = false;
            this.state = foxState.land;
        }

        // Clamps velocity.y so that the player does not accelerate towards ridiculous speeds especially when falling for too long
        this.velocity.y = MathHelper.clamp(
            this.velocity.y + this.gravity * this.currentGravityFactor * fixedDt,
            -this.maxVelocity.y,
            this.maxFallSpeed * this.currentGravityFactor * this.fallGravityFactor
        )

        this.transform.position.y += this.velocity.y * fixedDt;
        this.currentGravityFactor = this.defaultGravityFactor;
    }

    update(dt) {
        if(!this.isInitialized){
            return;
        }
        // Entity inspector related stuff
        if (this.bounds.contains(this.camera.toWorld(Game.instance.cursorPosition))) {
            this.isHovered = true;
        } else {
            this.isHovered = false;
        }
    }

    fixedUpdate(fixedDt) {
        // Do not update the fox until after initialization, and reattempt initialization
        // every frame until it succeeds, which requires the sprite sheet to be loaded.
        if (!this.isInitialized) {
            this.generateAnimations();
            return;
        }

        this.previousTransform.copyFrom(this.transform);

        this.handleStates(fixedDt);

        if (this.velocity.x < 0) {
            this.hFlip = true;
        }

        if (this.velocity.x > 0) {
            this.hFlip = false;
        }

        this.currentAnimation.fixedUpdate(fixedDt);
        this.transform.position.x = MathHelper.clamp(
            this.transform.position.x,
            0,
            Game.instance.canvas.element.width / (Game.instance.canvas.scale * this.camera.zoom) - this.bounds.width);

        this.applyGravity(fixedDt);

        this.transform.position.y = MathHelper.clamp(this.transform.position.y, -66, this.floor);
        if (this.transform.position.y >= this.floor && (this.state === foxState.descend || this.state === foxState.inAir) && !this.hasJumpedThisFrame) {
            this.hasLandedThisFrame = true;
        } else if (this.transform.position.y === this.floor) {
            this.velocity.y = 0;
        }

        this.bounds.x = this.transform.position.x;
        this.bounds.y = this.transform.position.y;
    }

    draw(canvas, dt, alpha) {
        if (!this.isInitialized) {
            return;
        }

        if (document.activeElement.nodeName === `BODY`) {
            Transform.lerp(this.lerpedTransform, this.previousTransform, this.transform, alpha);
        } else {
            this.lerpedTransform.copyFrom(this.transform);
        }

        SpriteBatch.draw(
            canvas, this.texture,
            this.lerpedTransform.position, this.currentAnimation.getCurrentFrame().slice, null, this.lerpedTransform.scale,
            this.hFlip, this.vFlip, this.camera)

        // Entity inspector related stuff
        if (document.getElementById(`show_bounds`).checked) {
            let color = this.isHovered ? `#00FF88` : this === EntityInspector.inspectedEntity ? `#0088FF` : `#FF3300`;
            this.drawBounds(dt, canvas, null, color, canvas.scale, 1);
        }

        if (this.isHovered && Input.isNewKeyPress(`lmb`)) {
            EntityInspector.inspectEntity(this);
        }
    }
}