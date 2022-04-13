import "./components/nav-header.js";
import "./components/void-break.js";

const game = document.querySelector('void-break');

const imageSources = {
	purple5: 'media/images/backgrounds/large/purple/purple-nebula-5.jpg'
};

// Load images
for (let imageName in imageSources) {
	let img = new Image();
	img.src = imageSources[imageName];
	imageSources[imageName] = img;
	img.onload = function () {
		game.loading += 25;
	}
	img.onerror = function () {
		console.log("ERROR: image named '" + imageName + "' at " + this.src + " did not load!");
	}
}
game.images = imageSources;

// Load sounds
const sounds = {};

sounds.shoot1 = new Howl({ src: ['media/sounds/shoot1.wav'] });
sounds.shoot1.volume(0.3);
game.loading += 25;

sounds.hit1 = new Howl({ src: ['media/sounds/hit1.wav'] });
sounds.hit1.volume(0.5);
game.loading += 25;

sounds.hit2 = new Howl({ src: ['media/sounds/hit2.wav'] });
sounds.hit2.volume(0.5);
game.loading += 25;

game.sounds = sounds;

// game.state = 'main menu';
