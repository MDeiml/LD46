import { gl, canvas, items, ITEMS, player, trees } from './model.js'
import { mat4, vec3, vec2, quat } from './gl-matrix-min.js'

let positionAttribute, texCoordAttribute;
let matrixUniform, textureUniform, modelUniform;
let squareBuffer, squareTexCoordBuffer;
export let projectionMatrix;
export let invProjectionMatrix;

let treeTextures = [];
let itemTextures = {};
let backgroundTexture;
let fireTexture;
let playerTexture;

// main render function
export function render() {
    drawTexture(backgroundTexture, vec2.fromValues(-50, -50), vec2.fromValues(100, 100));

    // draw fire
    drawTexture(fireTexture, vec2.fromValues(-0.5, -0.5));

    // draw player
    drawTexture(playerTexture, player.position);
    if (player.carrying) {
        let offset = vec2.fromValues(0, 0);
        vec2.add(offset, offset, player.position);
        drawTexture(itemTextures[player.carrying], offset);
    }

    // draw items
    for (let item of items) {
        drawTexture(itemTextures[item.id], item.pos);
    }

    // draw trees
    for (let tree of trees) {
        drawTexture(treeTextures[tree.type], tree.position, vec2.fromValues(2, 2));
    }
}

function drawTexture(id, position, scale) {
    if (!scale) {
        scale = vec3.fromValues(1, 1, 1);
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, squareBuffer);
    gl.vertexAttribPointer(positionAttribute, 3, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, squareTexCoordBuffer);
    gl.vertexAttribPointer(texCoordAttribute, 2, gl.FLOAT, false, 0, 0);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, id);
    gl.uniform1i(textureUniform, 0);

    let transform = mat4.create();
    mat4.fromRotationTranslationScale(transform, quat.create(), vec3.fromValues(position[0], position[1], 0), vec3.fromValues(scale[0], scale[1], 0));
    gl.uniformMatrix4fv(modelUniform, false, transform)
    mat4.mul(transform, projectionMatrix, transform);
    gl.uniformMatrix4fv(matrixUniform, false, transform);

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
}

// has to be called before calling render
export function initGL() {
    gl.clearColor(42/255, 51/255, 81/255, 1);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    initShaders();
    initSquare();

    for (let i = 0; i < 4; i++) {
        treeTextures.push(loadTexture('./textures/tree' + i + '.svg'));
    }
    itemTextures[ITEMS.WOOD] = loadTexture('./textures/wood_trunk.svg');
    fireTexture = loadTexture('./textures/fire0.svg');
    backgroundTexture = whiteTexture();
    playerTexture = loadTexture('./textures/character.svg');

    let aspect = canvas.width / canvas.height;
    projectionMatrix = mat4.create();
    mat4.ortho(projectionMatrix, -aspect, aspect, -1, 1, -1, 1);
    mat4.scale(projectionMatrix, projectionMatrix, vec3.fromValues(0.2, 0.2, 1));
    invProjectionMatrix = mat4.create();
    mat4.invert(invProjectionMatrix, projectionMatrix);
}

function initShaders() {
    const vs = getShader('shader-vs');
    const fs = getShader('shader-fs');

    const program = gl.createProgram();
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        alert('Error when linking shaders');
    }

    gl.useProgram(program);

    positionAttribute = gl.getAttribLocation(program, 'position');
    gl.enableVertexAttribArray(positionAttribute);

    texCoordAttribute = gl.getAttribLocation(program, 'texCoord');
    gl.enableVertexAttribArray(texCoordAttribute);

    matrixUniform = gl.getUniformLocation(program, 'MVP');
    modelUniform = gl.getUniformLocation(program, 'M');
    textureUniform = gl.getUniformLocation(program, 'texture');
}

function getShader(id) {
    const elem = document.getElementById(id);
    let source = '';
    let child = elem.firstChild;
    while (child) {
        if (child.nodeType == 3) {
            source += child.textContent;
        }
        child = child.nextSibling;
    }

    let shader;
    if (elem.type == 'x-shader/x-vertex') {
        shader = gl.createShader(gl.VERTEX_SHADER);
    } else if (elem.type == 'x-shader/x-fragment') {
        shader = gl.createShader(gl.FRAGMENT_SHADER);
    } else {
        alert('Invalid script type for shader: ' + elem.type);
    }

    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        alert('Error when compiling shader "' + id + '": ' + gl.getShaderInfoLog(shader));
    }

    return shader;
}

function initSquare() {
    squareBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, squareBuffer);
    const vertices = [
        1, 1, 0,
        0, 1, 0,
        1, 0, 0,
        0, 0, 0
    ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

    squareTexCoordBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, squareTexCoordBuffer);
    const texCoords = [
        1, 0,
        0, 0,
        1, 1,
        0, 1
    ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texCoords), gl.STATIC_DRAW);
}

function whiteTexture() {
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([255, 255, 255, 255]));
    return texture;
}

function loadTexture(url) {
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 255, 255]));

    const image = new Image();
    image.onload = function () {
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);

        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    };
    image.src = url;
    return texture;
}
