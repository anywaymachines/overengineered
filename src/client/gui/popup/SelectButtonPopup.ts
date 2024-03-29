import { GuiService } from "@rbxts/services";
import Control from "client/gui/Control";
import Gui from "client/gui/Gui";
import Popup from "client/gui/Popup";
import { ButtonControl, ButtonDefinition, TextButtonControl, TextButtonDefinition } from "client/gui/controls/Button";
import Signal from "shared/event/Signal";

export type SelectButtonPopupDefinition = GuiObject & {
	readonly Content: {
		readonly ScrollingFrame: ScrollingFrame & {
			readonly ButtonTemplate: TextButtonDefinition;
		};
	};
	readonly Buttons: {
		readonly CancelButton: GuiButton;
	};
	readonly Head: {
		readonly CloseButton: ButtonDefinition;
	};
};

export default class SelectButtonPopup extends Popup<SelectButtonPopupDefinition> {
	private readonly buttonPressed = new Signal<(key: KeyCode) => void>();
	private readonly cancelButton;
	private readonly closeButton;

	static showPopup(confirmFunc: (key: KeyCode) => void, cancelFunc: () => void) {
		const popup = new SelectButtonPopup(
			Gui.getGameUI<{
				Popup: { MobileSelectButton: SelectButtonPopupDefinition };
			}>().Popup.MobileSelectButton.Clone(),
			confirmFunc,
			cancelFunc,
		);

		popup.show();
	}
	constructor(gui: SelectButtonPopupDefinition, confirmFunc: (key: KeyCode) => void, cancelFunc: () => void) {
		super(gui);
		this.cancelButton = this.add(new ButtonControl(gui.Buttons.CancelButton));
		this.closeButton = this.add(new ButtonControl(gui.Head.CloseButton));

		const list = new Control(gui.Content.ScrollingFrame);
		this.add(list);

		const template = this.asTemplate(this.gui.Content.ScrollingFrame.ButtonTemplate);

		const keys = Enum.KeyCode.GetEnumItems().filter((value) => {
			// numbers
			if (value.Value > 48 && value.Value <= 57) return true;

			// a-z
			if (value.Value > 97 && value.Value <= 122) return true;

			// gamepad
			if (value.Value > 1000 && value.Value <= 1017) return true;

			return false;
		});

		const keyToName = (key: KeyCode) => {
			if (key === "Zero") return "0";
			if (key === "One") return "1";
			if (key === "Two") return "2";
			if (key === "Three") return "3";
			if (key === "Four") return "4";
			if (key === "Five") return "5";
			if (key === "Six") return "6";
			if (key === "Seven") return "7";
			if (key === "Eight") return "8";
			if (key === "Nine") return "9";

			if (key.find("^Button")[0] !== undefined) {
				return key.sub("Button".size());
			}

			return key;
		};

		for (const key of keys) {
			const btn = new TextButtonControl(template());
			btn.text.set(keyToName(key.Name));
			list.add(btn);

			this.event.subscribe(btn.activated, () => this.buttonPressed.Fire(key.Name));
		}

		this.event.subscribe(this.buttonPressed, (key) => {
			this.hide();
			confirmFunc(key);
		});
		this.event.subscribe(this.cancelButton.activated, () => {
			this.hide();
			cancelFunc();
		});
		this.event.subscribe(this.closeButton.activated, () => {
			this.hide();
			cancelFunc();
		});
	}

	protected prepareGamepad(): void {
		GuiService.SelectedObject = this.cancelButton.instance;
	}
}
