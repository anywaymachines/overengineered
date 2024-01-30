export default class PartUtils {
	static ghostModel(model: Model, color: Color3) {
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

		this.applyToAllDescendantsOfType("BasePart", model, (part) => fix(part));
		this.applyToAllDescendantsOfType("UnionOperation", model, (part) => fix(part));
	}

	static switchDescendantsMaterial(model: Instance, material: Enum.Material) {
		this.applyToAllDescendantsOfType("BasePart", model, (part) => {
			if (part.HasTag("STATIC_MATERIAL")) return;
			if (part.Transparency === 1) return;
			part.Material = material;
		});
	}

	static switchDescendantsColor(model: Instance, color: Color3) {
		this.applyToAllDescendantsOfType("BasePart", model, (part) => {
			if (part.HasTag("STATIC_COLOR")) return;
			part.Color = color;
		});
	}

	static switchDescendantsTransparency(model: Instance, transparency: number) {
		PartUtils.applyToAllDescendantsOfType("BasePart", model, (part) => {
			if (part.HasTag("STATIC_MATERIAL")) return;
			if (part.Transparency === 1) return;
			part.Transparency = transparency;
		});
	}

	static applyToAllDescendantsOfType<T extends keyof Instances>(
		typeName: T,
		parent: Instance,
		callback: (instance: Instances[T]) => void,
	) {
		const children = parent.GetDescendants().filter((value) => value.IsA(typeName)) as Instances[T][];
		children.forEach((element) => {
			callback(element);
		});
	}
}
