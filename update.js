import { DELTA, player } from './model.js';
import { mousePos } from './input.js';
import { vec2 } from './gl-matrix-min.js'

// main update function (called every DELTA seconds)
export function update() {
    if (mousePos) {
        vec2.copy(player.goal, mousePos);
        player.walking = true;
    }
    if (player.walking) {
        let dir = vec2.sub(vec2.create(), player.goal, player.position);
        let dist = vec2.length(dir);
        if (dist < player.speed * DELTA) {
            vec2.copy(player.position, player.goal);
            player.walking = false;
        } else {
            vec2.scale(dir, dir, player.speed * DELTA / dist);
            vec2.add(player.position, player.position, dir)
        }
    }
}
