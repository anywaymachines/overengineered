import EventHandler from "client/core/event/EventHandler";
import GuiUtils from "client/utils/GuiUtils";
import GuiAnimations from "../utils/GuiAnimations";
import BuildingManager from "shared/building/BuildingManager";

export default class MaterialSelectGUI {
	private static gameUI: ScreenGui & GameUI = GuiUtils.getGameUI() as ScreenGui & GameUI;
	private static gameDialog: ScreenGui & GameDialog = GuiUtils.getGameDialog() as ScreenGui & GameDialog;
	private static eventHandler: EventHandler = new EventHandler();
	private static materialButtons: (TextButton & {
		TextLabel: TextLabel;
	})[] = [];

	private static materialButtonTemplate: TextButton & {
		TextLabel: TextLabel;
	};

	static {
		this.materialButtonTemplate = this.gameDialog.MaterialSelectWindow.Answers.Template.Clone();
		this.gameDialog.MaterialSelectWindow.Answers.Template.Destroy();
	}

	static showSelectWindow(callback: Callback) {
		if (this.eventHandler.size() > 0) {
			return;
		}

		this.gameUI.Enabled = false;

		this.materialButtons.forEach((element) => {
			element.Destroy();
		});

		BuildingManager.AllowedMaterials.forEach((material) => {
			const obj = this.materialButtonTemplate.Clone();
			obj.Name = material.Name;
			obj.TextLabel.Text = material.Name;
			this.eventHandler.registerEvent(obj.MouseButton1Click, () => {
				this.gameDialog.MaterialSelectWindow.Visible = false;
				this.eventHandler.killAll();
				this.gameUI.Enabled = true;
				this.gameUI.Sounds.GuiClick.Play();
				callback(material);
			});
			obj.Parent = this.gameDialog.MaterialSelectWindow.Answers;
			this.materialButtons.push(obj);
		});

		this.eventHandler.registerOnce(this.gameDialog.MaterialSelectWindow.CloseButton.MouseButton1Click, () => {
			this.gameDialog.MaterialSelectWindow.Visible = false;
			this.eventHandler.killAll();
			this.gameUI.Enabled = true;
			this.gameUI.Sounds.GuiClick.Play();
		});

		// Display with animation
		this.gameDialog.MaterialSelectWindow.Visible = true;
		GuiAnimations.fade(this.gameDialog.MaterialSelectWindow, 0.1, "up");
	}
}
