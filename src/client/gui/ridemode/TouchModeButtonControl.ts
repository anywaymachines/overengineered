import { TextButtonControl } from "client/gui/controls/Button";
import { Gui } from "client/gui/Gui";
import { Signal } from "shared/event/Signal";
import type { ConfigLogicValueBase } from "client/blocks/config/ConfigLogicValueBase";
import type { TextButtonDefinition } from "client/gui/controls/Button";

export type TouchModeButtonData = {
	readonly name: string;
	readonly press: () => void;
	readonly release: () => void;
	readonly isPressed: () => boolean;
	readonly toggleMode: boolean;
};
export type TouchModeButtonControlDefinition = TextButtonDefinition;
export class TouchModeButtonControl extends TextButtonControl {
	//implements GroupableControl
	readonly pressed = new Signal<() => void>();
	readonly released = new Signal<() => void>();

	constructor(gui: TouchModeButtonControlDefinition) {
		super(gui);

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

	subscribe(press: () => void, unpress: () => void, isPressed: () => boolean, switchmode: boolean) {
		if (switchmode) {
			this.event.subscribe(this.pressed, () => (isPressed() ? unpress() : press()));
		} else {
			this.event.subscribe(this.pressed, press);
			this.event.subscribe(this.released, unpress);
		}
	}

	static fromTemplate() {
		const template = Gui.getTemplates<{
			readonly RideMode: { readonly TouchControlButton: TouchModeButtonControlDefinition };
		}>().RideMode.TouchControlButton;

		return new TouchModeButtonControl(template.Clone());
	}

	static fromBlocks(
		inputType: InputType,
		logics: readonly ConfigLogicValueBase[],
	): readonly TouchModeButtonControl[] {
		if (inputType !== "Touch") return [];

		const createButton = (key: string, group: readonly TouchModeButtonData[]) => {
			const button = this.fromTemplate();
			button.text.set(key);

			for (const data of group) {
				button.subscribe(data.press, data.release, data.isPressed, data.toggleMode);
			}

			return button;
		};

		const grouped = logics.flatmap((logic) => logic.getTouchButtonDatas()).groupBy((logic) => logic.name);
		return grouped.map(createButton);
	}
}
