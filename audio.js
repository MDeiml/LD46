import { player, ANIMATIONS, gui, GAME_STATUS } from './model.js';
import { vec2 } from './gl-matrix-min.js'

let sounds = {};

export function initAudio() {
    sounds['step'] = new Audio('./sounds/steps.ogg');
    sounds['step'].loop = true;
    sounds['fire'] = new Audio('./sounds/realfire0.ogg');
    sounds['fire'].loop = true;
    sounds['drop_wood'] = new Audio('./sounds/drop_wood0.wav');
    sounds['drop_stone'] = new Audio('./sounds/drop_stone0.wav');
    sounds['hack'] = new Audio('./sounds/hack0.wav');
    sounds['tree_down'] = new Audio('./sounds/tree_down0.wav');
    sounds['music'] = new Audio('./sounds/music.ogg');
    sounds['music'].loop = true;
    sounds['cooking'] = new Audio('./sounds/cooking0.ogg');
    sounds['eating'] = new Audio('./sounds/eating0.ogg');
    sounds['fishing'] = new Audio('./sounds/fishing_rod0.ogg');
    sounds['knife'] = new Audio('./sounds/knife0.ogg');
    sounds['oof'] = new Audio('./sounds/oof0.ogg');
    sounds['mining'] = new Audio('./sounds/stoneChipping0.ogg');
	sounds['water'] = new Audio('./sounds/water0.ogg');
	sounds['water'].loop = true;
    sounds['willhelm'] = new Audio('./sounds/wilhelmscream.ogg');
}

export function playAudio(name) {
    sounds[name].play();
}

export function updateAudio() {
    sounds['fire'].volume = 1 / Math.max(1, vec2.length(player.position));
    if (gui.gameStatus == GAME_STATUS.PLAYING && sounds['fire'].paused) {
        sounds['fire'].play();
        sounds['music'].play();
    }
    if (player.animationStatus == ANIMATIONS.WALKING && sounds['step'].paused) {
        sounds['step'].play();
    } else if (player.animationStatus != ANIMATIONS.WALKING && !sounds['step'].paused) {
        sounds['step'].pause();
        sounds['step'].currentTime = 0;
    }

    if (gui.gameStatus != GAME_STATUS.PLAYING && !sounds['fire'].paused) {
        for (let sound in sounds) {
            if (sound == 'willhelm') {
                continue;
            }
            sounds[sound].pause();
            sounds[sound].currentTime = 0;
        }
    }
}
