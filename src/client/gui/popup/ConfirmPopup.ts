import { GuiService } from "@rbxts/services";
import SoundController from "client/controller/SoundController";
import Gui from "client/gui/Gui";
import Popup from "client/gui/Popup";
import { ButtonControl, ButtonDefinition } from "client/gui/controls/Button";
import EventHandler from "shared/event/EventHandler";

export type ConfirmPopupDefinition = GuiObject & {
	readonly Body: {
		readonly Content: Frame & {
			readonly TextLabel1: TextLabel;
			readonly TextLabel2: TextLabel;
			readonly Head: {
				readonly CloseButton: ButtonDefinition;
			};
		};
		readonly AcceptButton: TextButton;
		readonly CancelButton: TextButton;
	};
};

export default class ConfirmPopup extends Popup<ConfirmPopupDefinition> {
	static readonly instance = new ConfirmPopup(
		Gui.getGameUI<{ Popup: { Confirm: ConfirmPopupDefinition } }>().Popup.Confirm,
	);

	private readonly confirmButton;
	private readonly cancelButton;
	private readonly closeButton;

	constructor(gui: ConfirmPopupDefinition) {
		super(gui);

		this.confirmButton = this.add(new ButtonControl(gui.Body.AcceptButton));
		this.cancelButton = this.add(new ButtonControl(gui.Body.CancelButton));
		this.closeButton = this.add(new ButtonControl(gui.Body.Content.Head.CloseButton));
	}

	showPopup(text: string, ps: string = "", okFunc: () => void, noFunc: () => void) {
		if (this.isVisible()) throw "Popup is already visible";
		SoundController.getSounds().Warning.Play();
		super.show();

		const eh = new EventHandler();

		this.gui.Body.Content.TextLabel1.Text = text;
		this.gui.Body.Content.TextLabel2.Text = ps;
		eh.subscribeOnce(this.confirmButton.activated, () => {
			eh.unsubscribeAll();
			okFunc();
			this.hide();
		});
		eh.subscribeOnce(this.cancelButton.activated, () => {
			eh.unsubscribeAll();
			noFunc();
			this.hide();
		});
		eh.subscribeOnce(this.closeButton.activated, () => {
			eh.unsubscribeAll();
			noFunc();
			this.hide();
		});
	}

	protected prepareGamepad(): void {
		GuiService.SelectedObject = this.gui.Body.CancelButton;
	}
}
