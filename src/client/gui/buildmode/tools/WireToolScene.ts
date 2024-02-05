import { GamepadService, GuiService } from "@rbxts/services";
import InputController from "client/controller/InputController";
import Control from "client/gui/Control";
import GuiAnimator from "client/gui/GuiAnimator";
import { ButtonControl } from "client/gui/controls/Button";
import WireTool from "client/tools/WireTool";

export type WireToolSceneDefinition = GuiObject & {
	readonly Bottom: {
		readonly CancelButton: GuiButton;
	};
	readonly NameLabel: TextLabel;
	readonly TextLabel: TextLabel;
};

export default class WireToolScene extends Control<WireToolSceneDefinition> {
	readonly tool;

	constructor(gui: WireToolSceneDefinition, tool: WireTool) {
		super(gui);
		this.tool = tool;

		this.add(new ButtonControl(this.gui.Bottom.CancelButton, () => this.cancel()));

		this.tool.startMarker.subscribe(() => this.update(), true);
		this.event.subscribe(GuiService.GetPropertyChangedSignal("SelectedObject"), () => this.update());
		this.onPrepare(() => this.update());
	}

	private update() {
		this.gui.Bottom.CancelButton.Visible = false;
		this.gui.TextLabel.Visible = false;
		this.gui.NameLabel.Visible = false;

		const inputType = InputController.inputType.get();
		if (inputType !== "Desktop") {
			this.gui.TextLabel.Visible = true;

			if (!this.tool.startMarker.get()) {
				this.gui.TextLabel.Text = "Select the first marker";
				this.gui.Bottom.CancelButton.Visible = false;
			} else {
				this.gui.TextLabel.Text = "Select the second marker";
				if (InputController.inputType.get() !== "Gamepad") {
					this.gui.Bottom.CancelButton.Visible = true;
				}
			}
		}

		if (InputController.inputType.get() === "Gamepad") {
			if (GamepadService.GamepadCursorEnabled) {
				if (GuiService.SelectedObject) {
					this.gui.NameLabel.Visible = true;
					this.gui.NameLabel.Text = GuiService.SelectedObject.Name;
					this.gui.NameLabel.TextColor3 = GuiService.SelectedObject.BackgroundColor3;
				} else {
					this.gui.NameLabel.Visible = false;
				}
			}
		}
	}

	private cancel() {
		this.tool.stopDragging();
		this.update();
	}

	public show() {
		super.show();

		GuiAnimator.transition(this.gui, 0.2, "down");
	}
}
