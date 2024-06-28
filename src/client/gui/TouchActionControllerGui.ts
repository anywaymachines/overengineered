import { Control } from "client/gui/Control";
import { ButtonControl } from "client/gui/controls/Button";
import { LogControl } from "client/gui/static/LogControl";
import { ActionController } from "client/modes/build/ActionController";
import { TransformService } from "shared/component/TransformService";
import type { ObservableValue } from "shared/event/ObservableValue";

export type TouchActionControllerGuiDefinition = GuiObject & {
	readonly Undo: GuiButton;
	readonly Redo: GuiButton;
	readonly Grid: GuiButton;
};
export class TouchActionControllerGui extends Control<TouchActionControllerGuiDefinition> {
	constructor(gui: TouchActionControllerGuiDefinition, gridEnabled: ObservableValue<boolean>) {
		super(gui);

		const undo = this.add(new ButtonControl(gui.Undo, () => ActionController.instance.undo()));
		const redo = this.add(new ButtonControl(gui.Redo, () => ActionController.instance.redo()));

		this.event.subscribeImmediately(ActionController.instance.history.changed, () => {
			const hasUndo = ActionController.instance.history.size() !== 0;
			undo.setInteractable(hasUndo);
		});
		this.event.subscribeImmediately(ActionController.instance.redoHistory.changed, () => {
			const hasRedo = ActionController.instance.redoHistory.size() !== 0;
			redo.setInteractable(hasRedo);
		});

		const grid = this.add(
			new ButtonControl(gui.Grid, () => {
				gridEnabled.set(!gridEnabled.get());
				LogControl.instance.addLine(gridEnabled.get() ? "Grid disabled!" : "Grid enabled!");
			}),
		);
		const animateGridEnabled = TransformService.boolStateMachine(
			grid.instance,
			TransformService.commonProps.quadOut02,
			{ Transparency: grid.instance.Transparency },
			{ Transparency: 0.6 },
		);
		this.event.subscribeObservable(gridEnabled, animateGridEnabled, true);
	}
}
