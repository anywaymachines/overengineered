export namespace PartUtils {
	export function ghostModel(model: Model, color: Color3) {
		function fix(part: BasePart | UnionOperation) {
			if (part.Parent?.Name === "Axis") {
				return;
			}

			part.Material = Enum.Material.SmoothPlastic;
			part.Color = color;
			part.CanCollide = false;
			part.CanQuery = false;
			part.CanTouch = false;

			if (part.IsA("UnionOperation")) {
				part.UsePartColor = true;
			}

			if (part.Transparency !== 1) {
				part.Transparency = 0.5;
			}
		}

		applyToAllDescendantsOfType("BasePart", model, (part) => fix(part));
		applyToAllDescendantsOfType("Decal", model, (part) => {
			part.Transparency = 0.5;
		});
	}

	export function switchDescendantsMaterial(model: Instance, material: Enum.Material) {
		applyToAllDescendantsOfType("BasePart", model, (part) => {
			if (part.HasTag("STATIC_MATERIAL")) return;
			if (part.Transparency === 1) return;
			part.Material = material;
		});
	}

	export function switchDescendantsColor(model: Instance, color: Color3) {
		applyToAllDescendantsOfType("BasePart", model, (part) => {
			if (part.HasTag("STATIC_COLOR")) return;
			part.Color = color;
		});
	}

	export function switchDescendantsTransparency(model: Instance, transparency: number) {
		PartUtils.applyToAllDescendantsOfType("BasePart", model, (part) => {
			if (part.HasTag("STATIC_MATERIAL")) return;
			if (part.Transparency === 1) return;
			part.Transparency = transparency;
		});
	}

	export function applyToAllDescendantsOfType<T extends keyof Instances>(
		typeName: T,
		parent: Instance,
		callback: (instance: Instances[T]) => void,
	) {
		const children = parent.GetDescendants().filter((value) => value.IsA(typeName)) as Instances[T][];
		children.forEach((element) => {
			callback(element);
		});
	}

	export function BreakJoints(part: BasePart) {
		const joints = part.GetJoints();
		joints.forEach((constraint) => {
			// constraint.Destroy();
			constraint.Enabled = false;
		});
	}
}
