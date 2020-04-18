import { DELTA, player } from './model.js';
import { mousePos } from './input.js';
import { vec2 } from './gl-matrix-min.js'

// main update function (called every DELTA seconds)
export function update() {
    if (mousePos) {
        vec2.copy(player.position, mousePos);
    }
}
