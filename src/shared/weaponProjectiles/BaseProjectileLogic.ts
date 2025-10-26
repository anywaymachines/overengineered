import { RunService, Workspace } from "@rbxts/services";
import { InstanceComponent } from "engine/shared/component/InstanceComponent";
import { C2SRemoteEvent } from "engine/shared/event/PERemoteEvent";
import { ReplicatedAssets } from "shared/ReplicatedAssets";
import { ModuleCollection } from "shared/weaponProjectiles/WeaponModuleSystem";
import type { damageType } from "engine/shared/BlockDamageController";

export type modifierValue = {
	isRelative?: boolean;
	value: number;
};

export type projectileModifier = Partial<
	Record<keyof damageType, modifierValue> & {
		speedModifier: modifierValue; //<-- velocity modifier
		lifetimeModifier: modifierValue; //<--- time modifier
	}
>;

export type baseWeaponProjectile = {
	Projectile: BasePart;
} & Model;

const CANNON_SHELL = ReplicatedAssets.waitForAsset<baseWeaponProjectile>("WeaponProjectiles", "ShellProjectile");
const PLASMA_BALL = ReplicatedAssets.waitForAsset<baseWeaponProjectile>("WeaponProjectiles", "PlasmaProjectile");
const BULLET = ReplicatedAssets.waitForAsset<baseWeaponProjectile>("WeaponProjectiles", "BulletProjectile");
const LASER = ReplicatedAssets.waitForAsset<baseWeaponProjectile>("WeaponProjectiles", "LaserProjectile");

const projectileFolder = new Instance("Folder", Workspace);
projectileFolder.Name = "Projectiles";

export type DamageType = "KINETIC" | "EXPLOSIVE" | "ENERGY";

export class WeaponProjectile extends InstanceComponent<BasePart> {
	static readonly damageInstance = new C2SRemoteEvent<{
		readonly part: BasePart;
		readonly damage: number;
		readonly modifiers: projectileModifier[];
	}>("projectile_damage", "RemoteEvent");

	rawModifiers: projectileModifier[] = [];
	totalEffect: projectileModifier = {};
	originalLifetime: number | undefined;
	modifiedLifetime: number | undefined;
	currentLifetime: number = 0;
	modifiedVelocity: Vector3;

	readonly projectilePart: BasePart;
	readonly originalProjectileModel;
	static readonly SHELL_PROJECTILE: baseWeaponProjectile = CANNON_SHELL;
	static readonly PLASMA_PROJECTILE: baseWeaponProjectile = PLASMA_BALL;
	static readonly LASER_PROJECTILE: baseWeaponProjectile = LASER;
	static readonly BULLET_PROJECTILE: baseWeaponProjectile = BULLET;

	constructor(
		public startPosition: Vector3,
		readonly projectileType: DamageType,
		originalProjectileModel: baseWeaponProjectile,
		public baseVelocity: Vector3,
		public baseDamage: number,
		readonly baseModifier: projectileModifier,
		lifetime?: number, //<--- seconds
		public color?: Color3,
	) {
		const pmodel: baseWeaponProjectile = originalProjectileModel.Clone();
		const newModel = pmodel.Projectile;
		newModel.Position = startPosition;
		newModel.CanCollide = false;
		newModel.CanTouch = true;
		newModel.Massless = true;
		//newModel.CollisionGroup = "Projectile";
		//newModel.EnableFluidForces = false;
		newModel.AssemblyLinearVelocity = baseVelocity;
		//transform projectile and shit
		//ELONgate the projectile to avoid clipping
		super(newModel);
		this.projectilePart = newModel;
		this.originalLifetime = this.modifiedLifetime = lifetime;
		this.projectilePart.PivotTo(
			CFrame.lookAlong(this.projectilePart.Position, (this.modifiedVelocity = baseVelocity)),
		);
		this.originalProjectileModel = pmodel;
		if (color) pmodel.PrimaryPart!.Color = color;
		pmodel.Parent = projectileFolder;

		this.event.subscribe(this.projectilePart.Touched, (part) => {
			if (part.CollisionGroup === this.projectilePart.CollisionGroup) return;
			this.onHit(part, this.projectilePart?.Position ?? part.Position);
		});
		this.event.subscribe(RunService.PostSimulation, (dt) => {
			const percentage = this.modifiedLifetime === undefined ? 0 : this.currentLifetime / this.modifiedLifetime;
			const reversePercentage = 1 - percentage;
			if (percentage >= 1) return this.destroy();
			this.onTick(dt, percentage, reversePercentage);
		});

		this.onDestroy(() => pmodel.Destroy());

		this.enable();
		recalculateEffects(this);

		if (this.totalEffect.speedModifier) {
			if (this.totalEffect.speedModifier.isRelative)
				newModel.AssemblyLinearVelocity = baseVelocity.mul(this.totalEffect.speedModifier.value);
			else
				newModel.AssemblyLinearVelocity = baseVelocity.add(
					baseVelocity.Unit.mul(this.totalEffect.speedModifier!.value),
				);
		}
	}

	addModifier(...modifiers: projectileModifier[]) {
		for (const mod of modifiers) this.rawModifiers.push(mod);
	}

	onHit(part: BasePart, point: Vector3, destroyOnHit = false): void {
		if (!part.Anchored && !RunService.IsServer())
			WeaponProjectile.damageInstance.send({
				part,
				damage: this.baseDamage,
				modifiers: [this.baseModifier, ...this.rawModifiers],
			});
		if (destroyOnHit) this.destroy();
	}

	onTick(dt: number, percentage: number, reversePercentage: number): void {
		if (this.isDestroyed()) return;
		this.currentLifetime += dt;
		/* :thinking:
		this.projectilePart.CFrame = this.projectilePart.CFrame.add(
			this.modifiedVelocity.mul(new Vector3(dt, dt, dt)),
		);*/
	}
}

function recalculateEffects(projectile: WeaponProjectile) {
	projectile.totalEffect =
		ModuleCollection.calculateTotalModifier([projectile.baseModifier, ...projectile.rawModifiers]) ?? {};

	if (projectile.originalLifetime !== undefined)
		projectile.modifiedLifetime =
			projectile.originalLifetime * (projectile.totalEffect.lifetimeModifier?.value ?? 1);
}

function applyDamageToPart(part: BasePart, damage: number, modifiers: projectileModifier[]) {
	const totalEffect = ModuleCollection.calculateTotalModifier(modifiers) ?? {};

	// todo: implement stuff from the damage system
	// just pass the object to the .applyDamage method
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
