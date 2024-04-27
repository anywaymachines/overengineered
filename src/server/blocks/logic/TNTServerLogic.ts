import { Workspace } from "@rbxts/services";
import { SpreadingFireController } from "server/SpreadingFireController";
import { ServerBlockLogic } from "server/blocks/ServerBlockLogic";
import { ServerPartUtils } from "server/plots/ServerPartUtils";
import { RemoteEvents } from "shared/RemoteEvents";
import { TNTBlockLogic } from "shared/block/logic/TNTBlockLogic";
import { BlockManager } from "shared/building/BlockManager";
import { PartUtils } from "shared/utils/PartUtils";

export class TNTServerBlockLogic extends ServerBlockLogic<typeof TNTBlockLogic> {
	constructor(logic: typeof TNTBlockLogic) {
		super(logic);

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
				if (math.random(1, 3) === 1) SpreadingFireController.burn(part);
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
		RemoteEvents.Effects.Explosion.sendToNetworkOwnerOrEveryone(block.PrimaryPart!, {
			part: block.PrimaryPart!,
			index: undefined,
		});
	}
}
