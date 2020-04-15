import { canvas } from './model.js';

let keys = {};
let lastKeys = {};
let nextKeys = {};

export function initInput() {
    document.addEventListener('keydown', function (event) {
        nextKeys[event.code] = true;
    });
    document.addEventListener('keyup', function (event) {
        nextKeys[event.code] = false;
    });
}

export function updateInput() {
    Object.assign(lastKeys, keys);
    Object.assign(keys, nextKeys);
}

export function key(code) {
    return code in keys && keys[code];
}

export function keyDown(code) {
    return key(code) && !(code in lastKeys && lastKeys[code]);
}
