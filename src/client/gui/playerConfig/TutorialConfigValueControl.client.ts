import { Control } from "client/gui/Control";
import { Gui } from "client/gui/Gui";
import { TextButtonControl, TextButtonDefinition } from "client/gui/controls/Button";
import { ConfigValueControl } from "client/gui/playerConfig/ConfigValueControl";
import { playerConfigControlRegistry } from "client/gui/playerConfig/PlayerConfigControlRegistry";
import { playerConfigValueTemplateStorage } from "client/gui/playerConfig/PlayerConfigValueTemplateStorage";
import { Tutorial } from "client/tutorial/Tutorial";
import { Signal } from "shared/event/Signal";

class TutorialValueControl extends ConfigValueControl<GuiObject> {
	readonly submitted = new Signal<(config: PlayerConfigTypes.Tutorial["config"]) => void>();

	constructor(
		config: PlayerConfigTypes.Tutorial["config"],
		definition: ConfigTypeToDefinition<PlayerConfigTypes.Tutorial>,
	) {
		super(playerConfigValueTemplateStorage.multi(), definition.displayName);

		const list = this.add(new Control(this.gui.Control));

		const basics = list.add(
			new TextButtonControl(
				Gui.getGameUI<{ Templates: { Button: TextButtonDefinition } }>().Templates.Button.Clone(),
				() => Tutorial.Begin("Basics"),
			),
		);
		basics.text.set("Start basics tutorial");
	}
}

playerConfigControlRegistry.set("tutorial", TutorialValueControl);
