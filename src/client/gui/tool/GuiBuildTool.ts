import BuildToolAPI from "client/tools/BuildToolAPI";
import GuiAbstractTool from "./GuiAbstractTool";
import ToolsGui from "./ToolsGui";
import GuiAnimations from "../GuiAnimations";
import AliveEventsHandler from "client/AliveEventsHandler";
import GameControls from "client/GameControls";

export default class GuiBuildTool extends GuiAbstractTool {
	private toolAPI: BuildToolAPI;

	constructor(gameUI: MyGui, toolsInterface: ToolsGui) {
		super(gameUI, toolsInterface);

		this.toolAPI = new BuildToolAPI(gameUI);

		// Register touchscreen controls
		AliveEventsHandler.registerAliveEvent(this.gameUI.BuildingGuiMobile.PlaceButton.MouseButton1Click, () =>
			this.toolAPI.placeBlock(),
		);
		AliveEventsHandler.registerAliveEvent(this.gameUI.BuildingGuiMobile.RotateRButton.MouseButton1Click, () =>
			this.toolAPI.rotate(true, "r"),
		);
		AliveEventsHandler.registerAliveEvent(this.gameUI.BuildingGuiMobile.RotateTButton.MouseButton1Click, () =>
			this.toolAPI.rotate(true, "t"),
		);
		AliveEventsHandler.registerAliveEvent(this.gameUI.BuildingGuiMobile.RotateYButton.MouseButton1Click, () =>
			this.toolAPI.rotate(true, "y"),
		);
	}

	public getDisplayName(): string {
		return "Building Mode";
	}

	public getShortDescription(): string {
		return "Puts blocks in the world";
	}

	public getKeybind(): Enum.KeyCode {
		// Gamepad controls implementated in GuiAbstractTool
		return Enum.KeyCode.One;
	}

	public getButton(): Frame & MyToolsGuiButton {
		return this.gameUI.Tools.Buttons.Build;
	}

	public onPlatformChanged(): void {
		if (!this.toolAPI.isEquipped()) {
			return;
		}

		// Show building mobile controls
		if (GameControls.getPlatform() === "Mobile") {
			this.gameUI.BuildingGuiMobile.Visible = true;
			GuiAnimations.fade(this.gameUI.BuildingGuiMobile, 0.1, "right", true);
		} else {
			this.gameUI.BuildingGuiMobile.Visible = false;
		}

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
		this.gameUI.BuildingGuiMobile.Visible = false;
		this.toolAPI.unequip();
	}

	public onInput(input: InputObject): void {
		// Place with gamepad button X
		if (input.KeyCode === Enum.KeyCode.ButtonX) {
			this.toolAPI.placeBlock();
		}
	}
}
