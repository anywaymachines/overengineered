import { Control } from "client/gui/Control";
import { TextButtonControl } from "client/gui/controls/Button";
import { Gui } from "client/gui/Gui";
import { Component } from "shared/component/Component";
import type { HideInterfaceController } from "client/gui/HideInterfaceController";

@injectable
class Starter extends Component {
	constructor(@inject di: ReadonlyDIContainer) {
		super();

		const gui = Gui.getGameUI<{ Action: ActionsGuiDefinition }>().Action;
		this.parentGui(di.resolveForeignClass(ActionsGui, [gui]));
	}
}

export type ActionsGuiDefinition = GuiObject & {
	readonly Hide: TextButton;
};
@injectable
export class ActionsGui extends Control<ActionsGuiDefinition> {
	static initialize(host: GameHostBuilder) {
		host.services.registerService(Starter);
	}

	constructor(gui: ActionsGuiDefinition, @inject hideInterfaceController: HideInterfaceController) {
		super(gui);

		this.add(new TextButtonControl(gui.Hide, () => hideInterfaceController.visible.set(false)));
	}
}
