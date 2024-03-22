import { Workspace } from "@rbxts/services";
import SpreadingFireController from "server/SpreadingFireController";
import ServerBlockLogic from "server/blocks/ServerBlockLogic";
import ServerPartUtils from "server/plots/ServerPartUtils";
import TNTBlockLogic from "shared/block/logic/TNTBlockLogic";
import BlockManager from "shared/building/BlockManager";
import Effects from "shared/effects/Effects";
import PartUtils from "shared/utils/PartUtils";

export default class TNTServerBlockLogic extends ServerBlockLogic<typeof TNTBlockLogic> {
	constructor(logic: typeof TNTBlockLogic) {
		super(logic);

		logic.events.explode.invoked.Connect((player, { block, isFlammable, pressure, radius }) => {
			if (!this.isValidBlock(block, player)) return;
			this.explode(player, block, isFlammable, pressure, radius);
		});
	}

	explode(player: Player | undefined, block: BlockModel, isFlammable: boolean, pressure: number, radius: number) {
		// temporary until block configuration moved to shared
		radius = math.clamp(radius, 0, 16);
		pressure = math.clamp(pressure, 0, 2500);

		// Explosion
		const explosion = new Instance("Explosion");
		explosion.ExplosionType = Enum.ExplosionType.NoCraters;
		explosion.BlastRadius = radius;
		explosion.BlastPressure = 0;
		explosion.DestroyJointRadiusPercent = 0;
		explosion.Position = block.GetPivot().Position;

		// Flame explosion
		if (isFlammable) {
			const flameExplosion = explosion.Clone();
			flameExplosion.BlastRadius *= 1.5;
			flameExplosion.Parent = Workspace;
			flameExplosion.Hit.Connect((part, distance) => {
				if (math.random(1, 3) === 1) SpreadingFireController.burn(part);
			});
		}

		explosion.Parent = Workspace;
		explosion.Hit.Connect((part, distance) => {
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
		Effects.Explosion.sendToNetworkOwnerOrEveryone(block.PrimaryPart!, {
			part: block.PrimaryPart!,
			index: undefined,
		});
	}
}
