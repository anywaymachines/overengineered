import { UserInputService } from "@rbxts/services";
import Signal from "@rbxts/signal";
import Control from "client/base/Control";
import ObservableValue from "shared/event/ObservableValue";

export type KeyChooserControlDefinition = TextButton;

/** Control that represents a key */
export default class KeyChooserControl extends Control<KeyChooserControlDefinition> {
	public readonly submitted = new Signal<(value: Enum.KeyCode) => void>();
	public readonly value = new ObservableValue<Enum.KeyCode>(Enum.KeyCode.P);

	private readonly color = Color3.fromRGB(48, 62, 87);
	private readonly activeColor = Color3.fromRGB(13, 150, 255);

	constructor(gui: KeyChooserControlDefinition) {
		super(gui);

		this.value.subscribe((value) => (this.gui.Text = value?.Name ?? ""));
		this.event.onPrepare(() => (this.gui.BackgroundColor3 = this.color));

		this.gui.Activated.Connect(() => {
			this.gui.BackgroundColor3 = this.activeColor;
			this.eventHandler.subscribeOnce(UserInputService.InputBegan, (input) => {
				this.value.set(input.KeyCode);
				this.submitted.Fire(input.KeyCode);
				this.gui.BackgroundColor3 = this.color;
			});
		});
	}
}
