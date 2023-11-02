import ClientSignals from "client/ClientSignals";
import AliveEventsHandler from "client/event/AliveEventsHandler";
import AbstractToolMeta from "./abstract/AbstractToolMeta";
import { UserInputService } from "@rbxts/services";
import GameControls from "client/GameControls";
import GuiAnimations from "./GuiAnimations";

export default class ControlTooltips {
	private gameUI: MyGui;

	// Cache
	private gamepadTooltipsCache: Map<Enum.KeyCode, string> = new Map<Enum.KeyCode, string>();
	private keyboardTooltipsCache: Map<string, string> = new Map<string, string>();

	// Templates
	private gamepadTooltipTemplate: Frame & GamepadTooltipFrame;
	private keyboardTooltipTemplate: Frame & KeyboardTooltipFrame;

	// Visible tooltips
	private gamepadSimpleTooltips: Map<Enum.KeyCode, ImageLabel> = new Map<Enum.KeyCode, ImageLabel>();
	private gamepadTooltips: Frame[] = [];
	private keyboardTooltips: Frame[] = [];

	private readonly tooltipColor = Color3.fromRGB(205, 217, 221);

	constructor(gameUI: MyGui) {
		this.gameUI = gameUI;

		// Prepare templates
		this.gamepadTooltipTemplate = gameUI.ControlTooltips.GamepadTemplate.Clone();
		this.keyboardTooltipTemplate = gameUI.ControlTooltips.KeyboardTemplate.Clone();
		gameUI.ControlTooltips.GamepadTemplate.Destroy();
		gameUI.ControlTooltips.KeyboardTemplate.Destroy();

		// Prepare events
		AliveEventsHandler.registerAliveEvent(ClientSignals.TOOL_EQUIPED, (tool: AbstractToolMeta) => {
			this.gamepadTooltipsCache = tool.getGamepadTooltips();
			this.keyboardTooltipsCache = tool.getKeyboardTooltips();

			this.updateTooltips(GameControls.getActualPlatform());
		});

		AliveEventsHandler.registerAliveEvent(ClientSignals.TOOL_UNEQUIPED, (_) => {
			this.gamepadTooltipsCache.clear();
			this.keyboardTooltipsCache.clear();

			this.updateTooltips(GameControls.getActualPlatform());
		});

		// Prepare simple gamepad tooltips
		this.gamepadSimpleTooltips.set(Enum.KeyCode.ButtonR1, this.gameUI.Tools.GamepadNext);
		this.gamepadSimpleTooltips.set(Enum.KeyCode.ButtonL1, this.gameUI.Tools.GamepadBack);
		this.gamepadSimpleTooltips.forEach((value, key) => {
			value.Image = UserInputService.GetImageForKeyCode(key);
			value.ImageColor3 = this.tooltipColor;
		});
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
			this.gamepadTooltipsCache.forEach((value, key) => {
				const image = UserInputService.GetImageForKeyCode(key);

				const obj = this.gamepadTooltipTemplate.Clone();
				obj.ImageLabel.Image = image;
				obj.ImageLabel.ImageColor3 = this.tooltipColor;
				obj.TextLabel.Text = value;
				obj.Parent = this.gameUI.ControlTooltips;

				this.gamepadTooltips.push(obj);
			});
		} else if (platform === "Desktop") {
			this.keyboardTooltipsCache.forEach((value, key) => {
				const obj = this.keyboardTooltipTemplate.Clone();
				obj.ImageLabel.KeyLabel.Text = key;
				obj.TextLabel.Text = value;
				obj.Parent = this.gameUI.ControlTooltips;

				this.keyboardTooltips.push(obj);
			});
		}

		GuiAnimations.fade(this.gameUI.ControlTooltips, 0.1, "up");
	}

	public onPlatformChanged(platform: string) {
		this.updateTooltips(platform);
	}
}
