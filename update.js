import { DELTA, player, createTree, initTrees, items, initItems, Item, ITEMS, pickUp, fire, chopDownTree, layDown, refuelFire, ANIMATIONS } from './model.js';
import { mousePos, doubleClick } from './input.js';
import { vec2 } from './gl-matrix-min.js'

export function init() {
    initTrees();
	initItems();
}

// main update function (called every DELTA seconds)
export function update() {
    fire.fuel -= fire.burningSpeed * DELTA;
    fire.animationTime += DELTA;
    if (mousePos) {
        vec2.sub(player.goal, mousePos, vec2.fromValues(0, 0.3));
        player.animationStatus = ANIMATIONS.WALKING;
    }
    if (player.animationStatus) {
        player.animationTimer += DELTA;
        if (player.animationStatus == ANIMATIONS.WALKING) {
            let dir = vec2.sub(vec2.create(), player.goal, player.position);
            let dist = vec2.length(dir);
            if (dist < player.speed * DELTA) {
                vec2.copy(player.position, player.goal);
                player.animationTimer = 0;
                player.animationStatus = 0;
                if (!doubleClick) {
                    if (!refuelFire()) {
                        if (!layDown()) {
                            if (!pickUp()) {
                                if (chopDownTree(true)) {
                                    player.animationStatus = ANIMATIONS.CHOPPING;
                                }
                            }
                        }
                    }
                }
            } else {
                vec2.scale(dir, dir, player.speed * DELTA / dist);
                vec2.add(player.position, player.position, dir)
            }
        } else if (player.animationStatus == ANIMATIONS.CHOPPING) {
            if (player.animationTimer >= 5) {
                player.animationTimer = 0;
                player.animationStatus = 0;
                chopDownTree(false);
            }
        }
    }
}
