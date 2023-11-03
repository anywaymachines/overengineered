import ClientSignals from "client/ClientSignals";
import AbstractToolMeta from "./abstract/AbstractToolMeta";
import { Players, UserInputService } from "@rbxts/services";
import GameInput from "client/GameControls";
import GuiAnimations from "./GuiAnimations";
import AbstractGUI from "./abstract/AbstractGUI";

export default class ControlTooltips extends AbstractGUI {
	// Cache
	private gamepadTooltipsCache: { image: string; text: string }[] = [];
	private keyboardTooltipsCache: { key: string; text: string }[] = [];

	// Templates
	private gamepadTooltipTemplate: Frame & GamepadTooltipFrame;
	private keyboardTooltipTemplate: Frame & KeyboardTooltipFrame;

	// Visible tooltips
	private gamepadSimpleTooltips: Map<Enum.KeyCode, ImageLabel> = new Map<Enum.KeyCode, ImageLabel>();
	private gamepadTooltips: Frame[] = [];
	private keyboardTooltips: Frame[] = [];

	private readonly tooltipColor = Color3.fromRGB(205, 217, 221);

	constructor(gameUI: GameUI) {
		super(gameUI);

		// Prepare templates
		this.gamepadTooltipTemplate = gameUI.ControlTooltips.GamepadTemplate.Clone();
		this.keyboardTooltipTemplate = gameUI.ControlTooltips.KeyboardTemplate.Clone();
		gameUI.ControlTooltips.GamepadTemplate.Destroy();
		gameUI.ControlTooltips.KeyboardTemplate.Destroy();

		// Prepare events
		this.eventHandler.registerEvent(ClientSignals.TOOL_EQUIPED, (tool: AbstractToolMeta) => {
			this.gamepadTooltipsCache = tool.getGamepadTooltips();
			this.keyboardTooltipsCache = tool.getKeyboardTooltips();

			this.updateTooltips(GameInput.currentPlatform);
		});

		this.eventHandler.registerEvent(ClientSignals.TOOL_UNEQUIPED, (_) => {
			this.gamepadTooltipsCache.clear();
			this.keyboardTooltipsCache.clear();

			this.updateTooltips(GameInput.currentPlatform);
		});

		// Prepare simple gamepad tooltips
		this.gamepadSimpleTooltips.set(Enum.KeyCode.ButtonR1, this.gameUI.Tools.GamepadNext);
		this.gamepadSimpleTooltips.set(Enum.KeyCode.ButtonL1, this.gameUI.Tools.GamepadBack);
		this.gamepadSimpleTooltips.forEach((value, key) => {
			value.Image = UserInputService.GetImageForKeyCode(key);
			value.ImageColor3 = this.tooltipColor;
		});

		// GUI Terminate when unused
		Players.LocalPlayer.CharacterRemoving.Once((_) => this.terminate());

		// Update first time
		this.updateTooltips(GameInput.currentPlatform);
	}

	public updateTooltips(platform: string) {
		// Delete all tooltips
		this.gamepadTooltips.forEach((element) => element.Destroy());
		this.keyboardTooltips.forEach((element) => element.Destroy());
		this.gamepadSimpleTooltips.forEach((element) => {
			GuiAnimations.tweenTransparency(element, 1, 0.1);
		});

		// Touch tooltips doesn't exist
		if (platform === "Touch") {
			return;
		}

		if (platform === "Console") {
			this.gamepadSimpleTooltips.forEach((element) => {
				GuiAnimations.tweenTransparency(element, 0, 0.1);
			});
			this.gamepadTooltipsCache.forEach((tooltip) => {
				const obj = this.gamepadTooltipTemplate.Clone();
				obj.ImageLabel.Image = tooltip.image;
				obj.ImageLabel.ImageColor3 = this.tooltipColor;
				obj.TextLabel.Text = tooltip.text;
				obj.Parent = this.gameUI.ControlTooltips;

				this.gamepadTooltips.push(obj);
			});
		} else if (platform === "Desktop") {
			this.keyboardTooltipsCache.forEach((tooltip) => {
				const obj = this.keyboardTooltipTemplate.Clone();
				obj.ImageLabel.KeyLabel.Text = tooltip.key;
				obj.TextLabel.Text = tooltip.text;
				obj.Parent = this.gameUI.ControlTooltips;

				this.keyboardTooltips.push(obj);
			});
		}

		GuiAnimations.fade(this.gameUI.ControlTooltips, 0.1, "up");
	}

	public onPlatformChanged(platform: string) {
		this.updateTooltips(platform);
	}

	public displayDefaultGUI(isVisible: boolean): void {
		this.gameUI.ControlTooltips.Visible = isVisible;
	}
	public onInput(input: InputObject): void {
		return;
	}
}
