import { Players, UserInputService } from "@rbxts/services";
import { Control } from "client/gui/Control";
import { NumberTextBoxControl } from "client/gui/controls/NumberTextBoxControl";
import { ProgressBarControl } from "client/gui/controls/ProgressBarControl";
import { EventHandler } from "shared/event/EventHandler";
import { NumberObservableValue } from "shared/event/NumberObservableValue";
import { Signal } from "shared/event/Signal";
import type {
	ProgressBarControlDefinition,
	ProgressBarControlDefinitionParts,
} from "client/gui/controls/ProgressBarControl";

type ToNum<TAllowNull extends boolean> = TAllowNull extends false ? number : number | undefined;
export type SliderControlDefinition = ProgressBarControlDefinition & SliderControlDefinitionParts;
export type SliderControlDefinitionParts = ProgressBarControlDefinitionParts & {
	readonly TextBox?: TextBox;
};

/** Control that represents a number via a slider. */
export class SliderControl<TAllowNull extends boolean = false> extends Control<SliderControlDefinition> {
	private readonly _submitted = new Signal<(value: number) => void>();
	readonly submitted = this._submitted.asReadonly();
	private readonly _moved = new Signal<(value: number) => void>();
	readonly moved = this._moved.asReadonly();
	readonly value;

	private readonly progressBar;
	private readonly parts: SliderControlDefinitionParts;

	constructor(
		gui: SliderControlDefinition,
		min: number,
		max: number,
		step: number,
		parts?: SliderControlDefinitionParts,
	) {
		super(gui);

		this.parts = {
			Filled: parts?.Filled ?? Control.findFirstChild(gui, "Filled"),
			Knob: parts?.Knob ?? Control.findFirstChild(gui, "Knob"),
			Text: parts?.Text ?? Control.findFirstChild(gui, "Text"),
			TextBox: parts?.TextBox ?? Control.findFirstChild(gui, "TextBox"),
		};

		this.progressBar = new ProgressBarControl(this.gui, min, max, step, this.parts);
		this.progressBar.instance.Active = true;
		this.add(this.progressBar);

		this.value = new NumberObservableValue<ToNum<TAllowNull>>(min, min, max, step);
		this.value.subscribe((value) => this.progressBar.value.set(value ?? 0), true);

		this.subscribeMovement();

		if (this.parts.TextBox) {
			const num = new NumberTextBoxControl<TAllowNull>(this.parts.TextBox, min, max, step);
			num.value.bindTo(this.value);
			this.event.subscribe(num.submitted, (value) => this._submitted.Fire(value));
			this.add(num);
		}
	}

	private subscribeMovement() {
		const eh = new EventHandler();
		let startpos: number | undefined;

		const moveMouse = () => {
			if (startpos === undefined) return;

			if (this.progressBar.vertical) {
				const y = this.gui.AbsoluteSize.Y - Players.LocalPlayer.GetMouse().Y;

				const value =
					((y - startpos) / this.gui.AbsoluteSize.Y) * this.value.getRange() +
					this.value.min +
					this.value.step / 2;
				this.value.set(value);
				this._moved.Fire(value);
			} else {
				const x = Players.LocalPlayer.GetMouse().X;

				const value = ((x - startpos) / this.gui.AbsoluteSize.X) * this.value.getRange() + this.value.min;
				this.value.set(value);
				this._moved.Fire(value);
			}
		};

		let st = false;
		const unsub = () => {
			st = false;
			startpos = undefined;
			eh.unsubscribeAll();

			const value = this.value.get();
			if (value !== undefined) {
				this._submitted.Fire(value);
			}
		};
		const sub = (signal: RBXScriptSignal<(input: InputObject) => void>) => {
			this.event.subscribe(signal, (input) => {
				if (
					input.UserInputState === Enum.UserInputState.Begin &&
					(input.UserInputType === Enum.UserInputType.MouseButton1 ||
						input.UserInputType === Enum.UserInputType.Touch)
				) {
					startpos = this.progressBar.vertical
						? this.gui.AbsoluteSize.Y - this.gui.AbsolutePosition.Y + this.gui.AbsoluteSize.Y
						: this.gui.AbsolutePosition.X;
					moveMouse();

					eh.subscribe(Players.LocalPlayer.GetMouse().Move, () => moveMouse());
					eh.subscribe(UserInputService.InputEnded, (input, _) => {
						if (startpos === undefined) return;

						if (
							input.UserInputType === Enum.UserInputType.MouseButton1 ||
							input.UserInputType === Enum.UserInputType.Touch
						) {
							unsub();
						}
					});
				}
			});
		};

		if (this.parts.Knob) {
			this.parts.Knob.SelectionGroup = true;
			this.parts.Knob.SelectionBehaviorLeft = Enum.SelectionBehavior.Stop;
			this.parts.Knob.SelectionBehaviorRight = Enum.SelectionBehavior.Stop;
		}

		const moveGamepad = (posx: boolean) => {
			const value = (this.value.get() ?? 0) + (posx ? this.value.step : -this.value.step);
			this.value.set(value);
			this._moved.Fire(value);
		};

		if (this.parts.Knob) {
			this.event.subscribe(this.parts.Knob.SelectionGained, () => {
				eh.subscribe(UserInputService.InputBegan, (input) => {
					if (!st) return;

					if (input.UserInputType === Enum.UserInputType.Gamepad1) {
						if (this.progressBar.vertical) {
							if (input.KeyCode === Enum.KeyCode.DPadUp) moveGamepad(true);
							else if (input.KeyCode === Enum.KeyCode.DPadDown) moveGamepad(false);
						} else {
							if (input.KeyCode === Enum.KeyCode.DPadRight) moveGamepad(true);
							else if (input.KeyCode === Enum.KeyCode.DPadLeft) moveGamepad(false);
						}
					}
				});
				eh.subscribe(UserInputService.InputChanged, (input) => {
					if (!st) return;

					if (this.progressBar.vertical) {
						if (input.UserInputType === Enum.UserInputType.Gamepad1 && input.Position.X !== 0) {
							moveGamepad(input.Position.X > 0);
						}
					} else {
						if (input.UserInputType === Enum.UserInputType.Gamepad1 && input.Position.Y !== 0) {
							moveGamepad(input.Position.Y > 0);
						}
					}
				});

				st = true;
			});

			this.event.subscribe(this.parts.Knob.SelectionLost, unsub);
			sub(this.parts.Knob.InputBegan);
		}

		if (this.parts.Filled) {
			sub(this.parts.Filled.InputBegan);
		}

		sub(this.gui.InputBegan);
	}
}
