import { Workspace } from "@rbxts/services";
import SpreadingFireController from "server/SpreadingFireController";
import ServerPartUtils from "server/plots/ServerPartUtils";
import TNTBlockLogic from "shared/block/logic/TNTBlockLogic";
import BlockManager from "shared/building/BlockManager";
import PartUtils from "shared/utils/PartUtils";
import ServerBlockLogic from "../ServerBlockLogic";

export default class TNTServerBlockLogic extends ServerBlockLogic<typeof TNTBlockLogic> {
	constructor(logic: typeof TNTBlockLogic) {
		super(logic);

		logic.events.explode.invoked.Connect((player, { block, isFlammable, pressure, radius }) => {
			if (!this.isValidBlock(block, player)) return;

			// temporary until block configuration moved to shared
			radius = math.clamp(radius, 0, 12);
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
					SpreadingFireController.burn(part);
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
					math.random(0, pressure / 100),
					math.random(0, pressure / 100),
					math.random(0, pressure / 100),
				);
			});

			PartUtils.applyToAllDescendantsOfType("Decal", block.PrimaryPart!, (decal) => {
				decal.Destroy();
			});

			// Explosion sound
			const sound = block.PrimaryPart!.FindFirstChild("Sound") as Sound;
			sound.Play();
			sound.Ended.Once(() => {
				sound.Destroy();
				block.Destroy();
			});
		});
	}
}
