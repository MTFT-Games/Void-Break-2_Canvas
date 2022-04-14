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

		// Resolution and autosizing
		this.resolution = 1080; //TODO: Get this from localstorage or defaults json
		document.defaultView.onresize = () => {
			this.canvas.width = (this.offsetWidth / this.offsetHeight) * this.resolution;
			this.canvas.height = this.resolution;
		};

		// init
		document.defaultView.onresize();
		this.state = 'loading';
		this.loading = 0;
		this.lastFrameTime = window.performance.now();
		this.loop();
	}

	// Draw a loading screen
	drawLoading(percent) {
		this.ctx.save();

		// Clear
		this.ctx.fillStyle = 'black';
		this.ctx.rect(0, 0, this.canvas.width, this.canvas.height);
		this.ctx.fill();

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

		this.ctx.restore();
	}

	loop() {
		requestAnimationFrame(() => this.loop());

		// Keep time
		const frameTime = window.performance.now();
		const deltaT = frameTime - this.lastFrameTime;
		this.lastFrameTime = frameTime;

		switch (this.state) {
			case 'loading':
				this.drawLoading(this.loading);
				break;

			case 'main menu':
				// Draw main menu
				this.ctx.save();

				// Clear
				this.ctx.fillStyle = 'black';
				this.ctx.rect(0, 0, this.canvas.width, this.canvas.height);
				this.ctx.fill();

				// Draw background
				this.ctx.save();
				let scale = this.resolution / 1024;
				if (this.canvas.width > this.canvas.height) scale = this.canvas.width / 1024;
				this.ctx.scale(scale, scale);
				this.ctx.drawImage(this.images.purple6, 0, 0);
				this.ctx.restore();

				// Draw logo text TODO: should make a proper logo
				this.ctx.fillStyle = 'red';
				this.ctx.strokeStyle = 'white';
				this.ctx.textAlign = 'center';
				this.ctx.font = '300px Futura';
				this.ctx.fillText("VOID", this.canvas.width / 2, this.canvas.height / 2 - 300);
				this.ctx.strokeText("VOID", this.canvas.width / 2, this.canvas.height / 2 - 300);
				this.ctx.fillText("BREAK", this.canvas.width / 2, this.canvas.height / 2 - 80);
				this.ctx.strokeText("BREAK", this.canvas.width / 2, this.canvas.height / 2 - 80);

				this.ctx.restore();
				break;

			default:
				break;
		}
	}
}

customElements.define('void-break', VoidBreak);