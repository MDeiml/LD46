import { vec2 } from './gl-matrix-min.js'

export let canvas;
export let gl;
export const FPS = 60;
export const FRAME_TIME = 1000 / FPS;
export const DELTA = 1 / FPS;

// TODO define Radius
export const FIRE_RADIUS = 1;

export let fireSize = 0;
export let items = [];
export let trees = [];

export let player = {
    speed: 2,
    position: vec2.create(),
    goal: vec2.create(),
    walking: false
};

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

export function createTree(position) {
    trees.push({
        position: position,
        type: Math.floor(Math.random() * 4)
    });
}

export class Recipe {
	constructor(wood, stone, neededFire) {
		this.wood = wood;
		this.stone = stone;
		this.neededFire = neededFire;
	};

	// Returns, if it is possible to craft the object other out of the given Item Set
	isPossible(other) {
		if (other.neededFire > fireSize) {
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

export class Pos {
	constructor(vec) {
		this.x = vec[0];
		this.y = vec[1];
		this.vec = vec;
	}

	inReachOfFire() {
		return this.distanceToFire() <= FIRE_RADIUS;
	}

	distanceToFire() {
		// xAbs = Math.abs(this.x);
		// yAbs = Math.abs(this.y);
		// return Math.sqrt(xAbs*xAbs + yAbs*yAbs);
		return vec2.length(this.vec);
	}
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

export function getRecipe(tool) {
	keys = Object.keys(TOOLS);
	let i;
	for (i = 0; i < keys.length; i++) {
		if (TOOLS[keys[i]] == tool) {
			break;
		}
	}
	return RECIPES[keys[i]];
}

export function itemsInReachOfFire() {
	ret = [];
	for (let i = 0; i < items.length; i++) {
		if (items[i].pos.inReachOfFire) {
			ret.push(items[i]);
		}
	}
	return ret;
}

export function craft(desired) {
	recipe = getRecipe(desired);
	numWoodAndStone = countOccurences(itemsInReachOfFire());
	if (numWoodAndStone.isPossible(recipe)) {
		if (removeItemsInReachOfFire(recipe)) {
			return desired;
		} else {
			console.log("Something went wrong when removing the ingredients");
		}
	}
	return null;
}

export function removeItemsInReachOfFire(recipe) {
	if (!countOccurences(items).isPossible(recipe)) {
		return false;
	}
	for (let i = 0; i < items.length; i++) {
		if (!items[i].pos.inReachOfFire()) {
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

export function removeFoodInReachOfFire(items, recipe) {
	if (!countOccurences(items).isPossible(recipe)) {
		return false;
	}
	for (let i = 0; i < items.length; i++) {
		if (!items[i].pos.inReachOfFire()) {
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
	wood = 0;
	stone = 0;
	for (let i = 0; i < items.length; i++) {
		switch(items[i]) {
			case Item.WOOD:
				wood++;
				break;
			case Item.STONE:
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
    gl = canvas.getContext('webgl');
}
