import { UserInputService } from "@rbxts/services";
import Signal from "@rbxts/signal";
import Control from "client/base/Control";
import { KeyCode } from "shared/Configuration";
import ObservableValue from "shared/event/ObservableValue";

export type KeyChooserControlDefinition = TextButton;

/** Control that represents a key */
export default class KeyChooserControl extends Control<KeyChooserControlDefinition> {
	public readonly submitted = new Signal<(value: KeyCode) => void>();
	public readonly value = new ObservableValue<KeyCode>("P");

	private readonly color = Color3.fromRGB(48, 62, 87);
	private readonly activeColor = Color3.fromRGB(13, 150, 255);

	constructor(gui: KeyChooserControlDefinition) {
		super(gui);

		this.value.subscribe((value) => (this.gui.Text = value ?? ""));
		this.event.onPrepare(() => (this.gui.BackgroundColor3 = this.color));

		this.gui.Activated.Connect(() => {
			this.gui.BackgroundColor3 = this.activeColor;
			this.eventHandler.subscribeOnce(UserInputService.InputBegan, (input) => {
				this.value.set(input.KeyCode.Name);
				this.submitted.Fire(input.KeyCode.Name);
				this.gui.BackgroundColor3 = this.color;
			});
		});
	}
}
