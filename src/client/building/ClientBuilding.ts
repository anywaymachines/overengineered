import { Players, ReplicatedStorage, UserInputService, Workspace } from "@rbxts/services";
import Logger from "shared/Logger";
import Remotes from "shared/NetworkDefinitions";
import PlayerUtils from "shared/utils/PlayerUtils";
import PartUtils from "shared/utils/PartUtils";
import VectorUtils from "shared/utils/VectorUtils";
import AbstractBlock from "shared/registry/AbstractBlock";
import BlockRegistry from "shared/registry/BlocksRegistry";
import BuildingManager from "shared/building/BuildingManager";
import GameControls from "client/GameControls";

/** A class for **client-side** construction management from blocks */
export default class ClientBuilding {
	private gameUI: GameUI;

	// Player
	private LocalPlayer: Player;
	private Mouse: Mouse;

	// Variables
	private lastBlock: AbstractBlock | undefined;
	private previewBlock: Model | undefined;
	private previewBlockRotation: CFrame;

	// Events
	private MouseMoveCallback: RBXScriptConnection | undefined;
	private MouseClickCallback: RBXScriptConnection | undefined;
	private buttonClickCallback: RBXScriptConnection | undefined;

	// Const
	private readonly placeAllowedColor: Color3 = Color3.fromRGB(194, 217, 255);
	private readonly placeNotAllowedColor: Color3 = Color3.fromRGB(255, 189, 189);
	private readonly defaultBlock = BlockRegistry.TEST_BLOCK;

	constructor(gameUI: GameUI) {
		this.gameUI = gameUI;

		this.LocalPlayer = Players.LocalPlayer;
		this.Mouse = this.LocalPlayer.GetMouse();
		this.previewBlockRotation = new CFrame();
	}

	/** Checking to see if **client** is currently building anything */
	isBuilding() {
		return this.previewBlock !== undefined && PlayerUtils.isAlive(this.LocalPlayer);
	}

	/** **Visually** enables building mode from blocks, use ```ClientBuildingController.selectBlock(block: Block)``` to select a block. */
	startBuilding() {
		// Selecting a block
		if (this.lastBlock === undefined) {
			this.lastBlock = this.defaultBlock;
		}

		// Spawning a new block
		this.previewBlock = this.lastBlock.getModel().Clone();
		this.previewBlock.Parent = Workspace;

		// Axes
		const axes = ReplicatedStorage.Assets.Axes.Clone();
		axes.PivotTo(this.previewBlock.GetPivot());
		axes.Parent = this.previewBlock;

		// Highlight
		const blockHighlight = new Instance("Highlight");
		blockHighlight.Name = "BlockHighlight";
		blockHighlight.Parent = this.previewBlock;
		blockHighlight.FillTransparency = 0.4;
		blockHighlight.OutlineTransparency = 0.5;
		blockHighlight.Adornee = this.previewBlock;

		// Display better
		PartUtils.ghostModel(this.previewBlock);

		// Events
		this.MouseMoveCallback = this.Mouse.Move.Connect(() => this.updatePosition());
		this.MouseClickCallback = this.Mouse.Button1Down.Connect(async () => await this.placeBlock());
		this.buttonClickCallback = UserInputService.InputBegan.Connect((input) => this.onUserInput(input));

		// Update position first time
		this.updatePosition();

		Logger.info("Building started with " + this.previewBlock.Name);
	}

	onUserInput(input: InputObject) {
		if (input.UserInputType === Enum.UserInputType.Keyboard) {
			// Keyboard rotation
			if (input.KeyCode === Enum.KeyCode.R) {
				this.rotate(GameControls.isShiftPressed(), "r");
			} else if (input.KeyCode === Enum.KeyCode.T) {
				this.rotate(GameControls.isShiftPressed(), "t");
			} else if (input.KeyCode === Enum.KeyCode.Y) {
				this.rotate(GameControls.isShiftPressed(), "y");
			}
		} else if (input.UserInputType === Enum.UserInputType.Gamepad1) {
			// TODO: Gamepad rotation
		}
		// TODO: Touch rotation
	}

	rotate(forward: boolean, axis: "r" | "t" | "y") {
		let rotation: Vector3;
		if (axis === "r") {
			rotation = new Vector3(0, forward ? math.pi / 2 : math.pi / -2, 0);
		} else if (axis === "t") {
			rotation = new Vector3(forward ? math.pi / 2 : math.pi / -2, 0, 0);
		} else if (axis === "y") {
			rotation = new Vector3(0, 0, forward ? math.pi / 2 : math.pi / -2);
		} else {
			return;
		}

		this.previewBlockRotation = CFrame.fromEulerAnglesXYZ(rotation.X, rotation.Y, rotation.Z).mul(
			this.previewBlockRotation,
		);

		this.gameUI.Sounds.Building.BlockRotate.PlaybackSpeed = math.random(8, 12) / 10; // Give some randomness
		this.gameUI.Sounds.Building.BlockRotate.Play();

		this.updatePosition();
	}

	// TODO: Use it in block selection menu
	selectBlock(block: AbstractBlock) {
		this.stopBuilding();
		this.lastBlock = block;
		this.startBuilding();
	}

	/** Place block request without arguments */
	async placeBlock() {
		if (this.lastBlock === undefined) {
			error("Block is not selected");
		}

		if (this.previewBlock === undefined) {
			error("No render object to update");
		}

		// If game developer made a mistake
		if (this.previewBlock.PrimaryPart === undefined) {
			error("PrimaryPart is undefined");
		}

		const response = await Remotes.Client.GetNamespace("Building").Get("PlayerPlaceBlock").CallServerAsync({
			block: this.lastBlock.id,
			location: this.previewBlock.PrimaryPart.CFrame,
		});

		if (response.success) {
			task.wait();
			this.updatePosition();

			// Play sound
			this.gameUI.Sounds.Building.BlockPlace.PlaybackSpeed = math.random(8, 12) / 10; // Give some randomness
			this.gameUI.Sounds.Building.BlockPlace.Play();
		} else {
			Logger.info("[BUILDING] Block placement failed: " + response.message);
			this.gameUI.Sounds.Building.BlockPlaceError.PlaybackSpeed = math.random(8, 12) / 10; // Give some randomness
			this.gameUI.Sounds.Building.BlockPlaceError.Play();
		}
	}

	/** Stops block construction */
	stopBuilding() {
		if (!this.isBuilding()) {
			Logger.info("[BUILDING] Building not stopped (it is not started)");
			return;
		}

		this.previewBlock?.Destroy();

		// Kill events
		this.MouseMoveCallback?.Disconnect();
		this.MouseClickCallback?.Disconnect();
		this.buttonClickCallback?.Disconnect();
	}

	/** **System** function that updates the location of the visual preview at the block */
	updatePosition() {
		// If there is no render object, then assert error
		if (this.previewBlock === undefined) {
			Logger.info("[BUILDING] No render object to update");
			this.stopBuilding();
			return;
		}

		// If game developer made a mistake (common problem)
		if (this.previewBlock.PrimaryPart === undefined) {
			Logger.info("[BUILDING] PrimaryPart is undefined");
			this.stopBuilding();
			return;
		}

		// If ESC menu is open - freeze movement
		if (GameControls.isPaused()) {
			return;
		}

		const MouseTarget: BasePart | undefined = this.Mouse.Target;

		// If the this.Mouse isn't over anything, stop rendering
		if (MouseTarget === undefined) {
			return;
		}

		const MouseHit = this.Mouse.Hit;
		const MouseSurface = this.Mouse.TargetSurface;
		const highlight = this.previewBlock.FindFirstChildOfClass("Highlight") as Highlight;

		// Positioning Stage 1
		const rotationRelative = MouseTarget.CFrame.sub(MouseTarget.Position).Inverse();
		const normalPositioning = VectorUtils.normalIdToNormalVector(MouseSurface, MouseTarget);
		const positioning = MouseTarget.CFrame.mul(
			new CFrame(normalPositioning.vector.mul(normalPositioning.size / 2)),
		);
		this.previewBlock.PivotTo(positioning.mul(rotationRelative).mul(this.previewBlockRotation));

		// Positioning Stage 2
		const convertedPosition = MouseTarget.CFrame.sub(MouseTarget.Position).PointToWorldSpace(
			normalPositioning.vector,
		);

		const RightVectorValue = math.abs(this.previewBlock.PrimaryPart.CFrame.RightVector.Dot(convertedPosition));
		const UpVectorValue = math.abs(this.previewBlock.PrimaryPart.CFrame.UpVector.Dot(convertedPosition));
		const LookVectorValue = math.abs(this.previewBlock.PrimaryPart.CFrame.LookVector.Dot(convertedPosition));

		this.previewBlock.PivotTo(positioning.mul(rotationRelative.Inverse()).mul(this.previewBlockRotation.Inverse()));

		// Positioning Stage 3
		const MouseHitObjectSpace = MouseTarget.CFrame.PointToObjectSpace(MouseHit.Position);
		const moveRangeStuds = 1; // TODO: Make this configurable (probably)
		const offset = VectorUtils.roundVectorToBase(
			MouseHitObjectSpace.sub(
				new Vector3(
					math.abs(normalPositioning.vector.X),
					math.abs(normalPositioning.vector.Y),
					math.abs(normalPositioning.vector.Z),
				).mul(MouseHitObjectSpace),
			),
			moveRangeStuds,
		);

		this.previewBlock.PivotTo(
			positioning
				.mul(
					new CFrame(
						normalPositioning.vector.mul(
							RightVectorValue * (this.previewBlock.PrimaryPart.Size.X / 2) +
								UpVectorValue * (this.previewBlock.PrimaryPart.Size.Y / 2) +
								LookVectorValue * (this.previewBlock.PrimaryPart.Size.Z / 2),
						),
					),
				)
				.mul(new CFrame(offset))
				.mul(rotationRelative)
				.mul(this.previewBlockRotation),
		);

		// Rounding vectors
		this.previewBlock.PivotTo(
			new CFrame(VectorUtils.roundVectorToNearestHalf(this.previewBlock.GetPivot().Position)).mul(
				this.previewBlock.GetPivot().Rotation,
			),
		);

		// Colorizing
		if (BuildingManager.vectorAbleToPlayer(this.previewBlock.PrimaryPart.Position, this.LocalPlayer)) {
			highlight.FillColor = this.placeAllowedColor;
		} else {
			highlight.FillColor = this.placeNotAllowedColor;
		}
	}
}
