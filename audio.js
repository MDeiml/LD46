import { player, ANIMATIONS, gui, GAME_STATUS } from './model.js';
import { vec2 } from './gl-matrix-min.js'

let sounds = {};

export function initAudio() {
    sounds['step'] = new Audio('./sounds/steps.ogg');
    sounds['step'].loop = true;
    sounds['fire'] = new Audio('./sounds/fire.ogg');
    sounds['fire'].loop = true;
    sounds['drop_wood'] = new Audio('./sounds/drop_wood0.wav');
    sounds['drop_stone'] = new Audio('./sounds/drop_stone0.wav');
    sounds['hack'] = new Audio('./sounds/hack0.wav');
    sounds['tree_down'] = new Audio('./sounds/tree_down0.wav');
}

export function playAudio(name) {
    sounds[name].play();
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

    if (gui.gameStatus != GAME_STATUS.PLAYING && !sounds['fire'].paused) {
        for (let sound in sounds) {
            sounds[sound].pause();
            sounds[sound].currentTime = 0;
        }
    }
}
