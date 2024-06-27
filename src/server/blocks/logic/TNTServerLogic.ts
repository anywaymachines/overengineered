import { Workspace } from "@rbxts/services";
import { ServerBlockLogic } from "server/blocks/ServerBlockLogic";
import { ServerPartUtils } from "server/plots/ServerPartUtils";
import { BlockManager } from "shared/building/BlockManager";
import { PartUtils } from "shared/utils/PartUtils";
import type { PlayModeController } from "server/modes/PlayModeController";
import type { SpreadingFireController } from "server/SpreadingFireController";
import type { TNTBlockLogic } from "shared/block/logic/TNTBlockLogic";
import type { ExplosionEffect } from "shared/effects/ExplosionEffect";

@injectable
export class TNTServerBlockLogic extends ServerBlockLogic<typeof TNTBlockLogic> {
	constructor(
		logic: typeof TNTBlockLogic,
		@inject playModeController: PlayModeController,
		@inject private readonly explosionEffect: ExplosionEffect,
		@inject private readonly spreadingFire: SpreadingFireController,
	) {
		super(logic, playModeController);

		logic.events.explode.invoked.Connect((player, { block, isFlammable, pressure, radius }) => {
			if (!this.isValidBlock(block, player)) return;
			this.explode(player, block, isFlammable, pressure, radius);
		});
	}

	explode(player: Player | undefined, block: BlockModel, isFlammable: boolean, pressure: number, radius: number) {
		radius = math.clamp(radius, 0, 16);
		pressure = math.clamp(pressure, 0, 2500);

		const hitParts = Workspace.GetPartBoundsInRadius(block.GetPivot().Position, radius);

		if (isFlammable) {
			const flameHitParts = Workspace.GetPartBoundsInRadius(block.GetPivot().Position, radius * 1.5);

			flameHitParts.forEach((part) => {
				if (math.random(1, 3) === 1) this.spreadingFire.burn(part);
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

		block.PrimaryPart!.Transparency = 1;
		PartUtils.applyToAllDescendantsOfType("Decal", block.PrimaryPart!, (decal) => {
			decal.Destroy();
		});

		// Explosion sound
		this.explosionEffect.send(block.PrimaryPart!, { part: block.PrimaryPart!, index: undefined });
	}
}
