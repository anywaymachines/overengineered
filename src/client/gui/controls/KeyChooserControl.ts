import { ContextActionService } from "@rbxts/services";
import { Colors } from "client/gui/Colors";
import { Control } from "client/gui/Control";
import { ObservableValue } from "shared/event/ObservableValue";
import { Signal } from "shared/event/Signal";

export type KeyChooserControlDefinition = TextButton;

type ToStr<TAllowNull extends boolean> = TAllowNull extends false ? KeyCode : KeyCode | undefined;
/** Control that represents a key */
export class KeyChooserControl<TAllowNull extends boolean = false> extends Control<KeyChooserControlDefinition> {
	readonly submitted = new Signal<(value: KeyCode, prev: ToStr<TAllowNull>) => void>();
	readonly value = new ObservableValue<ToStr<TAllowNull>>("P");

	private readonly color = Colors.accentDark;
	private readonly activeColor = Colors.accent;

	constructor(gui: KeyChooserControlDefinition) {
		super(gui);

		this.value.subscribe((value) => (this.gui.Text = value ?? ""));
		this.event.onPrepare(() => (this.gui.BackgroundColor3 = this.color));

		this.onPrepare((inputType) => (this.gui.Active = inputType !== "Touch"));

		this.gui.Activated.Connect(() => {
			this.gui.BackgroundColor3 = this.activeColor;

			const actionName = "peKeySelection";
			ContextActionService.BindActionAtPriority(
				actionName,
				(name, state, input) => {
					if (actionName === name) {
						if (input.KeyCode === Enum.KeyCode.Escape || input.KeyCode === Enum.KeyCode.Unknown) {
							return Enum.ContextActionResult.Sink;
						}

						ContextActionService.UnbindAction(actionName);

						const prev = this.value.get();
						this.value.set(input.KeyCode.Name);
						this.submitted.Fire(input.KeyCode.Name, prev);
						this.gui.BackgroundColor3 = this.color;
					}
				},
				true,
				2000 + 1,
				Enum.UserInputType.Keyboard,
				Enum.UserInputType.Gamepad1,
			);

			this.onDisable(() => ContextActionService.UnbindAction(actionName));
		});
	}
}
