import { RunService, Workspace } from "@rbxts/services";
import { InstanceComponent } from "shared/component/InstanceComponent";
import { AutoC2SRemoteEvent } from "shared/event/C2SRemoteEvent";
import { Instances } from "shared/fixes/Instances";
import { RemoteEvents } from "shared/RemoteEvents";

export type modifierValue = {
	isRelative?: boolean;
	value: number;
};

export type projectileModifier = {
	//<----- modifiers, not absolute units!
	speedModifier?: modifierValue; //<-- velocity modifier
	lifetimeModifier?: modifierValue; //<--- time modifier
	heatDamage?: modifierValue; //<-- chance modifier
	impactDamage?: modifierValue; //<-- damage modifier
	explosiveDamage?: modifierValue; //<-- area modifier
};

const PLASMA_BALL = Instances.assets.WaitForChild("WeaponProjectiles").WaitForChild("PlasmaProjectile") as BasePart;
const BULLET = Instances.assets.WaitForChild("WeaponProjectiles").WaitForChild("BulletProjectile") as BasePart;

const projectileFolder = new Instance("Folder", Workspace);
projectileFolder.Name = "Projectiles";

export type ProjectileType = "KINETIC" | "ROCKET" | "BOMB" | "LASER" | "PLASMA";

export class WeaponProjectile extends InstanceComponent<BasePart> {
	static readonly spawn = new AutoC2SRemoteEvent<{
		readonly startPosition: Vector3;
		readonly projectileType: ProjectileType;
		readonly projectilePart: BasePart;
		readonly baseVelocity: Vector3;
		readonly baseDamage: number;
		readonly lifetime?: number; //<--- seconds
	}>("projectile_spawn", "RemoteEvent");

	rawModifiers: projectileModifier[] = [];
	totalEffect: projectileModifier = {};
	originalLifetime: number | undefined;
	modifiedLifetime: number | undefined;
	currentLifetime: number = 0;
	modifiedVelocity: Vector3;
	static readonly damagedParts: Map<BasePart, number> = new Map();
	readonly projectilePart: BasePart;
	static readonly PLASMA_PROJECTILE: BasePart = PLASMA_BALL;
	static readonly LASER_PROJECTILE: BasePart;
	static readonly BULLET_PROJECTILE: BasePart = BULLET;

	constructor(
		readonly startPosition: Vector3,
		readonly projectileType: ProjectileType,
		projectilePart: BasePart,
		readonly baseVelocity: Vector3,
		readonly baseDamage: number,
		lifetime?: number, //<--- seconds
	) {
		const newModel = projectilePart.Clone();
		newModel.Position = startPosition;
		newModel.CanCollide = false;
		newModel.CanTouch = true;
		newModel.Massless = true;
		//newModel.CollisionGroup = "Projectile";
		//newModel.EnableFluidForces = false;
		newModel.AssemblyLinearVelocity = baseVelocity;
		newModel.Parent = projectileFolder;
		//transform projectile and shit
		//ELONgate the projectile to avoid clipping
		super(newModel);
		this.projectilePart = newModel;
		this.originalLifetime = lifetime;
		this.modifiedLifetime = lifetime;
		this.modifiedVelocity = baseVelocity;
		this.projectilePart.PivotTo(CFrame.lookAlong(this.projectilePart.GetPivot().Position, baseVelocity));

		this.event.subscribe(this.projectilePart.Touched, (part) => {
			if (part.CollisionGroup === this.projectilePart.CollisionGroup) return;
			this.onHit(part, this.projectilePart?.Position ?? part.Position);
		});
		this.event.subscribe(RunService.PreSimulation, (dt) => {
			const percentage = this.modifiedLifetime === undefined ? 0 : this.currentLifetime / this.modifiedLifetime;
			const reversePercentage = 1 - percentage;
			if (percentage >= 1) return this.destroy();
			this.onTick(dt, percentage, reversePercentage);
		});

		this.enable();
	}

	applyDamageToPart(part: BasePart) {
		this.recalculateEffects();

		const checkIfCanBeUnwelded = (part: BasePart) =>
			(WeaponProjectile.damagedParts.get(part) ?? 0) > 256 * part.CurrentPhysicalProperties.Density;
		const checkIfCanBeDestroyed = (part: BasePart) =>
			(WeaponProjectile.damagedParts.get(part) ?? 0) > 1024 * part.CurrentPhysicalProperties.Density;
		const tryYourLuck = (num: number): boolean => math.random() < num;
		function createExplosion(part: BasePart, diameter: number, force: number, enableEffect?: boolean) {
			//affect blocks in radius/diameter somehow
			//there probably is a mothod

			if (enableEffect ?? false) {
				//do explosion effect
			}
		}

		const putOnFire = (part: BasePart) => RemoteEvents.Burn.send([part]);
		const unweld = (part: BasePart) => RemoteEvents.ImpactBreak.send([part]);
		const explode = (part: BasePart, radius: number) =>
			RemoteEvents.Explode.send({
				part,
				radius,
				pressure: 1,
				isFlammable: false,
			});

		const properties = this.projectilePart.CurrentPhysicalProperties;
		const impactDamage = (this.totalEffect?.impactDamage?.value ?? 0) + this.baseDamage;
		const inflictedDamage = (WeaponProjectile.damagedParts.get(part) ?? 0) + impactDamage;
		const explosiveDamage = this.totalEffect?.explosiveDamage?.value ?? 0;
		const ignitionChance = //basically density == chance, because density can't be bigger than 100, right? right..?
			(1 - properties.Density / 100) * math.clamp(this.totalEffect?.heatDamage?.value ?? 0, 0, 1);

		WeaponProjectile.damagedParts.set(part, impactDamage);

		if (!WeaponProjectile.damagedParts.has(part))
			//damage here
			part.Destroying.Connect(() => WeaponProjectile.damagedParts.delete(part));
		if (checkIfCanBeUnwelded(part)) unweld(part); //unweld here
		if (checkIfCanBeDestroyed(part)) part.Destroy(); //destroy here
		if ((this.totalEffect.explosiveDamage?.value ?? 0) > 0)
			//explode here
			explode(this.projectilePart, this.totalEffect.explosiveDamage?.value ?? 0);
		if (tryYourLuck(ignitionChance)) putOnFire(part); //put on fire here
	}

	private recalculateEffects() {
		this.totalEffect = {};

		for (const mod of this.rawModifiers) {
			for (const [name, modifierValue] of pairs(mod)) {
				this.totalEffect[name] ??= { value: 0, isRelative: false };
				const oldValue = this.totalEffect[name]!.value;
				if (modifierValue.isRelative && modifierValue.isRelative !== undefined)
					this.totalEffect[name] = { value: oldValue * (1 + modifierValue.value), isRelative: false };
				else this.totalEffect[name] = { value: oldValue + modifierValue.value, isRelative: false };
			}
		}

		if (this.originalLifetime !== undefined)
			this.modifiedLifetime = this.originalLifetime * (this.totalEffect.lifetimeModifier?.value ?? 1);
	}

	addModifier(...modifiers: projectileModifier[]) {
		for (const mod of modifiers) this.rawModifiers.push(mod);
	}

	onHit(part: BasePart, point: Vector3): void {
		this.destroy();
	}

	onTick(dt: number, percentage: number, reversePercentage: number): void {
		if (this.isDestroyed()) return;
		this.currentLifetime += dt;
		/*
		this.projectilePart.CFrame = this.projectilePart.CFrame.add(
			this.modifiedVelocity.mul(new Vector3(dt, dt, dt)),
		);*/
	}
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
