import BuildToolAPI from "client/tools/BuildToolAPI";
import GuiAbstractTool from "./GuiAbstractTool";
import ToolsInterface from "./ToolsInterface";
import ControlUtils from "client/utils/ControlUtils";
import GuiAnimations from "../GuiAnimations";

export default class GuiBuildTool extends GuiAbstractTool {
	private toolAPI: BuildToolAPI;

	// Events
	private mobilePlaceButtonEvent: RBXScriptConnection | undefined;
	private mobileRotateRButtonEvent: RBXScriptConnection | undefined;
	private mobileRotateTButtonEvent: RBXScriptConnection | undefined;
	private mobileRotateYButtonEvent: RBXScriptConnection | undefined;

	constructor(gameUI: GameUI, toolsInterface: ToolsInterface) {
		super(gameUI, toolsInterface);

		this.toolAPI = new BuildToolAPI(gameUI);

		// Init mobile controls
		this.mobilePlaceButtonEvent = this.gameUI.BuildingGuiMobile.PlaceButton.MouseButton1Click.Connect(() => {
			this.toolAPI.placeBlock();
		});
		this.mobileRotateRButtonEvent = this.gameUI.BuildingGuiMobile.RotateRButton.MouseButton1Click.Connect(() => {
			this.toolAPI.rotate(true, "r");
		});
		this.mobileRotateTButtonEvent = this.gameUI.BuildingGuiMobile.RotateTButton.MouseButton1Click.Connect(() => {
			this.toolAPI.rotate(true, "t");
		});
		this.mobileRotateYButtonEvent = this.gameUI.BuildingGuiMobile.RotateYButton.MouseButton1Click.Connect(() => {
			this.toolAPI.rotate(true, "y");
		});
	}

	public getDisplayName(): string {
		return "Building Mode";
	}

	public getShortDescription(): string {
		return "Puts blocks in the world";
	}

	public getEquipButton(): Enum.KeyCode {
		// Gamepad controls implementated in GuiAbstractTool
		return Enum.KeyCode.One;
	}

	public getButton(): Frame & ToolsGuiButton {
		return this.gameUI.Tools.Buttons.Build;
	}

	public onControlChanged(): void {
		// Show building mobile controls
		if (ControlUtils.isMobile()) {
			this.gameUI.BuildingGuiMobile.Visible = true;
			GuiAnimations.fade(this.gameUI.BuildingGuiMobile, 0.1, "right", true);
		}
	}

	public onEquip(): void {
		super.onEquip();

		this.toolAPI.startBuilding();
		this.onControlChanged();
	}

	public onUnequip(): void {
		super.onUnequip();

		// Hide mobile controls
		this.gameUI.BuildingGuiMobile.Visible = false;
		this.toolAPI.stopBuilding();
	}

	public terminate(): void {
		super.terminate();

		// Terminate events
		this.mobilePlaceButtonEvent?.Disconnect();
		this.mobileRotateRButtonEvent?.Disconnect();
		this.mobileRotateTButtonEvent?.Disconnect();
		this.mobileRotateYButtonEvent?.Disconnect();
	}
}
