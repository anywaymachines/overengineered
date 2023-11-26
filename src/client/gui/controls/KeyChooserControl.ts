import Control from "client/base/Control";
import ObservableValue from "shared/event/ObservableValue";
import { UserInputService } from "@rbxts/services";

export type KeyChooserControlDefinition = TextButton;

export default class KeyChooserControl extends Control<KeyChooserControlDefinition> {
	public readonly value = new ObservableValue<Enum.KeyCode | undefined>(undefined);

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
				this.gui.BackgroundColor3 = this.color;
			});
		});
	}
}
