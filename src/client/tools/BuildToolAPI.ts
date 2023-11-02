import BlockRegistry from "shared/registry/BlocksRegistry";
import AbstractToolAPI from "../gui/abstract/AbstractToolAPI";
import AbstractBlock from "shared/registry/AbstractBlock";
import { Players, ReplicatedStorage, UserInputService, Workspace } from "@rbxts/services";
import PartUtils from "shared/utils/PartUtils";
import GameControls from "client/GameControls";
import PlayerUtils from "shared/utils/PlayerUtils";
import Remotes from "shared/NetworkDefinitions";
import Logger from "shared/Logger";
import BuildingManager from "shared/building/BuildingManager";
import VectorUtils from "shared/utils/VectorUtils";
import GuiUtils from "client/utils/GuiUtils";
import GuiAnimations from "client/gui/GuiAnimations";
import SoundUtils from "shared/utils/SoundUtils";

export default class BuildToolAPI extends AbstractToolAPI {
	// Mouse
	private lastMouseHit?: CFrame;
	private lastMouseTarget?: BasePart;
	private lastMouseSurface?: Enum.NormalId;

	// Block
	private equippedBlock: AbstractBlock;
	private previewBlock?: Model;
	private previewBlockRotation: CFrame = new CFrame();

	// Const
	private readonly allowedColor: Color3 = Color3.fromRGB(194, 217, 255);
	private readonly forbiddenColor: Color3 = Color3.fromRGB(255, 189, 189);
	private readonly defaultBlock = BlockRegistry.TEST_BLOCK;

	constructor(gameUI: MyGui) {
		super(gameUI);

		this.equippedBlock = BlockRegistry.TEST_BLOCK;
	}

	private addHighlight() {
		const blockHighlight = new Instance("Highlight");
		blockHighlight.Name = "BlockHighlight";
		blockHighlight.Parent = this.previewBlock;
		blockHighlight.FillTransparency = 0.4;
		blockHighlight.OutlineTransparency = 0.5;
		blockHighlight.Adornee = this.previewBlock;
	}

	private addAxisModel() {
		assert(this.previewBlock);

		const axis = ReplicatedStorage.Assets.Axis.Clone();
		axis.PivotTo(this.previewBlock.GetPivot());
		axis.Parent = this.previewBlock;

		if (this.equippedBlock.getAvailableRotationAxis().r === false) {
			axis.R.Destroy();
		}

		if (this.equippedBlock.getAvailableRotationAxis().t === false) {
			axis.T.Destroy();
		}

		if (this.equippedBlock.getAvailableRotationAxis().y === false) {
			axis.Y.Destroy();
		}
	}

	private rotateBlock(rotationVector: Vector3) {
		this.previewBlockRotation = CFrame.fromEulerAnglesXYZ(rotationVector.X, rotationVector.Y, rotationVector.Z).mul(
			this.previewBlockRotation,
		);
		this.gameUI.Sounds.Building.BlockRotate.PlaybackSpeed = SoundUtils.randomSoundSpeed();
		this.gameUI.Sounds.Building.BlockRotate.Play();
		this.updatePosition(true);
	}

	public rotate(forward: boolean, axis: "r" | "t" | "y") {
		const { r, t, y } = this.equippedBlock.getAvailableRotationAxis();

		if (axis === "r" && r) {
			this.rotateBlock(new Vector3(0, forward ? math.pi / 2 : math.pi / -2, 0));
		} else if (axis === "t" && t) {
			this.rotateBlock(new Vector3(forward ? math.pi / 2 : math.pi / -2, 0, 0));
		} else if (axis === "y" && y) {
			this.rotateBlock(new Vector3(0, 0, forward ? math.pi / 2 : math.pi / -2));
		} else {
			this.gameUI.Sounds.Building.BlockPlaceError.PlaybackSpeed = SoundUtils.randomSoundSpeed();
			this.gameUI.Sounds.Building.BlockPlaceError.Play();
		}
	}

	// TODO: Use it in block selection menu
	public selectBlock(block: AbstractBlock): void {
		this.unequip();
		this.equippedBlock = block;
		this.equip();
	}

	public async placeBlock() {
		assert(this.equippedBlock);
		assert(this.previewBlock);
		assert(this.previewBlock.PrimaryPart);

		// Non-alive players bypass
		if (!PlayerUtils.isAlive(Players.LocalPlayer)) {
			return;
		}

		const response = await Remotes.Client.GetNamespace("Building").Get("PlayerPlaceBlock").CallServerAsync({
			block: this.equippedBlock.id,
			location: this.previewBlock.PrimaryPart.CFrame,
		});

		if (response.success === true) {
			task.wait();
			this.updatePosition(true);

			// Play sound
			this.gameUI.Sounds.Building.BlockPlace.PlaybackSpeed = SoundUtils.randomSoundSpeed();
			this.gameUI.Sounds.Building.BlockPlace.Play();
		} else {
			Logger.info("[BUILDING] Block placement failed: " + response.message);
			this.gameUI.Sounds.Building.BlockPlaceError.PlaybackSpeed = SoundUtils.randomSoundSpeed();
			this.gameUI.Sounds.Building.BlockPlaceError.Play();
		}
	}

	public equip(): void {
		super.equip();

		// Selecting a block
		if (this.equippedBlock === undefined) {
			this.equippedBlock = this.defaultBlock;
		}

		// Spawning a new block
		this.previewBlock = this.equippedBlock.getModel().Clone();
		this.previewBlock.Parent = Workspace;

		this.addAxisModel();
		this.addHighlight();
		PartUtils.ghostModel(this.previewBlock);

		this.updatePosition();
	}

	public unequip(): void {
		super.unequip();

		// Hide mobile controls
		this.gameUI.TouchControls.BuildTool.Visible = false;

		this.previewBlock?.Destroy();
	}

	public onUserInput(input: InputObject): void {
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
			if (input.KeyCode === Enum.KeyCode.ButtonX) {
				this.placeBlock();
			}
			// TODO: Gamepad rotation
		} else if (input.UserInputType === Enum.UserInputType.Touch) {
			this.updatePosition();
		}
	}

	public onPlatformChanged(): void {
		super.onPlatformChanged();

		// Show building mobile controls
		if (GameControls.getActualPlatform() === "Touch") {
			this.gameUI.TouchControls.BuildTool.Visible = true;
			GuiAnimations.fade(this.gameUI.TouchControls.BuildTool, 0.1, "right");
		} else {
			this.gameUI.TouchControls.BuildTool.Visible = false;
		}

		this.setupEvents();
	}

	public setupEvents() {
		Logger.info("[BuildToolAPI] Setting up events");
		switch (GameControls.getActualPlatform()) {
			case "Desktop":
				this.eventHandler.registerEvent(this.mouse.Move, () => this.updatePosition());
				this.eventHandler.registerEvent(this.mouse.Button1Down, async () => await this.placeBlock());
				break;
			case "Console":
				this.eventHandler.registerEvent(
					(Workspace.CurrentCamera as Camera).GetPropertyChangedSignal("CFrame"),
					() => this.updatePosition(),
				);
				break;
			case "Touch":
				// Touchscreen controls
				this.eventHandler.registerEvent(this.gameUI.TouchControls.BuildTool.PlaceButton.MouseButton1Click, () =>
					this.placeBlock(),
				);
				this.eventHandler.registerEvent(
					this.gameUI.TouchControls.BuildTool.RotateRButton.MouseButton1Click,
					() => this.rotate(true, "r"),
				);
				this.eventHandler.registerEvent(
					this.gameUI.TouchControls.BuildTool.RotateTButton.MouseButton1Click,
					() => this.rotate(true, "t"),
				);
				this.eventHandler.registerEvent(
					this.gameUI.TouchControls.BuildTool.RotateYButton.MouseButton1Click,
					() => this.rotate(true, "y"),
				);
				this.eventHandler.registerEvent(UserInputService.TouchStarted, (_) => this.updatePosition());
				break;
			default:
				break;
		}
	}

	public updatePosition(savePosition: boolean = false) {
		assert(this.previewBlock);

		if (this.shouldReturnEarly(savePosition)) {
			return;
		}

		const { mouseTarget, mouseHit, mouseSurface } = this.getMouseProperties(savePosition);
		const highlight = this.previewBlock.FindFirstChildOfClass("Highlight") as Highlight;

		this.performPositioning(mouseTarget, mouseSurface, mouseHit);
		this.colorizePreviewBlock(highlight);

		if (!savePosition) {
			this.lastMouseTarget = mouseTarget;
			this.lastMouseHit = mouseHit;
			this.lastMouseSurface = mouseSurface;
		}
	}

	private shouldReturnEarly(savePosition: boolean): boolean {
		return (
			!this.previewBlock ||
			!this.previewBlock.PrimaryPart ||
			GameControls.isPaused() ||
			!PlayerUtils.isAlive(Players.LocalPlayer) ||
			(GuiUtils.isCursorOnVisibleGui() && !savePosition)
		);
	}

	private getMouseProperties(savePosition: boolean) {
		return {
			mouseTarget: savePosition && this.lastMouseTarget !== undefined ? this.lastMouseTarget : this.mouse.Target,
			mouseHit: savePosition && this.lastMouseHit !== undefined ? this.lastMouseHit : this.mouse.Hit,
			mouseSurface:
				savePosition && this.lastMouseSurface !== undefined ? this.lastMouseSurface : this.mouse.TargetSurface,
		};
	}

	private performPositioning(mouseTarget: BasePart | undefined, mouseSurface: Enum.NormalId, mouseHit: CFrame) {
		assert(this.previewBlock);
		assert(this.previewBlock.PrimaryPart);

		// No target block
		if (!mouseTarget) {
			return;
		}

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
	}

	private colorizePreviewBlock(highlight: Highlight) {
		assert(this.previewBlock);
		assert(this.previewBlock.PrimaryPart);

		// Colorizing
		if (BuildingManager.vectorAbleToPlayer(this.previewBlock.PrimaryPart.Position, Players.LocalPlayer)) {
			highlight.FillColor = this.allowedColor;
		} else {
			highlight.FillColor = this.forbiddenColor;
		}
	}
}
