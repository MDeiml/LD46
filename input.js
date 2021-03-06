import { canvas, DELTA } from './model.js';
import { vec2, vec3 } from './gl-matrix-min.js'
import { invPvMatrix } from './render.js'

let keys = {};
let lastKeys = {};
let nextKeys = {};
let nextMousePos = null;
export let mousePos = null;
export let doubleClick = false;
export let mouseOverPos = vec2.create();

let lastClick = 0;

export function initInput() {
    document.addEventListener('keydown', function (event) {
        nextKeys[event.code] = true;
    });
    document.addEventListener('keyup', function (event) {
        nextKeys[event.code] = false;
    });
    canvas.addEventListener('mousedown', function (event) {
        let v = vec3.fromValues(event.offsetX / canvas.width * 2 - 1, 1 - event.offsetY / canvas.height * 2, 0);
        vec3.transformMat4(v, v, invPvMatrix);
        nextMousePos = vec2.fromValues(v[0], v[1]);
        mouseOverPos = nextMousePos;
        if (lastClick < 0.5) {
            doubleClick = true;
        } else {
            doubleClick = false;
        }
        lastClick = 0;
    });
    canvas.addEventListener('mousemove', function (event) {
        let v = vec3.fromValues(event.offsetX / canvas.width * 2 - 1, 1 - event.offsetY / canvas.height * 2, 0);
        vec3.transformMat4(v, v, invPvMatrix);
        mouseOverPos = vec2.fromValues(v[0], v[1]);
    });
}

export function clickHandled() {
    mousePos = null;
}

export function updateInput() {
    lastClick += DELTA;
    Object.assign(lastKeys, keys);
    Object.assign(keys, nextKeys);
    mousePos = nextMousePos;
    nextMousePos = null;
}

export function key(code) {
    return code in keys && keys[code];
}

export function keyDown(code) {
    return key(code) && !(code in lastKeys && lastKeys[code]);
}
