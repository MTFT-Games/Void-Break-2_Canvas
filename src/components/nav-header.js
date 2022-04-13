const template = document.createElement('template');
template.innerHTML = `
<!-- Bulma -->
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bulma@0.9.3/css/bulma.min.css">

<!-- Font awesome -->
<link rel="stylesheet"
	href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css"
	integrity="sha512-9usAa10IRO0HhonpyAIVpjrylPvoDwiPUiKdWk5t3PyolY1cOd4DSE0Ga+ri4AuTroPR5aQvXU9xC6qOPnzFeg=="
	crossorigin="anonymous" referrerpolicy="no-referrer" />

<style>
	.navbar {
		background-image: url(media/images/backgrounds/large/purple/purple-nebula-5.jpg);
	}
</style>
<header>
	<nav class='navbar'>
		<!-- Brand and burger -->
		<div class='navbar-brand'>
			<a href='about.html' class='navbar-item'>
				<!-- TODO: make a proper logo/brand -->
				<i class="fa-brands fa-battle-net is-size-3 has-text-light mr-2"></i>
				<h1 class='title has-text-light'>Void Break 2</h1>
			</a>
			<a class='navbar-burger has-text-light'>
				<span></span>
				<span></span>
				<span></span>
			</a>
		</div>

		<!-- Nav menu -->
		<div class='navbar-menu'>
			<div class='navbar-end'>
				<a class='navbar-item is-tab has-text-light' href='about.html' id='about'>About</a>
				<a class='navbar-item is-tab has-text-light' href='game.html' id='game'>Game</a>
				<a class='navbar-item is-tab has-text-light' href='documentation.html' id='documentation'>
					Documentation</a>
			</div>
		</div>
	</nav>
</header>
`;

class NavHeader extends HTMLElement {
	constructor() {
		super();

		// Add shadowroot
		this.attachShadow({ mode: 'open' });
		this.shadowRoot.appendChild(template.content.cloneNode(true));

		// Mobile menu
		this.burger = this.shadowRoot.querySelector('.navbar-burger');
		this.menu = this.shadowRoot.querySelector('.navbar-menu');
		this.burger.onclick = () => {
			this.burger.classList.toggle('is-active');
			this.menu.classList.toggle('is-active');
		};
	}

	attributeChangedCallback(attributeName, oldVal, newVal) {
		if (attributeName != "data-active") return;

		oldVal = this.shadowRoot.querySelector(`#${oldVal}`);
		newVal = this.shadowRoot.querySelector(`#${newVal}`);

		if (oldVal) {
			oldVal.classList.toggle('is-active');
			oldVal.classList.toggle('has-text-light');
		}
		if (newVal) {
			newVal.classList.toggle('is-active');
			newVal.classList.toggle('has-text-light');
		}

	}

	static get observedAttributes() {
		return ["data-active"];
	}
}

customElements.define('nav-header', NavHeader);