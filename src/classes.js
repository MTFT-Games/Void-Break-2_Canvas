/**
 * Represents the player ship.
 */
class Player extends PIXI.Graphics {
	constructor() {
		super();
		// Draw shape
		this.lineStyle(1, 0xFFFFFF, 1);
		this.beginFill(0xFFFFFF);
		this.moveTo(0, -2);
		this.lineTo(1.5, 2);
		this.lineTo(0, 1);
		this.lineTo(-1.5, 2);
		this.lineTo(0, -2);
		this.endFill();
		this.scale.set(4);

		world.addChild(this);

		this.scrollLimit = 0;

		this.reset();
	}

	/**
	 * Resets player to initial state ready for a new game.
	 */
	reset() {
		// Motion stats
		this.friction = 0.9;
		this.vel = { x: game.view.width, y: game.view.height };
		this.thrust = 600.0;
		this.turnSpeed = 180.0;
		this.turning = "";
		this.thrusting = false;

		// Position
		this.x = 0;
		this.y = worldSize;
		this.angle = 45;
		showWorld.x = -worldSize;
		showWorld.y = -worldSize*2 + game.view.height;

		// Health and shields
		this.health = { max: 100, current: 100 };
		this.shield = { max: 50, current: 50 };
		this.damageCooldown = { max: 10, current: 0 };
		UI.health.max.scale.set(this.health.max, 1);
		UI.health.current.scale.set(this.health.current, 1);
		UI.shield.max.scale.set(this.shield.max, 1);
		UI.shield.current.scale.set(this.shield.current, 1);

		// Shooting stats
		this.projectiles = { count: 1, burst: 1, rate: 5.0, spread: 0, cooldown: 0 };
		this.bullet = { type: "bullet", damage: 5, size: 1, speed: 400, enemy: false, lifetime: 2 };
		this.firing = false;
		this.startFiring = false;
	}

	/**
	 * Update the state of this player.
	 * 
	 * Updates and applies rotation, thrust, friction, velocity, cooldowns, regen, 
	 * screen wrapping, collisions, and shooting.
	 */
	update() {
		// Turn
		// TODO: Maybe add a tiny hint of momentum to turning.
		if (this.turning == "cw") {
			this.angle += this.turnSpeed * dt;
		} else if (this.turning == "ccw") {
			this.angle -= this.turnSpeed * dt;
		}

		// Friction
		this.vel.x *= 1 - (this.friction * dt);
		this.vel.y *= 1 - (this.friction * dt);
		if (this.vel.x * this.vel.x + this.vel.y * this.vel.y < 0.01) {
			this.vel.x = 0;
			this.vel.y = 0;
		}

		// Thrust
		if (this.thrusting) {
			this.vel.x += this.thrust * dt * Math.sin(this.angle * (Math.PI/180));
			this.vel.y += this.thrust * dt * Math.cos(this.angle * (Math.PI/180));
		}

		// Movement
		this.x += this.vel.x * dt;
		this.y -= this.vel.y * dt;

		// Move the showWorld scene to keep the camera on the player
		if (this.x > -showWorld.x - worldSize + (game.view.width/2) + this.scrollLimit) { 
			// Too far right
			if (this.vel.x > 0) { // And moving right
				showWorld.x -= this.vel.x * dt;
			}
		}else if (this.x < -showWorld.x - worldSize + (game.view.width/2) - this.scrollLimit) { 
			// Too far left
			if (this.vel.x < 0) { // And moving left
				showWorld.x -= this.vel.x * dt;
			}
		}
		if (this.y > -showWorld.y - worldSize + (game.view.height/2) + this.scrollLimit) { 
			// Too low
			if (this.vel.y < 0) { // And moving down
				showWorld.y += this.vel.y * dt;
			}
		}else if (this.y < -showWorld.y - worldSize + (game.view.height/2) - this.scrollLimit) { 
			// Too high
			if (this.vel.y > 0) { // And moving up
				showWorld.y += this.vel.y * dt;
			}
		}

		// Screen wrap, move player and camera to the other side of the world when at edge
		if (this.x > worldSize) {
			showWorld.x += worldSize;
			this.x -= worldSize;
		} else if (this.x < 0) {
			showWorld.x -= worldSize;
			this.x += worldSize;
		}
		if (this.y > worldSize) {
			showWorld.y += worldSize;
			this.y -= worldSize;
		} else if (this.y < 0) {
			showWorld.y -= worldSize;
			this.y += worldSize;
		}

		// Cooldowns
		this.damageCooldown.current -= dt;
		this.projectiles.cooldown -= dt;

		// Shoot
		if (this.startFiring) {
			this.startFiring = false;
			this.firing = true;
			this.projectiles.cooldown = 0;
		}
		while (this.firing && this.projectiles.cooldown <= 0) {
			this.shoot();
		}

		// Regen if off cooldown
		if (this.shield.current < this.shield.max && this.damageCooldown.current <= 0) {
			this.shield.current += (this.shield.max/15) * dt;
			if (this.shield.current > this.shield.max) {
				this.shield.current = this.shield.max;
			}
			UI.shield.current.scale.set(this.shield.current, 1);
		}

		// Collisions
		asteroids.forEach(asteroid => {
			if (simpleCircleCollisionCheck(this, asteroid)) {
				// Get direction from this to the asteroid
				let impactDirection = { x: asteroid.x - this.x, y: -(asteroid.y - this.y) };
				
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
				this.vel.x -= (cappedAstDmg/3) * impactDirection.x;
				this.vel.y -= (cappedAstDmg/3) * impactDirection.y;

				// Doll out damage
				this.damage(cappedAstDmg);
				asteroid.damage(this.health.max);
			}
		});
	}

	/**
	 * Spawns and launches bullets according to the projectile settings.
	 */
	shoot() {
		if (playerBullets.length < 150) {
			playerBullets.push(new Bullet(this));
		}
		this.projectiles.cooldown += (1/this.projectiles.rate);
		sounds.shoot1.play();
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
				endGame();
			}
		}

		// Update ui
		UI.shield.current.scale.set(this.shield.current, 1);
		UI.health.current.scale.set(this.health.current, 1);
	}
}

class Bullet extends PIXI.Graphics {
	constructor(parent) {
		super();
		// Draw shape.
		if (parent.bullet.enemy) {
			this.lineStyle(1, 0xFF0000, 1);
		}else {
			this.lineStyle(1, 0xFFFFFF, 1);
		}
		this.beginFill(0xFFFFFF);
		this.moveTo(0, -2);
		this.lineTo(1.5, 2);
		this.lineTo(0, 1);
		this.lineTo(-1.5, 2);
		this.lineTo(0, -2);
		this.endFill();
		this.scale.set(parent.bullet.size);

		world.addChild(this);

		// Start position at parent
		this.x = parent.x + parent.vel.x * parent.projectiles.cooldown;
		this.y = parent.y - parent.vel.y * parent.projectiles.cooldown;
		this.angle = parent.angle;
		this.vel = { 
			x: parent.vel.x + parent.bullet.speed * Math.sin(this.angle * (Math.PI/180)), 
			y: parent.vel.y + parent.bullet.speed * Math.cos(this.angle * (Math.PI/180))
		};

		this.damage = parent.bullet.damage;
		this.lifetime = parent.bullet.lifetime;
		this.update(-parent.projectiles.cooldown);
	}

	/**
	 * Update the state of the bullet.
	 * 
	 * Apply velocity, screen wrap, check collision, and tick down lifetime.
	 * 
	 * @param {*} _dt Probably not necessary since dt is script scope.
	 */
	update(_dt) {
		// Move
		this.x += this.vel.x * _dt;
		this.y -= this.vel.y * _dt;
		
		// Screen wrap
		if (this.x > worldSize) {
			this.x -= worldSize;
		} else if (this.x < 0) {
			this.x += worldSize;
		}
		if (this.y > worldSize) {
			this.y -= worldSize;
		} else if (this.y < 0) {
			this.y += worldSize;
		}

		// Check collisions with asteroids
		asteroids.forEach(asteroid => {
			if (this.lifetime > 0 && simpleCircleCollisionCheck(this, asteroid)) {
				asteroid.damage(this.damage);
				this.lifetime = 0;
			}
		});

		// Tick down lifetime and delete if up.
		this.lifetime -= _dt;
		if (this.lifetime < 0) {
			world.removeChild(this);
		}
	}
}

/**
 * An asteroid obstacle.
 */
class Asteroid extends PIXI.Graphics {
	constructor(size, _x, _y) {
		super();
		//#region Generate random jaggy circle like shape
		// Start drawing
		this.lineStyle(1, 0xFFFFFF, 1);
		this.beginFill(0x404040);

		// Set settings
		this.radius = size;
		let delta = size/3.0;
		let min = size - (delta/2.0);
		let degreeStepMin = 5;
		let degreeStepDelta = 20;
		let currentAngle = 0;
		let magnitude;

		// Generate shape
		// Start with a point straight up
		let initialMagnitude = min + (Math.random()*delta);
		this.moveTo(0, -initialMagnitude);
		currentAngle += degreeStepMin + (Math.random()*degreeStepDelta);

		// Loop generating points around the circle until back at top
		while (currentAngle < 360) {
			// Get a random magnitude within limits.
			magnitude = min + (Math.random()*delta);
			this.lineTo(
				magnitude * Math.sin(currentAngle * (Math.PI/180)), 
				-magnitude * Math.cos(currentAngle * (Math.PI/180))
			);

			// Advance by a random degree within limits.
			currentAngle += degreeStepMin + (Math.random()*degreeStepDelta);
		}

		// Close the shape and finish
		this.lineTo(0, -initialMagnitude);
		this.endFill();
		//#endregion

		// Set given position
		this.x = _x;
		this.y = _y;

		world.addChild(this);

		this.health = size;

		// Randomize velocity and rotation
		let speed = 10+(Math.random()*(1000/size));
		this.angle = 360*Math.random();
		this.vel = { 
			x: speed * Math.sin(this.angle * (Math.PI/180)), 
			y: speed * Math.cos(this.angle * (Math.PI/180))
		};
	}

	/**
	 * Applies damage to the asteroid and splits the asteroid if applicable.
	 * 
	 * @param {*} amt 
	 */
	damage(amt) {
		// Damage
		this.health -= amt;
		sounds.hit1.play();

		// Destroy this
		if (this.health <= 0) {
			world.removeChild(this);
			sounds.hit2.play();

			// Add score
			score++;
			UI.score.current.text = score;
			if (this.radius > 10) {
				// Divide
				// TODO: add original velocity to the new frags
				let maxDivisions = Math.floor(this.radius/5);
				if (maxDivisions > 5) {
					maxDivisions = 5;
				}
				let divisions = Math.floor(2 + (Math.random()*(maxDivisions-1)));
				for (let i = 0; i < divisions; i++) {
					asteroids.push(new Asteroid(this.radius / divisions, this.x, this.y));
				}
			}
		}
	}

	/**
	 * Update the state of the asteroid.
	 * 
	 * @param {*} _dt Probably not needed since dt is script scope.
	 */
	update(_dt) {
		// Move
		this.x += this.vel.x * _dt;
		this.y -= this.vel.y * _dt;

		// Screen wrap
		if (this.x > worldSize) {
			this.x -= worldSize;
		} else if (this.x < 0) {
			this.x += worldSize;
		}
		if (this.y > worldSize) {
			this.y -= worldSize;
		} else if (this.y < 0) {
			this.y += worldSize;
		}
	}
}