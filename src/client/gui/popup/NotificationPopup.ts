import { GuiService } from "@rbxts/services";
import { SoundController } from "client/controller/SoundController";
import { ButtonControl } from "client/gui/controls/Button";
import { Gui } from "client/gui/Gui";
import { Popup } from "client/gui/Popup";
import type { ButtonDefinition } from "client/gui/controls/Button";

export type NotificationPopupDefinition = GuiObject & {
	readonly Content: Frame & {
		readonly TextLabel1: TextLabel;
		readonly TextLabel2: TextLabel;
	};
	readonly Head: {
		readonly CloseButton: ButtonDefinition;
	};
	readonly Buttons: {
		readonly OkButton: TextButton;
	};
};

export class NotificationPopup extends Popup<NotificationPopupDefinition> {
	private readonly okButton;
	private readonly closeButton;

	static showPopup(text: string, ps: string = "") {
		const popup = new NotificationPopup(
			Gui.getGameUI<{ Popup: { Notification: NotificationPopupDefinition } }>().Popup.Notification.Clone(),
			text,
			ps,
		);

		popup.show();
	}
	constructor(gui: NotificationPopupDefinition, text: string, ps: string = "") {
		super(gui);

		this.okButton = this.add(new ButtonControl(gui.Buttons.OkButton));
		this.closeButton = this.add(new ButtonControl(gui.Head.CloseButton));

		SoundController.getSounds().Warning.Play();

		this.gui.Content.TextLabel1.Text = text;
		this.gui.Content.TextLabel2.Text = ps;
		this.event.subscribe(this.okButton.activated, () => this.hide());
		this.event.subscribe(this.closeButton.activated, () => this.hide());
	}

	protected prepareGamepad(): void {
		GuiService.SelectedObject = this.okButton.instance;
	}
}
