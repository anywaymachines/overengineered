import ClientSignals from "client/ClientSignals";
import GuiAnimations from "./GuiAnimations";
import AliveEventsHandler from "client/event/AliveEventsHandler";
import AbstractToolMeta from "./abstract/AbstractToolMeta";
import GameControls from "client/GameControls";

export default class GamepadTooltips {
	private gameUI: MyGui;

	private textTooltips: Frame[] = [];
	private textTemplate: Frame & GamepadTextTooltipFrame;
	private assetIDs = {
		ButtonA: "15216507754",
		ButtonB: "15216552197",
		ButtonY: "15216504649",
		ButtonX: "15216505617",
	};

	constructor(gameUI: MyGui) {
		this.gameUI = gameUI;

		this.textTemplate = gameUI.GamepadTextTooltips.Template.Clone();
		gameUI.GamepadTextTooltips.Template.Destroy();

		AliveEventsHandler.registerAliveEvent(ClientSignals.TOOL_EQUIPED, (tool: AbstractToolMeta) => {
			this.manageTooltips(tool.getGamepadTooltips(), this.assetIDs);
		});

		AliveEventsHandler.registerAliveEvent(ClientSignals.TOOL_UNEQUIPED, (tool: AbstractToolMeta) => {
			this.manageTooltips({}, this.assetIDs);
		});
	}

	public showImages() {
		this.gameUI.GamepadImageTooltips.GetChildren().forEach((gui) => {
			if (!gui.IsA("GuiObject")) {
				return;
			}
			GuiAnimations.fade(gui, 0.1, "up");
			GuiAnimations.tweenTransparency(gui, 0, 0.1);
		});
	}

	public hideImages() {
		this.gameUI.GamepadImageTooltips.GetChildren().forEach((gui) => {
			if (!gui.IsA("GuiObject")) {
				return;
			}
			GuiAnimations.tweenTransparency(gui, 1, 0.1);
		});
	}

	public onPlatformChanged() {
		if (GameControls.getPlatform() === "Console") {
			this.showImages();
		} else {
			this.hideImages();
		}

		this.updateTextTooltips();
	}

	public updateTextTooltips() {
		const platform = GameControls.getPlatform();
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

	public manageTooltips(
		tooltip: GamepadTextTooltip,
		assetId: { ButtonA: string; ButtonB: string; ButtonY: string; ButtonX: string },
	) {
		this.terminateTooltips();

		this.createTooltipRow(tooltip, "ButtonA", assetId.ButtonA);
		this.createTooltipRow(tooltip, "ButtonB", assetId.ButtonB);
		this.createTooltipRow(tooltip, "ButtonY", assetId.ButtonY);
		this.createTooltipRow(tooltip, "ButtonX", assetId.ButtonX);
	}

	private terminateTooltips() {
		this.textTooltips.forEach((element) => {
			element.Destroy();
		});

		this.textTooltips.clear();
	}

	private createTooltipRow(tooltip: GamepadTextTooltip, button: GamepadTextTooltipKeys, assetId: string) {
		if (tooltip[button] !== undefined) {
			const obj = this.textTemplate.Clone();
			obj.ImageLabel.Image = `http://www.roblox.com/asset/?id=${assetId}`;
			obj.TextLabel.Text = tooltip[button] as string;
			obj.Parent = this.gameUI.GamepadTextTooltips;

			obj.TextLabel.TextTransparency = 1;
			obj.ImageLabel.ImageTransparency = 1;

			this.textTooltips.push(obj);
		}
		this.updateTextTooltips();
	}
}
