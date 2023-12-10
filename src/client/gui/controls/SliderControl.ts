import { Players, UserInputService } from "@rbxts/services";
import Signal from "@rbxts/signal";
import Control from "client/base/Control";
import EventHandler from "shared/event/EventHandler";
import NumberTextBoxControl from "./NumberTextBoxControl";
import ProgressBarControl, { ProgressBarControlDefinition } from "./ProgressBarControl";

export type SliderControlDefinition = GuiObject &
	ProgressBarControlDefinition & {
		TextBox?: TextBox;
	};

/** Control that represents a number via a slider. */
export default class SliderControl<
	T extends SliderControlDefinition = SliderControlDefinition,
> extends ProgressBarControl<T> {
	public readonly submitted = new Signal<(value: number) => void>();

	constructor(gui: T, min: number, max: number, step: number) {
		super(gui, min, max, step);

		this.value.subscribe((value) => this.textValue.set(tostring(value)), true);
		this.subscribeVisualSlider();
		this.subscribeMovement();
	}

	private subscribeVisualSlider() {
		if (Control.exists(this.gui, "TextBox")) {
			const num = new NumberTextBoxControl(this.gui.TextBox);
			num.value.bindTo(this.value);
			this.event.subscribe(num.submitted, (value) => this.submitted.Fire(value));
			this.add(num);
		}
	}
	private subscribeMovement() {
		const eh = new EventHandler();
		let startpos: number | undefined;

		const moveMouse = () => {
			if (startpos === undefined) return;

			if (this.vertical) {
				const y = this.gui.AbsoluteSize.Y - Players.LocalPlayer.GetMouse().Y;
				this.value.set(
					((y - startpos) / this.gui.AbsoluteSize.Y) * this.value.getRange() +
						this.value.min +
						this.value.step / 2,
				);
			} else {
				const x = Players.LocalPlayer.GetMouse().X;
				this.value.set(
					((x - startpos) / this.gui.AbsoluteSize.X) * this.value.getRange() +
						this.value.min +
						this.value.step / 2,
				);
			}
		};

		let st = false;
		const unsub = () => {
			st = false;
			startpos = undefined;
			eh.unsubscribeAll();

			this.submitted.Fire(this.value.get());
		};
		const sub = (signal: RBXScriptSignal<(input: InputObject) => void>) => {
			this.event.subscribe(signal, (input) => {
				if (
					input.UserInputState === Enum.UserInputState.Begin &&
					(input.UserInputType === Enum.UserInputType.MouseButton1 ||
						input.UserInputType === Enum.UserInputType.Touch)
				) {
					startpos = this.vertical
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
							print("ie");
							unsub();
						}
					});
				}
			});
		};

		if (Control.exists(this.gui, "Knob")) {
			this.gui.Knob.SelectionGroup = true;
			this.gui.Knob.SelectionBehaviorLeft = Enum.SelectionBehavior.Stop;
			this.gui.Knob.SelectionBehaviorRight = Enum.SelectionBehavior.Stop;
		}

		const moveGamepad = (posx: boolean) => {
			this.value.set(this.value.get() + (posx ? this.value.step : -this.value.step));
		};

		if (Control.exists(this.gui, "Knob")) {
			this.event.subscribe(this.gui.Knob.SelectionGained, () => {
				eh.subscribe(UserInputService.InputBegan, (input) => {
					if (!st) return;

					if (input.UserInputType === Enum.UserInputType.Gamepad1) {
						if (this.vertical) {
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

					if (this.vertical) {
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

			this.event.subscribe(this.gui.Knob.SelectionLost, unsub);
			sub(this.gui.Knob.InputBegan);
		}

		if (Control.exists(this.gui, "Filled")) {
			sub(this.gui.Filled.InputBegan);
		}

		sub(this.gui.InputBegan);
	}
}
