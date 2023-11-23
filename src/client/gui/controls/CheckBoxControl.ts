import Control from "client/base/Control";
import GuiAnimator from "../GuiAnimator";

export type CheckBoxControlDefinition = TextButton & {
	Circle: TextButton;
};

export default class CheckBoxControl extends Control<CheckBoxControlDefinition> {
	private checked = false;
	private locked = false;

	private readonly color = Color3.fromRGB(48, 62, 87);
	private readonly activeColor = Color3.fromRGB(13, 150, 255);
	private readonly activationColor = 0.15;

	constructor(gui: CheckBoxControlDefinition) {
		super(gui);

		this.updateVisuals();

		this.event.subscribe(gui.MouseButton1Click, () => this.onClick());
		this.event.subscribe(gui.Circle.MouseButton1Click, () => this.onClick());
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
		this.checked = !this.checked;
		this.updateVisuals();
	}

	public getValue() {
		return this.checked;
	}

	private updateVisuals() {
		if (this.checked) {
			GuiAnimator.tweenPosition(this.gui.Circle, new UDim2(0.5, 0, 0, 0), 0.2);
			GuiAnimator.tweenColor(this.gui, this.activeColor, this.activationColor);
			this.tempLock(this.activationColor);
		} else {
			GuiAnimator.tweenPosition(this.gui.Circle, new UDim2(0, 0, 0, 0), 0.2);
			GuiAnimator.tweenColor(this.gui, this.color, this.activationColor);
			this.tempLock(this.activationColor);
		}
	}
}
