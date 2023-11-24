import Control from "client/base/Control";
import GuiAnimator from "../GuiAnimator";
import ObservableValue from "shared/event/ObservableValue";

export type CheckBoxControlDefinition = TextButton & {
	Circle: TextButton;
};

export default class CheckBoxControl extends Control<CheckBoxControlDefinition> {
	public readonly value = new ObservableValue(false);

	private locked = false;
	private animated = false;

	private readonly color = Color3.fromRGB(48, 62, 87);
	private readonly activeColor = Color3.fromRGB(13, 150, 255);
	private readonly activationColor = 0.15;

	constructor(gui: CheckBoxControlDefinition) {
		super(gui);

		this.event.subscribe(gui.MouseButton1Click, () => this.onClick());
		this.event.subscribe(gui.Circle.MouseButton1Click, () => this.onClick());

		this.event.subscribeObservable(this.value, () => this.updateVisuals(), true);
		this.event.onPrepare(() => (this.animated = true));
	}

	public tempLock(time: number) {
		this.locked = true;
		spawn(() => {
			wait(time);
			this.locked = false;
		});
	}

	public onClick() {
		if (this.locked) return;
		this.value.set(!this.value.get());
		this.updateVisuals();
	}

	public getValue() {
		return this.value.get();
	}

	private updateVisuals() {
		if (this.value.get()) {
			GuiAnimator.tweenPosition(this.gui.Circle, new UDim2(0.5, 0, 0, 0), this.animated ? 0.2 : 0);
			GuiAnimator.tweenColor(this.gui, this.activeColor, this.animated ? this.activationColor : 0);
			this.tempLock(this.activationColor);
		} else {
			GuiAnimator.tweenPosition(this.gui.Circle, new UDim2(0, 0, 0, 0), this.animated ? 0.2 : 0);
			GuiAnimator.tweenColor(this.gui, this.color, this.animated ? this.activationColor : 0);
			this.tempLock(this.activationColor);
		}
	}
}
