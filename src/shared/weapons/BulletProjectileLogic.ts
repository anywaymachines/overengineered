import { AutoC2SRemoteEvent } from "shared/event/C2SRemoteEvent";
import { WeaponProjectile } from "shared/weapons/BaseProjectileLogic";

export class BulletProjectile extends WeaponProjectile {
	static readonly spawn = new AutoC2SRemoteEvent<{
		readonly startPosition: Vector3;
		readonly baseVelocity: Vector3;
		readonly baseDamage: number;
	}>("bullet_spawn", "RemoteEvent");
	constructor(startPosition: Vector3, baseVelocity: Vector3, baseDamage: number) {
		super(startPosition, "KINETIC", WeaponProjectile.PLASMA_PROJECTILE, baseVelocity, baseDamage);
	}

	onHit(part: BasePart, point: Vector3): void {
		const startedWithSize = this.projectilePart.Size;
		this.projectilePart.AssemblyLinearVelocity = Vector3.zero;
		this.projectilePart.Anchored = true;
		this.projectilePart.CanCollide = false;
		this.projectilePart.CanTouch = false;
		this.disable();
		this.projectilePart.Position = this.projectilePart.CFrame.PointToWorldSpace(
			new Vector3(0, startedWithSize.Y / 2, 0),
		);

		super.onHit(part, point);
	}

	onTick(dt: number, percentage: number, reversePercentage: number): void {
		super.onTick(dt, percentage, reversePercentage);
	}
}
BulletProjectile.spawn.invoked.Connect((player, { startPosition, baseVelocity, baseDamage }) => {
	task.delay(5, () => {
		print("Projectile spawned");
		const proj = new BulletProjectile(startPosition, baseVelocity, baseDamage);
	});
});
