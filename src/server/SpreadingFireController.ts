import { ReplicatedStorage, Workspace } from "@rbxts/services";

const explosionBase = new Instance("Explosion");
explosionBase.BlastPressure = 0;
explosionBase.BlastRadius = 3.5;
explosionBase.ExplosionType = Enum.ExplosionType.NoCraters;
explosionBase.DestroyJointRadiusPercent = 0;
explosionBase.Visible = false;

export default class SpreadingFireController {
	private isPartBurnable(part: BasePart) {
		if (part.Anchored || part.GetAttribute("Burn") === true || !part.IsDescendantOf(Workspace.Plots)) {
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

			if (obj.IsA("Sound")) {
				if (math.random(1, 4) === 1) {
					obj.Play();
				} else {
					obj.Destroy();
					return;
				}
			}

			appliedEffects.push(obj);
		});

		spawn(() => {
			wait(math.random(15, 30));

			// Remove effects
			appliedEffects.forEach((value) => {
				value.Destroy();
			});

			// Break joints with a chance
			if (math.random(1, 4) === 1) {
				part.BreakJoints();
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
