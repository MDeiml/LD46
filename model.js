import { vec2 } from './gl-matrix-min.js'

export let canvas;
export let gl;
export const FPS = 60;
export const FRAME_TIME = 1000 / FPS;
export const DELTA = 1 / FPS;

export let items = [];

// Just the player
export let player = {
    position: vec2.create()
};

export function setCanvas(c) {
    canvas = c;
    gl = canvas.getContext('webgl');
}
