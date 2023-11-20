import ToolBase from "client/base/ToolBase";
import Widget from "client/base/Widget";
import Signals from "client/event/Signals";

export default abstract class ToolWidget<T extends ToolBase> extends Widget {
	protected readonly tool: T;
	private equipped = false;

	constructor(tool: T) {
		super();
		this.tool = tool;

		this.eventHandler.subscribe(Signals.TOOL.EQUIPPED, (tool) => {
			if (tool !== this.tool) return;

			this.equipped = true;
			this.onEquip();
		});
		this.eventHandler.subscribe(Signals.TOOL.UNEQUIPPED, (tool) => {
			if (tool !== this.tool) return;

			this.equipped = false;
			this.onUnequip;
		});
	}

	protected onEquip() {
		this.showWidget(true);
	}
	protected onUnequip() {
		this.hideWidget(true);
	}
}
