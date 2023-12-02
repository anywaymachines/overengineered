import Signal from "@rbxts/signal";
import Control from "client/base/Control";
import SoundController from "client/controller/SoundController";
import ObservableValue from "shared/event/ObservableValue";

export type ButtonDefinition = GuiButton;

export class ButtonControl<T extends ButtonDefinition = ButtonDefinition> extends Control<T> {
	public readonly activated = new Signal<() => void>();

	constructor(gui: T) {
		super(gui);

		const silent = this.getAttribute<boolean>("silent") === true;

		this.event.subscribe(this.gui.Activated, () => {
			if (!silent) SoundController.getSounds().Click.Play();
			this.activated.Fire();
		});
	}
}

export type TextButtonDefinition = TextButton;
export class TextButtonControl extends ButtonControl<TextButtonDefinition> {
	public readonly text = new ObservableValue("");

	constructor(gui: TextButtonDefinition) {
		super(gui);
		this.event.subscribeObservable(this.text, (value) => (this.gui.Text = value));
	}
}
