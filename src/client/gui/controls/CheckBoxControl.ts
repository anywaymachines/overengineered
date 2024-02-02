import Signal from "@rbxts/signal";
import Control from "client/gui/Control";
import ObservableValue from "shared/event/ObservableValue";

export type CheckBoxControlDefinition = TextButton & {
	readonly Enabled: GuiObject;
	readonly Mixed: GuiObject;
};

/** Control that represents a boolean */
export default class CheckBoxControl extends Control<CheckBoxControlDefinition> {
	public readonly submitted = new Signal<(value: boolean) => void>();
	public readonly value = new ObservableValue<boolean | undefined>(false);

	constructor(gui: CheckBoxControlDefinition) {
		super(gui);

		const clicked = () => {
			this.value.set(!this.value.get());
			this.submitted.Fire(this.value.get() === true);
		};
		this.event.subscribe(gui.MouseButton1Click, clicked);

		this.value.subscribe((value) => {
			this.gui.Enabled.Visible = value === true;
			this.gui.Mixed.Visible = value === undefined;
		}, true);
	}
}
