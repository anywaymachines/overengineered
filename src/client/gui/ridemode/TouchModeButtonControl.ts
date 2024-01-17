import Signal from "@rbxts/signal";
import Control from "client/base/Control";
import GuiController from "client/controller/GuiController";
import ObservableValue from "shared/event/ObservableValue";
import { TextButtonDefinition } from "../controls/Button";

export type TouchModeButtonControlDefinition = TextButtonDefinition;
export default class TouchModeButtonControl extends Control<TouchModeButtonControlDefinition> {
	readonly pressed = new Signal<() => void>();
	readonly released = new Signal<() => void>();
	readonly text = new ObservableValue("");

	constructor(gui: TouchModeButtonControlDefinition) {
		super(gui);

		this.event.subscribeObservable(this.text, (text) => (this.gui.TextLabel.Text = text), true);

		this.event.onInputBegin((input) => {
			if (
				input.UserInputType !== Enum.UserInputType.MouseButton1 &&
				input.UserInputType !== Enum.UserInputType.Touch
			)
				return;

			this.pressed.Fire();
		});
		this.event.onInputEnd((input) => {
			if (
				input.UserInputType !== Enum.UserInputType.MouseButton1 &&
				input.UserInputType !== Enum.UserInputType.Touch
			)
				return;

			this.released.Fire();
		});
	}

	static create() {
		const template = GuiController.getTemplates<{ TouchControlButton: TouchModeButtonControlDefinition }>()
			.TouchControlButton;

		return new TouchModeButtonControl(template.Clone());
	}
}
