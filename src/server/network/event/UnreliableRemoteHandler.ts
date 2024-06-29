import { Workspace } from "@rbxts/services";
import { ServerPartUtils } from "server/plots/ServerPartUtils";
import { BlockManager } from "shared/building/BlockManager";
import { HostedService } from "shared/GameHost";
import { RemoteEvents } from "shared/RemoteEvents";
import { PartUtils } from "shared/utils/PartUtils";
import type { PlayerDatabase } from "server/database/PlayerDatabase";
import type { SpreadingFireController } from "server/SpreadingFireController";
import type { ExplosionEffect } from "shared/effects/ExplosionEffect";
import type { ImpactSoundEffect } from "shared/effects/ImpactSoundEffect";
import type { ExplodeArgs } from "shared/RemoteEvents";

@injectable
export class UnreliableRemoteController extends HostedService {
	constructor(
		@inject players: PlayerDatabase,
		@inject impactSoundEffect: ImpactSoundEffect,
		@inject spreadingFire: SpreadingFireController,
		@inject explosionEffect: ExplosionEffect,
	) {
		super();

		// PhysicsService.RegisterCollisionGroup("Wreckage");
		// PhysicsService.CollisionGroupSetCollidable("Wreckage", "Wreckage", false);

		const impactBreakEvent = (player: Player | undefined, parts: BasePart[]) => {
			parts.forEach((part) => {
				if (!BlockManager.isActiveBlockPart(part)) return;

				ServerPartUtils.BreakJoints(part);
				// part.CollisionGroup = "Wreckage";

				// Play sounds
				impactSoundEffect.send(part, { part, index: undefined });
			});
		};

		const burnEvent = (parts: BasePart[]) => {
			parts.forEach((part) => {
				if (!BlockManager.isActiveBlockPart(part)) return;

				spreadingFire.burn(part);
			});
		};

		const explode = (player: Player | undefined, { part, isFlammable, pressure, radius }: ExplodeArgs) => {
			function isValidBlock(part: BasePart, player: Player | undefined): boolean {
				if (!part) return false;
				if (!part.IsDescendantOf(Workspace)) return false;

				if (player) {
					if (!part.Anchored && !part.AssemblyRootPart?.Anchored && part.GetNetworkOwner() !== player) {
						return false;
					}
				}

				return true;
			}
			if (!isValidBlock(part, player)) {
				return;
			}

			radius = math.clamp(radius, 0, 16);
			pressure = math.clamp(pressure, 0, 2500);

			const hitParts = Workspace.GetPartBoundsInRadius(part.Position, radius);

			if (isFlammable) {
				const flameHitParts = Workspace.GetPartBoundsInRadius(part.Position, radius * 1.5);

				flameHitParts.forEach((part) => {
					if (math.random(1, 3) === 1) {
						spreadingFire.burn(part);
					}
				});
			}

			hitParts.forEach((part) => {
				if (!BlockManager.isActiveBlockPart(part)) {
					return;
				}

				if (math.random(1, 2) === 1) {
					ServerPartUtils.BreakJoints(part);
				}

				part.Velocity = new Vector3(
					math.random(0, pressure / 40),
					math.random(0, pressure / 40),
					math.random(0, pressure / 40),
				);
			});

			part.Transparency = 1;
			PartUtils.applyToAllDescendantsOfType("Decal", part, (decal) => decal.Destroy());

			// Explosion sound
			explosionEffect.send(part, { part, index: undefined });
		};

		this.event.subscribe(RemoteEvents.ImpactBreak.invoked, impactBreakEvent);
		this.event.subscribe(RemoteEvents.Burn.invoked, (_, parts) => burnEvent(parts));
		this.event.subscribe(RemoteEvents.Explode.invoked, explode);
	}
}
