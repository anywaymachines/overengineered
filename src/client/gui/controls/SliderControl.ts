import { UserInputService } from "@rbxts/services";
import { Players } from "@rbxts/services";
import EventHandler from "shared/event/EventHandler";
import GuiAnimator from "../GuiAnimator";
import Control from "client/base/Control";
import ObservableValue from "shared/event/ObservableValue";

export type SliderControlDefinition = GuiObject & {
	Filled?: GuiObject;
	Text?: TextLabel;
	Knob: GuiObject;
};

export default class SliderControl<T extends SliderControlDefinition = SliderControlDefinition> extends Control<T> {
	public readonly value = new ObservableValue(0);
	private readonly visibleValue = new ObservableValue(0);
	private min = 0;
	private max = 10;
	private step = 1;

	constructor(gui: T) {
		super(gui);
		this.updateVisuals();

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

		this.visibleValue.subscribe(() => this.updateVisuals(), true);
		this.value.subscribe((value) => this.visibleValue.set(value / (this.max - this.min)));

		const moveMouse = (input: InputObject) => {
			if (startpos === undefined) return;

			const x = Players.LocalPlayer.GetMouse().X;
			this.visibleValue.set(math.clamp((x - startpos) / this.gui.AbsoluteSize.X, 0, 1));
		};

		let st = false;
		const unsub = () => {
			st = false;
			startpos = undefined;
			eh.unsubscribeAll();

			const v = this.steppedValue() * (this.max - this.min);
			this.value.setIfNotSame(v - (v % this.step));
		};
		const sub = (signal: RBXScriptSignal<(input: InputObject) => void>) => {
			this.event.subscribe(signal, (input) => {
				if (
					input.UserInputState === Enum.UserInputState.Begin &&
					(input.UserInputType === Enum.UserInputType.MouseButton1 ||
						input.UserInputType === Enum.UserInputType.Touch)
				) {
					startpos = this.gui.AbsolutePosition.X;
					moveMouse(input);
					eh.subscribe(Players.LocalPlayer.GetMouse().Move, () => moveMouse(input));
				}
			});
		};

		this.gui.Knob.SelectionGroup = true;
		this.gui.Knob.SelectionBehaviorLeft = Enum.SelectionBehavior.Stop;
		this.gui.Knob.SelectionBehaviorRight = Enum.SelectionBehavior.Stop;

		const moveGamepad = (posx: boolean) => {
			const x = this.value.get() + (posx ? this.step : -this.step);
			this.value.set(math.clamp(x, this.min, this.max));
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

		if (Control.exists(this.gui, "Filled")) sub(this.gui.Filled.InputBegan);
		sub(this.gui.Knob.InputBegan);
		sub(this.gui.InputBegan);
	}

	setMin(value: number): void {
		this.min = value;
		this.updateVisuals();
	}
	setMax(value: number): void {
		this.max = value;
		this.updateVisuals();
	}
	setStep(value: number): void {
		this.step = value;
		this.updateVisuals();
	}

	public getValue() {
		return this.value;
	}

	private doStep(value: number) {
		return value - (value % (this.step / (this.max - this.min)));
	}
	private steppedValue() {
		return this.doStep(this.visibleValue.get() + this.step / (this.max - this.min) / 2);
	}

	private updateVisuals() {
		const value = this.steppedValue();

		const guivalue = value - (value % (this.step / (this.max - this.min)));
		GuiAnimator.tween(
			this.gui.Knob,
			{ Position: new UDim2(guivalue, 0, 0.5, 0) },
			new TweenInfo(0.1, Enum.EasingStyle.Quad, Enum.EasingDirection.Out),
		);

		if (Control.exists(this.gui, "Filled"))
			GuiAnimator.tween(
				this.gui.Filled as GuiObject,
				{ Size: new UDim2(guivalue, 0, 1, 0) },
				new TweenInfo(0.1, Enum.EasingStyle.Quad, Enum.EasingDirection.Out),
			);

		if (Control.exists(this.gui, "Text")) {
			let text = value * (this.max - this.min) + this.min;
			text -= text % this.step;
			this.gui.Text.Text = math.floor(text * 10) / 10 + "";
		}
	}
}
