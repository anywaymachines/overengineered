import { GuiService } from "@rbxts/services";
import Popup from "client/base/Popup";
import SoundController from "client/controller/SoundController";
import EventHandler from "shared/event/EventHandler";
import { ButtonControl } from "../controls/Button";

export type ConfirmPopupDefinition = GuiObject & {
	HeadingLabel: TextLabel;
	Title: TextLabel & {
		HeadingLabel: TextLabel;
	};
	ConfirmButton: GuiButton & {
		TextLabel: TextLabel;
	};
	CancelButton: GuiButton & {
		TextLabel: TextLabel;
	};
};

export default class ConfirmPopup extends Popup<ConfirmPopupDefinition> {
	private readonly confirmButton;
	private readonly cancelButton;

	constructor(gui: ConfirmPopupDefinition) {
		super(gui);

		this.confirmButton = this.added(new ButtonControl(gui.ConfirmButton));
		this.cancelButton = this.added(new ButtonControl(gui.CancelButton));
	}

	showPopup(text: string, okFunc: () => void, noFunc: () => void) {
		SoundController.getSounds().ActionRequired.Play();

		if (this.isVisible()) throw "Popup is already visible";
		super.show();

		const eh = new EventHandler();

		this.gui.HeadingLabel.Text = text;
		eh.subscribeOnce(this.confirmButton.activated, () => {
			eh.unsubscribeAll();
			SoundController.getSounds().Click.Play();
			okFunc();
			this.hide();
		});
		eh.subscribeOnce(this.cancelButton.activated, () => {
			eh.unsubscribeAll();
			SoundController.getSounds().Click.Play();
			noFunc();
			this.hide();
		});
	}

	protected prepareGamepad(): void {
		GuiService.SelectedObject = this.gui.CancelButton;
	}
}
