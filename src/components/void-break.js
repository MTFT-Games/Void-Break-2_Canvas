const template = document.createElement('template');
template.innerHTML = `
<style>
canvas {
	height: 100%;
	width: 100%;
}
</style>
<canvas>
`;

class VoidBreak extends HTMLElement {
	constructor() {
		super();

		// Add shadowroot
		this.attachShadow({ mode: 'open' });
		this.shadowRoot.appendChild(template.content.cloneNode(true));

		this.canvas = this.shadowRoot.querySelector('canvas');
		this.ctx = this.canvas.getContext('2d');
		this.ctx.fillRect(0,0,this.canvas.width, this.canvas.height);
	}
}

customElements.define('void-break', VoidBreak);