import Logger from "shared/Logger";
import BaseGui from "./BaseGui";
import GuiAnimations from "./GuiAnimations";
import ClientBuildingController from "client/building/ClientBuildingController";

export default class ToolsGui extends BaseGui {
	private ToolsGui: GameToolsGui;

	public equippedTool: "build" | "configure" | "delete" | "move" | "paint" | undefined;

	private buildButton: RBXScriptConnection;
	private configureButton: RBXScriptConnection;
	private deleteButton: RBXScriptConnection;
	private moveButton: RBXScriptConnection;
	private paintButton: RBXScriptConnection;

	constructor() {
		super();

		// Define tools gui
		this.ToolsGui = this.GameUI.Tools;

		// Physical click on tool
		this.buildButton = this.ToolsGui.Buttons.Build.ImageButton.MouseButton1Click.Connect(() =>
			this.equipTool("build"),
		);
		this.configureButton = this.ToolsGui.Buttons.Configure.ImageButton.MouseButton1Click.Connect(() =>
			this.equipTool("configure"),
		);
		this.deleteButton = this.ToolsGui.Buttons.Delete.ImageButton.MouseButton1Click.Connect(() =>
			this.equipTool("delete"),
		);
		this.moveButton = this.ToolsGui.Buttons.Move.ImageButton.MouseButton1Click.Connect(() =>
			this.equipTool("move"),
		);
		this.paintButton = this.ToolsGui.Buttons.Paint.ImageButton.MouseButton1Click.Connect(() =>
			this.equipTool("paint"),
		);

		this.redrawSelection();
	}

	// override
	public userInput(input: InputObject): void {
		if (input.UserInputType === Enum.UserInputType.Keyboard) {
			// PC Tool Selection
			switch (input.KeyCode) {
				case Enum.KeyCode.One:
					this.equipTool("build");
					break;

				case Enum.KeyCode.Two:
					this.equipTool("move");
					break;

				case Enum.KeyCode.Three:
					this.equipTool("delete");
					break;

				case Enum.KeyCode.Four:
					this.equipTool("paint");
					break;

				case Enum.KeyCode.Five:
					this.equipTool("configure");
					break;

				default:
					break;
			}
		}
	}

	/** Function for tool switching */
	public equipTool(tool: typeof this.equippedTool) {
		if (this.equippedTool === tool) {
			this.equipTool(undefined);
			return;
		}

		this.equippedTool = tool;
		this.redrawSelection();

		Logger.info("[ToolsGUI] Equipped tool " + tool);

		// Stop all controllers
		ClientBuildingController.stopBuilding();

		// Enable selected controller
		if (tool === "build") {
			ClientBuildingController.startBuilding();
		}
	}

	/** Function for drawing the tool selection */
	public redrawSelection() {
		const animationDuration = 0.2;

		this.equippedTool === "build"
			? GuiAnimations.tweenTransparency(this.ToolsGui.Buttons.Build, 0, animationDuration)
			: GuiAnimations.tweenTransparency(this.ToolsGui.Buttons.Build, 1, animationDuration);
		this.equippedTool === "configure"
			? GuiAnimations.tweenTransparency(this.ToolsGui.Buttons.Configure, 0, animationDuration)
			: GuiAnimations.tweenTransparency(this.ToolsGui.Buttons.Configure, 1, animationDuration);
		this.equippedTool === "delete"
			? GuiAnimations.tweenTransparency(this.ToolsGui.Buttons.Delete, 0, animationDuration)
			: GuiAnimations.tweenTransparency(this.ToolsGui.Buttons.Delete, 1, animationDuration);
		this.equippedTool === "move"
			? GuiAnimations.tweenTransparency(this.ToolsGui.Buttons.Move, 0, animationDuration)
			: GuiAnimations.tweenTransparency(this.ToolsGui.Buttons.Move, 1, animationDuration);
		this.equippedTool === "paint"
			? GuiAnimations.tweenTransparency(this.ToolsGui.Buttons.Paint, 0, animationDuration)
			: GuiAnimations.tweenTransparency(this.ToolsGui.Buttons.Paint, 1, animationDuration);
	}

	// override
	public terminate(): void {
		super.terminate();

		// Terminate custom events
		this.buildButton.Disconnect();
		this.configureButton.Disconnect();
		this.deleteButton.Disconnect();
		this.moveButton.Disconnect();
		this.paintButton.Disconnect();
	}
}
