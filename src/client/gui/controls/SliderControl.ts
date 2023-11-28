import { UserInputService } from "@rbxts/services";
import { Players } from "@rbxts/services";
import EventHandler from "shared/event/EventHandler";
import Control from "client/base/Control";
import NumberTextBoxControl from "./NumberTextBoxControl";
import NumberObservableValue from "shared/event/NumberObservableValue";
import Signal from "@rbxts/signal";
import Animation from "../Animation";

export type SliderControlDefinition = GuiObject & {
	Filled?: GuiObject;
	Text?: TextLabel;
	TextBox?: TextBox;
	Knob: GuiObject;
};

/** Control that represents a number via a slider. */
export default class SliderControl<T extends SliderControlDefinition = SliderControlDefinition> extends Control<T> {
	public readonly submitted = new Signal<(value: number) => void>();
	public readonly value;

	constructor(gui: T, min: number, max: number, step: number) {
		super(gui);
		this.value = new NumberObservableValue(min, min, max, step);

		this.subscribeVisual();
		this.subscribeMovement();
	}

	private subscribeVisual() {
		if (Control.exists(this.gui, "TextBox")) {
			const num = new NumberTextBoxControl(this.gui.TextBox);
			num.value.bindTo(this.value);
			this.add(num);
		}

		if (Control.exists(this.gui, "Text")) {
			const text = this.gui.Text;
			this.value.subscribe((value) => (text.Text = tostring(value)), true);
		}

		Animation.value(
			this.event,
			this.gui.Knob,
			this.value,
			(value) => {
				return {
					Position: new UDim2(value / this.value.getRange(), 0, 0.5, 0),
				};
			},
			new TweenInfo(0.1, Enum.EasingStyle.Quad, Enum.EasingDirection.Out),
		);

		if (Control.exists(this.gui, "Filled")) {
			Animation.value(
				this.event,
				this.gui.Filled as GuiObject,
				this.value,
				(value) => {
					return {
						Size: new UDim2(value / this.value.getRange(), 0, 1, 0),
					};
				},
				new TweenInfo(0.1, Enum.EasingStyle.Quad, Enum.EasingDirection.Out),
			);
		}
	}
	private subscribeMovement() {
		const eh = new EventHandler();
		let startpos: number | undefined;

		this.event.subscribe(UserInputService.InputEnded, (input, _) => {
			if (
				input.UserInputType === Enum.UserInputType.MouseButton1 ||
				input.UserInputType === Enum.UserInputType.Touch
			) {
				unsub();
			}
		});

		const moveMouse = () => {
			if (startpos === undefined) return;

			const x = Players.LocalPlayer.GetMouse().X;
			this.value.set(((x - startpos) / this.gui.AbsoluteSize.X) * this.value.getRange() + this.value.step / 2);
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
					startpos = this.gui.AbsolutePosition.X;
					moveMouse();
					eh.subscribe(Players.LocalPlayer.GetMouse().Move, () => moveMouse());
				}
			});
		};

		this.gui.Knob.SelectionGroup = true;
		this.gui.Knob.SelectionBehaviorLeft = Enum.SelectionBehavior.Stop;
		this.gui.Knob.SelectionBehaviorRight = Enum.SelectionBehavior.Stop;

		const moveGamepad = (posx: boolean) => {
			this.value.set(this.value.get() + (posx ? this.value.step : -this.value.step));
		};

		this.event.subscribe(this.gui.Knob.SelectionGained, () => {
			eh.subscribe(UserInputService.InputBegan, (input) => {
				if (!st) return;

				if (input.UserInputType === Enum.UserInputType.Gamepad1) {
					if (input.KeyCode === Enum.KeyCode.DPadRight) moveGamepad(true);
					else if (input.KeyCode === Enum.KeyCode.DPadLeft) moveGamepad(false);
				}
			});
			eh.subscribe(UserInputService.InputChanged, (input) => {
				if (!st) return;

				if (input.UserInputType === Enum.UserInputType.Gamepad1 && input.Position.X !== 0) {
					moveGamepad(input.Position.X > 0);
				}
			});

			st = true;
		});
		this.event.subscribe(this.gui.Knob.SelectionLost, unsub);

		if (Control.exists(this.gui, "Filled")) {
			sub(this.gui.Filled.InputBegan);
		}

		sub(this.gui.Knob.InputBegan);
		sub(this.gui.InputBegan);
	}
}
