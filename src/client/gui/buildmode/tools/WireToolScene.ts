import { GamepadService, GuiService } from "@rbxts/services";
import Control from "client/base/Control";
import InputController from "client/controller/InputController";
import WireTool from "client/tools/WireTool";
import GuiAnimator from "../../GuiAnimator";
import { ButtonControl } from "../../controls/Button";

export type WireToolSceneDefinition = GuiObject & {
	Button: GuiButton;
	TextLabel: TextLabel;
	NameLabel: TextLabel;
};

export default class WireToolScene extends Control<WireToolSceneDefinition> {
	readonly tool;

	constructor(gui: WireToolSceneDefinition, tool: WireTool) {
		super(gui);
		this.tool = tool;

		this.add(new ButtonControl(this.gui.Button, () => this.cancel()));

		this.tool.startMarker.subscribe(() => this.update(), true);
		this.event.subscribe(GuiService.GetPropertyChangedSignal("SelectedObject"), () => this.update());
	}

	private update() {
		this.gui.Button.Visible = false;
		this.gui.TextLabel.Visible = false;
		this.gui.NameLabel.Visible = false;

		if (InputController.inputType.get() === "Gamepad") {
			if (GamepadService.GamepadCursorEnabled) {
				this.gui.TextLabel.Visible = true;

				if (GuiService.SelectedObject) {
					this.gui.NameLabel.Visible = true;
					this.gui.NameLabel.Text = GuiService.SelectedObject.Name;
					this.gui.NameLabel.TextColor3 = GuiService.SelectedObject.BackgroundColor3;
				} else {
					this.gui.NameLabel.Visible = false;
				}

				if (!this.tool.startMarker.get()) {
					this.gui.TextLabel.Text = "Select the first marker";
					this.gui.Button.Visible = false;
				} else {
					this.gui.TextLabel.Text = "Select the second marker";
					this.gui.Button.Visible = true;
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
