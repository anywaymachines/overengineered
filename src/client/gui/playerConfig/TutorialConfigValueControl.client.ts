import { Control } from "client/gui/Control";
import { TextButtonControl } from "client/gui/controls/Button";
import { Gui } from "client/gui/Gui";
import { ConfigValueControl } from "client/gui/playerConfig/ConfigValueControl";
import { playerConfigControlRegistry } from "client/gui/playerConfig/PlayerConfigControlRegistry";
import { playerConfigValueTemplateStorage } from "client/gui/playerConfig/PlayerConfigValueTemplateStorage";
import { TutorialBasics } from "client/tutorial/TutorialBasics";
import { Signal } from "shared/event/Signal";
import type { TextButtonDefinition } from "client/gui/controls/Button";
import type { Tutorial } from "client/tutorial/Tutorial";

@injectable
class TutorialValueControl extends ConfigValueControl<GuiObject> {
	readonly submitted = new Signal<(config: PlayerConfigTypes.Tutorial["config"]) => void>();

	constructor(
		config: PlayerConfigTypes.Tutorial["config"],
		definition: ConfigTypeToDefinition<PlayerConfigTypes.Tutorial>,
		@inject tutorial: Tutorial,
	) {
		super(playerConfigValueTemplateStorage.multi(), definition.displayName);

		const list = this.add(new Control(this.gui.Control));

		const basics = list.add(
			new TextButtonControl(
				Gui.getGameUI<{ Templates: { Button: TextButtonDefinition } }>().Templates.Button.Clone(),
				() => TutorialBasics(tutorial),
			),
		);
		basics.text.set("Start basics tutorial");
	}
}

playerConfigControlRegistry.set("tutorial", TutorialValueControl);
