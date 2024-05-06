import { GuiService } from "@rbxts/services";
import { Gui } from "client/gui/Gui";
import { Popup } from "client/gui/Popup";
import { ButtonControl } from "client/gui/controls/Button";

export type TextPopupDefinition = GuiObject & {
	readonly Heading: Frame & {
		readonly CloseButton: TextButton;
		readonly TitleLabel: TextLabel;
	};
	readonly DoneButton: TextButton;
	readonly TextBox: TextBox;
};

export class TextPopup extends Popup<TextPopupDefinition> {
	private readonly doneButton;
	private readonly closeButton;

	static showPopup(text: string, ps: string = "", okFunc: (text: string) => void, noFunc: () => void) {
		const popup = new TextPopup(
			Gui.getGameUI<{ Popup: { Text: TextPopupDefinition } }>().Popup.Text.Clone(),
			text,
			ps,
			okFunc,
			noFunc,
		);

		popup.show();
	}
	constructor(
		gui: TextPopupDefinition,
		text: string,
		ps: string = "",
		okFunc: (text: string) => void,
		noFunc: () => void,
	) {
		super(gui);

		this.doneButton = this.add(new ButtonControl(gui.DoneButton));
		this.closeButton = this.add(new ButtonControl(gui.Heading.CloseButton));

		this.gui.Heading.TitleLabel.Text = text;
		this.gui.TextBox.PlaceholderText = ps;
		this.event.subscribe(this.doneButton.activated, () => {
			okFunc(this.gui.TextBox.Text);
			this.hide();
		});
		this.event.subscribe(this.closeButton.activated, () => {
			noFunc();
			this.hide();
		});
	}

	protected prepareGamepad(): void {
		GuiService.SelectedObject = this.gui.TextBox;
	}
}
