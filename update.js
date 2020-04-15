import { DELTA, player } from './model.js'
import { key } from './input.js'

export function init() {
    player.position = vec2.fromValues(0, 0);
}

// main update function (called every DELTA seconds)
export function update() {
	// hi its me
    if (key('KeyD')) {
        vec2.add(player.position, player.position, vec2.fromValues(DELTA, 0));
    }
}
