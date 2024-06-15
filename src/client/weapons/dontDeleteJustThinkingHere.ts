import { RunService } from "@rbxts/services";
import { InstanceComponent } from "shared/component/InstanceComponent";

type projectileModifier = {
	//<----- modifiers, not absolute units!
	speedModifier?: number;
	lifetimeModifier?: number;
	heatDamage?: number;
	impactDamage?: number;
	explosiveDamage?: number;
};

class WeaponProjectile extends InstanceComponent<BasePart> {
	private modifiers: projectileModifier[] = [];
	private totalEffect: projectileModifier = {};
	lifetime: number | undefined;
	constructor(
		readonly projectileType: "KINETIC" | "ROCKET" | "BOMB" | "LASER" | "PLASMA",
		readonly model: BasePart,
		readonly baseSpeed: Vector3,
		readonly baseDamage: number,
		lifetime?: number, //<--- milliseconds
	) {
		super(model);

		this.lifetime = lifetime;

		this.event.subscribe(model.Touched, (part) => this.hit(part));
		this.event.subscribe(RunService.Heartbeat, (dt) => this.tick(dt));
	}

	private recalculateProperties() {
		this.totalEffect = {};
		for (const mod of this.modifiers) {
			for (const [name, value] of pairs(mod)) {
				this.totalEffect[name] = (this.totalEffect[name] ?? 0) + value;
			}
		}
	}

	addRelativeModifier(...modifiers: projectileModifier[]) {
		//todo: add relative AND absolute modifiers
		for (const mod of modifiers) this.modifiers.push(mod);
	}

	hit(part: BasePart) {
		//
	}

	tick(dt: number): void {
		if (this.lifetime !== undefined) this.lifetime -= dt;
	}
}

class PlasmaProjectile extends WeaponProjectile {
	constructor(baseVelocity: Vector3, baseDamage: number) {
		super("PLASMA", new Instance("Part"), baseVelocity, baseDamage);
	}

	tick(dt: number): void {}
}
/*
	To fire something, you need:
	1. something to load ammo in
	- magazine
	- accumulator (laser, plasma)
	- gas tank (plasma)
	- rocket battery

	2. something to fire loaded
	3. something to modify fired
	
	kinetic: 
		magazine -> some loader (?) -> barrel -> nozzle -> world -> some sparks in the hit spots
		- different calibers?
	rocket:
		???
	
	bomb:
		built by player -> installed into holder -> released on command

	laser:
		acumulator -> emitter -> some lenses -> focal lens nozzle -> world -> light source until stopped firing

	plasma:
		??? -> emitter (?) -> accelerator magnet (?) -> nozzle -> world -> flash of colored light on hit
		- Strength depends on distance traveled from the emitter 
*/
