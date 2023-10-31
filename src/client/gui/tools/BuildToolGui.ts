import BuildToolAPI from "client/tools/BuildToolAPI";
import AbstractToolGui from "../abstract/AbstractToolGui";
import ToolsGui from "../ToolsGui";
import GuiAnimations from "../GuiAnimations";
import GameControls from "client/GameControls";

export default class BuildToolGui extends AbstractToolGui {
	private toolAPI: BuildToolAPI;

	constructor(gameUI: MyGui, toolsInterface: ToolsGui) {
		super(gameUI, toolsInterface);

		this.toolAPI = new BuildToolAPI(gameUI);
	}

	public getDisplayName(): string {
		return "Building Mode";
	}

	public getShortDescription(): string {
		return "Put blocks in the world";
	}

	public getGamepadTooltips() {
		return {
			ButtonX: "Place",
			ButtonB: "Unequip",
		};
	}

	public getKeybind(): Enum.KeyCode {
		return Enum.KeyCode.One;
	}

	public getButton(): Frame & MyToolsGuiButton {
		return this.gameUI.Tools.Build;
	}

	public onPlatformChanged(): void {
		if (!this.toolAPI.isEquipped()) {
			return;
		}

		// Show building mobile controls
		if (GameControls.getPlatform() === "Mobile") {
			this.gameUI.BuildToolMobile.Visible = true;
			GuiAnimations.fade(this.gameUI.BuildToolMobile, 0.1, "right");
		} else {
			this.gameUI.BuildToolMobile.Visible = false;
		}

		// Call platform change on tool API
		this.toolAPI.onPlatformChanged();
	}

	public onEquip(): void {
		super.onEquip();

		this.toolAPI.equip();
		this.onPlatformChanged();
	}

	public onUnequip(): void {
		super.onUnequip();

		// Hide mobile controls
		this.gameUI.BuildToolMobile.Visible = false;
		this.toolAPI.unequip();
	}
}
