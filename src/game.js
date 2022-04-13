//#region Setup
//#region PIXI init
"use strict";
/* TODO: Dynamically size the window and scale the game to the size of the 
browser window. */
const game = new PIXI.Application({
	width: 600,
	height: 600
});
//#endregion

window.onload = () => {
	document.body.appendChild(game.view);

	//#region Image loading
	// TODO: Load and use textures in place of primitive shapes.
	game.loader.
		add([
			"media/images/backgrounds/large/purple/purple-nebula-5.jpg"
		]);
	game.loader.onProgress.add(e => { console.log(`progress=${e.progress}`) });
	game.loader.onComplete.add(setup);
	game.loader.load();
	//#endregion
};

//#region Variables
let playerBullets = [];
let enemyBullets = [];
let enemies = [];
let asteroids = [];
let player;
let UI = {
	score: { current: null, final: null },
	health: { max: null, current: null },
	shield: { max: null, current: null}
};

let sounds = {};

let mainMenuScene, gameScene, world, showWorld, gameOverScene;
let worldCamera;
let worldSize = 1024;
let activeTutorials = [];
let score = 0;
let paused = true;
let dt;
//#endregion

/**
 * Sets up the initial state of the game.
 * 
 * To be called once after loading textures.
 */
function setup() {
	//#region Initialize scenes
	mainMenuScene = new PIXI.Container();
	game.stage.addChild(mainMenuScene);

	gameScene = new PIXI.Container();
	gameScene.visible = false;
	game.stage.addChild(gameScene);

	world = new PIXI.Container();

	showWorld = new PIXI.Container();
	gameScene.addChild(showWorld);
	showWorld.x = -worldSize;
	showWorld.y = -worldSize;

	gameOverScene = new PIXI.Container();
	gameOverScene.visible = false;
	game.stage.addChild(gameOverScene);
	//#endregion
	//#region Create UI
	let buttonStyle = new PIXI.TextStyle({
		fill: 0xFF0000,
		fontSize: 48,
		fontFamily: "Futura"
	});
	let textStyle = new PIXI.TextStyle({
		fill: 0xFFFFFF,
		fontSize: 18,
		fontFamily: "Futura",
	});

	//#region Main menu UI
	// Logo text.
	// TODO: Make the logo a stylized sprite instead of plain text.
	let logo = new PIXI.Text("Void Break", {
		fill: 0xFFFFFF,
		fontSize: 96,
		fontFamily: "Futura",
		stroke: 0xFF0000,
		strokeThickness: 6
	});
	logo.anchor.set(0.5, 0.5);
	logo.x = game.view.width / 2;
	logo.y = 100;
	mainMenuScene.addChild(logo);

	// Start button
	let startButton = new PIXI.Text("Start", buttonStyle);
	startButton.anchor.set(0.5, 0.5);
	startButton.x = game.view.width / 2;
	startButton.y = game.view.height - 100;
	startButton.interactive = true;
	startButton.buttonMode = true;
	startButton.on("pointerup", startGame);
	startButton.on('pointerover', e => e.target.alpha = 0.7);
	startButton.on('pointerout', e => e.currentTarget.alpha = 1.0);
	mainMenuScene.addChild(startButton);
	//#endregion

	//#region Game UI
	// Background
	let background = new PIXI.Sprite(game.loader.resources[
		"media/images/backgrounds/large/purple/purple-nebula-5.jpg"].texture);
	world.addChild(background);

	// RenderTexture, essentially a camera on the world scene that I 
	// can paste 9 times for (almost) seamless world wrapping.
	worldCamera = PIXI.RenderTexture.create(worldSize, worldSize);
	
	let topLeftCam = new PIXI.Sprite(worldCamera);
	showWorld.addChild(topLeftCam);
	
	let topCam = new PIXI.Sprite(worldCamera);
	showWorld.addChild(topCam);
	topCam.x = worldSize;

	let topRightCam = new PIXI.Sprite(worldCamera);
	showWorld.addChild(topRightCam);
	topRightCam.x = worldSize*2;

	let leftCam = new PIXI.Sprite(worldCamera);
	showWorld.addChild(leftCam);
	leftCam.y = worldSize;

	let centerCam = new PIXI.Sprite(worldCamera);
	showWorld.addChild(centerCam);
	centerCam.x = worldSize;
	centerCam.y = worldSize;

	let rightCam = new PIXI.Sprite(worldCamera);
	showWorld.addChild(rightCam);
	rightCam.x = worldSize*2;
	rightCam.y = worldSize;

	let bottomLeftCam = new PIXI.Sprite(worldCamera);
	showWorld.addChild(bottomLeftCam);
	bottomLeftCam.y = worldSize*2;
	
	let bottomCam = new PIXI.Sprite(worldCamera);
	showWorld.addChild(bottomCam);
	bottomCam.x = worldSize;
	bottomCam.y = worldSize*2;

	let bottomRightCam = new PIXI.Sprite(worldCamera);
	showWorld.addChild(bottomRightCam);
	bottomRightCam.x = worldSize*2;
	bottomRightCam.y = worldSize*2;

	//#region Health bar
	// Health bar background
	UI.health.max = new PIXI.Graphics();
	UI.health.max.lineStyle(5, 0x3F3F3F, 1); // Width, color, alpha
	UI.health.max.moveTo(-1.5, 0);
	UI.health.max.lineTo(1.5, 0);
	UI.health.max.x = game.view.width / 2;
	UI.health.max.y = game.view.height - 20;
	gameScene.addChild(UI.health.max);

	// Health bar
	UI.health.current = new PIXI.Graphics();
	UI.health.current.lineStyle(5, 0xCF0000, 1); // Width, color, alpha
	UI.health.current.moveTo(-1.5, 0);
	UI.health.current.lineTo(1.5, 0);
	UI.health.current.x = game.view.width / 2;
	UI.health.current.y = game.view.height - 20;
	gameScene.addChild(UI.health.current);
	//#endregion

	//#region Shield bar
	// TODO: Refresh bar maybe?
	// Shield bar background
	UI.shield.max = new PIXI.Graphics();
	UI.shield.max.lineStyle(5, 0x3F3F3F, 1); // Width, color, alpha
	UI.shield.max.moveTo(-1.5, 0);
	UI.shield.max.lineTo(1.5, 0);
	UI.shield.max.x = game.view.width / 2;
	UI.shield.max.y = game.view.height - 14;
	gameScene.addChild(UI.shield.max);

	// Shield bar
	UI.shield.current = new PIXI.Graphics();
	UI.shield.current.lineStyle(5, 0x0000CF, 1); // Width, color, alpha
	UI.shield.current.moveTo(-1.5, 0);
	UI.shield.current.lineTo(1.5, 0);
	UI.shield.current.x = game.view.width / 2;
	UI.shield.current.y = game.view.height - 14;
	gameScene.addChild(UI.shield.current);
	//#endregion

	//#region Score
	// Score label
	let scoreLabel = new PIXI.Text("Score: ", textStyle);
	gameScene.addChild(scoreLabel);

	// Score counter
	// The text of this should be changed to keep up with the current score.
	UI.score.current = new PIXI.Text("0", textStyle);
	UI.score.current.x = scoreLabel.x + scoreLabel.width;
	UI.score.current.y = scoreLabel.y;
	gameScene.addChild(UI.score.current);
	//#endregion Score
	//#endregion Game UI

	//#region Game over UI
	// Big game over label
	let gameOverLabel = new PIXI.Text("Game Over", {
		fill: 0xFFFFFF,
		fontSize: 96,
		fontFamily: "Futura",
		stroke: 0x0F0F0F,
		strokeThickness: 4
	});
	gameOverLabel.anchor.set(0.5, 0.5);
	gameOverLabel.x = game.view.width / 2;
	gameOverLabel.y = 100;
	gameOverScene.addChild(gameOverLabel);

	// Final score counter
	// Text should be updated when transitioning to game over scene.
	UI.score.final = new PIXI.Text("Score: UNSET", textStyle);
	UI.score.final.anchor.set(0.5, 0.5);
	UI.score.final.x = game.view.width / 2;
	UI.score.final.y = 200;
	gameOverScene.addChild(UI.score.final);

	// Replay button
	let restartButton = new PIXI.Text("Play again?", buttonStyle);
	restartButton.anchor.set(0.5, 0.5);
	restartButton.x = game.view.width / 2;
	restartButton.y = game.view.height - 100;
	restartButton.interactive = true;
	restartButton.buttonMode = true;
	restartButton.on("pointerup", restart);
	restartButton.on('pointerover', e => e.target.alpha = 0.7);
	restartButton.on('pointerout', e => e.currentTarget.alpha = 1.0);
	gameOverScene.addChild(restartButton);
	//#endregion Game over
	//#endregion UI

	// Load sounds
	sounds.shoot1 = new Howl({ src: ['media/sounds/shoot1.wav'] });
	sounds.shoot1.volume(0.3);

	sounds.hit1 = new Howl({ src: ['media/sounds/hit1.wav'] });
	sounds.hit1.volume(0.5);

	sounds.hit2 = new Howl({ src: ['media/sounds/hit2.wav'] });
	sounds.hit2.volume(0.5);

	player = new Player();

	game.ticker.add(update);

	document.addEventListener('keydown', OnKeyDown);
	document.addEventListener('keyup', OnKeyUp);
}
//#endregion Setup

/**
 * Starts and shows the main game scene.
 */
function startGame() {
	// Show game.
	gameOverScene.visible = false;
	mainMenuScene.visible = false;
	gameScene.visible = true;
	paused = false;

	// Show controls tutorial
	let controlsTut = new PIXI.Text("Controls:\nThrust: W\nRotate: A/D\nShoot: Space", {
		fill: 0xFFFFFF,
		fontSize: 24,
		fontFamily: "Futura"
	});
	let controlsTutBg = new PIXI.Graphics();
	controlsTutBg.beginFill(0x000000, 0.4);
	controlsTutBg.drawRect(0,0,150,150);
	controlsTutBg.endFill();
	controlsTutBg.y = game.view.height - 150;
	controlsTut.y = game.view.height - 125;
	controlsTut.x = 10;
	gameScene.addChild(controlsTutBg);
	gameScene.addChild(controlsTut);
	activeTutorials.push({ parts: [controlsTutBg, controlsTut], timeToShow: 10, timeToFade: 5 });
}

/**
 * Resets the game state and starts again.
 */
function restart() {
	// Empty all entities from last game.
	playerBullets.forEach(e => world.removeChild(e));
	playerBullets = []
	enemyBullets.forEach(e => world.removeChild(e));
	enemyBullets = [];
	enemies.forEach(e => world.removeChild(e));
	enemies = [];
	activeTutorials.forEach(e => gameScene.removeChild(e));
	activeTutorials = [];
	asteroids.forEach(e => world.removeChild(e));
	asteroids = [];

	// Reset everything that persists.
	player.reset();
	score = 0;
	UI.score.current.text = score;

	startGame();
}

/**
 * Main game update loop.
 * 
 * Calculates delta time, filters out dead items from arrays, updates tutorials 
 * and other objects, and spawns asteroids. 
 */
function update() {
	if (paused) return;

	// Delta time
	dt = 1/game.ticker.FPS;
	if (dt > 1/12) dt = 1/12;

	// Low fps warning
	if (game.ticker.FPS < 30) {
		console.warn("Warning: Low FPS");
		console.warn("FPS: " + game.ticker.FPS);
		console.warn("Bullets: " + playerBullets.length);
	}
	
	// Update bullets
	playerBullets.forEach(b => { b.update(dt); });
	playerBullets = playerBullets.filter(b=>b.lifetime > 0);
	
	// Update player
	player.update();
	
	// Update tutorials
	activeTutorials.forEach(tut => {
		tut.timeToShow -= dt;
		if (tut.timeToShow < 0) {
			tut.parts.forEach(element => {
				element.alpha += tut.timeToShow/tut.timeToFade;
			});
			tut.timeToShow = 0;
			if (tut.parts[0].alpha == 0) {
				tut.parts.forEach(element => {
					gameScene.removeChild(element);
				});
			}
		}
	});
	activeTutorials = activeTutorials.filter(e => e.parts[0].alpha > 0);
	
	// Update asteroids
	asteroids.forEach(a => { a.update(dt); });
	asteroids = asteroids.filter(e => e.health > 0);

	// Spawn asteroids
	// TODO: Add option to spawn waves
	// TODO: Add some randomness to the size
	while (asteroids.length < 3 + (score/5)) {
		let asteroidSpawnAngle = 360*Math.random();
		asteroids.push(new Asteroid(
			20+(score/5), 
			player.x + (worldSize/2) * Math.sin(asteroidSpawnAngle * (Math.PI/180)), 
			player.y + (worldSize/2) * Math.cos(asteroidSpawnAngle * (Math.PI/180))
		));
	}

	// Update the world camera render
	game.renderer.render(world, worldCamera);
}

/**
 * Ends the game and displays the game over scene.
 */
function endGame() {
	paused = true;

	UI.score.final.text = "Score: " + score;

	gameOverScene.visible = true;
	mainMenuScene.visible = false;
	gameScene.visible = false;
}

/**
 * Handles any input of a pressed key.
 * 
 * @param {*} key The key that was pressed.
 */
function OnKeyDown(key) {
	switch (key.keyCode) {
		case 87: // W
			player.thrusting = true;
			break;

		case 65: // A
			player.turning = "ccw";
			break;

		case 68: // D
			player.turning = "cw";
			break;

		case 32: // space
			if (!player.firing) {	
				player.startFiring = true;
			}
			break;

		default:
			break;
	}
}

/**
 * Handles any input of a released key.
 * 
 * @param {*} key The key that was released.
 */
function OnKeyUp(key) {
	switch (key.keyCode) {
		case 87: // W
			player.thrusting = false;
			break;

		case 65: // A
		case 68: // D
			player.turning = "";
			break;

		case 32: // space
			player.firing = false;
			break;

		default:
			break;
	}
}
// TODO: Better label region endings