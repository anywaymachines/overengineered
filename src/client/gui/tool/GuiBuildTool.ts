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

		// Mobile controls
		if (ControlUtils.isMobile()) {
			this.mobilePlaceButtonEvent = this.gameUI.MobileBuilding.PlaceButton.MouseButton1Click.Connect(() => {
				this.toolAPI.placeBlock();
			});
			this.mobileRotateRButtonEvent = this.gameUI.MobileBuilding.RotateRButton.MouseButton1Click.Connect(() => {
				this.toolAPI.rotate(true, "r");
			});
			this.mobileRotateTButtonEvent = this.gameUI.MobileBuilding.RotateTButton.MouseButton1Click.Connect(() => {
				this.toolAPI.rotate(true, "t");
			});
			this.mobileRotateYButtonEvent = this.gameUI.MobileBuilding.RotateYButton.MouseButton1Click.Connect(() => {
				this.toolAPI.rotate(true, "y");
			});
		}
	}

	public getDisplayName(): string {
		return "Building Mode";
	}

	public getEquipButton(): Enum.KeyCode {
		// Gamepad controls implementated in GuiAbstractTool
		return Enum.KeyCode.One;
	}

	public getButton(): Frame & ToolsGuiButton {
		return this.gameUI.Tools.Buttons.Build;
	}

	public onEquip(): void {
		super.onEquip();

		this.toolAPI.startBuilding();

		if (ControlUtils.isMobile()) {
			this.gameUI.MobileBuilding.Visible = true;
			GuiAnimations.fade(this.gameUI.MobileBuilding, 0.1, "right", true);
		}
	}

	public onUnequip(): void {
		super.onUnequip();

		this.gameUI.MobileBuilding.Visible = false;
		this.toolAPI.stopBuilding();
	}

	public terminate(): void {
		super.terminate();

		this.mobilePlaceButtonEvent?.Disconnect();
		this.mobileRotateRButtonEvent?.Disconnect();
		this.mobileRotateTButtonEvent?.Disconnect();
		this.mobileRotateYButtonEvent?.Disconnect();
	}
}
