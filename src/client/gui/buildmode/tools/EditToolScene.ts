import { Colors } from "client/gui/Colors";
import Control from "client/gui/Control";
import GuiAnimator from "client/gui/GuiAnimator";
import { ButtonControl } from "client/gui/controls/Button";
import EditTool, { EditToolMode } from "client/tools/EditTool";
import { SharedBuilding } from "shared/building/SharedBuilding";
import type { TransformProps } from "shared/component/Transform";
import Objects from "shared/fixes/objects";

export type EditToolSceneDefinition = GuiObject & {
	readonly Top: GuiObject & {
		readonly SelectAllButton: GuiButton;
		readonly DeselectAllButton: GuiButton;
	};
	readonly Bottom: GuiObject & {
		readonly MoveButton: GuiButton;
	};
};

export default class EditToolScene extends Control<EditToolSceneDefinition> {
	readonly tool;

	constructor(gui: EditToolSceneDefinition, tool: EditTool) {
		super(gui);
		this.tool = tool;

		this.add(new ButtonControl(this.gui.Top.SelectAllButton, () => tool.selectPlot()));
		this.add(new ButtonControl(this.gui.Top.DeselectAllButton, () => tool.deselectAll()));

		this.event.subscribeObservable2(
			tool.selectedMode,
			(mode) => {
				const props: TransformProps = {
					style: "Quad",
					direction: "Out",
					duration: 0.2,
				};

				const buttonsAreActive = mode === undefined;

				this.runTransform(this.gui.Top, (tr) =>
					tr.transform("AnchorPoint", new Vector2(0.5, buttonsAreActive ? 0 : 0.8), props),
				);

				for (const button of this.gui.Top.GetChildren()) {
					if (!button.IsA("TextButton")) continue;

					button.AutoButtonColor = button.Active = buttonsAreActive;
					this.runTransform(button, (tr) => tr.transform("Transparency", buttonsAreActive ? 0 : 0.6, props));
				}
			},
			true,
		);

		const move = this.add(new ButtonControl(this.gui.Bottom.MoveButton, () => tool.toggleMode("Move")));

		const buttons: readonly ButtonControl[] = [move];
		this.event.subscribeObservable2(
			tool.selected,
			(selected) => {
				const enabled = !SharedBuilding.isEmpty(selected);

				for (const button of buttons) {
					button.getGui().Active = button.getGui().AutoButtonColor = enabled;
					this.runTransform(button.instance, (tr) =>
						tr.transform("Transparency", enabled ? 0 : 0.6, {
							style: "Quad",
							direction: "Out",
							duration: 0.2,
						}),
					);
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

	show() {
		super.show();
		GuiAnimator.transition(this.gui.Bottom, 0.2, "up");
	}
}
