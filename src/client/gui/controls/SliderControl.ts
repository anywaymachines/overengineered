import { UserInputService } from "@rbxts/services";
import { Players } from "@rbxts/services";
import EventHandler from "shared/EventHandler";
import GuiAnimator from "../GuiAnimator";
import Control from "client/base/Control";

export type SliderControlDefinition = GuiObject & {
	Filled: GuiObject;
	Knob: GuiObject;
	Text: TextLabel;
};

export default class SliderControl extends Control<SliderControlDefinition> {
	private value = 0;
	private min = 0;
	private max = 10;
	private step = 1;

	constructor(template: SliderControlDefinition) {
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

		const update = () => {
			if (startpos === undefined) return;

			const x = Players.LocalPlayer.GetMouse().X;
			this.value = math.clamp((x - startpos) / this.gui.AbsoluteSize.X, 0, 1);
			this.updateVisuals();
		};

		const sub = (signal: RBXScriptSignal<(input: InputObject) => void>) => {
			this.eventHandler.subscribe(signal, (input) => {
				if (
					input.UserInputState === Enum.UserInputState.Begin &&
					input.UserInputType === Enum.UserInputType.MouseButton1
				) {
					startpos = this.gui.Text.AbsolutePosition.X;
					update();

					eh.subscribe(Players.LocalPlayer.GetMouse().Move, update);
				}
			});
		};

		sub(this.gui.Filled.InputBegan);
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
		const value = this.value + this.step / (this.max - this.min) / 2;

		const guivalue = value - (value % (this.step / (this.max - this.min)));
		GuiAnimator.tween(
			this.gui.Knob,
			{ Position: new UDim2(guivalue, 0, 0.5, 0) },
			new TweenInfo(0.1, Enum.EasingStyle.Quad, Enum.EasingDirection.Out),
		);

		GuiAnimator.tween(
			this.gui.Filled,
			{ Size: new UDim2(guivalue, 0, 1, 0) },
			new TweenInfo(0.1, Enum.EasingStyle.Quad, Enum.EasingDirection.Out),
		);

		let text = value * (this.max - this.min) + this.min;
		text -= text % this.step;
		this.gui.Text.Text = math.floor(text * 10) / 10 + "";
	}
}
