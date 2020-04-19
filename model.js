import { vec2 } from './gl-matrix-min.js'

export let canvas;
export let gl;
export const FPS = 60;
export const FRAME_TIME = 1000 / FPS;
export const DELTA = 1 / FPS;

// TODO define Radius
export const FIRE_RADIUS = 2;
export const PICK_UP_RADIUS = 0.5;

export const STARTING_WOOD = 3;
export const STARTING_STONE = 5;
export const STARTING_TREES = 0;
export const STARTING_DECORATIONS = 20;
export const RESOURCE_SPAWN_RADIUS = 10;
export const NO_TREES_AROUND_FIRE_RADIUS = 2.5;
export const DISTANCE_BETWEEN_TREES = 1;
export const NO_INIT_ITEMS_AROUND_FIRE_RADIUS = 3;
export const DISTANCE_BETWEEN_ITEMS_OF_SAME_TYPE = 3;
export const WOOD_PER_TREE = 2;

export let fire = {
    // Type of the fire
    size: 0,
    // The capacity of logs a fire can hold
    capacity: 2,
    // The fuel that the fire currently has
    fuel: 2,
    burningSpeed: 0.03,
    animationTime: 0
};

export let fireCapacity = 2;
export let fireFuel = 2;

export let items = [];
export let trees = [];
export let decorations = [];

export let animals = [{
    position: vec2.fromValues(-5, 5),
    type: 0,
    speed: 2,
    walkingDir: null,
    walkTimer: 0,
}];

export const FIRES = {
	OPEN_FIRE: 0,
	CAMPFIRE: 1,
	COOKING_FIRE: 2,
	BEACON: 3
}

export const TOOLS = {
	AXE: 0,
	TORCH: 1,
	KNIFE: 2,
	SPEAR: 3,
	PICKAXE: 4,
	FISHING_ROD: 5,
	BOW: 6,
	ARROW: 7
}

export const ITEMS = {
	WOOD: 1000,
	STONE: 1001
}

export const FOOD = {
	MEAT: 2000,
	COOKED_MEAT: 2001,
	FISH: 2002,
	COOKED_FISH: 2003,
	BERRIES: 2004
}

export let player = {
    speed: 2,
    lastPosition: vec2.fromValues(1, -1),
    actualSpeed: 0,
    position: vec2.fromValues(1, -1),
    goal: vec2.create(),
    animationStatus: 0,
    animationTimer: 0,
	carrying: null,
	currentTool: null,
	facingLeft: false,
	tools: {}
};

export function facingLeft() {
	let walkingDirection = vec2.create();
	if (player.goal == null) {
		return false;
	}
	vec2.sub(walkingDirection, player.goal, player.position);
	if (vec2.length(walkingDirection) == 0) {
		return player.facingLeft;
	}
	player.facingLeft = walkingDirection[0] < 0;
	return player.facingLeft;
}

export const ANIMATIONS = {
    WALKING: 1,
    CHOPPING: 2,
    CRAFTING: 3
};

export function createItem(position, type) {
	if (vec2.length(position) < NO_INIT_ITEMS_AROUND_FIRE_RADIUS) {
		return false;
	}
	for (let i = 0; i < items.length; i++) {
		if (items[i].id != type) {
			continue;
		}
		if (vec2.distance(items[i].pos, position) <
				(DISTANCE_BETWEEN_ITEMS_OF_SAME_TYPE + 1)) {
			return false;
		}
	}
	position[0] += Math.random();
	position[1] += Math.random();
	items.push(new Item(position, type));
	return true;
}

export function createTree(position) {
	if (vec2.length(position) < NO_TREES_AROUND_FIRE_RADIUS) {
		return false;
	}
	for (let i = 0; i < trees.length; i++) {
		if (vec2.distance(trees[i].position, position) < (DISTANCE_BETWEEN_TREES + 1)) {
			return false;
		}
	}
	position[0] += Math.random();
	position[1] += Math.random();
    trees.push({
        position: position,
        type: Math.floor(Math.random() * 4),
        direction: Math.random() > 0.5
	});
	return true;
}

export function createDecoration(position) {
	if (vec2.length(position) < NO_TREES_AROUND_FIRE_RADIUS) {
		return false;
	}
	for (let i = 0; i < decorations.length; i++) {
		if (vec2.distance(decorations[i].position, position) < (DISTANCE_BETWEEN_TREES + 1)) {
			return false;
		}
	}
	position[0] += Math.random();
	position[1] += Math.random();
    decorations.push({
        position: position,
        type: Math.floor(Math.random() * 7)
	});
	return true;
}

export function chopDownTree(test) {
	if (player.currentTool != TOOLS.AXE) {
		return false;
	}
	let treePos = -1;
	for (let i = 0; i < trees.length; i++) {
		if (vec2.distance(trees[i].position, player.position) <= 1) {
			treePos = i;
			break;
		}
	}
	if (treePos < 0) {
		return false;
	}
    if (!test) {
        trees.splice(treePos, 1);
        for (let j = 0; j < WOOD_PER_TREE; j++) {
            let itemPos = vec2.clone(player.position);
            itemPos[0] += j * 0.5;
            itemPos[1] += j * 0.5;
            items.push(new Item(itemPos, ITEMS.WOOD));
        }
    }
	return true;
}

export function initItems() {
	items.push(new Item(vec2.fromValues(2, 1), ITEMS.WOOD));
	items.push(new Item(vec2.fromValues(2, 2), ITEMS.WOOD));
	//items.push(new Item(vec2.fromValues(1, 2), ITEMS.WOOD));
	items.push(new Item(vec2.fromValues(-2, -1), ITEMS.STONE));
	//items.push(new Item(vec2.fromValues(-2, -2), ITEMS.STONE));
	//items.push(new Item(vec2.fromValues(-1, -2), ITEMS.STONE));
	for (let i = 0; i < STARTING_WOOD; i++) {
		if (!createItem(vec2.fromValues(Math.round(Math.random() * (RESOURCE_SPAWN_RADIUS * 2)) -
				RESOURCE_SPAWN_RADIUS, Math.round(Math.random() * (RESOURCE_SPAWN_RADIUS * 2)) -
				RESOURCE_SPAWN_RADIUS), ITEMS.WOOD)) {
			i--;
			continue;
		}
	}
	for (let i = 0; i < STARTING_STONE; i++) {
		if (!createItem(vec2.fromValues(Math.round(Math.random() * (RESOURCE_SPAWN_RADIUS * 2)) -
				RESOURCE_SPAWN_RADIUS, Math.round(Math.random() * (RESOURCE_SPAWN_RADIUS * 2)) -
				RESOURCE_SPAWN_RADIUS), ITEMS.STONE)) {
			i--;
			continue;
		}
	}
}

export function initTrees() {
	for (let i = 0; i < STARTING_TREES; i++) {
		if (!createTree(vec2.fromValues(Math.round(Math.random() * (RESOURCE_SPAWN_RADIUS * 2)) -
				RESOURCE_SPAWN_RADIUS, Math.round(Math.random() * (RESOURCE_SPAWN_RADIUS * 2)) -
				RESOURCE_SPAWN_RADIUS))) {
			i--;
			continue;
		}
	}
}

export function initDecorations() {
	for (let i = 0; i < STARTING_DECORATIONS; i++) {
		if (!createDecoration(vec2.fromValues(Math.round(Math.random() * (RESOURCE_SPAWN_RADIUS * 2)) -
				RESOURCE_SPAWN_RADIUS, Math.round(Math.random() * (RESOURCE_SPAWN_RADIUS * 2)) -
				RESOURCE_SPAWN_RADIUS))) {
			i--;
			continue;
		}
	}
	console.log(decorations);
}

export class Recipe {
	constructor(wood, stone, neededFire) {
		this.wood = wood;
		this.stone = stone;
		this.neededFire = neededFire;
	};

	// Returns, if it is possible to craft the object other out of the given Item Set
	isPossible(other) {
		if (other.neededFire > fire.size) {
			return false;
		}
		return (other.wood <= this.wood) && (other.stone <= this.stone);
	};
}

export class Item {
	constructor(pos, id) {
		this.pos = pos;
		this.id = id;
	}
}

export function inReachOfFire(vec) {
	return distanceToFire(vec) <= FIRE_RADIUS;
}

export function distanceToFire(vec) {
	return vec2.length(vec);
}

export function layDown() {
	if (player.carrying == null) {
		return false;
	}
	items.push(new Item(vec2.clone(player.position), player.carrying));
	player.carrying = null;
	return true;
}

export function pickUp() {
	let wasCarrying = player.carrying != null;
	let posNearest = nearestItem();
    if (posNearest < 0) {
		return false;
	}
	let pickedUp = removeItem(posNearest);
	player.carrying = pickedUp.id;
	return true;
}

export function removeItem(posInArray) {
	return items.splice(posInArray, 1)[0];
}

// returns the position in the items array of the item that is nearest to the player
export function nearestItem() {
	if (items.length == 0) {
		return -1;
	}
	let posMin = -1;
	let lenMin = PICK_UP_RADIUS;
	for (let i = 0; i < items.length; i++) {
		let len = vec2.distance(player.position, items[i].pos);
		if (len < lenMin) {
			posMin = i;
			lenMin = len;
		}
	}
    let len = vec2.length(player.position);
    if (len < lenMin) {
        // nearest thing is fire
        lenMin = len;
        posMin = -2;
    }
	return posMin;
}

// (Wood, Stone)
export const RECIPES = {
	AXE: new Recipe(2, 1, FIRES.OPEN_FIRE),
	TORCH: new Recipe(1, 0, FIRES.OPEN_FIRE),
	KNIFE: new Recipe(1, 2, FIRES.CAMPFIRE),
	SPEAR: new Recipe(3, 1, FIRES.CAMPFIRE),
	PICKAXE: new Recipe(2, 3, FIRES.CAMPFIRE),
	FISHING_ROD: new Recipe(3, 0, FIRES.COOKING_FIRE),
	BOW: new Recipe(4, 0, FIRES.COOKING_FIRE),
	ARROW: new Recipe(1, 1, FIRES.COOKING_FIRE)
}

// For testing
export const FIRES_UPGRADES = {
	CAMPFIRE:  new Recipe(1, 1, FIRES.OPEN_FIRE),
	COOKING_FIRE:  new Recipe(2, 1, FIRES.CAMPFIRE),
	BEACON:   new Recipe(3, 1, FIRES.COOKING_FIRE)
}

/*
export const FIRES_UPGRADES = {
	CAMPFIRE:  new Recipe(10, 5, FIRES.OPEN_FIRE),
	COOKING_FIRE:  new Recipe(20, 10, FIRES.CAMPFIRE),
	BEACON:   new Recipe(40, 20, FIRES.COOKING_FIRE)
}*/

export function getRecipe(tool) {
	let keys = Object.keys(TOOLS);
	let i;
	for (i = 0; i < keys.length; i++) {
		if (TOOLS[keys[i]] == tool) {
			break;
		}
	}
	let ret = JSON.parse(JSON.stringify(RECIPES[keys[i]]));
	return ret;
}

export function getFireName() {
	let keys = Object.keys(FIRES);
	let i;
	for (i = 0; i < keys.length; i++) {
		if (FIRES[keys[i]] == fire.size) {
			break;
		}
	}
	return keys[i];
}

export function getNextFireName() {
	let keys = Object.keys(FIRES);
	let i;
	for (i = 0; i < keys.length; i++) {
		if (FIRES[keys[i]] == fire.size) {
			break;
		}
	}
	return keys[i+1];
}

export function itemsInReachOfFire() {
	let ret = [];
	for (let i = 0; i < items.length; i++) {
		if (inReachOfFire(items[i].pos)) {
			ret.push(items[i]);
		}
	}
	return ret;
}

export function craft(desired) {
	if (player.tools[desired]) {
		player.currentTool = desired;
		return desired;
	}
	let recipe = canCraft(desired);
	if (recipe) {
		if (removeItemsInReachOfFire(recipe)) {
			player.tools[desired] = true;
			player.currentTool = desired;
			return desired;
		} else {
			console.log("Something went wrong when removing the ingredients");
		}
	}
	return null;
}

export function canCraft(desired) {
	let recipe = getRecipe(desired);
	if (player.tools[desired]) {
		return true;
	}
	let numWoodAndStone = countOccurences(itemsInReachOfFire());
	return numWoodAndStone.isPossible(recipe)?recipe:null;
}

export function upgradeFire() {
	let recipe = FIRES_UPGRADES[getNextFireName()];
	let numWoodAndStone = countOccurences(itemsInReachOfFire());
	if (numWoodAndStone.isPossible(recipe)) {
		if (removeItemsInReachOfFire(recipe)) {
			fire.size++;
			return true;
		} else {
			console.log("Something went wrong when removing the ingredients");
		}
	}
	return false;
}

export function refuelFire() {
	if (nearestItem() != -2) {
		return false;
	}
	if (player.carrying == ITEMS.WOOD) {
		player.carrying = null;
		fire.fuel = (fire.fuel+1 > fire.capacity) ? fire.capacity : fire.fuel+1;
		return true;
	}
	return false;
}

export function removeItemsInReachOfFire(recipe) {
	if (!countOccurences(items).isPossible(recipe)) {
		return false;
	}

	for (let i = 0; i < items.length; i++) {
		if (!inReachOfFire(items[i].pos)) {
			continue;
		}
		if (recipe.wood > 0 && items[i].id == ITEMS.WOOD) {
			items.splice(i, 1);
			i--;
			recipe.wood--;
		} else if (recipe.stone > 0 && items[i].id == ITEMS.STONE) {
			items.splice(i, 1);
			i--;
			recipe.stone--;
		} else if (recipe.wood == 0 && recipe.stone == 0) {
			break;
		}
	}
	return true;
}

export function removeFoodInReachOfFire(items, recipe) {
	if (!countOccurences(items).isPossible(recipe)) {
		return false;
	}
	for (let i = 0; i < items.length; i++) {
		if (!inReachOfFire(items[i].pos)) {
			continue;
		}
		if (recipe.wood > 0 && items[i].id == ITEMS.WOOD) {
			items.splice(i, 1);
			recipe.wood--;
		} else if (recipe.stone > 0 && items[i].id == ITEMS.STONE) {
			items.splice(i, 1);
			recipe.stone--;
		} else if (recipe.wood == 0 && recipe.stone == 0) {
			break;
		}
	}
	return true;
}

// Get a Recipe from a List of items
export function countOccurences(items) {
	let wood = 0;
	let stone = 0;
	for (let i = 0; i < items.length; i++) {
		switch(items[i].id) {
			case ITEMS.WOOD:
				wood++;
				break;
			case ITEMS.STONE:
				stone++;
				break;
		}
	}
	return new Recipe(wood, stone, 0);
}

// TODO: Not yet finished. Don't use food system
// Cooking food won't remove the raw item
export function cook(food) {
	switch(food) {
		case FOOD.FISH:
			return FOOD.COOKED_FISH;
		case FOOD.MEAT:
			return FOOD.COOKED_MEAT;
	}
	return null;
}

export function setCanvas(c) {
    canvas = c;
    let w = canvas.clientWidth;
    let h = canvas.clientHeight;
    canvas.width = w;
    canvas.height = h;
    gl = canvas.getContext('webgl');
}
