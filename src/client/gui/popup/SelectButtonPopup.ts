import { GuiService } from "@rbxts/services";
import Signal from "@rbxts/signal";
import Control from "client/gui/Control";
import Gui from "client/gui/Gui";
import Popup from "client/gui/Popup";
import { ButtonControl, ButtonDefinition, TextButtonControl, TextButtonDefinition } from "client/gui/controls/Button";
import EventHandler from "shared/event/EventHandler";

export type SelectButtonPopupDefinition = GuiObject & {
	readonly Body: GuiObject & {
		readonly ScrollingFrame: ScrollingFrame & {
			readonly ButtonTemplate: TextButtonDefinition;
		};
		readonly CancelButton: GuiButton;
		readonly Head: {
			readonly CloseButton: ButtonDefinition;
		};
	};
};

export default class SelectButtonPopup extends Popup<SelectButtonPopupDefinition> {
	static readonly instance = new SelectButtonPopup(
		Gui.getGameUI<{
			Popup: {
				MobileSelectButton: SelectButtonPopupDefinition;
			};
		}>().Popup.MobileSelectButton,
	);

	private readonly buttonPressed = new Signal<(key: KeyCode) => void>();
	private readonly cancelButton;
	private readonly closeButton;

	constructor(gui: SelectButtonPopupDefinition) {
		super(gui);
		this.cancelButton = this.add(new ButtonControl(gui.Body.CancelButton));
		this.closeButton = this.add(new ButtonControl(gui.Body.Head.CloseButton));

		const list = new Control(gui.Body.ScrollingFrame);
		this.add(list);

		const template = Control.asTemplate(this.gui.Body.ScrollingFrame.ButtonTemplate);

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

			this.event.subscribe(btn.activated, () => {
				this.buttonPressed.Fire(key.Name);
				this.hide();
			});
		}
	}

	showPopup(confirmFunc: (key: KeyCode) => void, cancelFunc: () => void) {
		if (this.isVisible()) throw "Popup is already visible";
		super.show();

		const eh = new EventHandler();

		eh.subscribeOnce(this.buttonPressed, (key) => {
			eh.unsubscribeAll();
			this.hide();
			confirmFunc(key);
		});
		eh.subscribeOnce(this.cancelButton.activated, () => {
			eh.unsubscribeAll();
			this.hide();
			cancelFunc();
		});
		eh.subscribeOnce(this.closeButton.activated, () => {
			eh.unsubscribeAll();
			this.hide();
			cancelFunc();
		});
	}

	protected prepareGamepad(): void {
		GuiService.SelectedObject = this.gui.Body.CancelButton;
	}
}
