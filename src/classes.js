import { simpleCircleCollisionCheck } from "./utilities.js";

/**
 * Basic gameobject
 */
export class GameObject {
	constructor(pos, vel = { x: 0, y: 0 }, angle = 0, worldSize) {
		this.worldSize = worldSize;
		this.pos = {x: pos.x, y: pos.y};
		this.vel = {x: vel.x, y: vel.y};
		this.angle = angle;
	}

	move(deltaT) {
		this.pos.x += this.vel.x * deltaT;
		this.pos.y += this.vel.y * deltaT;
	}

	update(deltaT) {
		this.move(deltaT);

		//#region World wrapping
		if (this.pos.x < 0) {
			this.pos.x += this.worldSize;
		} else if (this.pos.x > this.worldSize) {
			this.pos.x -= this.worldSize;
		}
		if (this.pos.y < 0) {
			this.pos.y += this.worldSize;
		} else if (this.pos.y > this.worldSize) {
			this.pos.y -= this.worldSize;
		}
		//#endregion
	}
}

/**
 * Represents the player ship.
 */
export class Player extends GameObject {
	constructor(pos, game) {
		super(pos, { x: 0, y: 0 }, 0, game.worldSize);
		this.sounds = game.sounds;
		this.game = game;
	}

	/**
	 * Resets player to initial state ready for a new game.
	 */
	reset() {
		// TODO: use variable and make theses defaults changable
		// Motion stats
		this.friction = 0.9;
		this.vel = { x: this.worldSize / 3, y: -this.worldSize / 3 };
		this.thrust = 1200.0;
		this.turnSpeed = 180.0;
		this.turning = {cw: 0, ccw: 0};
		this.thrusting = false;
		this.angle = 45;
		this.radius = 16;

		// Health and shields
		this.health = { max: 100, current: 100 };
		this.shield = { max: 50, current: 50 };
		this.damageCooldown = { max: 10, current: 0 };

		// Shooting stats
		this.projectiles = { count: 1, burst: 1, rate: 5.0, spread: 0, cooldown: 0 };
		this.bullet = { type: "bullet", damage: 10, size: 1, speed: 600, enemy: false, lifetime: 2 };
		this.bullets = [];
		this.firing = false;
		this.startFiring = false;
	}

	draw() {
		const canvas = this.game.canvas;
		const ctx = this.game.ctx;

		//#region Draw ship
		ctx.save();
		ctx.translate(canvas.width / 2, canvas.height / 2);
		ctx.rotate(this.angle * (Math.PI / 180));
		ctx.scale(8, 8);

		//#region Draw body
		ctx.fillStyle = 'white';
		ctx.beginPath();
		ctx.moveTo(0, -2);
		ctx.lineTo(1.5, 2);
		ctx.lineTo(0, 1);
		ctx.lineTo(-1.5, 2);
		ctx.closePath();
		ctx.fill();
		//#endregion

		//#region Draw thrust
		if (this.thrusting) {
			ctx.fillStyle = 'rgba(180,180,255, 0.8)';
			ctx.beginPath();
			ctx.moveTo(0, 1);
			ctx.lineTo(-1.2, 3);
			ctx.lineTo(0, 5);
			ctx.lineTo(1.2, 3);
			ctx.closePath();
			ctx.fill();
		}
		//#endregion

		ctx.restore();
		//#endregion

		//#region Draw player ui
		ctx.save();
		ctx.translate(canvas.width / 2, canvas.height - 50);
		ctx.scale(3, 1);

		//#region Health bar
		// Background
		ctx.fillStyle = '#3f3f3f';
		ctx.beginPath();
		ctx.rect(-this.health.max / 2, 10, this.health.max, 20);
		ctx.fill();
		
		// Forground
		ctx.fillStyle = '#cf0000';
		ctx.beginPath();
		ctx.rect(-this.health.current / 2, 10, this.health.current, 20);
		ctx.fill();
		//#endregion

		//#region Shield bar
		// Background
		ctx.fillStyle = '#3f3f3f';
		ctx.beginPath();
		ctx.rect(-this.shield.max / 2, -20, this.shield.max, 20);
		ctx.fill();
		
		// Forground
		ctx.fillStyle = '#0000cf';
		ctx.beginPath();
		ctx.rect(-this.shield.current / 2, -20, this.shield.current, 20);
		ctx.fill();

		ctx.restore();
		//#endregion
		//#endregion
	}

	/**
	 * Update the state of this player.
	 * 
	 * Updates and applies rotation, thrust, friction, velocity, cooldowns, regen, 
	 * screen wrapping, collisions, and shooting.
	 */
	update(deltaT) {
		// Turn
		// TODO: Maybe add a tiny hint of momentum to turning.
		this.angle += this.turnSpeed * deltaT * (this.turning.cw - this.turning.ccw);

		//#region Friction
		this.vel.x *= 1 - (this.friction * deltaT);
		this.vel.y *= 1 - (this.friction * deltaT);

		// Set 0 because floating point
		if (this.vel.x * this.vel.x + this.vel.y * this.vel.y < 0.01) {
			this.vel.x = 0;
			this.vel.y = 0;
		}
		//#endregion

		// Thrust
		if (this.thrusting) {
			this.vel.x += this.thrust * deltaT * Math.sin(this.angle * (Math.PI / 180));
			this.vel.y -= this.thrust * deltaT * Math.cos(this.angle * (Math.PI / 180));
		}

		// Move and wrap
		super.update(deltaT);

		// Cooldowns
		this.damageCooldown.current -= deltaT;
		this.projectiles.cooldown -= deltaT;

		//#region Shoot
		if (this.startFiring && this.projectiles.cooldown <= 0) {
			this.startFiring = false;
			this.firing = true;
			this.projectiles.cooldown = 0;
		}
		while (this.firing && this.projectiles.cooldown <= 0) {
			this.shoot();
		}
		//#endregion

		//#region Regen if off cooldown
		if (this.shield.current < this.shield.max && this.damageCooldown.current <= 0) {
			this.shield.current += (this.shield.max / 15) * deltaT;
			if (this.shield.current > this.shield.max) {
				this.shield.current = this.shield.max;
			}
		}
		//#endregion

		// Update bullets
		this.bullets.forEach(bullet => {
			bullet.update(deltaT);
		});
		this.bullets = this.bullets.filter(e => e.lifetime > 0);
	}

	checkCollisions() {
		this.game.asteroids.forEach(asteroid => {
			if (simpleCircleCollisionCheck(this, asteroid)) {
				// Get direction from player to the asteroid
				let impactDirection = { x: asteroid.pos.x - this.pos.x, y: asteroid.pos.y - this.pos.y };

				// Knock back the asteroid
				// TODO: I forgot to normalize the vector first... that will cause fuckieness
				asteroid.vel.x += impactDirection.x * (this.health.max / 20);
				asteroid.vel.y += impactDirection.y * (this.health.max / 20);

				// Calculate capped asteroid damage
				let cappedAstDmg = asteroid.radius;
				if (cappedAstDmg > 30) {
					cappedAstDmg = 30;
				}

				// Knock back the player
				this.vel.x -= (cappedAstDmg / 3) * impactDirection.x;
				this.vel.y -= (cappedAstDmg / 3) * impactDirection.y;

				// Doll out damage
				this.damage(cappedAstDmg);
				asteroid.damage(this.health.max);
			}
		});

		this.bullets.forEach(bullet => {
			bullet.checkCollisions();
		});
	}

	/**
	 * Spawns and launches bullets according to the projectile settings.
	 */
	shoot() {
		// TODO: use a variable for the limit
		if (this.bullets.length < 150) {
			this.bullets.push(new Bullet(this));
		}
		this.projectiles.cooldown += (1 / this.projectiles.rate);
		this.sounds.shoot1.play();
	}

	/**
	 * Apply damage to the player.
	 * 
	 * Applies damage to the players shields before health and resets damage 
	 * cooldown. Ends game if damage is fatal.
	 * 
	 * @param {*} amt The amount of damage to apply.
	 */
	damage(amt) {
		// Reset damage cooldown.
		this.damageCooldown.current = this.damageCooldown.max;

		// Apply damage to shield.
		this.shield.current -= amt;

		// Apply any damage the shield can't absorb to health.
		if (this.shield.current < 0) {
			this.health.current += this.shield.current;
			this.shield.current = 0;

			// Check for death.
			if (this.health.current <= 0) {
				this.game.state = 'game over'; 
				// TODO maybe something fancier later. animate a flower thing?
			}
		}
	}
}

class Bullet extends GameObject {
	constructor(parent) {
		super(
			{
				x: parent.pos.x + parent.vel.x * parent.projectiles.cooldown,
				y: parent.pos.y + parent.vel.y * parent.projectiles.cooldown
			},
			{
				x: parent.vel.x + parent.bullet.speed * Math.sin(parent.angle * (Math.PI / 180)),
				y: parent.vel.y - parent.bullet.speed * Math.cos(parent.angle * (Math.PI / 180))
			},
			parent.angle,
			parent.worldSize);

		this.parent = parent;
		this.radius = 4 * this.parent.bullet.size;
		this.lifetime = parent.bullet.lifetime;
		this.update(-parent.projectiles.cooldown);
	}

	draw() {
		const canvas = this.parent.game.canvas;
		const ctx = this.parent.game.ctx;
		ctx.save();

		// Draw shape.
		ctx.translate(this.pos.x, this.pos.y);
		ctx.rotate(this.angle * (Math.PI / 180));
		ctx.scale(2 * this.parent.bullet.size, 2 * this.parent.bullet.size);
		if (this.parent.bullet.enemy) {
			ctx.fillStyle = 'red';
		} else {
			ctx.fillStyle = 'white';
		}

		ctx.beginPath();
		ctx.moveTo(0, -2);
		ctx.lineTo(1.5, 2);
		ctx.lineTo(0, 1);
		ctx.lineTo(-1.5, 2);
		ctx.closePath();
		ctx.fill();

		ctx.restore();
	}

	/** 
	 * Update the state of the bullet.
	 *
	 * Apply velocity, screen wrap, check collision, and tick down lifetime.
	 *
	 * @param {*} deltaT Delta time.
	 */
	update(deltaT) {
		super.update(deltaT);

		// Tick down lifetime.
		this.lifetime -= deltaT;
	}

	checkCollisions() {
		// Check collisions with asteroids
		this.parent.game.asteroids.forEach(asteroid => {
			if (simpleCircleCollisionCheck(this, asteroid)) {
				asteroid.damage(this.parent.bullet.damage);
				this.lifetime = 0;
			}
		});
	}
}

/**
 * An asteroid obstacle.
 */
export class Asteroid extends GameObject {
	constructor(size, pos, worldSize, sounds, array) {
		super(pos, {x:0,y:0},360 * Math.random(), worldSize);
		//#region Generate random jaggy circle like shape
		this.points = [];

		// Set settings
		this.radius = size;
		let delta = this.radius / 3.0;
		let min = this.radius - (delta / 2.0);
		let degreeStepMin = 5;
		let degreeStepDelta = 20;
		let currentAngle = 0;
		let magnitude;

		// Generate shape
		// Start with a point straight up
		let initialMagnitude = min + (Math.random() * delta);
		this.points.push({x:0, y:-initialMagnitude});
		currentAngle += degreeStepMin + (Math.random() * degreeStepDelta);

		// Loop generating points around the circle until back at top
		while (currentAngle < 360) {
			// Get a random magnitude within limits.
			magnitude = min + (Math.random() * delta);
			this.points.push({
				x:magnitude * Math.sin(currentAngle * (Math.PI / 180)),
				y:-magnitude * Math.cos(currentAngle * (Math.PI / 180))
			});

			// Advance by a random degree within limits.
			currentAngle += degreeStepMin + (Math.random() * degreeStepDelta);
		}
		//#endregion

		this.health = size;
		this.sounds = sounds;
		this.asteroids = array;

		// Randomize velocity
		let speed = 20 + (Math.random() * (2000 / this.radius));
		this.vel = {
			x: speed * Math.sin(this.angle * (Math.PI / 180)),
			y: speed * Math.cos(this.angle * (Math.PI / 180))
		};
	}

	draw(ctx) {
		ctx.save();
		ctx.strokeStyle = 'white';
		ctx.fillStyle = '#404040';

		// Draw shape.
		ctx.translate(this.pos.x, this.pos.y);
		ctx.rotate(this.angle * (Math.PI / 180));

		ctx.beginPath();
		ctx.moveTo(this.points[0].x, this.points[0].y);
		for (let index = 1; index < this.points.length; index++) {
			ctx.lineTo(this.points[index].x, this.points[index].y);
		}
		ctx.closePath();
		ctx.fill();
		ctx.stroke();
		ctx.restore();
	}

	/**
	 * Applies damage to the asteroid and splits the asteroid if applicable.
	 *
	 * @param {*} amt
	 */
	damage(amt) {
		// Damage
		this.health -= amt;
		this.sounds.hit1.play();

		// Destroy this
		if (this.health <= 0) {
			this.sounds.hit2.play();

			
			if (this.radius > 20) {
				// Divide
				// TODO: add original velocity to the new frags
				let maxDivisions = Math.floor(this.radius / 10);
				if (maxDivisions > 5) {
					maxDivisions = 5;
				}
				let divisions = Math.floor(2 + (Math.random() * (maxDivisions - 1)));
				for (let i = 0; i < divisions; i++) {
					this.asteroids().push(new Asteroid(this.radius / divisions, this.pos, this.worldSize, this.sounds, this.asteroids));
				}
			}
		}
	}
}