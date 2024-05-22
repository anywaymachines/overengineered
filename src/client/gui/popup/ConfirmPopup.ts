import { GuiService } from "@rbxts/services";
import { SoundController } from "client/controller/SoundController";
import { ButtonControl } from "client/gui/controls/Button";
import { Gui } from "client/gui/Gui";
import { Popup } from "client/gui/Popup";
import type { ButtonDefinition } from "client/gui/controls/Button";

export type ConfirmPopupDefinition = GuiObject & {
	readonly Content: Frame & {
		readonly TextLabel1: TextLabel;
		readonly TextLabel2: TextLabel;
	};
	readonly Head: {
		readonly CloseButton: ButtonDefinition;
	};
	readonly Buttons: {
		readonly AcceptButton: TextButton;
		readonly CancelButton: TextButton;
	};
};

export class ConfirmPopup extends Popup<ConfirmPopupDefinition> {
	private readonly confirmButton;
	private readonly cancelButton;
	private readonly closeButton;

	static showPopup(text: string, ps: string = "", okFunc: () => void, noFunc: () => void) {
		const popup = new ConfirmPopup(
			Gui.getGameUI<{ Popup: { Confirm: ConfirmPopupDefinition } }>().Popup.Confirm.Clone(),
			text,
			ps,
			okFunc,
			noFunc,
		);

		popup.show();
	}
	constructor(gui: ConfirmPopupDefinition, text: string, ps: string = "", okFunc: () => void, noFunc: () => void) {
		super(gui);

		this.confirmButton = this.add(new ButtonControl(gui.Buttons.AcceptButton));
		this.cancelButton = this.add(new ButtonControl(gui.Buttons.CancelButton));
		this.closeButton = this.add(new ButtonControl(gui.Head.CloseButton));

		SoundController.getSounds().Warning.Play();

		this.gui.Content.TextLabel1.Text = text;
		this.gui.Content.TextLabel2.Text = ps;
		this.event.subscribe(this.confirmButton.activated, () => {
			okFunc();
			this.hide();
		});
		this.event.subscribe(this.cancelButton.activated, () => {
			noFunc();
			this.hide();
		});
		this.event.subscribe(this.closeButton.activated, () => {
			noFunc();
			this.hide();
		});
	}

	protected prepareGamepad(): void {
		GuiService.SelectedObject = this.cancelButton.instance;
	}
}
