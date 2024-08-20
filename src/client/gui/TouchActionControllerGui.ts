import { Control } from "client/gui/Control";
import { ButtonControl } from "client/gui/controls/Button";
import { GridEditorControl } from "client/gui/GridEditor";
import { Gui } from "client/gui/Gui";
import { ActionController } from "client/modes/build/ActionController";
import type { GridEditorControlDefinition } from "client/gui/GridEditor";
import type { EditMode } from "client/modes/build/BuildingMode";
import type { EditTool } from "client/tools/EditTool";
import type { ObservableValue } from "shared/event/ObservableValue";

export type TouchActionControllerGuiDefinition = GuiObject & {
	readonly Undo: GuiButton;
	readonly Redo: GuiButton;
	readonly Grid: GuiButton;
};
export class TouchActionControllerGui extends Control<TouchActionControllerGuiDefinition> {
	constructor(
		gui: TouchActionControllerGuiDefinition,
		editMode: ObservableValue<EditMode>,
		moveGridStep: ObservableValue<number>,
		rotateGridStep: ObservableValue<number>,
		editTool: EditTool,
	) {
		super(gui);

		this.event.subscribeObservable(
			editTool.selectedMode,
			(mode) => (gui.Visible = gridEditorGui.Visible = mode === undefined),
		);

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

		const gridEditorGui = Gui.getGameUI<{
			BuildingMode: { Grid: GuiObject & { Content: GridEditorControlDefinition } };
		}>().BuildingMode.Grid;
		gridEditorGui.Visible = false;

		this.add(new GridEditorControl(gridEditorGui.Content, moveGridStep, rotateGridStep, editMode));
		this.add(new ButtonControl(gui.Grid, () => (gridEditorGui.Visible = !gridEditorGui.Visible)));
	}
}
