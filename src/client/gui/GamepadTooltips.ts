import ClientSignals from "client/ClientSignals";
import GuiAnimations from "./GuiAnimations";
import AliveEventsHandler from "client/event/AliveEventsHandler";
import AbstractToolMeta from "./abstract/AbstractToolMeta";
import GameControls from "client/GameControls";
import { UserInputService } from "@rbxts/services";

export default class GamepadTooltips {
	private gameUI: MyGui;

	private textTooltips: Frame[] = [];
	private imageTooltips: Map<Enum.KeyCode, ImageLabel> = new Map<Enum.KeyCode, ImageLabel>();

	private textTemplate: Frame & GamepadTextTooltipFrame;

	private readonly tooltipColor = Color3.fromRGB(207, 207, 207);

	constructor(gameUI: MyGui) {
		this.gameUI = gameUI;

		this.textTemplate = gameUI.GamepadTextTooltips.Template.Clone();
		gameUI.GamepadTextTooltips.Template.Destroy();

		AliveEventsHandler.registerAliveEvent(ClientSignals.TOOL_EQUIPED, (tool: AbstractToolMeta) => {
			this.manageTooltips(tool.getGamepadTooltips());
		});

		AliveEventsHandler.registerAliveEvent(ClientSignals.TOOL_UNEQUIPED, (tool: AbstractToolMeta) => {
			this.manageTooltips(undefined);
		});

		// Init image tooltips
		this.imageTooltips.set(Enum.KeyCode.ButtonR1, this.gameUI.Tools.GamepadNext);
		this.imageTooltips.set(Enum.KeyCode.ButtonL1, this.gameUI.Tools.GamepadBack);
		this.imageTooltips.forEach((value, key) => {
			value.Image = UserInputService.GetImageForKeyCode(key);
			value.ImageColor3 = this.tooltipColor;
		});
	}

	public showImages() {
		this.imageTooltips.forEach((gui) => {
			if (!gui.IsA("GuiObject")) {
				return;
			}
			GuiAnimations.fade(gui, 0.1, "up");
			GuiAnimations.tweenTransparency(gui, 0, 0.1);
		});
	}

	public hideImages() {
		this.imageTooltips.forEach((gui) => {
			if (!gui.IsA("GuiObject")) {
				return;
			}
			GuiAnimations.tweenTransparency(gui, 1, 0.1);
		});
	}

	public onPlatformChanged() {
		if (GameControls.getActualPlatform() === "Console") {
			this.showImages();
		} else {
			this.hideImages();
		}

		this.updateTextTooltips();
	}

	public updateTextTooltips() {
		const platform = GameControls.getActualPlatform();
		this.textTooltips.forEach((value) => {
			const tooltip = value as Frame & GamepadTextTooltipFrame;
			if (platform === "Console") {
				GuiAnimations.fade(this.gameUI.GamepadTextTooltips, 0.1, "up");

				GuiAnimations.tweenTransparency(tooltip.TextLabel, 0, 0.1);
				GuiAnimations.tweenTransparency(tooltip.ImageLabel, 0, 0.1);
			} else {
				GuiAnimations.tweenTransparency(tooltip.TextLabel, 1, 0.1);
				GuiAnimations.tweenTransparency(tooltip.ImageLabel, 1, 0.1);
			}
		});
	}

	public manageTooltips(tooltips?: Map<Enum.KeyCode, string>) {
		this.terminateTooltips();

		// No tooltips -> terminate
		if (!tooltips) {
			return;
		}

		tooltips.forEach((value, key) => {
			this.createTooltipRow(key, value);
		});
	}

	private terminateTooltips() {
		this.textTooltips.forEach((element) => {
			element.Destroy();
		});

		this.textTooltips.clear();
	}

	private createTooltipRow(button: Enum.KeyCode, tooltip: string) {
		const obj = this.textTemplate.Clone();
		obj.ImageLabel.Image = UserInputService.GetImageForKeyCode(button);
		obj.ImageLabel.ImageColor3 = this.tooltipColor;
		obj.TextLabel.Text = tooltip;
		obj.Parent = this.gameUI.GamepadTextTooltips;

		obj.TextLabel.TextTransparency = 1;
		obj.ImageLabel.ImageTransparency = 1;

		this.textTooltips.push(obj);
		this.updateTextTooltips();
	}
}
