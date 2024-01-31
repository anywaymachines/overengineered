import BlockManager from "shared/building/BlockManager";
import Effects from "shared/effects/Effects";
import ServerPartUtils from "./plots/ServerPartUtils";

const explosionBase = new Instance("Explosion");
explosionBase.BlastPressure = 0;
explosionBase.BlastRadius = 3.5;
explosionBase.ExplosionType = Enum.ExplosionType.NoCraters;
explosionBase.DestroyJointRadiusPercent = 0;
explosionBase.Visible = false;

export default class SpreadingFireController {
	private static isPartBurnable(part: BasePart) {
		if (!BlockManager.isActiveBlockPart(part) || (math.random(1, 8) !== 1 && part.Position.Y < 1)) {
			return false;
		}

		return true;
	}

	static burn(part: BasePart) {
		if (!this.isPartBurnable(part)) {
			return;
		}

		part.SetAttribute("Burn", true);

		// Apply color
		const rand_rgb = math.random(0, 50);
		const color = Color3.fromRGB(rand_rgb, rand_rgb, rand_rgb);
		part.Color = color;

		const duration = math.random(15, 30);

		// Apply fire effect
		Effects.Fire.send(part, { duration }, part.GetNetworkOwner() ?? "everyone");

		spawn(() => {
			wait(duration);

			// Break joints with a chance
			if (math.random(1, 4) === 1) {
				ServerPartUtils.BreakJoints(part);
			}

			// Burn closest parts
			const explosion = explosionBase.Clone();
			explosion.Position = part.Position;
			explosion.Parent = part;
			explosion.Hit.Connect((part, distance) => {
				this.burn(part);
			});
		});
	}
}
