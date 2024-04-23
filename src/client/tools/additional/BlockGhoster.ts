import { Workspace } from "@rbxts/services";
import { Colors } from "client/gui/Colors";
import { Element } from "shared/Element";
import { PartUtils } from "shared/utils/PartUtils";

export namespace BlockGhoster {
	export const parent = Element.create(
		"Model",
		{ Name: "Ghosts", Parent: Workspace },
		{ highlight: createHighlight() },
	);
	export function createHighlight(additional?: Partial<Highlight>) {
		return Element.create("Highlight", {
			FillColor: Colors.red,
			FillTransparency: 0.4,
			OutlineTransparency: 0.5,
			DepthMode: Enum.HighlightDepthMode.Occluded,
			...(additional ?? {}),
		});
	}

	export function setColor(color: Color3) {
		parent.highlight.FillColor = color;
	}

	/** Disable model collision and parent the block to a special folder */
	function justGhostModel(model: Model) {
		const fix = (part: BasePart | UnionOperation) => {
			if (part.Parent?.Name === "Axis") {
				return;
			}

			part.CastShadow = true;
			part.CanCollide = false;
			part.CanQuery = false;
			part.CanTouch = false;

			if (part.IsA("UnionOperation")) {
				part.UsePartColor = true;
			}
		};

		PartUtils.applyToAllDescendantsOfType("BasePart", model, fix);
		model.Parent = parent;
	}

	/** Trigger the {@link Highlight.Adornee} update */
	function triggerUpdate() {
		parent.highlight.Adornee = undefined;
		parent.highlight.Adornee = parent;
	}

	/** Disable models collision and parent them to a special folder */
	export function ghostModels(models: readonly Model[]) {
		for (const model of models) {
			justGhostModel(model);
		}

		triggerUpdate();
	}
	/** Disable model collision and parent it to a special folder */
	export function ghostModel(model: Model) {
		justGhostModel(model);
		triggerUpdate();
	}
}
