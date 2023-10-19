import { GuiService, Players, ReplicatedStorage, UserInputService, Workspace } from "@rbxts/services";
import Logger from "shared/Logger";
import Remotes from "shared/network/Remotes";
import PlayerUtils from "shared/utils/PlayerUtils";
import PartUtils from "shared/utils/PartUtils";
import VectorUtils from "shared/utils/VectorUtils";
import Block from "shared/registry/Block";
import BlockRegistry from "shared/registry/BlocksRegistry";
import BuildingManager from "shared/building/BuildingManager";

const LocalPlayer: Player = Players.LocalPlayer;
//const PlayerGui: PlayerGui = LocalPlayer.WaitForChild("PlayerGui") as PlayerGui;
const Mouse: Mouse = LocalPlayer.GetMouse();

/** A class for **client-side** construction management from blocks */
export default class ClientBuildingController {
	private static lastPlaceable: Block | undefined;
	private static renderingObject: Model | undefined;
	private static renderingObjectRotation: CFrame = new CFrame();

	private static mouseMoveCallback: RBXScriptConnection | undefined;
	private static mouseClickCallback: RBXScriptConnection | undefined;
	private static buttonClickCallback: RBXScriptConnection | undefined;

	private static placeAllowedColor: Color3 = Color3.fromRGB(194, 217, 255);
	private static placeNotAllowedColor: Color3 = Color3.fromRGB(255, 189, 189);

	private static defaultBlock = BlockRegistry.TEST_BLOCK;

	/** Checking to see if **client** is currently building anything */
	static isBuilding() {
		return this.renderingObject !== undefined && PlayerUtils.isAlive(LocalPlayer);
	}

	/** **Visually** enables building mode from blocks, use ```ClientBuildingController.selectBlock(block: Block)``` to select a block. */
	static startBuilding() {
		// Selecting a block
		if (this.lastPlaceable === undefined) {
			this.lastPlaceable = this.defaultBlock;
		}

		// Spawning a new block
		this.renderingObject = this.lastPlaceable.getModel().Clone();
		this.renderingObject.Parent = Workspace;

		// Axes
		const axes = ReplicatedStorage.Assets.Axes.Clone();
		axes.PivotTo(this.renderingObject.GetPivot());
		axes.Parent = this.renderingObject;

		// Highlight
		const blockHighlight = new Instance("Highlight");
		blockHighlight.Name = "BlockHighlight";
		blockHighlight.Parent = this.renderingObject;
		blockHighlight.FillTransparency = 0.4;
		blockHighlight.OutlineTransparency = 0.5;
		blockHighlight.Adornee = this.renderingObject;

		// Display better
		PartUtils.ghostModel(this.renderingObject);

		// Events
		this.mouseMoveCallback = Mouse.Move.Connect(() => this.updatePosition());
		this.mouseClickCallback = Mouse.Button1Down.Connect(async () => await this.placeBlock());
		this.buttonClickCallback = UserInputService.InputBegan.Connect((input) => this.onUserInput(input));

		Logger.info("Building started with " + this.renderingObject.Name);
	}

	static onUserInput(input: InputObject) {
		if (input.UserInputType === Enum.UserInputType.Keyboard) {
			// Keyboard rotation
			if (input.KeyCode === Enum.KeyCode.R) {
				this.renderingObjectRotation = CFrame.fromEulerAnglesXYZ(0, math.pi / 2, 0).mul(
					this.renderingObjectRotation,
				);
				this.updatePosition();
			} else if (input.KeyCode === Enum.KeyCode.T) {
				this.renderingObjectRotation = CFrame.fromEulerAnglesXYZ(math.pi / 2, 0, 0).mul(
					this.renderingObjectRotation,
				);
				this.updatePosition();
			} else if (input.KeyCode === Enum.KeyCode.Y) {
				this.renderingObjectRotation = CFrame.fromEulerAnglesXYZ(0, 0, math.pi / 2).mul(
					this.renderingObjectRotation,
				);
				this.updatePosition();
			}
		} else if (input.UserInputType === Enum.UserInputType.Gamepad1) {
			// TODO: Gamepad rotation
		}
		// TODO: Touch rotation
	}

	// TODO: Use it in block selection menu
	static selectBlock(block: Block) {
		this.stopBuilding();
		this.lastPlaceable = block;
		this.startBuilding();
	}

	/** Place block request without arguments */
	static async placeBlock() {
		if (this.lastPlaceable === undefined) {
			error("Block is not selected");
		}

		if (this.renderingObject === undefined) {
			error("No render object to update");
		}

		// If game developer made a mistake
		if (this.renderingObject.PrimaryPart === undefined) {
			error("PrimaryPart is undefined");
		}

		const response = await Remotes.Client.GetNamespace("Building").Get("PlayerPlaceBlock").CallServerAsync({
			block: this.lastPlaceable.id,
			location: this.renderingObject.PrimaryPart.CFrame,
		});

		if (response.success) {
			task.wait();
			this.updatePosition();
			// TODO: Play sound of success message
		} else {
			Logger.info("Block placement failed: " + response.message);
			// TODO: Play sound of failure message
		}
	}

	/** Stops block construction */
	static stopBuilding() {
		if (!this.isBuilding()) {
			return;
		}

		this.renderingObject?.Destroy();
		this.mouseMoveCallback?.Disconnect();
		this.mouseClickCallback?.Disconnect();
		this.buttonClickCallback?.Disconnect();
	}

	/** **System** function that updates the location of the visual preview at the block */
	private static updatePosition() {
		// If there is no render object, then assert error
		if (this.renderingObject === undefined) {
			Logger.info("No render object to update");
			this.stopBuilding();
			return;
		}

		// If game developer made a mistake (common problem)
		if (this.renderingObject.PrimaryPart === undefined) {
			Logger.info("PrimaryPart is undefined");
			this.stopBuilding();
			return;
		}

		// If ESC menu is open - freeze movement
		if (GuiService.MenuIsOpen) {
			return;
		}

		const mouseTarget: BasePart | undefined = Mouse.Target;

		// If the mouse isn't over anything, stop rendering
		if (mouseTarget === undefined) {
			return;
		}

		const mouseHit = Mouse.Hit;
		const mouseSurface = Mouse.TargetSurface;

		// Positioning Stage 1
		const rotationRelative = mouseTarget.CFrame.sub(mouseTarget.Position).Inverse();
		const normalPositioning = VectorUtils.normalIdToNormalVector(mouseSurface, mouseTarget);
		const positioning = mouseTarget.CFrame.mul(
			new CFrame(normalPositioning.vector.mul(normalPositioning.size / 2)),
		);
		this.renderingObject.PivotTo(positioning.mul(rotationRelative).mul(this.renderingObjectRotation));

		// Positioning Stage 2
		const convertedPosition = mouseTarget.CFrame.sub(mouseTarget.Position).PointToWorldSpace(
			normalPositioning.vector,
		);

		const RightVectorValue = math.abs(this.renderingObject.PrimaryPart.CFrame.RightVector.Dot(convertedPosition));
		const UpVectorValue = math.abs(this.renderingObject.PrimaryPart.CFrame.UpVector.Dot(convertedPosition));
		const LookVectorValue = math.abs(this.renderingObject.PrimaryPart.CFrame.LookVector.Dot(convertedPosition));

		this.renderingObject.PivotTo(
			positioning.mul(rotationRelative.Inverse()).mul(this.renderingObjectRotation.Inverse()),
		);

		// Positioning Stage 3
		const mouseHitObjectSpace = mouseTarget.CFrame.PointToObjectSpace(mouseHit.Position);
		const moveRangeStuds = 1; // TODO: Make this configurable (probably)
		const offset = VectorUtils.roundVectorToBase(
			mouseHitObjectSpace.sub(
				new Vector3(
					math.abs(normalPositioning.vector.X),
					math.abs(normalPositioning.vector.Y),
					math.abs(normalPositioning.vector.Z),
				).mul(mouseHitObjectSpace),
			),
			moveRangeStuds,
		);

		this.renderingObject.PivotTo(
			positioning
				.mul(
					new CFrame(
						normalPositioning.vector.mul(
							RightVectorValue * (this.renderingObject.PrimaryPart.Size.X / 2) +
								UpVectorValue * (this.renderingObject.PrimaryPart.Size.Y / 2) +
								LookVectorValue * (this.renderingObject.PrimaryPart.Size.Z / 2),
						),
					),
				)
				.mul(new CFrame(offset))
				.mul(rotationRelative)
				.mul(this.renderingObjectRotation),
		);

		// Rounding vectors
		this.renderingObject.PivotTo(
			new CFrame(VectorUtils.roundVectorToNearestHalf(this.renderingObject.GetPivot().Position)).mul(
				this.renderingObject.GetPivot().Rotation,
			),
		);

		// Colorizing
		const highlight = this.renderingObject.FindFirstChildOfClass("Highlight") as Highlight;

		if (BuildingManager.vectorAbleToPlayer(this.renderingObject.PrimaryPart.Position, LocalPlayer)) {
			highlight.FillColor = this.placeAllowedColor;
		} else {
			highlight.FillColor = this.placeNotAllowedColor;
		}
	}
}
