import Logger from "shared/Logger";
import AbstractInterface from "./AbstractInterface";
import GuiAnimations from "./GuiAnimations";
import ClientBuilding from "client/building/ClientBuilding";

export default class ToolsInterface extends AbstractInterface {
	private gameUI: GameUI;

	// Variables
	public equippedTool: "build" | "configure" | "delete" | "move" | "paint" | undefined;
	public readonly toolDisplayNames = {
		build: "Building Mode",
		configure: "Configuring Mode",
		delete: "Deleting Mode",
		move: "Moving Mode",
		paint: "Painting Mode",
	};

	// Tools API
	public clientBuilding: ClientBuilding;

	// Events
	private buildButton: RBXScriptConnection;
	private configureButton: RBXScriptConnection;
	private deleteButton: RBXScriptConnection;
	private moveButton: RBXScriptConnection;
	private paintButton: RBXScriptConnection;

	constructor(gameUI: GameUI) {
		super();

		// Define tools gui
		this.gameUI = gameUI;

		// Physical click on tool
		this.buildButton = this.gameUI.Tools.Buttons.Build.ImageButton.MouseButton1Click.Connect(() =>
			this.equipTool("build"),
		);
		this.configureButton = this.gameUI.Tools.Buttons.Configure.ImageButton.MouseButton1Click.Connect(() =>
			this.equipTool("configure"),
		);
		this.deleteButton = this.gameUI.Tools.Buttons.Delete.ImageButton.MouseButton1Click.Connect(() =>
			this.equipTool("delete"),
		);
		this.moveButton = this.gameUI.Tools.Buttons.Move.ImageButton.MouseButton1Click.Connect(() =>
			this.equipTool("move"),
		);
		this.paintButton = this.gameUI.Tools.Buttons.Paint.ImageButton.MouseButton1Click.Connect(() =>
			this.equipTool("paint"),
		);

		// Tools API
		this.clientBuilding = new ClientBuilding(gameUI);

		this.redrawSelection();
	}

	// override
	public onUserInput(input: InputObject): void {
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

		this.gameUI.Sounds.GuiClick.Play();

		Logger.info("[ToolsGUI] Equipped tool " + tool);

		// Stop all controllers
		this.clientBuilding.stopBuilding();

		// Enable selected controller
		if (tool === "build") {
			this.clientBuilding.startBuilding();
		}
	}

	/** Function for drawing the tool selection */
	public redrawSelection() {
		const animationDuration = 0.2;

		this.equippedTool === "build"
			? GuiAnimations.tweenTransparency(this.gameUI.Tools.Buttons.Build, 0, animationDuration)
			: GuiAnimations.tweenTransparency(this.gameUI.Tools.Buttons.Build, 1, animationDuration);
		this.equippedTool === "configure"
			? GuiAnimations.tweenTransparency(this.gameUI.Tools.Buttons.Configure, 0, animationDuration)
			: GuiAnimations.tweenTransparency(this.gameUI.Tools.Buttons.Configure, 1, animationDuration);
		this.equippedTool === "delete"
			? GuiAnimations.tweenTransparency(this.gameUI.Tools.Buttons.Delete, 0, animationDuration)
			: GuiAnimations.tweenTransparency(this.gameUI.Tools.Buttons.Delete, 1, animationDuration);
		this.equippedTool === "move"
			? GuiAnimations.tweenTransparency(this.gameUI.Tools.Buttons.Move, 0, animationDuration)
			: GuiAnimations.tweenTransparency(this.gameUI.Tools.Buttons.Move, 1, animationDuration);
		this.equippedTool === "paint"
			? GuiAnimations.tweenTransparency(this.gameUI.Tools.Buttons.Paint, 0, animationDuration)
			: GuiAnimations.tweenTransparency(this.gameUI.Tools.Buttons.Paint, 1, animationDuration);

		// ModeLabel redraw
		if (this.equippedTool !== undefined) {
			this.gameUI.ModeLabel.Text = this.toolDisplayNames[this.equippedTool];
		} else {
			this.gameUI.ModeLabel.Text = "";
		}
		GuiAnimations.fade(this.gameUI.ModeLabel, 0.1, "down");
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
