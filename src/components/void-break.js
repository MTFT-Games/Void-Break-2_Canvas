import { Player, Asteroid } from "../classes.js";
import { testAABB } from "../utilities.js";

//#region Canvas element
const template = document.createElement('template');
template.innerHTML = `
<style>
canvas {
	height: 100%;
	width: 100%;
}
:host {
	overflow: hidden;
}
</style>
<canvas>
`;
//#endregion

class VoidBreak extends HTMLElement {
	constructor() {
		super();

		//#region Add shadowroot and get canvas
		this.attachShadow({ mode: 'open' });
		this.shadowRoot.appendChild(template.content.cloneNode(true));

		this.canvas = this.shadowRoot.querySelector('canvas');
		this.ctx = this.canvas.getContext('2d');
		//#endregion

		//#region Resolution and autosizing
		this.resolution = 1080; //TODO: Get this from localstorage or defaults json
		document.defaultView.onresize = () => {
			this.canvas.width = (this.offsetWidth / this.offsetHeight) * this.resolution;
			this.canvas.height = this.resolution;
		};
		//#endregion

		//#region Input
		// Keep track of mouse position
		this.canvas.onmousemove = (e) => {
			// relationship bitmap vs. element
			const scaleX = this.canvas.width / this.canvas.offsetWidth;
			const scaleY = this.canvas.height / this.canvas.offsetHeight;

			this.mousePos = {
				x: (e.clientX) * scaleX,
				y: (e.clientY - this.canvas.offsetTop) * scaleY
			};
		};

		// Keep track of mouse buttons
		this.canvas.onmousedown = this.canvas.onmouseup = (e) => {
			this.mouseState = e.buttons;
		};

		// Prevent right click menu over the game
		this.canvas.oncontextmenu = (e) => {
			e.preventDefault();
		};

		// Keep track of keyboard
		// TODO: Make the keys to check variables so they can be changed
		document.onkeydown = (key) => {
			switch (key.keyCode) {
				case 87: // W
					this.player.thrusting = true;
					break;

				case 65: // A
					this.player.turning.ccw = 1;
					break;

				case 68: // D
					this.player.turning.cw = 1;
					break;

				case 32: // space
					if (!this.player.firing) {
						this.player.startFiring = true;
					}
					break;

				default:
					break;
			}
		};
		document.onkeyup = (key) => {
			switch (key.keyCode) {
				case 87: // W
					this.player.thrusting = false;
					break;

				case 65: // A
					this.player.turning.ccw = 0;
					break;

				case 68: // D
					this.player.turning.cw = 0;
					break;

				case 32: // space
					this.player.firing = false;
					break;

				default:
					break;
			}
		};
		//#endregion

		//#region Tutorials
		this.tutorials = {
			ui: {
				activate() { this.time = 10; }, time: 0, draw(game) {
					const canvas = game.canvas;
					const ctx = game.ctx;

					// Set context
					ctx.save();
					ctx.translate(canvas.width / 2, canvas.height - 50);
					ctx.globalAlpha = this.time / 2;
					ctx.textAlign = 'center';
					ctx.font = '40px Futura';

					// Calculate how big the box should be
					let width = game.player.health.max < game.player.shield.max ? game.player.shield.max * 3 : game.player.health.max * 3;

					//#region Labels
					ctx.fillStyle = 'white';
					ctx.strokeStyle = '#cf0000';
					ctx.fillText("Health", -width / 2 - 65, 35);
					ctx.strokeText("Health", -width / 2 - 65, 35);
					ctx.strokeStyle = '#0000cf';
					ctx.fillText("Shield", -width / 2 - 65, 0);
					ctx.strokeText("Shield", -width / 2 - 65, 0);
					//#endregion

					//#region Outline
					ctx.strokeStyle = 'white';
					ctx.fillStyle = 'rgba(255,255,255,0.1)';
					ctx.lineWidth = 4;
					ctx.beginPath();
					ctx.rect(-width / 2, -30, width, 80);
					ctx.stroke();
					ctx.fill();
					//#endregion

					ctx.restore();
				}
			},
			controls: {
				activate() { this.time = 10; }, time: 0, draw(game) {
					const canvas = game.canvas;
					const ctx = game.ctx;

					// Set context
					ctx.save();
					ctx.translate(100, canvas.height / 2);
					ctx.globalAlpha = this.time / 2;
					ctx.font = '50px Futura';
					ctx.strokeStyle = 'white';

					//#region Box
					ctx.save();
					ctx.lineWidth = 5;
					ctx.fillStyle = 'rgba(255,255,255,0.05)';
					ctx.beginPath();
					ctx.rect(0, -canvas.height / 4, 300, 300);
					ctx.stroke();
					ctx.fill();
					ctx.restore();
					//#endregion

					//#region Draw turn icon
					ctx.save();
					ctx.translate(50, -canvas.height / 4 + 50);
					ctx.scale(6, 6);

					//#region Ship
					ctx.save();
					ctx.rotate(45 * (Math.PI / 180));
					ctx.fillStyle = 'white';
					ctx.beginPath();
					ctx.moveTo(0, -2);
					ctx.lineTo(1.5, 2);
					ctx.lineTo(0, 1);
					ctx.lineTo(-1.5, 2);
					ctx.closePath();
					ctx.fill();
					ctx.restore();
					//#endregion

					//#region Curves
					ctx.beginPath();
					ctx.arc(0, 0, 4.2, 180 * (Math.PI / 180), 270 * (Math.PI / 180));
					ctx.stroke();

					ctx.beginPath();
					ctx.arc(0, 0, 4.2, 0 * (Math.PI / 180), 90 * (Math.PI / 180));
					ctx.stroke();
					//#endregion

					//#region Arrows
					ctx.beginPath();
					ctx.moveTo(0, -4);
					ctx.lineTo(-1, -3.5);
					ctx.lineTo(-1, -4.5);
					ctx.closePath();
					ctx.stroke();

					ctx.beginPath();
					ctx.moveTo(0, 4);
					ctx.lineTo(1, 3.5);
					ctx.lineTo(1, 4.5);
					ctx.closePath();
					ctx.stroke();
					//#endregion

					ctx.restore();
					//#endregion

					//#region Thrust icon
					ctx.save();
					ctx.translate(50, -canvas.height / 4 + 150);
					ctx.rotate(45 * (Math.PI / 180));
					ctx.scale(6, 6);

					//#region Ship
					ctx.fillStyle = 'white';
					ctx.beginPath();
					ctx.moveTo(0, -2);
					ctx.lineTo(1.5, 2);
					ctx.lineTo(0, 1);
					ctx.lineTo(-1.5, 2);
					ctx.closePath();
					ctx.fill();
					//#endregion

					//#region Thrust
					ctx.fillStyle = 'rgba(180,180,255, 0.8)';
					ctx.beginPath();
					ctx.moveTo(0, 1);
					ctx.lineTo(-1.2, 3);
					ctx.lineTo(0, 5);
					ctx.lineTo(1.2, 3);
					ctx.closePath();
					ctx.fill();
					//#endregion

					ctx.restore();
					//#endregion

					//#region Fire icon
					ctx.save();
					ctx.translate(50, -canvas.height / 4 + 250);
					ctx.rotate(45 * (Math.PI / 180));
					ctx.fillStyle = 'white';

					//#region Ship
					ctx.save();
					ctx.scale(6, 6);
					ctx.beginPath();
					ctx.moveTo(0, -2);
					ctx.lineTo(1.5, 2);
					ctx.lineTo(0, 1);
					ctx.lineTo(-1.5, 2);
					ctx.closePath();
					ctx.fill();
					ctx.restore();
					//#endregion

					//#region Bullets
					ctx.scale(2, 2);

					ctx.beginPath();
					ctx.moveTo(0, -13);
					ctx.lineTo(1.5, -9);
					ctx.lineTo(0, -10);
					ctx.lineTo(-1.5, -9);
					ctx.closePath();
					ctx.fill();

					ctx.beginPath();
					ctx.moveTo(0, -19);
					ctx.lineTo(1.5, -15);
					ctx.lineTo(0, -16);
					ctx.lineTo(-1.5, -15);
					ctx.closePath();
					ctx.fill();
					//#endregion

					ctx.restore();
					//#endregion

					ctx.fillStyle = 'white';
					ctx.lineWidth = 2;
					ctx.lineJoin = 'round';

					//#region Turning controls
					ctx.fillText("A", 120, -canvas.height / 4 + 70)

					// Box around letter
					ctx.beginPath();
					ctx.rect(113, -canvas.height / 4 + 30, 50, 50);
					ctx.stroke();

					ctx.fillText("D", 200, -canvas.height / 4 + 70)

					// Box around letter
					ctx.beginPath();
					ctx.rect(193, -canvas.height / 4 + 30, 50, 50);
					ctx.stroke();
					//#endregion

					//#region Thrust controls
					ctx.fillText("W", 120, -canvas.height / 4 + 170)

					// Box around letter
					ctx.beginPath();
					ctx.rect(117, -canvas.height / 4 + 128, 50, 50);
					ctx.stroke();
					//#endregion

					//#region Fire controls
					ctx.fillText("Space", 120, -canvas.height / 4 + 260)

					// Box around letter
					ctx.beginPath();
					ctx.rect(117, -canvas.height / 4 + 220, 130, 58);
					ctx.stroke();
					//#endregion

					ctx.restore();
				}
			}
		};
		//#endregion

		//#region Init
		document.defaultView.onresize(); // Set initial resolution

		this.mousePos = { x: 0, y: 0 };
		this.worldSize = 3000;
		this.mouseState = 0;
		this.lastMouseState = 0;
		this.sounds = {};
		this.player = new Player({ x: 0, y: 0 }, this);
		this.state = 'loading';
		this.loading = 0;
		this.lastFrameTime = window.performance.now() / 1000.0;

		this.loop();
		//#endregion
	}

	// Draw a loading screen (Probably doesn't need to be it's own function)
	drawLoading(percent, time) {
		this.ctx.save();
		this.ctx.fillStyle = 'white';
		this.ctx.strokeStyle = 'white';

		// Draw text
		this.ctx.textAlign = 'center';
		this.ctx.font = '30px Comic Sans MS';
		this.ctx.fillText("Loading...", this.canvas.width / 2, this.canvas.height / 2 - 20);

		// Draw outline
		this.ctx.beginPath();
		this.ctx.rect(this.canvas.width / 3, this.canvas.height / 2, this.canvas.width / 3, 30);
		this.ctx.stroke();

		// Draw fill
		this.ctx.beginPath();
		this.ctx.rect(
			this.canvas.width / 3,
			this.canvas.height / 2,
			this.canvas.width / 3 * (percent / 100),
			30);
		this.ctx.fill();

		// Draw spinner
		this.ctx.lineWidth = 5;
		this.ctx.beginPath();
		this.ctx.arc(this.canvas.width / 2 + 100, this.canvas.height / 2 - 30, 20, (2 * Math.PI) * ((time % 1) / 1), (2 * Math.PI) * ((time % 1) / 1) + ((2 / 3) * Math.PI));
		this.ctx.stroke();

		this.ctx.restore();
	}

	loop() {
		requestAnimationFrame(() => this.loop());

		//#region Keep time
		const frameTime = window.performance.now() / 1000.0;
		const deltaT = frameTime - this.lastFrameTime;
		this.lastFrameTime = frameTime;
		//#endregion

		// Clear
		this.ctx.fillStyle = 'black';
		this.ctx.rect(0, 0, this.canvas.width, this.canvas.height);
		this.ctx.fill();

		switch (this.state) {
			case 'loading':
				this.drawLoading(this.loading, frameTime);
				break;

			case 'main menu':
				this.ctx.save();

				//#region Draw background
				this.ctx.save();
				let scale = this.resolution / 1024;
				if (this.canvas.width > this.canvas.height) scale = this.canvas.width / 1024;
				this.ctx.scale(scale, scale);
				this.ctx.drawImage(this.images.purple6, 0, 0);
				this.ctx.restore();
				//#endregion

				//#region Draw logo text TODO: should make a proper logo
				this.ctx.save();
				this.ctx.fillStyle = 'red';
				this.ctx.strokeStyle = 'white';
				this.ctx.textAlign = 'center';
				this.ctx.font = '300px Futura';

				this.ctx.fillText("VOID", this.canvas.width / 2, this.canvas.height / 2 - 300);
				this.ctx.strokeText("VOID", this.canvas.width / 2, this.canvas.height / 2 - 300);
				this.ctx.fillText("BREAK", this.canvas.width / 2, this.canvas.height / 2 - 80);
				this.ctx.strokeText("BREAK", this.canvas.width / 2, this.canvas.height / 2 - 80);

				this.ctx.restore();
				//#endregion

				//#region Start button TODO: Maybe make it a reusable function to draw and check a button
				this.ctx.save();
				this.ctx.fillStyle = 'red';

				// Debug show hitbox
				//this.ctx.fillRect(this.canvas.width / 2 - 90, this.canvas.height / 2 + 130, 185, 75);

				//#region Test for mouse hover and click
				if (testAABB(
					{ x: this.mousePos.x, y: this.mousePos.y, w: 0, h: 0 },
					{ x: this.canvas.width / 2 - 90, y: this.canvas.height / 2 + 130, w: 185, h: 75 })) {

					if (this.mouseState % 2 == 1) {
						this.ctx.fillStyle = 'darkRed';
					} else if (this.lastMouseState % 2 == 1 && this.mouseState % 2 == 0) {
						// TODO: Will likely need to make this a function later when the game 
						// starts from multiple places
						this.worldSize = this.defaults.worldSize;
						this.background = this.defaults.background;
						this.asteroidSpawning = this.defaults.asteroidSpawning;
						this.player.reset();
						this.tutorials.ui.activate();
						this.tutorials.controls.activate();
						this.asteroids = [];
						this.score = 0;
						this.state = 'game';
					} else {
						this.ctx.fillStyle = 'coral';
					}
				}
				//#endregion

				//#region Draw button
				this.ctx.strokeStyle = 'white';
				this.ctx.textAlign = 'center';
				this.ctx.font = '100px Futura';

				this.ctx.fillText("Start", this.canvas.width / 2, this.canvas.height / 2 + 200);
				this.ctx.strokeText("Start", this.canvas.width / 2, this.canvas.height / 2 + 200);

				this.ctx.restore();
				//#endregion
				//#endregion

				this.ctx.restore();
				break;

			case 'game':
				//#region Updates
				this.player.update(deltaT);

				// Update asteroids
				this.asteroids.forEach(a => { a.update(deltaT); });
				this.asteroids = this.asteroids.filter(e => {
					if (e.health > 0) {
						return true;
					}
					this.score++;
					return false;
				});

				// Update tutorials
				for (const tutorial in this.tutorials) {
					this.tutorials[tutorial].time -= deltaT;
				}

				//#region Spawn asteroids
				// TODO: Add option to spawn waves
				// TODO: Add some randomness to the size
				while (this.asteroids.length < this.asteroidSpawning.minLimit + (this.score / this.asteroidSpawning.scorePerLimit)) {
					let asteroidSpawnAngle = 360 * Math.random();
					this.asteroids.push(new Asteroid(
						this.asteroidSpawning.minSize + (this.score / this.asteroidSpawning.scorePerSize),
						{
							x: this.player.pos.x + (this.worldSize / 2) * Math.sin(asteroidSpawnAngle * (Math.PI / 180)),
							y: this.player.pos.y + (this.worldSize / 2) * Math.cos(asteroidSpawnAngle * (Math.PI / 180))
						},
						this.worldSize,
						this.sounds,
						() => { return this.asteroids }
					));
				}
				//#endregion
				//#endregion

				// Collisions
				this.player.checkCollisions();

				//#region Draw
				this.ctx.save();

				//#region Translate to world origin
				this.ctx.save();
				this.ctx.translate(
					this.canvas.width / 2 - this.player.pos.x, 
					this.canvas.height / 2 - this.player.pos.y);

				// Draw the 9 backgrounds
				for (let x = -1; x < 2; x++) {
					for (let y = -1; y < 2; y++) {
						this.ctx.save();
						this.ctx.translate(this.worldSize * x, this.worldSize * y);

						// Draw just background first so it doesn't cut off things at the seams
						this.ctx.drawImage(this.images[this.defaults.background], 0, 0, this.worldSize, this.worldSize);

						this.ctx.restore();
					}
				}

				// Translate to each of the 9 copies of the world
				for (let x = -1; x < 2; x++) {
					for (let y = -1; y < 2; y++) {
						this.ctx.save();
						this.ctx.translate(this.worldSize * x, this.worldSize * y);

						// Draw bullets
						this.player.bullets.forEach(bullet => {
							bullet.draw();
						});

						// draw asteroids
						this.asteroids.forEach(a => {
							a.draw(this.ctx);
						});

						this.ctx.restore();
					}
				}

				this.ctx.restore();
				//#endregion

				// Draw tutorials
				for (const tutorial in this.tutorials) {
					if (this.tutorials[tutorial].time > 0) {
						this.tutorials[tutorial].draw(this);
					}
				}

				this.player.draw();

				// Draw UI
				this.ctx.fillStyle = 'white';
				this.ctx.font = '40px Futura';
				this.ctx.fillText("Score: " + this.score, 10, 50);

				this.ctx.restore();
				//#endregion
				break;

			default:
				break;
		}

		// Set last mouse state
		this.lastMouseState = this.mouseState;
	}
}

customElements.define('void-break', VoidBreak);