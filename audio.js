import { player, ANIMATIONS } from './model.js';
import { vec2 } from './gl-matrix-min.js'
let stepAudio;
let fireAudio;

export function initAudio() {
    stepAudio = new Audio('./sounds/steps.ogg');
    stepAudio.loop = true;
    fireAudio = new Audio('./sounds/fire.ogg');
    fireAudio.loop = true;
}

export function updateAudio() {
    fireAudio.volume = 1 / Math.max(1, vec2.length(player.position));
    // TODO: remove this (after creating menu)
    if (player.animationStatus == ANIMATIONS.WALKING && fireAudio.paused) {
        fireAudio.play();
    }
    if (player.animationStatus == ANIMATIONS.WALKING && stepAudio.paused) {
        stepAudio.play();
    } else if (player.animationStatus != ANIMATIONS.WALKING && !stepAudio.paused) {
        stepAudio.pause();
        stepAudio.currentTime = 0;
    }
}
