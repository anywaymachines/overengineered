import { UserInputService } from "@rbxts/services";
import { Players } from "@rbxts/services";
import EventHandler from "client/event/EventHandler";
import GuiAnimator from "../GuiAnimator";

type SliderWidgetType = Frame & {
	TextButton: TextButton & {
		TextButton: TextButton;
	};
	TextBox: TextBox;
	TextLabel: TextLabel;
};

export default class SliderWidget {
	private readonly eventHandler = new EventHandler();
	private readonly widget: SliderWidgetType;
	private value = 0;
	private min = 0;
	private max = 10;
	private step = 1;

	constructor(widget: SliderWidgetType) {
		this.widget = widget;
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
			this.value = math.clamp((x - startpos) / widget.TextButton.AbsoluteSize.X, 0, 1);
			this.updateVisuals();
		};

		const sub = (event: RBXScriptSignal<(x: number, y: number) => void>) => {
			this.eventHandler.subscribe(event, (x, y) => {
				startpos = widget.TextButton.AbsolutePosition.X;
				update();

				eh.subscribe(Players.LocalPlayer.GetMouse().Move, update);
			});
		};

		sub(widget.TextButton.MouseButton1Down);
		sub(widget.TextButton.TextButton.MouseButton1Down);
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

		GuiAnimator.tween(
			this.widget.TextButton.TextButton,
			{ Position: new UDim2(value - (value % (this.step / (this.max - this.min))), 0, 0.5, 0) },
			new TweenInfo(0.1, Enum.EasingStyle.Quad, Enum.EasingDirection.Out),
		);

		let text = value * (this.max - this.min) + this.min;
		text -= text % this.step;
		this.widget.TextBox.Text = math.floor(text * 10) / 10 + "";
	}
}
