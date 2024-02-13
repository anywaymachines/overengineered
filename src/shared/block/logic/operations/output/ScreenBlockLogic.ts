import { Players, TextService } from "@rbxts/services";
import ConfigurableBlockLogic from "shared/block/ConfigurableBlockLogic";
import blockConfigRegistry from "shared/block/config/BlockConfigRegistry";
import { PlacedBlockData } from "shared/building/BlockManager";
import { AutoC2SRemoteEvent } from "shared/event/C2SRemoteEvent";

type Screen = BlockModel & {
	readonly Part: BasePart & {
		readonly SurfaceGui: SurfaceGui & {
			readonly TextLabel: TextLabel;
		};
	};
};

export default class ScreenBlockLogic extends ConfigurableBlockLogic<typeof blockConfigRegistry.screen, Screen> {
	static readonly events = {
		update: new AutoC2SRemoteEvent<{
			readonly block: Screen;
			readonly text: string;
		}>("screen_update"),
	} as const;

	constructor(block: PlacedBlockData) {
		super(block, blockConfigRegistry.screen);

		this.event.subscribeObservable(
			this.input.data,
			(data) => {
				let text: string;

				if (typeIs(data, "string")) {
					// TODO: TESTME
					// FIXME: this code MIGHT be executed on the server, causing a nil error in Players.LocalPlayer
					text = TextService.FilterStringAsync(
						data,
						Players.LocalPlayer.UserId,
					).GetNonChatStringForBroadcastAsync();
				} else {
					text = tostring(data);
				}

				ScreenBlockLogic.events.update.send({
					block: this.instance,
					text,
				});
			},
			true,
		);
	}
}
