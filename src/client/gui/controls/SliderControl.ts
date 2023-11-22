import { UserInputService } from "@rbxts/services";
import { Players } from "@rbxts/services";
import EventHandler from "shared/event/EventHandler";
import GuiAnimator from "../GuiAnimator";
import Control from "client/base/Control";
import Bindable from "shared/event/ObservableValue";

export type SliderControlDefinition = GuiObject & {
	Filled?: GuiObject;
	Text?: TextLabel;
	Knob: GuiObject;
};

export default class SliderControl<T extends SliderControlDefinition = SliderControlDefinition> extends Control<T> {
	public readonly value = new Bindable(0);
	private min = 0;
	private max = 10;
	private step = 1;

	constructor(template: T) {
		super(template);
		this.updateVisuals();

		const eh = new EventHandler();
		let startpos: number | undefined;

		this.eventHandler.subscribe(UserInputService.InputEnded, (input, _) => {
			if (input.UserInputType === Enum.UserInputType.MouseButton1) {
				startpos = undefined;
				eh.unsubscribeAll();
			}
		});

		this.value.subscribe(this.eventHandler, () => this.updateVisuals(), true);

		const update = () => {
			if (startpos === undefined) return;

			const x = Players.LocalPlayer.GetMouse().X;
			this.value.set(math.clamp((x - startpos) / this.gui.AbsoluteSize.X, 0, 1));
		};

		const sub = (signal: RBXScriptSignal<(input: InputObject) => void>) => {
			this.eventHandler.subscribe(signal, (input) => {
				if (
					input.UserInputState === Enum.UserInputState.Begin &&
					input.UserInputType === Enum.UserInputType.MouseButton1
				) {
					startpos = this.gui.AbsolutePosition.X;
					update();

					eh.subscribe(Players.LocalPlayer.GetMouse().Move, update);
				}
			});
		};

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

	private updateVisuals() {
		const value = this.value.get() + this.step / (this.max - this.min) / 2;

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
