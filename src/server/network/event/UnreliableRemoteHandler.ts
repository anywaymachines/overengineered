import { Players, RunService, Workspace } from "@rbxts/services";
import { ServerPartUtils } from "server/plots/ServerPartUtils";
import { ServerPlayers } from "server/ServerPlayers";
import { BlockManager } from "shared/building/BlockManager";
import { HostedService } from "shared/GameHost";
import { RemoteEvents } from "shared/RemoteEvents";
import { CustomRemotes } from "shared/Remotes";
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

		const breakQueue: Map<Player, BasePart[]> = new Map();

		// PhysicsService.RegisterCollisionGroup("Wreckage");
		// PhysicsService.CollisionGroupSetCollidable("Wreckage", "PlayerCharacters", false);
		// PhysicsService.CollisionGroupSetCollidable("Wreckage", "Wreckage", false);

		const impactBreakEvent = (player: Player | undefined, parts: BasePart[]) => {
			if (!player) throw "ban forever fix this idk";

			const newData = breakQueue.get(player) ?? [];
			breakQueue.set(player, newData);

			parts.forEach((part) => {
				if (!BlockManager.isActiveBlockPart(part)) return;

				newData.push(part);
			});
		};

		this.event.subscribe(RunService.Heartbeat, (dT) => {
			if (breakQueue.size() > 0) {
				const copy = [...breakQueue];
				breakQueue.clear();

				task.spawn(() => {
					for (const [player, blocks] of copy) {
						const players = ServerPlayers.GetLoadedPlayers().filter((p) => p !== player);
						CustomRemotes.physics.normalizeRootparts.send(players, { parts: blocks });
						impactSoundEffect.send(blocks[0], { blocks, index: undefined });

						for (const part of blocks) {
							ServerPartUtils.BreakJoints(part);
							// part.CollisionGroup = "Wreckage";
						}
					}
				});
			}
		});

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
					const players = Players.GetPlayers().filter((p) => p !== player);
					CustomRemotes.physics.normalizeRootparts.send(players, { parts: [part] });
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
