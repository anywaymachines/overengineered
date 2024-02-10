import { UserInputService } from "@rbxts/services";
import Signal from "@rbxts/signal";
import InputController from "client/controller/InputController";
import { Colors } from "client/gui/Colors";
import Control from "client/gui/Control";
import SelectButtonPopup from "client/gui/popup/SelectButtonPopup";
import ObservableValue from "shared/event/ObservableValue";

export type KeyChooserControlDefinition = TextButton;

/** Control that represents a key */
export default class KeyChooserControl extends Control<KeyChooserControlDefinition> {
	public readonly submitted = new Signal<(value: KeyCode, prev: KeyCode) => void>();
	public readonly value = new ObservableValue<KeyCode>("P");

	private readonly color = Colors.accentDark;
	private readonly activeColor = Colors.accent;

	constructor(gui: KeyChooserControlDefinition) {
		super(gui);

		this.value.subscribe((value) => (this.gui.Text = value ?? ""));
		this.event.onPrepare(() => (this.gui.BackgroundColor3 = this.color));

		this.gui.Activated.Connect(() => {
			if (InputController.inputType.get() === "Touch") {
				SelectButtonPopup.showPopup(
					(key) => {
						const prev = this.value.get();
						this.value.set(key);
						this.submitted.Fire(key, prev);
					},
					() => {},
				);
			} else {
				this.gui.BackgroundColor3 = this.activeColor;
				this.eventHandler.subscribeOnce(UserInputService.InputBegan, (input) => {
					const prev = this.value.get();
					this.value.set(input.KeyCode.Name);
					this.submitted.Fire(input.KeyCode.Name, prev);
					this.gui.BackgroundColor3 = this.color;
				});
			}
		});
	}
}
