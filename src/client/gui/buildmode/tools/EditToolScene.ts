import { Colors } from "client/gui/Colors";
import Control from "client/gui/Control";
import GuiAnimator from "client/gui/GuiAnimator";
import { ButtonControl } from "client/gui/controls/Button";
import EditTool, { EditToolMode } from "client/tools/EditTool";
import { SharedBuilding } from "shared/building/SharedBuilding";
import Objects from "shared/fixes/objects";

export type EditToolSceneDefinition = GuiObject & {
	readonly Bottom: GuiObject & {
		readonly MoveButton: GuiButton;
	};
};

export default class EditToolScene extends Control<EditToolSceneDefinition> {
	readonly tool;

	constructor(gui: EditToolSceneDefinition, tool: EditTool) {
		super(gui);
		this.tool = tool;

		const move = this.add(new ButtonControl(this.gui.Bottom.MoveButton, () => tool.toggleMode("Move")));

		const buttons: readonly ButtonControl[] = [move];
		this.event.subscribeObservable2(
			tool.selected,
			(selected) => {
				const enabled = !SharedBuilding.isEmpty(selected);

				for (const button of buttons) {
					button.getGui().Active = button.getGui().AutoButtonColor = enabled;
					button.getGui().Transparency = enabled ? 0 : 0.5;
				}
			},
			true,
		);

		const modeButtons: Readonly<Record<EditToolMode, ButtonControl>> = { Move: move };
		this.event.subscribeObservable2(
			tool.selectedMode,
			(mode) => {
				for (const [name, button] of Objects.pairs(modeButtons)) {
					button.getGui().BackgroundColor3 = mode === name ? Colors.accentDark : Colors.staticBackground;
				}
			},
			true,
		);
	}

	public show() {
		super.show();
		GuiAnimator.transition(this.gui.Bottom, 0.2, "up");
	}
}
