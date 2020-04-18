import { vec2 } from './gl-matrix-min.js'

export let canvas;
export let gl;
export const FPS = 60;
export const FRAME_TIME = 1000 / FPS;
export const DELTA = 1 / FPS;

export let items = [];

export let player = {
    speed: 2,
    position: vec2.create(),
    goal: vec2.create(),
    walking: false
};

export const ITEMS = {
	AXE: 0,
	TORCH: 1,
	BOW: 2,
	ARROW: 3,
	SPEAR: 4,
	KNIFE: 5
}

export class Item {
	constructor(pos, id) {
		this.pos = pos;
		this.id = id;
	}
}

export function setCanvas(c) {
    canvas = c;
    gl = canvas.getContext('webgl');
}
