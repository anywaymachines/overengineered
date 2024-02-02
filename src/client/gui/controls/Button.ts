import Signal from "@rbxts/signal";
import SoundController from "client/controller/SoundController";
import Control from "client/gui/Control";
import ObservableValue from "shared/event/ObservableValue";

export type ButtonDefinition = GuiButton;
export class ButtonControl<T extends ButtonDefinition = ButtonDefinition> extends Control<T> {
	public readonly activated = new Signal<() => void>();

	constructor(gui: T, activated?: () => void) {
		super(gui);

		const silent = this.getAttribute<boolean>("silent") === true;

		this.event.subscribe(this.gui.Activated, () => {
			if (!silent) SoundController.getSounds().Click.Play();
			this.activated.Fire();
		});

		if (activated) {
			this.activated.Connect(activated);
		}
	}
}

export type TextButtonDefinition = GuiButton & {
	readonly TextLabel: TextLabel;
};
export class TextButtonControl<T extends TextButtonDefinition = TextButtonDefinition> extends ButtonControl<T> {
	public readonly text = new ObservableValue("");

	constructor(gui: T) {
		super(gui);
		this.event.subscribeObservable(this.text, (value) => (this.gui.TextLabel!.Text = value), true);
	}
}
