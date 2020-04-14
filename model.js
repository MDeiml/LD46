export let canvas;
export let gl;
export const FPS = 60;
export const FRAME_TIME = 1000 / FPS;
export const DELTA = 1 / FPS;

export let player = {
    position: null
};

export function setCanvas(c) {
    canvas = c;
    gl = canvas.getContext('webgl');
}
