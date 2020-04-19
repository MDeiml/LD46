import { DELTA, player, createTree, initTrees, items, initItems, Item, ITEMS, pickUp, fire, chopDownTree, layDown, refuelFire, ANIMATIONS, PICK_UP_RADIUS, trees, animals} from './model.js';
import { mousePos, doubleClick, clickHandled } from './input.js';
import { vec2 } from './gl-matrix-min.js'

export function init() {
    initTrees();
	initItems();
}

// main update function (called every DELTA seconds)
export function update() {
    fire.fuel -= fire.burningSpeed * DELTA;
    fire.animationTime += DELTA;
    if (player.animationStatus == ANIMATIONS.CRAFTING && mousePos) {
        for (let i = 0; i < 9; i++) {
            let angle = Math.PI * i / 5;
            let point = vec2.fromValues(2 * Math.sin(angle), 2 * Math.cos(angle));
            if (vec2.distance(mousePos, point) < 0.5) {
                console.log(i);
                clickHandled();
                break;
            }
        }
    }
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
                    if (refuelFire()) {
                    } else if (layDown()) {
                    } else if (vec2.length(player.position) < PICK_UP_RADIUS) {
                        player.animationStatus = ANIMATIONS.CRAFTING;
                    } else if (pickUp()) {
                    } else if (chopDownTree(true)) {
                        player.animationStatus = ANIMATIONS.CHOPPING;
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

    handleCollision(player);

    // ANIMALS
    for (let animal of animals) {
        let dir = vec2.sub(vec2.create(), player.position, animal.position);
        let dist = vec2.len(dir);
        if (dist < 3) {
            vec2.scale(dir, dir, animal.speed * DELTA / dist);
            vec2.add(animal.position, animal.position, dir);
            animal.walkingDir = null;
            animal.walkTimer = 0;
        } else {
            animal.walkTimer -= DELTA;
            if (animal.walkingDir) {
                vec2.add(animal.position, animal.position, vec2.scale(dir, animal.walkingDir, DELTA * animal.speed));
                if (animal.walkTimer <= 0) {
                    animal.walkTimer = Math.random() + 1;
                    animal.walkingDir = null;
                }
            } else {
                if (animal.walkTimer <= 0) {
                    animal.walkTimer = Math.random() + 1;
                    animal.walkingDir = vec2.random(vec2.create());
                }
            }
        }
        handleCollision(animal);
    }
}

function handleCollision(obj) {
    for (let tree of trees) {
        let dir = vec2.sub(vec2.create(), tree.position, obj.position);
        let dist = vec2.len(dir);
        if (dist < 0.2) {
            vec2.scale(dir, dir, -(0.2 - dist)/dist);
            vec2.add(obj.position, obj.position, dir);
        }
    }
}
