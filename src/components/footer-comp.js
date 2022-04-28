const template = document.createElement('template');
template.innerHTML = `
<!-- Bulma -->
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bulma@0.9.3/css/bulma.min.css">

<footer class="footer has-background-black-bis has-text-light">
  <div class="content has-text-centered">
    <p>
      <strong>Void Break 2</strong> by Noah Emke. Check out my <a href="https://github.com/MTFT-Games">GitHub</a> and <a href="https://noahemke.com/">website</a> for more of my work.
    </p>
  </div>
</footer>
`;

class FooterComp extends HTMLElement {
	constructor() {
		super();

		// Add shadowroot
		this.attachShadow({ mode: 'open' });
		this.shadowRoot.appendChild(template.content.cloneNode(true));
	}
}

customElements.define('footer-comp', FooterComp);