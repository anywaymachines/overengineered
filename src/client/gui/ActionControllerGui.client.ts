import { Control } from "client/gui/Control";
import { Gui } from "client/gui/Gui";
import { ButtonControl } from "client/gui/controls/Button";
import { ActionController } from "client/modes/build/ActionController";
import { rootComponents } from "client/test/RootComponents";

type ActionControllerGuiDefinition = GuiObject & {
	readonly Undo: GuiButton;
	readonly Redo: GuiButton;
};
class ActionControllerGui extends Control<ActionControllerGuiDefinition> {
	constructor(gui: ActionControllerGuiDefinition) {
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

		this.onPrepare((inputType) => (this.gui.Visible = inputType === "Touch"));
	}
}

const controller = new ActionControllerGui(Gui.getGameUI<{ readonly Action: ActionControllerGuiDefinition }>().Action);
controller.show();
rootComponents.push(controller);
