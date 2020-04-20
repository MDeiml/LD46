import { DELTA, player, createTree, initTrees, items, initItems, Item, ITEMS, pickUp, fire, chopDownTree,
	layDown, refuelFire, ANIMATIONS, PICK_UP_RADIUS, upgradeFire, craft, trees, animals, initDecorations,
	initQuarry, mineStone, TIME_TO_CHOP_DOWN_TREE, TIME_TO_MINE_STONE, quarry, hitAnimal, gui, GAME_STATUS,
    ENERGY_DEPLETING_SPEED, ANIMAL_ANIMATION, cookFood } from './model.js';
import { mousePos, doubleClick, clickHandled } from './input.js';
import { vec2 } from './gl-matrix-min.js'

export function init() {
	initQuarry();
    initTrees();
	initItems();
	initDecorations();
}

// main update function (called every DELTA seconds)
export function update() {
    if (fire.fuel <= 0 || player.energy <= 0) {
        gui.gameStatus = GAME_STATUS.GAME_OVER;
    }
    if (fire.size == 3) {
        gui.gameStatus = GAME_STATUS.WIN;
    }
    if (gui.gameStatus == GAME_STATUS.MENU) {
        if (mousePos) {
            gui.gameStatus = GAME_STATUS.PLAYING;
            return;
        }
    }
    if (gui.gameStatus != GAME_STATUS.PLAYING) {
        return;
    }
    fire.fuel -= fire.burningSpeed * DELTA;
    fire.animationTime += DELTA;

    if (vec2.length(player.position) > fire.fuel * 2) {
        player.energy -= DELTA * ENERGY_DEPLETING_SPEED;
    }

    if (player.animationStatus == ANIMATIONS.CRAFTING && mousePos) {
        for (let i = 0; i < 9; i++) {
            let angle = Math.PI * i / 5;
            let point = vec2.fromValues(2 * Math.sin(angle), 2 * Math.cos(angle));
            if (vec2.distance(mousePos, point) < 0.5) {
				if (i == 0) {
					console.log(upgradeFire());
				} else {
					console.log(craft(i-1));
					console.log(player.tools);
				}
                clickHandled();
                break;
            }
        }
    }
    if (mousePos) {
        vec2.sub(player.goal, mousePos, vec2.fromValues(0, 0.3));
        player.animationStatus = ANIMATIONS.WALKING;
        player.animationTimer = 0;
    }
    if (player.animationStatus) {
        player.animationTimer += DELTA;
        if (player.animationStatus == ANIMATIONS.WALKING) {
            let dir = vec2.sub(vec2.create(), player.goal, player.position);
            let dist = vec2.length(dir);
            vec2.scale(dir, dir, Math.min(player.speed * DELTA / dist, 1));
            vec2.add(player.position, player.position, dir)
            if (dist < 0.01 || (player.animationTimer > DELTA && player.actualSpeed < 0.5 * player.speed)) {
                player.animationTimer = 0;
                player.animationStatus = 0;
                if (vec2.distance(player.position, player.goal) < 0.5 && !doubleClick) {
                    if (hitAnimal(true)) {
                        player.animationStatus = ANIMATIONS.FIGHTING;
                    } else if (refuelFire()) {
                    } else if (cookFood()) {
					} else if (layDown()) {
                    } else if (vec2.length(player.position) < PICK_UP_RADIUS) {
                        player.animationStatus = ANIMATIONS.CRAFTING;
                    } else if (pickUp()) {
                    } else if (chopDownTree(true)) {
                        player.animationStatus = ANIMATIONS.CHOPPING;
                    } else if (mineStone(true)) {
                        player.animationStatus = ANIMATIONS.MINING;
                    }
                }
            } else {
            }
        } else if (player.animationStatus == ANIMATIONS.CHOPPING) {
            if (player.animationTimer >= TIME_TO_CHOP_DOWN_TREE) {
                player.animationTimer = 0;
                player.animationStatus = 0;
                chopDownTree(false);
            }
        } else if (player.animationStatus == ANIMATIONS.MINING) {
            if (player.animationTimer >= TIME_TO_MINE_STONE) {
                player.animationTimer = 0;
                player.animationStatus = 0;
                mineStone(false);
            }
        } else if (player.animationStatus == ANIMATIONS.FIGHTING) {
            if (player.animationTimer >= 0.5) {
                player.animationTimer = 0;
                player.animationStatus = 0;
                hitAnimal(false);
            }
        }
    }

    handleCollision(player, 0.3);
    player.actualSpeed = vec2.distance(player.lastPosition, player.position) / DELTA;
    vec2.copy(player.lastPosition, player.position);

    // ANIMALS
    for (let animal of animals) {
        let dir = vec2.sub(vec2.create(), player.position, animal.position);
        let dist = vec2.len(dir);
        animal.animationTimer += DELTA;

        if (animal.animationStatus == ANIMAL_ANIMATION.ATTACKING && animal.animationTimer >= 1) {
            animal.animationStatus = 0;
            animal.animationTimer = 0;
        }

        if (animal.animationStatus != ANIMAL_ANIMATION.ATTACKING && dist < 3 && vec2.length(player.position) > fire.fuel * 2) {
            animal.animationStatus = ANIMAL_ANIMATION.HUNTING;
        } else if (animal.animationStatus == ANIMAL_ANIMATION.HUNTING) {
            animal.animationStatus = 0;
            animal.animationTimer = 0;
        }
        if (animal.animationStatus == ANIMAL_ANIMATION.HUNTING && dist < 0.5) {
            animal.animationStatus = ANIMAL_ANIMATION.ATTACKING;
            animal.animationTimer = 0;
            player.energy -= animal.damage;
        }

        if (animal.animationStatus == ANIMAL_ANIMATION.HUNTING) {
            vec2.scale(dir, dir, animal.speed * DELTA / dist);
            vec2.add(animal.position, animal.position, dir);
        } else if (animal.animationStatus == ANIMAL_ANIMATION.WALKING) {
            vec2.add(animal.position, animal.position, vec2.scale(dir, animal.walkingDir, DELTA * animal.speed));
            if (animal.animationTimer >= 0) {
                animal.animationTimer = -Math.random() - 1;
                animal.animationStatus = 0;
            }
        } else if (animal.animationStatus == 0) {
            if (animal.animationTimer >= 0) {
                animal.animationTimer = -Math.random() - 1;
                animal.walkingDir = vec2.random(vec2.create());
                animal.animationStatus = ANIMAL_ANIMATION.WALKING;
                let dirToQuarry = vec2.sub(vec2.create(), quarry.position, animal.position);
                vec2.scale(dirToQuarry, dirToQuarry, 1/3);
                vec2.add(animal.walkingDir, animal.walkingDir, dirToQuarry);
                vec2.normalize(animal.walkingDir, animal.walkingDir);
            }
        }
        handleCollision(animal, fire.fuel * 2);
    }
}

function handleCollision(obj, fireRadius) {
    for (let tree of trees) {
        let dir = vec2.sub(vec2.create(), tree.position, obj.position);
        let dist = vec2.len(dir);
        if (dist < 0.2) {
            vec2.scale(dir, dir, -(0.2 - dist)/dist);
            vec2.add(obj.position, obj.position, dir);
        }
    }

    let dir = vec2.clone(obj.position);
    let dist = vec2.len(dir);
    if (dist < fireRadius) {
        vec2.scale(dir, dir, (fireRadius - dist)/dist);
        vec2.add(obj.position, obj.position, dir);
    }

    dir = vec2.sub(vec2.create(), quarry.position, obj.position);
    dist = vec2.len(dir);
    if (dist < 0.3) {
        vec2.scale(dir, dir, -(0.3 - dist)/dist);
        vec2.add(obj.position, obj.position, dir);
    }
}
