import { Player } from "../classes.js";
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

		// Add shadowroot
		this.attachShadow({ mode: 'open' });
		this.shadowRoot.appendChild(template.content.cloneNode(true));

		this.canvas = this.shadowRoot.querySelector('canvas');
		this.ctx = this.canvas.getContext('2d');

		//#region Resolution and autosizing
		this.resolution = 1080; //TODO: Get this from localstorage or defaults json
		document.defaultView.onresize = () => {
			this.canvas.width = (this.offsetWidth / this.offsetHeight) * this.resolution;
			this.canvas.height = this.resolution;
		};
		//#endregion

		//#region Input
		this.canvas.onmousemove = (e) => {
			// relationship bitmap vs. element
			const scaleX = this.canvas.width / this.canvas.offsetWidth;
			const scaleY = this.canvas.height / this.canvas.offsetHeight;

			this.mousePos = {
				x: (e.clientX) * scaleX,
				y: (e.clientY - this.canvas.offsetTop) * scaleY
			};
		};
		this.canvas.onmousedown = this.canvas.onmouseup = (e) => {
			this.mouseState = e.buttons;
		};
		this.canvas.oncontextmenu = (e) => {
			e.preventDefault();
		};
		document.onkeydown = (key) => {
			switch (key.keyCode) {
				case 87: // W
					this.player.thrusting = true;
					break;

				case 65: // A
					this.player.turning = "ccw";
					break;

				case 68: // D
					this.player.turning = "cw";
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
				case 68: // D
					this.player.turning = "";
					break;

				case 32: // space
					this.player.firing = false;
					break;

				default:
					break;
			}
		};
		//#endregion

		// init
		document.defaultView.onresize();
		this.mousePos = { x: 0, y: 0 };
		this.worldSize = 3000; // TODO set this
		this.mouseState = 0;
		this.lastMouseState = 0;
		this.sounds = {};
		this.asteroids = []; // TODO: maybe make an asteroid manager
		this.player = new Player({ x: 0, y: 0 }, this);
		this.state = 'loading';
		this.loading = 0;
		this.lastFrameTime = window.performance.now() / 1000.0;
		this.loop();
	}

	// Draw a loading screen
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

		// Keep time
		const frameTime = window.performance.now() / 1000.0;
		const deltaT = frameTime - this.lastFrameTime;
		this.lastFrameTime = frameTime;

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

				// Debug show hitbox
				this.ctx.fillStyle = 'red';
				//this.ctx.fillRect(this.canvas.width / 2 - 90, this.canvas.height / 2 + 130, 185, 75);

				//#region Test for mouse hover and click
				if (testAABB({ x: this.mousePos.x, y: this.mousePos.y, w: 0, h: 0 },
					{ x: this.canvas.width / 2 - 90, y: this.canvas.height / 2 + 130, w: 185, h: 75 })) {
					if (this.mouseState % 2 == 1) {
						this.ctx.fillStyle = 'darkRed';
					} else if (this.lastMouseState % 2 == 1 && this.mouseState % 2 == 0) {
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
				this.player.update(deltaT);
				// update asteroids

				this.player.checkCollisions();

				//#region Draw
				this.ctx.save();
				// Translate to world origin
				this.ctx.translate(this.canvas.width / 2 - this.player.pos.x, this.canvas.height / 2 - this.player.pos.y);

				// Translate to each of the 9 copies of the world
				for (let x = -1; x < 2; x++) {
					for (let y = -1; y < 2; y++) {
						this.ctx.save();
						this.ctx.translate(this.worldSize * x, this.worldSize * y);

						// Draw background
						this.ctx.drawImage(this.images.purple5, 0, 0, this.worldSize, this.worldSize);

						// draw asteroids

						// Draw bullets
						this.player.bullets.forEach(bullet => {
							bullet.draw();
						});

						this.ctx.restore();
					}
				}
				this.ctx.restore();
				this.player.draw();
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