import { gl, canvas, items, player } from './model.js'
import { mat4, vec3 } from './gl-matrix-min.js'

let positionAttribute, texCoordAttribute;
let matrixUniform, textureUniform;
let squareBuffer, squareTexCoordBuffer;
let projectionMatrix;

let testTexture;

// main render function
export function render() {
    // clear canvas to black
    gl.clear(gl.COLOR_BUFFER_BIT);

    drawTexture(testTexture, player.position);
    for (let item of items) {
        drawTexture(testTexture, item.position);
    }
}

function drawTexture(id, position) {
    gl.bindBuffer(gl.ARRAY_BUFFER, squareBuffer);
    gl.vertexAttribPointer(positionAttribute, 3, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, squareTexCoordBuffer);
    gl.vertexAttribPointer(texCoordAttribute, 2, gl.FLOAT, false, 0, 0);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, id);
    gl.uniform1i(textureUniform, 0);

    let transform = mat4.create();
    mat4.fromTranslation(transform, vec3.fromValues(position[0], position[1], 0));
    mat4.mul(transform, projectionMatrix, transform);
    gl.uniformMatrix4fv(matrixUniform, false, transform);

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
}

// has to be called before calling render
export function initGL() {
    gl.clearColor(0, 0, 0, 1);
    initShaders();
    initSquare();

    testTexture = loadTexture('./test.jpg');

    let aspect = canvas.width / canvas.height;
    projectionMatrix = mat4.create();
    mat4.ortho(projectionMatrix, -aspect, aspect, -1, 1, -1, 1);
    mat4.scale(projectionMatrix, projectionMatrix, vec3.fromValues(0.1, 0.1, 1));
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
        -1, 1, 0,
        1, -1, 0,
        -1, -1, 0
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
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    };
    image.src = url;
    return texture;
}
