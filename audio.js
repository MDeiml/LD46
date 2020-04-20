import { player, ANIMATIONS, gui, GAME_STATUS } from './model.js';
import { vec2 } from './gl-matrix-min.js'

let sounds = {};

export function initAudio() {
    sounds['step'] = new Audio('./sounds/steps.ogg');
    sounds['step'].loop = true;
    sounds['fire'] = new Audio('./sounds/fire.ogg');
    sounds['fire'].loop = true;
}

export function updateAudio() {
    sounds['fire'].volume = 1 / Math.max(1, vec2.length(player.position));
    if (gui.gameStatus == GAME_STATUS.PLAYING && sounds['fire'].paused) {
        sounds['fire'].play();
    }
    if (player.animationStatus == ANIMATIONS.WALKING && sounds['step'].paused) {
        sounds['step'].play();
    } else if (player.animationStatus != ANIMATIONS.WALKING && !sounds['step'].paused) {
        sounds['step'].pause();
        sounds['step'].currentTime = 0;
    }
}
