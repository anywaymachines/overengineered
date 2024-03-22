import { Players } from "@rbxts/services";
import PlayerDataStorage from "client/PlayerDataStorage";
import SharedPlots from "shared/building/SharedPlots";
import { PlayerConfigDefinition } from "shared/config/PlayerConfig";
import PartUtils from "shared/utils/PartUtils";

const graphics = PlayerDataStorage.config.createChild("graphics", PlayerConfigDefinition.graphics.config);
graphics.subscribe(({ localShadows, othersShadows }) => {
	for (const plot of SharedPlots.plots) {
		const selfowned = plot.ownerId.get() === Players.LocalPlayer.UserId;

		if (selfowned) {
			PartUtils.applyToAllDescendantsOfType(
				"BasePart",
				plot.instance.Blocks,
				(child) => (child.CastShadow = localShadows),
			);
		} else {
			PartUtils.applyToAllDescendantsOfType(
				"BasePart",
				plot.instance.Blocks,
				(child) => (child.CastShadow = othersShadows),
			);
		}
	}
});

for (const plot of SharedPlots.plots) {
	const selfowned = plot.ownerId.get() === Players.LocalPlayer.UserId;

	plot.instance.Blocks.DescendantAdded.Connect((child) => {
		if (!child.IsA("BasePart")) return;

		const { localShadows, othersShadows } = graphics.get();
		if (!localShadows && !othersShadows) {
			return;
		}

		if (selfowned) {
			if (localShadows) {
				child.CastShadow = true;
			}
		} else {
			if (othersShadows) {
				child.CastShadow = true;
			}
		}
	});
}

export const GraphicsSettingsController = {
	// empty method to trigger the initialization
	initialize: () => {},
} as const;
