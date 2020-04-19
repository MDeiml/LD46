import { gl, canvas, items, ITEMS, player, trees, fire, TOOLS, ANIMATIONS, facingLeft, animals, canCraft } from './model.js'
import { mat4, vec3, vec2, quat } from './gl-matrix-min.js'

let positionAttribute, texCoordAttribute;
let matrixUniform, textureUniform, modelUniform, fireIntesityUniform;
let squareBuffer, squareTexCoordBuffer;
let projectionMatrix;
let pvMatrix = mat4.create();
export let invPvMatrix = mat4.create();

let treeTextures = [];
let itemTextures = {};
let backgroundTexture;
let fireTextures = [];
let toolTextures = [];
let playerTexture;
let circleTexture;
let animalTextures = [];

let flicker = 0;
let flickerTimer = 0;

let shadowTexture;
let shadowFramebuffer;

function vec2ToVec3(v) {
    return vec3.fromValues(v[0], v[1], 0);
}

// main render function
export function render() {
    if (fire.animationTime - flickerTimer > 0.25) {
        flicker = Math.random();
        flickerTimer += 0.25;
    }

    mat4.fromTranslation(pvMatrix, vec3.fromValues(-player.position[0], -player.position[1], 0));
    mat4.mul(pvMatrix, projectionMatrix, pvMatrix);
    mat4.invert(invPvMatrix, pvMatrix);

    let transform = mat4.create();
    mat4.fromRotationTranslationScale(transform, quat.fromEuler(quat.create(), -90, 0, 0), vec3.fromValues(0, -50, 0), vec3.fromValues(100, 100, 100));
    drawTexture(backgroundTexture, transform);
    drawObjects();
    if (player.animationStatus == ANIMATIONS.CRAFTING) {
        for (let i = 0; i < 9; i++) {
            let angle = Math.PI * i / 5;
            mat4.fromTranslation(transform, vec3.fromValues(Math.sin(angle) * 2, Math.cos(angle) * 2 - 0.5, 0));
            drawTexture(circleTexture, transform);
            mat4.translate(transform, transform, vec3.fromValues(0, 0.3, 0));
            if (i == 0) {
				// TODO: watch out fire.size + 1 isn't out of bounds
				if (fireTextures[fire.size + 1] != null) {
					drawTexture(fireTextures[fire.size + 1][0], transform, 2);
				}
            } else {
                if (canCraft(i-1)) {
					drawTexture(toolTextures[i - 1], transform, 2);
				}
            }
        }
    }
}


function drawObjects() {
    let transform = mat4.create();

    // draw fire
    mat4.identity(transform);
    drawTexture(fireTextures[fire.size][Math.floor(fire.animationTime * 4) % 4], transform, 1);

    // draw player
    let angle = player.animationStatus == ANIMATIONS.WALKING ? Math.pow(Math.sin(player.animationTimer * 5), 2) * 10 : 0;
	mat4.fromRotationTranslationScale(transform, quat.fromEuler(quat.create(), 0, angle, 0), vec2ToVec3(player.position),
			vec3.fromValues(facingLeft()?-1:1, 1, 1));
    drawTexture(playerTexture, transform);
    if (player.carrying) {
        mat4.translate(transform, transform, vec3.fromValues(0, 0, 0.3));
        drawTexture(itemTextures[player.carrying], transform);
    } else if (player.currentTool != null) {
        mat4.translate(transform, transform, vec3.fromValues(0, 0, 0.3));
        if (player.animationStatus == ANIMATIONS.CHOPPING) {
            mat4.rotate(transform, transform, Math.max(0, Math.sin(player.animationTimer * Math.PI * 2)), vec3.fromValues(0, -1, 0));
        }
        drawTexture(toolTextures[player.currentTool], transform);
    }

    // draw animals
    for (let animal of animals) {
		mat4.fromTranslation(transform, vec2ToVec3(animal.position));
        drawTexture(animalTextures[animal.type], transform);
    }

    // draw items
    for (let item of items) {
		mat4.fromTranslation(transform, vec2ToVec3(item.pos));
        drawTexture(itemTextures[item.id], transform);
    }

    // draw trees
    for (let tree of trees) {
        mat4.fromRotationTranslationScale(transform, quat.create(), vec2ToVec3(tree.position), vec3.fromValues(tree.direction ? 2 : -2, 2, 2));
        drawTexture(treeTextures[tree.type], transform);
    }
}

function drawTexture(id, transform, lighting) {
    gl.bindBuffer(gl.ARRAY_BUFFER, squareBuffer);
    gl.vertexAttribPointer(positionAttribute, 3, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, squareTexCoordBuffer);
    gl.vertexAttribPointer(texCoordAttribute, 2, gl.FLOAT, false, 0, 0);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, id);
    gl.uniform1i(textureUniform, 0);

    gl.uniformMatrix4fv(modelUniform, false, transform)
    let mvp = mat4.create();
    mat4.mul(mvp, pvMatrix, transform);
    gl.uniformMatrix4fv(matrixUniform, false, mvp);
    let intensity = fire.fuel * 2 + flicker * 0.2;
    intensity = intensity * intensity;
    if (lighting == 1) {
        intensity = 4;
    } else if (lighting == 2) {
        intensity = -1;
    }
    gl.uniform1f(fireIntesityUniform, intensity);

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

    for (let i = 0; i < 4; i++) {
        fireTextures.push(loadTexture('./textures/fire' + i + '.svg'));
    }
    fireTextures = [fireTextures];
    let campfireTextures = [];
    for (let i = 0; i < 1; i++) {
        campfireTextures.push(loadTexture('./textures/campfire' + i + '.svg'));
    }
    fireTextures.push(campfireTextures);

    toolTextures[TOOLS.ARROW] = loadTexture('./textures/arrow.svg');
    toolTextures[TOOLS.AXE] = loadTexture('./textures/axe.svg');
    toolTextures[TOOLS.BOW] = loadTexture('./textures/bow.svg');
    toolTextures[TOOLS.FISHING_ROD] = loadTexture('./textures/fishingrod.svg');
    toolTextures[TOOLS.KNIFE] = loadTexture('./textures/knife.svg');
    toolTextures[TOOLS.PICKAXE] = loadTexture('./textures/pickaxe.svg');
    toolTextures[TOOLS.SPEAR] = loadTexture('./textures/spear.svg');
    toolTextures[TOOLS.TORCH] = loadTexture('./textures/torch.svg');
    itemTextures[ITEMS.WOOD] = loadTexture('./textures/wood_trunk.svg');
    itemTextures[ITEMS.STONE] = loadTexture('./textures/stone.svg');
    animalTextures[0] = loadTexture('./textures/wolf.svg');
    animalTextures[1] = loadTexture('./textures/bear.svg');
    backgroundTexture = whiteTexture();
    playerTexture = loadTexture('./textures/character.svg');
    circleTexture = loadTexture('./textures/circle.svg');

    updateProjection();
}

export function updateProjection() {
    let aspect = canvas.width / canvas.height;
    projectionMatrix = mat4.create();
    mat4.ortho(projectionMatrix, -aspect, aspect, -1, 1, -1, 1);
    mat4.scale(projectionMatrix, projectionMatrix, vec3.fromValues(0.2, 0.2, 0.2));
    mat4.mul(projectionMatrix, projectionMatrix,
        mat4.fromValues(1, 0, 0, 0,
                        0, 1, 0, 0,
                        0, 1, 1, 0,
                        0, 0, 0, 1));

    if (shadowTexture) {
        gl.deleteTexture(shadowTexture);
        gl.deleteFramebuffer(shadowFramebuffer);
    }
    shadowTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, shadowTexture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, canvas.width, canvas.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    shadowFramebuffer = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, shadowFramebuffer);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, shadowTexture, 0);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
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
    fireIntesityUniform = gl.getUniformLocation(program, 'fireIntensity');
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
        0.5, 0, 1,
        -0.5, 0, 1,
        0.5, 0, 0,
        -0.5, 0, 0
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
