import { DELTA, player, createTree, initTrees, items, initItems, Item, ITEMS, pickUp } from './model.js';
import { mousePos, doubleClick } from './input.js';
import { vec2 } from './gl-matrix-min.js'

export function init() {
    initTrees();
	initItems();
}

// main update function (called every DELTA seconds)
export function update() {
    if (mousePos) {
        vec2.copy(player.goal, mousePos);
        player.walking = true;
    }
    if (player.walking) {
        player.walkingTimer += DELTA;
        let dir = vec2.sub(vec2.create(), player.goal, player.position);
        let dist = vec2.length(dir);
        if (dist < player.speed * DELTA) {
            vec2.copy(player.position, player.goal);
            player.walking = false;
            player.walkingTimer = 0;
            if (doubleClick) {
                pickUp();
            }
        } else {
            vec2.scale(dir, dir, player.speed * DELTA / dist);
            vec2.add(player.position, player.position, dir)
        }
    }
}
