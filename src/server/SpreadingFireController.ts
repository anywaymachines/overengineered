import { ReplicatedStorage, Workspace } from "@rbxts/services";

export default class SpreadingFireController {
	private isPartBurnable(part: BasePart) {
		if (part.Anchored || !part.IsDescendantOf(Workspace.Plots) || part.GetAttribute("Burn")) {
			return false;
		}

		return true;
	}

	burn(part: BasePart) {
		if (!this.isPartBurnable(part)) {
			return;
		}

		part.SetAttribute("Burn", true);
		game.GetService("Debris").AddItem(part, 180);

		// Apply color
		const rand_rgb = math.random(0, 50);
		const color = Color3.fromRGB(rand_rgb, rand_rgb, rand_rgb);
		part.Color = color;

		// Apply fire effect
		const effects = ReplicatedStorage.Assets.Fire.GetChildren();
		const appliedEffects: Instance[] = [];
		effects.forEach((value) => {
			const obj = value.Clone();
			obj.Parent = part;
			appliedEffects.push(obj);
		});

		spawn(() => {
			wait(math.random(15, 30));

			// Remove effects
			appliedEffects.forEach((value) => {
				value.Destroy();
			});

			// Break joints with a chance
			if (math.random(1, 2) === 1) {
				part.BreakJoints();
			}

			// Burn closest parts
			const explosion = new Instance("Explosion");
			explosion.BlastPressure = 0;
			explosion.BlastRadius = 3.5;
			explosion.ExplosionType = Enum.ExplosionType.NoCraters;
			explosion.DestroyJointRadiusPercent = 0;
			explosion.Position = part.Position;
			explosion.Parent = part;
			explosion.Visible = false;
			explosion.Hit.Connect((part, distance) => {
				this.burn(part);
			});
		});
	}
}
