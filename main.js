import { canvas, gl, setCanvas, FRAME_TIME } from './model.js'
import { initGL, render, updateProjection } from './render.js'
import { initInput, updateInput } from './input.js'
import { update, init } from './update.js'
import { updateAudio, initAudio } from './audio.js';

window.running = false;
let unprocessed = 0;
let lastTick;

// setup everything and start game loop
function main() {
    setCanvas(document.getElementById('glCanvas'));
    initGL();
    initInput();
    initAudio();
    init();

    window.running = true;
    requestAnimationFrame(tick);
    window.addEventListener('resize', resize);
    window.addEventListener('orientationchange', resize);
    window.addEventListener('fullscreenchange', resize);
}

function resize(event) {
    let w = canvas.clientWidth;
    let h = canvas.clientHeight;
    canvas.width = w;
    canvas.height = h;
    gl.viewport(0, 0, w, h);
    updateProjection();
}

// main game loop
// update exactly 60 times per second
// render as necessary (and possible)
function tick(now) {
    if (!lastTick) {
        lastTick = now;
    }

    unprocessed += now - lastTick;
    lastTick = now;

    if (unprocessed >= 1000) {
        // this means game has probably stopped running (e.g. computer was turned off)
        unprocessed = 0;
    }

    let shouldRender = false;
    let fps = 0;
    while (unprocessed >= FRAME_TIME) {
        unprocessed -= FRAME_TIME;
        updateInput();
        update();
        updateAudio();
        shouldRender = true;
        fps += 1;
    }

    // don't render if there was no update
    if (shouldRender) {
        render();
    }

    if (window.running) {
        requestAnimationFrame(tick);
    }
}

main();
