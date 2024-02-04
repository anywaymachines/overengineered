import Component from "client/component/Component";
import Control from "client/gui/Control";
import Gui from "client/gui/Gui";
import GuiAnimator from "client/gui/GuiAnimator";

export type PopupControllerDefinition = ScreenGui & {
	readonly Background: Frame;
	// readonly ConfirmGui: ConfirmPopupDefinition;
	// readonly MaterialGui: MaterialChooserControlDefinition;
	// readonly SettingsGui: SettingsDefinition;
};

export default class PopupController extends Component<PopupControllerDefinition> {
	static readonly instance = new PopupController(Gui.getPopupUI<PopupControllerDefinition>());

	constructor(gui: PopupControllerDefinition) {
		super(gui);
		this.disable();
	}

	private showAnimated(gui: Control) {
		this.enable();

		this.instance.Background.BackgroundTransparency = 1;
		GuiAnimator.tween(
			this.instance.Background,
			{ BackgroundTransparency: 0.5 },
			new TweenInfo(0.3, Enum.EasingStyle.Quad, Enum.EasingDirection.Out),
		);

		GuiAnimator.transition(gui.getGui(), 0.2, "up");
	}
	private hideAnimated(gui: Control) {
		this.instance.Background.BackgroundTransparency = 0.5;
		GuiAnimator.tween(
			this.instance.Background,
			{ BackgroundTransparency: 1 },
			new TweenInfo(0.1, Enum.EasingStyle.Quad, Enum.EasingDirection.In),
		);

		GuiAnimator.transition(gui.getGui(), 0.2, "up");
		delay(0.1, () => this.disable());
	}

	enable() {
		super.enable();
		this.instance.Enabled = true;
	}
	disable() {
		super.disable();
		this.instance.Enabled = false;
	}
}
