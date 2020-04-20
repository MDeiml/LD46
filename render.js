import { gl, canvas, items, ITEMS, player, trees, fire, TOOLS, ANIMATIONS, facingLeft, animals, getRecipe,
		decorations, quarry, stumps, gui, GAME_STATUS, MAX_ENERGY, ANIMAL_ANIMATION, FOOD, tutorial, FIRE_RADIUS } from './model.js'
import { mat4, vec3, vec2, quat } from './gl-matrix-min.js'

let positionAttribute, texCoordAttribute;
let matrixUniform, textureUniform, modelUniform, fireIntesityUniform, shadowTextureUniform, canvasSizeUniform;
let matrixUniformShadow, textureUniformShadow, modelUniformShadow;
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
let decorationTextures = [];
let stumpTextures = [];
let quarryTexture;
let energyTexture;
let firecircleTexture;
let markerTexture;

let winscreenTexture;
let menuTexture;

let flicker = 0;
let flickerTimer = 0;

let shadowTexture;
let shadowFramebuffer;

let defaultShader;
let shadowShader;
let shadowShaderActive = true;

let tutorialTextures = [];
let craftingTextures = [];

let drawOrder;

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

    gl.useProgram(shadowShader);
    shadowShaderActive = true;
    gl.bindFramebuffer(gl.FRAMEBUFFER, shadowFramebuffer);
    gl.clear(gl.COLOR_BUFFER_BIT);

    drawObjects();

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.useProgram(defaultShader);
    shadowShaderActive = false;

    let transform = mat4.create();
    mat4.fromRotationTranslationScale(transform, quat.fromEuler(quat.create(), -90, 0, 0), vec3.fromValues(0, -50, 0), vec3.fromValues(100, 100, 100));
    drawTexture(backgroundTexture, transform, 0, true);
    mat4.fromRotationTranslationScale(transform, quat.fromEuler(quat.create(), -90, 0, 0), vec3.fromValues(0, -FIRE_RADIUS, 0), vec3.fromValues(FIRE_RADIUS * 2, FIRE_RADIUS * 2, FIRE_RADIUS * 2));
    drawTexture(firecircleTexture, transform, 0, true);

    drawObjects();

    if (tutorial.enabled && gui.gameStatus == GAME_STATUS.PLAYING) {
        if (tutorial.position) {
            let pos = vec2ToVec3(tutorial.position)
            vec3.add(pos, pos, vec3.fromValues(0, 0, 0.3));
            mat4.fromRotationTranslationScale(transform, quat.create(), pos, vec3.fromValues(0.5, 0.5, 0.5));
            drawTexture(markerTexture, transform, 2, true);
        }
        mat4.fromRotationTranslationScale(transform, quat.fromEuler(quat.create(), -90, 0, 0), vec3.fromValues(0, -5, 0), vec3.fromValues(10, 10, 10));
        drawTexture(tutorialTextures[tutorial.type], transform, 2, true, true);
    }

    if (player.animationStatus == ANIMATIONS.CRAFTING) {
        for (let i = 0; i < 9; i++) {
            let angle = Math.PI * i / 5;
            mat4.fromTranslation(transform, vec3.fromValues(Math.sin(angle) * 2, Math.cos(angle) * 2 - 0.5, 0));
            drawTexture(circleTexture, transform, 2, true);
            if (i == 0) {
				// TODO: watch out fire.size + 1 isn't out of bounds
				if (craftingTextures[0] != null) {
					drawTexture(craftingTextures[0], transform, 2, true);
				}
            } else {
                // if (canCraft(i-1)) {
                if (player.tools[i - 1]) {
					drawTexture(toolTextures[i - 1], transform, 2, true);
                } else if (craftingTextures[i] != null && getRecipe(i - 1).neededFire <= fire.size) {
					drawTexture(craftingTextures[i], transform, 2, true);
				}
            }
        }
    }

    if (gui.gameStatus == GAME_STATUS.MENU) {
        mat4.fromRotationTranslationScale(transform, quat.fromEuler(quat.create(), -90, 0, 0), vec3.fromValues(0, -5, 0), vec3.fromValues(10, 10, 10));
        drawTexture(menuTexture, transform, 2, true, true);
    } else if (gui.gameStatus != GAME_STATUS.PLAYING) {
        mat4.fromRotationTranslationScale(transform, quat.fromEuler(quat.create(), -90, 0, 0), vec3.fromValues(0, -5, 0), vec3.fromValues(10, 10, 10));
        drawTexture(winscreenTexture, transform, 2, true, true);
    } else {
        mat4.fromRotationTranslationScale(transform, quat.fromEuler(quat.create(), -90, 0, 0), vec3.fromValues(0, -4.5, 0), vec3.fromValues(player.energy / MAX_ENERGY * 2, 0.2, 0.2));
        drawTexture(energyTexture, transform, 2, true, true);
    }
}


function drawObjects() {
    drawOrder = [];
    let transform = mat4.create();

    // draw decorations
    for (let decoration of decorations) {
		mat4.fromRotationTranslationScale(transform, quat.create(), vec2ToVec3(decoration.position), vec3.fromValues(0.5, 0.5, 0.5));
		drawTexture(decorationTextures[decoration.type], transform);
	}

    // draw decorations
    for (let stump of stumps) {
		mat4.fromRotationTranslationScale(transform, quat.create(), vec2ToVec3(stump.position), vec3.fromValues(2, 2, 2));
		drawTexture(stumpTextures[stump.type], transform);
	}
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
        if (player.animationStatus == ANIMATIONS.CHOPPING || player.animationStatus == ANIMATIONS.MINING || player.animationStatus == ANIMATIONS.FIGHTING) {
            mat4.rotate(transform, transform, Math.max(0, Math.sin(player.animationTimer * Math.PI * 2)), vec3.fromValues(0, -1, 0));
        }
        drawTexture(toolTextures[player.currentTool], transform);
    }

    // draw animals
    for (let animal of animals) {
        angle = 0;
        if (animal.animationStatus == ANIMAL_ANIMATION.WALKING) {
            angle = Math.pow(Math.sin(animal.animationTimer * 5), 2) * 10;
        } else if (animal.animationStatus == ANIMAL_ANIMATION.ATTACKING) {
            angle = -Math.max(0, Math.sin(animal.animationTimer * Math.PI * 2)) * 10;
        }
		mat4.fromRotationTranslation(transform, quat.fromEuler(quat.create(), 0, angle, 0), vec2ToVec3(animal.position));
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

	// draw quarry
	mat4.fromTranslation(transform, vec2ToVec3(quarry.position));
	drawTexture(quarryTexture, transform);

    drawOrder.sort(function (a, b) {
        return b.y - a.y;
    });
    for (let drawElement of drawOrder) {
        drawTexture(drawElement.id, drawElement.transform, drawElement.lighting, true);
    }
}

function drawTexture(id, transform, lighting, reallyDraw, isGUI) {
    if (!reallyDraw) {
        drawOrder.push({
            id,
            transform: mat4.clone(transform),
            lighting,
            y: mat4.getTranslation(vec3.create(), transform)[1]
        });
        return;
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, squareBuffer);
    gl.vertexAttribPointer(positionAttribute, 3, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, squareTexCoordBuffer);
    gl.vertexAttribPointer(texCoordAttribute, 2, gl.FLOAT, false, 0, 0);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, id);

    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, shadowTexture);

    if (shadowShaderActive) {
        gl.uniform1i(textureUniformShadow, 0);
        gl.uniformMatrix4fv(modelUniformShadow, false, transform)
        gl.uniformMatrix4fv(matrixUniformShadow, false, pvMatrix);
    } else {
        gl.uniform1i(textureUniform, 0);
        gl.uniform1i(shadowTextureUniform, 1);
        gl.uniformMatrix4fv(modelUniform, false, transform)
        let mvp = mat4.create();
        mat4.mul(mvp, isGUI ? projectionMatrix : pvMatrix, transform);
        gl.uniformMatrix4fv(matrixUniform, false, mvp);
        gl.uniform2f(canvasSizeUniform, canvas.width, canvas.height);
        let intensity = fire.fuel * 2 + flicker * 0.2;
        intensity = intensity * intensity;
        if (lighting == 1) {
            intensity = 4;
        } else if (lighting == 2) {
            intensity = -1;
        }
        gl.uniform1f(fireIntesityUniform, intensity);
    }

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
}

// has to be called before calling render
export function initGL() {
    gl.clearColor(0, 0, 0, 1);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    initShaders();
    initSquare();

    for (let i = 0; i < 10; i++) {
        tutorialTextures.push(loadTexture('./textures/tutorial/tutorial' + i + '.svg'));
    }

    for (let i = 0; i < 4; i++) {
        craftingTextures.push(loadTexture('./textures/crafting' + i + '.svg'));
    }

    for (let i = 0; i < 4; i++) {
        treeTextures.push(loadTexture('./textures/tree' + i + '.svg'));
    }

    for (let i = 0; i < 4; i++) {
        fireTextures.push(loadTexture('./textures/fire' + i + '.svg'));
    }
    fireTextures = [fireTextures];
    let campfireTextures = [];
    for (let i = 0; i < 4; i++) {
        campfireTextures.push(loadTexture('./textures/campfire' + i + '.svg'));
    }
    fireTextures.push(campfireTextures);

    let cookingfireTextures = [];
    for (let i = 0; i < 4; i++) {
        cookingfireTextures.push(loadTexture('./textures/cookingfire' + i + '.svg'));
    }
    fireTextures.push(cookingfireTextures);

    let beaconTextures = [];
    for (let i = 0; i < 4; i++) {
        beaconTextures.push(loadTexture('./textures/beacon' + i + '.svg'));
    }
    fireTextures.push(beaconTextures);

    for (let i = 0; i < 7; i++) {
        decorationTextures.push(loadTexture('./textures/decoration/decoration' + i + '.svg'));
	}

    for (let i = 0; i < 4; i++) {
        stumpTextures.push(loadTexture('./textures/stump' + i + '.svg'));
	}

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
    itemTextures[FOOD.MEAT] = loadTexture('./textures/meat.svg');
    itemTextures[FOOD.COOKED_MEAT] = loadTexture('./textures/cooked_meat.svg');
    animalTextures[0] = loadTexture('./textures/wolf.svg');
    animalTextures[1] = loadTexture('./textures/bear.svg');
    backgroundTexture = colorTexture([255, 255, 255, 255]);
    playerTexture = loadTexture('./textures/character.svg');
    circleTexture = loadTexture('./textures/circle.svg');
    quarryTexture = loadTexture('./textures/quarry.svg');
    winscreenTexture = loadTexture('./textures/winscreen.png');
    menuTexture = loadTexture('./textures/menu.svg');
    energyTexture = colorTexture([255, 255, 0, 255]);
    firecircleTexture = loadTexture('./textures/fireCircle.svg');
    markerTexture = loadTexture('./textures/marker.svg');

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

function initShaders(name) {
    let vs = getShader('shader-vs');
    let fs = getShader('shader-fs');

    defaultShader = gl.createProgram();
    gl.attachShader(defaultShader, vs);
    gl.attachShader(defaultShader, fs);
    gl.linkProgram(defaultShader);

    if (!gl.getProgramParameter(defaultShader, gl.LINK_STATUS)) {
        alert('Error when linking shaders');
    }

    gl.useProgram(defaultShader);

    positionAttribute = gl.getAttribLocation(defaultShader, 'position');
    gl.enableVertexAttribArray(positionAttribute);

    texCoordAttribute = gl.getAttribLocation(defaultShader, 'texCoord');
    gl.enableVertexAttribArray(texCoordAttribute);

    matrixUniform = gl.getUniformLocation(defaultShader, 'MVP');
    modelUniform = gl.getUniformLocation(defaultShader, 'M');
    textureUniform = gl.getUniformLocation(defaultShader, 'texture');
    fireIntesityUniform = gl.getUniformLocation(defaultShader, 'fireIntensity');
    shadowTextureUniform = gl.getUniformLocation(defaultShader, 'shadowTexture');
    canvasSizeUniform = gl.getUniformLocation(defaultShader, 'canvasSize');

    vs = getShader('shadow-vs');
    fs = getShader('shadow-fs');

    shadowShader = gl.createProgram();
    gl.attachShader(shadowShader, vs);
    gl.attachShader(shadowShader, fs);
    gl.linkProgram(shadowShader);

    if (!gl.getProgramParameter(shadowShader, gl.LINK_STATUS)) {
        alert('Error when linking shaders');
    }

    gl.useProgram(shadowShader);

    matrixUniformShadow = gl.getUniformLocation(shadowShader, 'VP');
    modelUniformShadow = gl.getUniformLocation(shadowShader, 'M');
    textureUniformShadow = gl.getUniformLocation(shadowShader, 'texture');
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

function colorTexture(color) {
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array(color));
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
