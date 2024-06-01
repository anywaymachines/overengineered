import { Players } from "@rbxts/services";
import { PlayerDataStorage } from "client/PlayerDataStorage";
import { PlayerConfigDefinition } from "shared/config/PlayerConfig";
import { HostedService } from "shared/GameHost";
import { PartUtils } from "shared/utils/PartUtils";
import type { SharedPlots } from "shared/building/SharedPlots";

@injectable
export class GraphicsSettingsController extends HostedService {
	constructor(@inject plots: SharedPlots) {
		super();

		const graphics = PlayerDataStorage.config.createChild("graphics", PlayerConfigDefinition.graphics.config);
		this.event.subscribeObservable(graphics, ({ localShadows, othersShadows }) => {
			for (const plot of plots.plots) {
				const selfowned = plot.ownerId.get() === Players.LocalPlayer.UserId;

				if (selfowned) {
					PartUtils.applyToAllDescendantsOfType(
						"BasePart",
						plot.instance,
						(child) => (child.CastShadow = localShadows),
					);
				} else {
					PartUtils.applyToAllDescendantsOfType(
						"BasePart",
						plot.instance,
						(child) => (child.CastShadow = othersShadows),
					);
				}
			}
		});

		for (const plot of plots.plots) {
			const selfowned = plot.ownerId.get() === Players.LocalPlayer.UserId;

			this.event.subscribe(plot.instance.DescendantAdded, (child) => {
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
	}
}
