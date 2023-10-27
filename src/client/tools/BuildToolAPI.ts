import { Players, ReplicatedStorage, UserInputService, Workspace } from "@rbxts/services";
import GameControls from "client/GameControls";
import ControlUtils from "client/utils/ControlUtils";
import GuiUtils from "client/utils/GuiUtils";
import Logger from "shared/Logger";
import Remotes from "shared/NetworkDefinitions";
import BuildingManager from "shared/building/BuildingManager";
import AbstractBlock from "shared/registry/AbstractBlock";
import BlockRegistry from "shared/registry/BlocksRegistry";
import PartUtils from "shared/utils/PartUtils";
import PlayerUtils from "shared/utils/PlayerUtils";
import VectorUtils from "shared/utils/VectorUtils";

export default class BuildToolAPI {
	private gameUI: GameUI;

	// Mouse
	private mouse: Mouse;
	private lastMouseHit: CFrame | undefined;
	private lastMouseTarget: BasePart | undefined;
	private lastMouseSurface: Enum.NormalId | undefined;

	// Events
	private updateEvent: RBXScriptConnection | undefined;
	private placeEvent: RBXScriptConnection | undefined;
	private inputEvent: RBXScriptConnection | undefined;

	// Block
	private lastBlock: AbstractBlock | undefined;
	private previewBlock: Model | undefined;
	private previewBlockRotation: CFrame = new CFrame();

	// Const
	private readonly allowedColor: Color3 = Color3.fromRGB(194, 217, 255);
	private readonly forbiddenColor: Color3 = Color3.fromRGB(255, 189, 189);
	private readonly defaultBlock = BlockRegistry.TEST_BLOCK;

	constructor(gameUI: GameUI) {
		this.gameUI = gameUI;

		this.mouse = Players.LocalPlayer.GetMouse();
	}

	public isBuilding() {
		return this.previewBlock !== undefined;
	}

	public startBuilding() {
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
		this.inputEvent = UserInputService.InputBegan.Connect((input) => this.onUserInput(input));
		if (!ControlUtils.isMobile()) {
			// PC Controls
			this.updateEvent = this.mouse.Move.Connect(() => this.updatePosition());
			this.placeEvent = this.mouse.Button1Down.Connect(async () => await this.placeBlock());
		} else {
			// Mobile controls
			this.updateEvent = UserInputService.TouchStarted.Connect((_) => this.updatePosition());
		}

		// Update position first time
		this.updatePosition();

		Logger.info("Building started with " + this.previewBlock.Name);
	}

	public onUserInput(input: InputObject) {
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
		} else if (input.UserInputType === Enum.UserInputType.Touch) {
			this.updatePosition();
		}
	}

	public rotate(forward: boolean, axis: "r" | "t" | "y") {
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

		this.updatePosition(true);
	}

	// TODO: Use it in block selection menu
	public selectBlock(block: AbstractBlock) {
		this.stopBuilding();
		this.lastBlock = block;
		this.startBuilding();
	}

	/** Place block request without arguments */
	public async placeBlock() {
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

		// Non-alive players bypass
		if (!PlayerUtils.isAlive(Players.LocalPlayer)) {
			return;
		}

		const response = await Remotes.Client.GetNamespace("Building").Get("PlayerPlaceBlock").CallServerAsync({
			block: this.lastBlock.id,
			location: this.previewBlock.PrimaryPart.CFrame,
		});

		if (response.success === true) {
			task.wait();
			this.updatePosition(true);

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
	public stopBuilding() {
		if (!this.isBuilding()) {
			Logger.info("[BUILDING] Building not stopped (it is not started)");
			return;
		}

		this.previewBlock?.Destroy();

		// Kill events
		this.updateEvent?.Disconnect();
		this.placeEvent?.Disconnect();
		this.inputEvent?.Disconnect();
	}

	/** **System** function that updates the location of the visual preview at the block */
	public updatePosition(savePosition: boolean = false) {
		assert(this.previewBlock);
		assert(this.previewBlock.PrimaryPart);

		// If ESC menu is open - freeze movement
		if (GameControls.isPaused()) {
			return;
		}

		// Non-alive players bypass
		if (!PlayerUtils.isAlive(Players.LocalPlayer)) {
			return;
		}

		// Fix buttons positions
		if (GuiUtils.isCursorOnVisibleGui() && !savePosition) {
			return;
		}

		const mouseTarget: BasePart | undefined =
			savePosition && this.lastMouseTarget !== undefined ? this.lastMouseTarget : this.mouse.Target;

		// If the this.mouse isn't over anything, stop rendering
		if (mouseTarget === undefined) {
			return;
		}

		const mouseHit = savePosition && this.lastMouseHit !== undefined ? this.lastMouseHit : this.mouse.Hit;
		const mouseSurface =
			savePosition && this.lastMouseSurface !== undefined ? this.lastMouseSurface : this.mouse.TargetSurface;
		const highlight = this.previewBlock.FindFirstChildOfClass("Highlight") as Highlight;

		// Positioning Stage 1
		const rotationRelative = mouseTarget.CFrame.sub(mouseTarget.Position).Inverse();
		const normalPositioning = VectorUtils.normalIdToNormalVector(mouseSurface, mouseTarget);
		const positioning = mouseTarget.CFrame.mul(
			new CFrame(normalPositioning.vector.mul(normalPositioning.size / 2)),
		);
		this.previewBlock.PivotTo(positioning.mul(rotationRelative).mul(this.previewBlockRotation));

		// Positioning Stage 2
		const convertedPosition = mouseTarget.CFrame.sub(mouseTarget.Position).PointToWorldSpace(
			normalPositioning.vector,
		);

		const RightVectorValue = math.abs(this.previewBlock.PrimaryPart.CFrame.RightVector.Dot(convertedPosition));
		const UpVectorValue = math.abs(this.previewBlock.PrimaryPart.CFrame.UpVector.Dot(convertedPosition));
		const LookVectorValue = math.abs(this.previewBlock.PrimaryPart.CFrame.LookVector.Dot(convertedPosition));

		this.previewBlock.PivotTo(positioning.mul(rotationRelative.Inverse()).mul(this.previewBlockRotation.Inverse()));

		// Positioning Stage 3
		const MouseHitObjectSpace = mouseTarget.CFrame.PointToObjectSpace(mouseHit.Position);
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
		if (BuildingManager.vectorAbleToPlayer(this.previewBlock.PrimaryPart.Position, Players.LocalPlayer)) {
			highlight.FillColor = this.allowedColor;
		} else {
			highlight.FillColor = this.forbiddenColor;
		}

		// Saving a new values
		if (!savePosition) {
			this.lastMouseTarget = mouseTarget;
			this.lastMouseHit = mouseHit;
			this.lastMouseSurface = mouseSurface;
		}
	}
}
