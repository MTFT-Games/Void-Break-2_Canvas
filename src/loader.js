import "./components/nav-header.js";
import "./components/void-break.js";

const game = document.querySelector('void-break');
const loadingTotal = 6.0;

const imageSources = {
	purple5: 'media/images/backgrounds/large/purple/purple-nebula-5.jpg',
	purple6: 'media/images/backgrounds/large/purple/purple-nebula-6.jpg'
};

// Load sounds
game.sounds.shoot1 = new Howl({ src: ['media/sounds/shoot1.wav'] });
game.sounds.shoot1.volume(0.3);
game.loading += 100.0 / loadingTotal;

game.sounds.hit1 = new Howl({ src: ['media/sounds/hit1.wav'] });
game.sounds.hit1.volume(0.5);
game.loading += 100.0 / loadingTotal;

game.sounds.hit2 = new Howl({ src: ['media/sounds/hit2.wav'] });
game.sounds.hit2.volume(0.5);
game.loading += 100.0 / loadingTotal;

// Load JSON
fetch('data/defaults.json')
	.then(response => response.json())
	.then(data => {
		game.loading += 100.0 / loadingTotal;
		game.defaults = data;
		if (game.loading >= 99.9) {
			game.images = imageSources;
			game.state = 'main menu';
		}
	});


// Load images
for (let imageName in imageSources) {
	let img = new Image();
	img.src = imageSources[imageName];
	imageSources[imageName] = img;
	img.onload = function () {
		game.loading += 100.0 / loadingTotal;
		if (game.loading >= 99.9) {
			game.images = imageSources;
			game.state = 'main menu';
		}
	}
	img.onerror = function () {
		console.log("ERROR: image named '" + imageName + "' at " + this.src + " did not load!");
	}
}