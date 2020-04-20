import { DELTA, player, createTree, initTrees, items, initItems, Item, ITEMS, pickUp, fire, chopDownTree,
	layDown, refuelFire, ANIMATIONS, PICK_UP_RADIUS, upgradeFire, craft, trees, animals, initDecorations,
	initQuarry, mineStone, quarry, hitAnimal, gui, GAME_STATUS, spawnAnimal,
	ENERGY_DEPLETING_SPEED, ANIMAL_ANIMATION, cookFood, eatFood, tutorial, initStartingItems, initLake,
	fishFish, TOOLS, canCraft, FOOD, lake, timeToHarvest, canvas, reset } from './model.js';
import { mousePos, doubleClick, clickHandled, mouseOverPos } from './input.js';
import { vec2 } from './gl-matrix-min.js'
import { playAudio } from './audio.js'

export function init() {
	initLake();
	initQuarry();
	initStartingItems();
    initTrees();
	initItems();
	initDecorations();
}

// main update function (called every DELTA seconds)
export function update() {
    if (tutorial.type == 8) {
        tutorial.timer += DELTA;
        if (tutorial.timer >= 5) {
            tutorial.enabled = false;
            spawnAnimal();
        }
    }
    if (fire.fuel <= 0 || player.energy <= 0) {
		gui.gameStatus = GAME_STATUS.GAME_OVER;
		playAudio('oof');
    }
    if (fire.size == 3) {
        gui.gameStatus = GAME_STATUS.WIN;
    }
    if (gui.gameStatus == GAME_STATUS.MENU) {
        if (mousePos) {
            gui.gameStatus = GAME_STATUS.PLAYING;
            if (checkMobile()) {
                canvas.requestFullscreen();
            }
            return;
        }
    }
    if (gui.gameStatus == GAME_STATUS.GAME_OVER || gui.gameStatus == GAME_STATUS.WIN) {
        if (mousePos) {
            reset();
            init();
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
        for (let i = 0; i < 6; i++) {
            let angle = Math.PI * i / 5;
            let point = vec2.fromValues(3 * Math.sin(angle), 3 * Math.cos(angle));
            if (vec2.distance(mousePos, point) < 0.75) {
				if (i == 0) {
					if(upgradeFire()) {
                        player.animationStatus = 0;
                    }
				} else {
					if (craft(i-1) !== null) {
                        player.animationStatus = 0;
                    }
				}
                if (tutorial.type == 4) {
                    tutorial.type = 5;
                    tutorial.position = vec2.fromValues(-0.5, 2);
                }
                clickHandled();
                break;
            }
        }
    }
    if (mousePos) {
		vec2.sub(player.goal, mousePos, vec2.fromValues(0, 0.3));
        if (player.animationStatus != ANIMATIONS.FIGHTING) {
            if (vec2.distance(player.goal, player.position) > 0.5) {
                player.animationStatus = ANIMATIONS.WALKING;
                player.animationTimer = 0;
            } else if (eatFood()) {
                if (tutorial.type == 7) {
                    tutorial.type = 8;
                }
            } else {
                player.animationStatus = ANIMATIONS.WALKING;
                player.animationTimer = 0;
            }
        }
    }
    if (tutorial.type == 2 && canCraft(TOOLS.AXE)) {
        tutorial.type = 3;
        tutorial.position = vec2.fromValues(0, 0);
    }
    if (player.animationStatus) {
        let oldAnimationTimer = player.animationTimer;
        player.animationTimer += DELTA;

        if (player.animationStatus == ANIMATIONS.WALKING) {
            if (hitAnimal(true)) {
                player.animationStatus = ANIMATIONS.FIGHTING;
            }
        }

        if (player.animationStatus == ANIMATIONS.WALKING) {
            let dir = vec2.sub(vec2.create(), player.goal, player.position);
            let dist = vec2.length(dir);
            vec2.scale(dir, dir, Math.min(player.speed * DELTA / dist, 1));
            vec2.add(player.position, player.position, dir)
            let oldCarrying = player.carrying;
            if (dist < 0.01 || (player.animationTimer > DELTA && player.actualSpeed < 0.5 * player.speed)) {
                player.animationTimer = 0;
                player.animationStatus = 0;
                if (vec2.distance(player.position, player.goal) < 0.5 && !doubleClick) {
                    if (hitAnimal(true)) {
                        player.animationStatus = ANIMATIONS.FIGHTING;
                    } else if (refuelFire()) {
                        if (tutorial.type == 1) {
                            tutorial.type = 2;
                            tutorial.position = vec2.fromValues(3, 1);
                        }
                    } else if (cookFood()) {
                        if (tutorial.type == 6) {
                            tutorial.type = 7;
                            tutorial.position = null;
                        }
					} else if (layDown()) {
                        if (oldCarrying == ITEMS.STONE) {
                            playAudio('drop_stone');
                        } else if (oldCarrying == ITEMS.WOOD) {
                            playAudio('drop_wood');
                        }
                    } else if (vec2.length(player.position) < PICK_UP_RADIUS) {
                        player.animationStatus = ANIMATIONS.CRAFTING;
                        if (tutorial.type == 3) {
                            tutorial.type = 4;
                            tutorial.position = null;
                        }
                    } else if (pickUp()) {
                        if (tutorial.type == 0 && player.carrying == ITEMS.WOOD) {
                            tutorial.type = 1;
                            tutorial.position = vec2.fromValues(0, 0);
                        }
                        if (tutorial.type == 2 && player.carrying == ITEMS.STONE) {
                            tutorial.position = null;
                        }
                        if (tutorial.type == 6 && player.carrying == FOOD.MEAT) {
                            tutorial.position = vec2.fromValues(0, 0);
                        }
                    } else if (chopDownTree(true)) {
                        player.animationStatus = ANIMATIONS.CHOPPING;
                    } else if (mineStone(true)) {
                        player.animationStatus = ANIMATIONS.MINING;
                    } else if (fishFish(true)) {
                        player.animationStatus = ANIMATIONS.FISHING;
                    }
                }
            } else {
            }
        } else if (player.animationStatus == ANIMATIONS.CHOPPING) {
            if (Math.ceil(oldAnimationTimer + 0.5) != Math.ceil(player.animationTimer + 0.5)) {
                playAudio('hack');
            }
            if (player.animationTimer >= timeToHarvest) {
                player.energy -= 10;
                player.animationTimer = 0;
                player.animationStatus = 0;
                chopDownTree(false);
                if (tutorial.type == 5) {
                    tutorial.type = 6;
                    tutorial.position = vec2.fromValues(2, -1);
                }
                playAudio('tree_down');
            }
        } else if (player.animationStatus == ANIMATIONS.MINING) {
			if (Math.ceil(oldAnimationTimer + 0.5) != Math.ceil(player.animationTimer + 0.5)) {
                playAudio('mining');
            }
            if (player.animationTimer >= timeToHarvest) {
                player.energy -= 20;
                player.animationTimer = 0;
                player.animationStatus = 0;
                mineStone(false);
                playAudio('drop_stone');
            }
        } else if (player.animationStatus == ANIMATIONS.FISHING) {
			if (Math.ceil(oldAnimationTimer + 0.5) != Math.ceil(player.animationTimer + 0.5)) {
                playAudio('fishing');
            }
            if (player.animationTimer >= timeToHarvest) {
                player.energy -= 10;
                player.animationTimer = 0;
                player.animationStatus = 0;
                fishFish(false);
				// TODO: Fishing Audio
				// playAudio('drop_stone');
            }
        } else if (player.animationStatus == ANIMATIONS.FIGHTING) {
			if (Math.ceil(oldAnimationTimer + 0.5) != Math.ceil(player.animationTimer + 0.5)) {
                playAudio('knife');
            }
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
            animal.facingLeft = dir[0] < 0;
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
                animal.facingLeft = animal.walkingDir[0] < 0;
            }
        }
        handleCollision(animal, fire.fuel * 2);
    }

    for (let tree of trees) {
        if (player.currentTool == TOOLS.AXE && vec2.distance(mouseOverPos, tree.position) < 1) {
            tree.highlight = true;
        } else {
            tree.highlight = false;
        }
    }

    for (let item of items) {
        item.highlight = vec2.distance(mouseOverPos, item.pos) < PICK_UP_RADIUS;
    }

    quarry.highlight = player.currentTool == TOOLS.PICKAXE && vec2.distance(mouseOverPos, quarry.position) < 1;

    lake.highlight = player.currentTool == TOOLS.FISHING_ROD && vec2.distance(mouseOverPos, lake.position) < 1;
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
        vec2.scale(dir, dir, Math.min(DELTA * 2, fireRadius - dist)/dist);
        vec2.add(obj.position, obj.position, dir);
    }

    dir = vec2.sub(vec2.create(), quarry.position, obj.position);
    dist = vec2.len(dir);
    if (dist < 0.3) {
        vec2.scale(dir, dir, -(0.3 - dist)/dist);
        vec2.add(obj.position, obj.position, dir);
    }

    dir = vec2.sub(vec2.create(), lake.position, obj.position);
    dist = vec2.len(dir);
    if (dist < 0.5) {
        vec2.scale(dir, dir, -(0.5 - dist)/dist);
        vec2.add(obj.position, obj.position, dir);
    }
}

function checkMobile() {
  let check = false;
  (function(a){if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0,4))) check = true;})(navigator.userAgent||navigator.vendor||window.opera);
  return check;
};
