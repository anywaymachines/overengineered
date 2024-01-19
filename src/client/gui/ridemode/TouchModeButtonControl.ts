import Signal from "@rbxts/signal";
import Control from "client/base/Control";
import GuiController from "client/controller/GuiController";
import ObservableValue from "shared/event/ObservableValue";
import { TextButtonDefinition } from "../controls/Button";

export type TouchModeButtonControlDefinition = TextButtonDefinition;
export default class TouchModeButtonControl extends Control<TouchModeButtonControlDefinition> {
	//implements GroupableControl
	readonly pressed = new Signal<() => void>();
	readonly released = new Signal<() => void>();
	readonly text = new ObservableValue("");

	constructor(gui: TouchModeButtonControlDefinition) {
		super(gui);

		this.event.subscribeObservable(this.text, (text) => (this.gui.TextLabel.Text = text), true);

		this.event.subscribe(this.gui.InputBegan, (input) => {
			if (
				input.UserInputType !== Enum.UserInputType.MouseButton1 &&
				input.UserInputType !== Enum.UserInputType.Touch
			)
				return;

			this.pressed.Fire();
		});
		this.event.subscribe(this.gui.InputEnded, (input) => {
			if (
				input.UserInputType !== Enum.UserInputType.MouseButton1 &&
				input.UserInputType !== Enum.UserInputType.Touch
			)
				return;

			this.released.Fire();
		});
	}

	/*groupWith(controls: readonly GroupableControl[]): Control {
		const control = new TouchModeButtonControl();
		control.text.set(this.text.get());

		return control;
	}*/

	subscribe(press: () => void, unpress: () => void, isPressed: () => boolean, switchmode: boolean) {
		if (switchmode) {
			this.event.subscribe(this.pressed, () => (isPressed() ? unpress() : press()));
		} else {
			this.event.subscribe(this.pressed, press);
			this.event.subscribe(this.released, unpress);
		}
	}

	static create() {
		const template = GuiController.getTemplates<{
			readonly RideMode: { readonly TouchControlButton: TouchModeButtonControlDefinition };
		}>().RideMode.TouchControlButton;

		return new TouchModeButtonControl(template.Clone());
	}
}
