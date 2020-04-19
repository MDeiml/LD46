import { player, ANIMATIONS } from './model.js';
let stepAudio;

export function initAudio() {
    stepAudio = new Audio('./sounds/steps.ogg');
    stepAudio.loop = true;
}

export function updateAudio() {
    if (player.animationStatus == ANIMATIONS.WALKING && stepAudio.paused) {
        stepAudio.play();
    } else if (player.animationStatus != ANIMATIONS.WALKING && !stepAudio.paused) {
        stepAudio.pause();
        stepAudio.currentTime = 0;
    }
}
