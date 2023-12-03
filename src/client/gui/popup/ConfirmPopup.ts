import Popup from "client/base/Popup";
import GuiController from "client/controller/GuiController";
import SoundController from "client/controller/SoundController";
import EventHandler from "shared/event/EventHandler";
import GuiAnimator from "../GuiAnimator";
import { GuiService } from "@rbxts/services";
import { ButtonControl } from "../controls/Button";

export type ConfirmPopupDefinition = GuiObject & {
	Body: GuiObject & {
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
};

export default class ConfirmPopup extends Popup<ConfirmPopupDefinition> {
	public static readonly instance = new ConfirmPopup(
		GuiController.getGameUI<{
			Popup: {
				ConfirmGui: ConfirmPopupDefinition;
			};
		}>().Popup.ConfirmGui,
	);

	private readonly confirmButton;
	private readonly cancelButton;

	constructor(gui: ConfirmPopupDefinition) {
		super(gui);

		this.confirmButton = this.added(new ButtonControl(gui.Body.ConfirmButton));
		this.cancelButton = this.added(new ButtonControl(gui.Body.CancelButton));
	}

	showPopup(text: string, okFunc: () => void, noFunc: () => void) {
		if (this.isVisible()) throw "Popup is already visible";
		super.show();
		GuiAnimator.transition(this.gui.Body, 0.2, "up");

		const eh = new EventHandler();

		this.gui.Body.HeadingLabel.Text = text;
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
		GuiService.SelectedObject = this.gui.Body.CancelButton;
	}
}
