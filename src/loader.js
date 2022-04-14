import "./components/nav-header.js";
import "./components/void-break.js";

const game = document.querySelector('void-break');
const loadingTotal = 5.0;

const imageSources = {
	purple5: 'media/images/backgrounds/large/purple/purple-nebula-5.jpg',
	purple6: 'media/images/backgrounds/large/purple/purple-nebula-6.png'
};

// Load sounds
const sounds = {};

sounds.shoot1 = new Howl({ src: ['media/sounds/shoot1.wav'] });
sounds.shoot1.volume(0.3);
game.loading += 100.0 / loadingTotal;

sounds.hit1 = new Howl({ src: ['media/sounds/hit1.wav'] });
sounds.hit1.volume(0.5);
game.loading += 100.0 / loadingTotal;

sounds.hit2 = new Howl({ src: ['media/sounds/hit2.wav'] });
sounds.hit2.volume(0.5);
game.loading += 100.0 / loadingTotal;

game.sounds = sounds;

// Load images
for (let imageName in imageSources) {
	let img = new Image();
	img.src = imageSources[imageName];
	imageSources[imageName] = img;
	img.onload = function () {
		game.loading += 100.0 / loadingTotal;
		if (game.loading == 100) {
			game.images = imageSources;
			game.state = 'main menu';
		}
	}
	img.onerror = function () {
		console.log("ERROR: image named '" + imageName + "' at " + this.src + " did not load!");
	}
}